/* ========== RESTAURATION AVANT SAISIE, PUIS SAUVEGARDE ========== */

import { db } from "../bdd/bdd-connect.js";
import { checkSession, getSessionMessage } from "../auth/auth-session.js";
import { createWorkRepository } from "./work-repository.js";
import { createAnswerBuffer } from "./answer-buffer.js";
import { initCourseGroups } from "./collaboration.js";
import { createStudentEvaluation } from './student-evaluation.js';

const MESSAGES = {
    pending: "Modifications en attente d’enregistrement…",
    saving: "Enregistrement en cours…",
    saved: "Toutes tes réponses sont enregistrées.",
    error: "Certaines réponses ne sont pas enregistrées. Garde la page ouverte et réessaie.",
    conflict: "Cette réponse a été modifiée par un autre participant ou dans un autre onglet. Ta saisie est conservée ici, sans remplacer la version enregistrée. Copie-la si nécessaire avant de recharger."
};

export function initCourseWork() {
    const root = document.getElementById("course-work");
    if (!root) return;
    const fieldset = document.getElementById("course-answers");
    const status = document.getElementById("course-save-status");
    const identity = document.getElementById("course-identity");
    const retry = document.getElementById("course-retry");
    const reload = document.getElementById("course-reload");
    const gradeSummary = document.getElementById('course-evaluation');
    const submit = document.getElementById('course-submit');
    const submitStatus = document.getElementById('course-submit-status');
    const canSubmit = submit?.dataset.enabled === 'true';
    const evaluation = createStudentEvaluation({ db, checkSession, root: fieldset, summary: gradeSummary, enabled: gradeSummary?.dataset.enabled === 'true' });
    const fields = [...fieldset.querySelectorAll("[data-answer-id]")];
    const keys = fields.map(field => field.dataset.answerId);
    const course = {
        etablissement: root.dataset.etablissement, matiere: root.dataset.matiere,
        classe: root.dataset.classe, seance: root.dataset.seance
    };
    let buffer = null;
    let activeUser = null;
    let generation = 0;
    let refreshTimer;
    let groups = null;
    let polling = null;
    let activeCopy = null, submitting = false;
    const collaborative = root.dataset.collaborationEnabled === "true";
    const selectedCopy = collaborative ? new URL(window.location.href).searchParams.get("copie") : null;
    const history = collaborative && new URL(window.location.href).searchParams.get("historique") === "1";
    const loadOptions = { collaborative, history, submission: canSubmit };

    function message(text, state = "locked") {
        status.textContent = text;
        status.dataset.state = state;
        retry.hidden = state !== "error" && state !== "load_error";
        reload.hidden = state !== "conflict";
    }
    function invalidate() {
        evaluation.clear();
        ++generation;
        clearInterval(polling);
        groups?.dispose();
        groups = null;
        const groupControls = document.getElementById("group-controls");
        if (groupControls) groupControls.hidden = true;
        document.getElementById("group-classmates")?.replaceChildren();
        document.getElementById("course-feedback")?.replaceChildren();
        buffer?.dispose();
        buffer = null;
        activeUser = null;
        activeCopy = null; submitting = false;
        if (submit) { submit.hidden = true; submit.disabled = true; }
        if (submitStatus) submitStatus.textContent = '';
        fieldset.disabled = true;
        identity.textContent = "";
        fields.forEach(field => { field.value = ""; });
    }

    async function load() {
        invalidate();
        const current = generation;
        message("Chargement de ta copie…", "loading");
        try {
            const session = await checkSession();
            if (current !== generation) return;
            if (session.status !== "authenticated") {
                message(getSessionMessage(session.status), session.status === "not_authenticated" ? "locked" : "load_error");
                return;
            }
            if (session.profile.role !== "student") {
                message("Aperçu professeur : utilise un compte élève pour essayer la sauvegarde des réponses.");
                return;
            }
            if (session.profile.enrollment_status === 'pending') {
                message("Ton inscription attend la validation de ton professeur. Recharge la page après validation.");
                return;
            }
            if (!selectedCopy && !history && (session.profile.etablissement !== course.etablissement || session.profile.classe !== course.classe)) {
                message("Cette séance est réservée aux élèves de " + course.classe + " de " + (course.etablissement === "college" ? "collège." : "MFR."));
                return;
            }
            activeUser = session.user.id;
            const copy = await createWorkRepository(db).loadCopy(activeUser, course, keys, selectedCopy, loadOptions);
            if (current !== generation) return;
            // Une réponse tardive d’un autre compte ne doit jamais être restaurée dans le nouveau.
            const verified = await checkSession();
            if (current !== generation) return;
            if (verified.status !== "authenticated" || verified.user.id !== activeUser ||
                verified.profile.role !== "student" || (!selectedCopy && !history && (verified.profile.etablissement !== course.etablissement ||
                verified.profile.classe !== course.classe))) {
                invalidate();
                message("La connexion a changé. Reconnecte-toi avant de charger une copie.");
                return;
            }
            buffer = createAnswerBuffer({
                keys, answers: copy.answers,
                save: (key, value, revision) => createWorkRepository(db).saveAnswer(copy.id, key, value, revision),
                onStatus: state => { message(MESSAGES[state], state); }
            });
            fields.forEach(field => { field.value = buffer.value(field.dataset.answerId); });
            identity.textContent = ((verified.profile.prenom || "") + " " + (verified.profile.nom || "")).trim();
            fieldset.disabled = copy.locked;
            activeCopy = copy;
            if (submit) { submit.hidden = !canSubmit || history || copy.locked || copy.submitted; submit.disabled = copy.locked; }
            if (copy.submitted && !copy.locked && submitStatus) submitStatus.textContent = 'Ce travail est indiqué comme terminé. Tu peux encore compléter tes réponses jusqu’à la clôture par ton professeur.';
            await evaluation.load(copy, activeUser, { history });
            if (current !== generation) return;
            message(history ? "Historique de ton travail individuel : consultation uniquement. La copie collective est le travail de référence." :
                copy.locked ? "Copie terminée : tes réponses sont consultables en lecture seule." : "Copie chargée. Tes réponses seront enregistrées automatiquement.");
            if (collaborative) {
                const controller = await initCourseGroups({
                    course, selectedCopy: history ? '__history__' : copy.group ? String(copy.id) : selectedCopy,
                    isCurrent: () => current === generation,
                    async beforeCreate() {
                        if (submitting) return false;
                        await buffer?.flush();
                        if (current !== generation) return false;
                        if (buffer?.hasUnsaved()) { message("Enregistre tes réponses avant d’envoyer les invitations.", "error"); return false; }
                        fieldset.disabled = true;
                        return true;
                    },
                    onCreateEnd(created) { if (!created && current === generation) fieldset.disabled = activeCopy?.locked ?? copy.locked; },
                    async onChoose(id) {
                        if (submitting) return false;
                        await buffer?.flush();
                        if (current !== generation) return false;
                        if (buffer?.hasUnsaved() && !window.confirm("Certaines réponses ne sont pas enregistrées. Abandonner cette saisie et ouvrir l’autre copie ?")) {
                            message("Ta saisie est conservée ici. Copie-la si nécessaire avant de changer de copie.", "error"); return false;
                        }
                        const url = new URL(window.location.href);
                        url.searchParams.delete("historique");
                        if (id === '__history__') { url.searchParams.delete("copie"); url.searchParams.set("historique", "1"); }
                        else if (id) url.searchParams.set("copie", id); else url.searchParams.delete("copie");
                        window.location.assign(url.href);
                        return true;
                    }
                });
                if (current !== generation) { controller?.dispose(); return; }
                groups = controller;
                await groups?.showFeedback(copy.id);
                if (current !== generation) return;
                let reading = false;
                polling = setInterval(async () => {
                    if (reading || submitting || current !== generation || document.visibilityState !== "visible") return;
                    reading = true;
                    try {
                        const fresh = await createWorkRepository(db).loadCopy(activeUser, course, keys, selectedCopy, loadOptions);
                        if (current !== generation || submitting) return;
                        if (String(fresh.id) !== String(copy.id)) {
                            evaluation.clear();
                            fieldset.disabled = true;
                            if (!buffer?.hasUnsaved()) { load(); return; }
                            message("Ton travail individuel est maintenant dans l’historique. Ta saisie non enregistrée reste visible ici ; conserve-la avant d’ouvrir la copie collective.", "conflict");
                            return;
                        }
                        fieldset.disabled = fresh.locked;
                        if (activeCopy?.locked && !fresh.locked && submitStatus) submitStatus.textContent = '';
                        activeCopy = fresh;
                        if (submit) { submit.hidden = !canSubmit || history || fresh.locked || fresh.submitted; submit.disabled = fresh.locked; }
                        if (fresh.submitted && !fresh.locked && submitStatus) submitStatus.textContent = 'Ce travail est indiqué comme terminé. Tu peux encore compléter tes réponses jusqu’à la clôture par ton professeur.';
                        if (!buffer?.adopt(fresh.answers)) { evaluation.clear(); return; }
                        fields.forEach(field => { field.value = buffer.value(field.dataset.answerId); });
                        fieldset.disabled = fresh.locked;
                        await evaluation.load(fresh, activeUser, { history });
                        if (current !== generation) return;
                        message(history ? "Historique individuel : consultation uniquement." : fresh.locked ? "Copie terminée : consultation uniquement." : MESSAGES.saved, fresh.locked ? "locked" : "saved");
                        await groups?.showFeedback(copy.id);
                    } catch { if (current === generation) message("Actualisation interrompue. Ta saisie est conservée ; vérifie ta connexion.", "error"); }
                    finally { reading = false; }
                }, 5000);
            }
        } catch (error) {
            if (current !== generation) return;
            invalidate();
            if (error.code === 'history_missing') { message("Aucun travail individuel conservé pour cette séance. Retrouve ta copie collective depuis Mon espace."); return; }
            message("Impossible de charger ta copie. La saisie reste désactivée pour préserver les réponses déjà enregistrées. Réessaie.", "load_error");
        }
    }

    fieldset.disabled = true;
    if (root.dataset.savingEnabled !== "true") {
        message("La sauvegarde est en préparation. La saisie sera activée après validation des règles d’accès.");
        return;
    }
    if (!db || !keys.length || new Set(keys).size !== keys.length || Object.values(course).some(value => !value)) {
        message("Cette séance n’est pas prête pour l’enregistrement. Contacte ton professeur.");
        return;
    }

    fields.forEach(field => {
        field.maxLength = 20000;
        field.addEventListener("input", () => { buffer?.edit(field.dataset.answerId, field.value); });
    });
    submit?.addEventListener('click', async () => {
        if (!canSubmit || submitting || history || !activeCopy || activeCopy.locked || !buffer || fieldset.disabled) return;
        if (!fields.some(field => field.value.trim())) { if (submitStatus) submitStatus.textContent = 'Ta copie ne contient aucune réponse. Commence ton travail ou demande de l’aide à ton professeur.'; return; }
        const empty = fields.filter(field => field.dataset.required !== 'false' && !field.value.trim()).length;
        const confirmation = (empty ? empty + ' réponse(s) ne sont pas renseignées. ' : '') +
            (activeCopy.group ? 'Cette action indique que tous les participants du groupe ont terminé. ' : 'Cette action indique que tu as terminé. ') +
            'Les réponses restent modifiables jusqu’à la clôture par ton professeur. Confirmer ?';
        if (!window.confirm(confirmation)) return;
        const current = generation, actor = activeUser, copy = activeCopy;
        submitting = true; fieldset.disabled = true; submit.disabled = true;
        try {
            if (submitStatus) submitStatus.textContent = 'Enregistrement des dernières réponses…';
            await buffer.flush();
            if (current !== generation) return;
            if (buffer.hasUnsaved()) throw new Error('unsaved');
            const verified = await checkSession();
            if (current !== generation) return;
            if (verified.status !== 'authenticated' || verified.user.id !== actor || verified.profile.role !== 'student' ||
                !['approved', 'legacy'].includes(verified.profile.enrollment_status)) { invalidate(); message('Reconnecte-toi avant de remettre ton travail.'); return; }
            await createWorkRepository(db).submitCopy(copy.id, buffer.revisions());
            if (current !== generation) return;
            copy.submitted = true; submit.hidden = true; fieldset.disabled = false;
            if (submitStatus) submitStatus.textContent = 'Travail indiqué comme terminé. Tu peux revenir le modifier jusqu’à la clôture par ton professeur. La correction et la note seront ajoutées plus tard.';
            message('Travail terminé. Retourne dans ton espace pour retrouver la séance suivante.', 'saved');
        } catch (error) {
            if (current !== generation) return;
            if (submitStatus) submitStatus.textContent = error.code === 'conflict' ?
                'La copie a changé dans un autre onglet ou chez un participant. Actualise et relis les réponses avant de la remettre.' :
                'La remise n’est pas confirmée. Tes réponses restent ici : vérifie la sauvegarde, puis réessaie ou actualise la copie.';
            fieldset.disabled = copy.locked; submit.disabled = copy.locked;
        } finally { if (current === generation) submitting = false; }
    });
    retry.addEventListener("click", () => { buffer ? buffer.retry() : load(); });
    reload.addEventListener("click", () => {
        if (!buffer?.hasUnsaved() || window.confirm("Recharger la copie enregistrée et abandonner la saisie non enregistrée de cet onglet ?")) load();
    });
    window.addEventListener("beforeunload", event => {
        if (buffer?.hasUnsaved()) {
            event.preventDefault();
            event.returnValue = "";
        }
    });
    window.addEventListener("online", () => { buffer?.retry(); });
    window.addEventListener("pageshow", event => { if (event.persisted) load(); });
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") buffer?.flush();
    });
    db.auth.onAuthStateChange((event, session) => {
        if (['TOKEN_REFRESHED', 'USER_UPDATED'].includes(event)) evaluation.clear();
        if (event === "SIGNED_OUT" || (event === "SIGNED_IN" && session?.user?.id !== activeUser)) {
            invalidate();
            clearTimeout(refreshTimer);
            if (event === "SIGNED_OUT") {
                message("Tu es déconnecté. Reconnecte-toi pour retrouver ta copie.");
            } else {
                refreshTimer = setTimeout(load, 0);
            }
        }
    });
    load();
}

initCourseWork();
