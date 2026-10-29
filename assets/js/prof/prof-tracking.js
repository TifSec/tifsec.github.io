/* ========== MATIÈRE → CLASSE → SÉANCE → COPIES ET RETOURS ========== */
import { db } from '../bdd/bdd-connect.js';
import { checkSession } from '../auth/auth-session.js';
import { lessonCatalogue, collaborationRpc } from '../cours/collaboration.js';
import { initCopyCorrection } from './copy-correction.js?v=20261029-prof-2';

const LABELS = { techno: 'Technologie', tim: 'TIM', maths: 'Mathématiques' };
const same = (a, b) => ['etablissement', 'matiere', 'classe'].every(key => a[key] === b[key]);
export function allowedLessons(scopes, catalogue) {
    return catalogue.filter(lesson => scopes.some(scope => same(scope, lesson)));
}
export function answerValues(rows) {
    return new Map(rows.filter(row => typeof row.question_key === 'string' && typeof row.reponse === 'string')
        .map(row => [row.question_key, row.reponse]));
}

export function initTeacherTracking() {
    const root = document.getElementById('teacher-tracking');
    if (!root || root.dataset.enabled !== 'true') return;
    const element = id => document.getElementById('tracking-' + id);
    const status = element('status'), subject = element('subject'), schoolClass = element('class'), lesson = element('lesson');
    const copies = element('copies'), preview = element('preview'), detail = element('detail');
    const feedback = element('feedback'), correction = element('correction'), filters = element('filters');
    const history = element('history');
    const assisted = initCopyCorrection({ db, checkSession, onValidated(result) {
        if (!selected || String(selected.copy_id) !== result.copy_id) return;
        selected.terminee = true;
        if (typeof result.saved_feedback === 'string') savedComment = result.saved_feedback;
        selected.evaluation = { id: result.evaluation_id, total: result.total, marks: result.marks };
        element('copy-status').textContent = 'Correction validée — note ' + result.total + ' / 20 — copie verrouillée';
        element('finish').textContent = 'Rouvrir la copie';
        copies.querySelectorAll('button').forEach(button => { if (button.dataset.copy === String(selected.copy_id)) button.textContent = copyLabel(selected); });
        status.textContent = 'Correction et note validées. La copie est verrouillée pour les élèves.';
    } });
    let generation = 0, selection = 0, userId = null, lessons = [], selected = null, savedComment = '', busy = false;
    let displayedLesson = '', reading = 0;
    // Bonus d'XP du petit défi : section présente seulement si le site l'active (bac à sable pour l'instant).
    const challenge = document.getElementById('tracking-challenge');
    const challengeBox = document.getElementById('tracking-challenge-award');
    const challengeStatus = document.getElementById('tracking-challenge-status');
    const CHALLENGE_GRANTED = 'Bonus accordé : +5 XP pour chaque participant de cette copie.';
    function clearChallenge() {
        if (!challenge) return;
        challenge.hidden = true; challengeBox.checked = false; challengeBox.disabled = true; challengeStatus.textContent = '';
    }
    async function showChallenge(row, available, chosen) {
        if (!challenge) return;
        if (!available || row.is_history) { clearChallenge(); return; }
        challenge.hidden = false; challengeBox.disabled = true; challengeStatus.textContent = 'Lecture du bonus du défi…';
        const { data, error } = await db.from('challenge_awards').select('awarded_at').eq('work_session_id', row.copy_id).maybeSingle();
        if (chosen !== selection) return;
        if (error) { challengeStatus.textContent = 'Bonus du défi indisponible pour le moment.'; return; }
        challengeBox.checked = Boolean(data); challengeBox.disabled = false;
        challengeStatus.textContent = data ? CHALLENGE_GRANTED : 'Bonus non accordé pour cette copie.';
    }
    let requestedCopy = null;

    function clearCopy() {
        assisted.clear(); clearChallenge();
        ++selection; selected = null; savedComment = ''; feedback.value = '';
        correction.disabled = true; detail.hidden = true; preview.replaceChildren();
        element('identity').textContent = ''; element('copy-status').textContent = '';
    }
    function reset() {
        ++generation; ++reading; clearCopy(); userId = null; lessons = []; displayedLesson = ''; copies.replaceChildren();
        subject.replaceChildren(); schoolClass.replaceChildren(); lesson.replaceChildren(); filters.disabled = true;
    }
    function mayLeave() {
        if (busy || assisted.isBusy()) { status.textContent = 'Attendez la fin de l’enregistrement.'; return false; }
        return !selected || (feedback.value === savedComment && !assisted.hasDraft()) || window.confirm('Abandonner les points, appréciations ou commentaire non enregistrés ?');
    }
    function currentLesson() { return lessons.find(row => row.url === lesson.value); }
    function copyLabel(row) {
        const date = row.last_saved ? new Date(row.last_saved).toLocaleString('fr-FR') : 'aucune réponse enregistrée';
        return (row.participants || 'Participants indisponibles') + '\n' +
            (row.is_history ? 'Historique individuel' : row.max_members > 1 ? 'Copie collective de référence' : 'Copie individuelle de référence') + ' · ' + row.answer_count + ' réponse(s)\n' + date + '\n' +
            (row.is_history ? 'Consultation uniquement' : row.terminee ? 'Terminée' : 'En cours');
    }
    function options(select, entries) {
        select.replaceChildren();
        for (const [value, label] of entries) select.add(new Option(label, value));
    }
    function classOptions(preferred = '') {
        const scopes = lessons.filter(row => row.matiere === subject.value);
        const entries = new Map(scopes.map(row => [row.etablissement + '|' + row.classe,
            (row.etablissement === 'college' ? 'Collège' : 'MFR') + ' · ' + row.classe]));
        options(schoolClass, entries);
        if (entries.has(preferred)) schoolClass.value = preferred;
        lessonOptions();
    }
    function lessonOptions() {
        options(lesson, lessons.filter(row => row.matiere === subject.value && row.etablissement + '|' + row.classe === schoolClass.value)
            .map(row => [row.url, row.seance + ' — ' + row.titre]));
    }
    async function showCopy(row) {
        if (!mayLeave()) return;
        clearCopy();
        const current = generation, chosen = selection, course = currentLesson();
        if (!course || !userId) return;
        status.textContent = 'Chargement de la copie…';
        try {
            const [answers, comments, response, grade] = await Promise.all([
                db.from('work_answers').select('question_key, reponse').eq('work_session_id', row.copy_id),
                db.from('work_feedback').select('commentaire').eq('work_session_id', row.copy_id).eq('teacher_id', userId).maybeSingle(),
                fetch(course.url, { credentials: 'same-origin' }),
                readGrade(row.copy_id)
            ]);
            if (answers.error || comments.error || grade.error || !response.ok) throw new Error('read_failed');
            const html = await response.text();
            const verified = await checkSession();
            if (current !== generation || chosen !== selection) return;
            if (verified.status !== 'authenticated' || verified.user.id !== userId || verified.profile.role !== 'teacher') {
                reset(); status.textContent = 'Reconnectez-vous pour consulter les copies.'; return;
            }
            const documentCourse = new DOMParser().parseFromString(html, 'text/html');
            const nodes = documentCourse.querySelectorAll('.cours-intro, .cours-activites');
            if (!nodes.length) throw new Error('course_missing');
            const values = answerValues(answers.data || []);
            preview.replaceChildren(...[...nodes].map(node => document.importNode(node, true)));
            preview.querySelectorAll('[data-answer-id]').forEach(field => {
                field.value = values.get(field.dataset.answerId) || ''; field.disabled = true;
            });
            row.evaluation = grade.data;
            row.submitted_at = grade.submittedAt;
            if (row.evaluation) row.terminee = true;
            selected = row; savedComment = comments.data?.commentaire || ''; feedback.value = savedComment;
            assisted.select(row, userId);
            element('identity').textContent = row.participants || 'Participants indisponibles';
            element('copy-status').textContent = row.is_history ? 'Historique du travail individuel — consultation uniquement' : row.terminee ? 'Copie clôturée par le professeur' : row.submitted_at ? 'Travail déclaré terminé — réponses encore modifiables par les élèves' : 'Copie en cours';
            if (row.evaluation) element('copy-status').textContent = 'Note validée : ' + row.evaluation.total + ' / 20 — copie verrouillée';
            element('finish').textContent = row.terminee ? 'Rouvrir la copie' : 'Terminer la copie';
            correction.disabled = Boolean(row.is_history); correction.hidden = Boolean(row.is_history); detail.hidden = false;
            copies.querySelectorAll('button').forEach(button => { button.setAttribute('aria-pressed', String(button.dataset.copy === String(row.copy_id))); });
            status.textContent = 'Copie chargée. Les réponses sont consultables dans le cours.';
            showChallenge(row, Boolean(documentCourse.querySelector('.course-challenge')), chosen).catch(() => {
                if (chosen === selection && challengeStatus) challengeStatus.textContent = 'Bonus du défi indisponible pour le moment.';
            });
        } catch {
            if (current === generation && chosen === selection) status.textContent = 'Impossible de charger cette copie. Actualisez la liste avant de réessayer.';
        }
    }
    async function readGrade(copyId) {
        if (root.dataset.gradeValidation !== 'true') return { data: null, error: null };
        const copy = await db.from('work_sessions').select('current_evaluation_id'+(root.dataset.studentSubmission==='true'?',submitted_at':'')).eq('id', copyId).maybeSingle();
        if (copy.error || !copy.data?.current_evaluation_id) return { data: null, error: copy.error, submittedAt: copy.data?.submitted_at };
        const grade = await db.from('work_evaluations').select('id, total, marks, validated_at').eq('id', copy.data.current_evaluation_id).eq('work_session_id', copyId).maybeSingle();
        return { ...grade, submittedAt: copy.data.submitted_at };
    }
    async function listCopies() {
        const course = currentLesson(), current = generation, request = ++reading;
        displayedLesson = lesson.value;
        clearCopy(); copies.replaceChildren();
        if (!course) { status.textContent = 'Aucune séance intégrée pour cet enseignement.'; return; }
        status.textContent = 'Chargement des copies…';
        try {
            const rows = await collaborationRpc('refonte_teacher_copies', {
                p_school: course.etablissement, p_subject: course.matiere, p_class: course.classe, p_lesson: course.seance,
                p_history: Boolean(history?.checked)
            });
            if (current !== generation || request !== reading) return;
            for (const row of rows) {
                const button = document.createElement('button'); button.type = 'button'; button.className = 'tracking-copy';
                button.dataset.copy = String(row.copy_id); button.setAttribute('aria-pressed', 'false');
                button.dataset.kind = row.is_history ? 'history' : row.max_members > 1 ? 'group' : 'individual';
                button.textContent = copyLabel(row);
                button.addEventListener('click', () => showCopy(row)); copies.append(button);
            }
            status.textContent = rows.length ? rows.length + ' copie(s). Choisissez une copie pour consulter les réponses.' : 'Aucune copie commencée pour cette séance.';
            if (requestedCopy) {
                const row = rows.find(row => String(row.copy_id) === requestedCopy); requestedCopy = null;
                if (row) await showCopy(row);
                else status.textContent = 'La copie demandée n’est plus dans cette liste. Actualisez ou consultez son historique.';
            }
        } catch { if (current === generation && request === reading) status.textContent = 'Les copies ne sont pas disponibles. Vérifiez vos affectations puis actualisez.'; }
    }
    async function load() {
        reset(); const current = generation;
        const session = await checkSession();
        if (current !== generation) return;
        if (session.status !== 'authenticated' || session.profile.role !== 'teacher') {
            status.textContent = 'Connectez-vous avec votre compte professeur.'; return;
        }
        userId = session.user.id;
        const result = await db.from('teacher_class_assignments').select('etablissement, matiere, classe').eq('teacher_id', userId);
        if (current !== generation) return;
        if (result.error) { status.textContent = 'Impossible de charger vos affectations. Réessayez après reconnexion.'; return; }
        lessons = allowedLessons(result.data || [], lessonCatalogue());
        if (!lessons.length) { status.textContent = 'Aucune séance intégrée dans vos classes affectées pour le moment.'; return; }
        const subjects = new Map(lessons.map(row => [row.matiere, LABELS[row.matiere] || row.matiere]));
        options(subject, subjects);
        const query = new URL(window.location.href).searchParams;
        if (subjects.has(query.get('matiere'))) subject.value = query.get('matiere');
        classOptions((query.get('etablissement') || '') + '|' + (query.get('classe') || ''));
        const requestedLesson=lessons.find(row=>row.seance===query.get('seance')&&row.matiere===subject.value&&row.etablissement+'|'+row.classe===schoolClass.value);
        if(requestedLesson)lesson.value=requestedLesson.url;
        requestedCopy=/^[1-9][0-9]*$/.test(query.get('copie') || '')?query.get('copie'):null;
        if(history)history.checked=query.get('historique')==='1';
        filters.disabled = false; await listCopies();
    }
    subject.addEventListener('change', () => { if (!mayLeave()) { subject.value = currentLesson()?.matiere || ''; return; } classOptions(); listCopies(); });
    schoolClass.addEventListener('change', () => {
        if (!mayLeave()) { const row = currentLesson(); schoolClass.value = row ? row.etablissement + '|' + row.classe : ''; return; }
        lessonOptions(); listCopies();
    });
    lesson.addEventListener('change', () => { if (!mayLeave()) { lesson.value = displayedLesson; return; } listCopies(); });
    element('refresh').addEventListener('click', () => { if (mayLeave()) listCopies(); });
    history?.addEventListener('change', () => { if (!mayLeave()) { history.checked = !history.checked; return; } listCopies(); });
    async function mutate(action) {
        if (!selected || selected.is_history || busy || assisted.isBusy()) return;
        if (action !== 'save' && selected.terminee && selected.evaluation && !window.confirm('Rouvrir cette copie retirera sa note courante. La correction validée sera conservée dans l’historique. Continuer ?')) return;
        if (action !== 'save' && assisted.hasDraft() && !window.confirm('Abandonner les points non validés avant de changer l’état de la copie ?')) return;
        const current = generation, chosen = selection, row = selected;
        const comment = feedback.value;
        busy = true; correction.disabled = true;
        try {
            if (action === 'save') await collaborationRpc('refonte_save_feedback', { p_copy: row.copy_id, p_comment: comment });
            else await collaborationRpc('refonte_finish_copy', { p_copy: row.copy_id, p_finished: !row.terminee });
            if (current !== generation || chosen !== selection) return;
            if (action === 'save') { savedComment = comment; status.textContent = 'Commentaire enregistré et visible par les participants.'; }
            else {
                assisted.clear();
                row.terminee = !row.terminee;
                if (!row.terminee) row.evaluation = null;
                assisted.select(row, userId);
                copies.querySelectorAll('button').forEach(button => { if (button.dataset.copy === String(row.copy_id)) button.textContent = copyLabel(row); });
                element('copy-status').textContent = row.terminee ? 'Copie terminée' : 'Copie en cours';
                element('finish').textContent = row.terminee ? 'Rouvrir la copie' : 'Terminer la copie';
                status.textContent = row.terminee ? 'Copie terminée : les élèves peuvent la consulter.' : 'Copie rouverte : les participants peuvent répondre.';
            }
        } catch { if (current === generation && chosen === selection) status.textContent = 'Action non confirmée. Votre commentaire est conservé ici ; réessayez.'; }
        finally { busy = false; if (current === generation && chosen === selection) correction.disabled = false; }
    }
    challengeBox?.addEventListener('change', async () => {
        const row = selected, chosen = selection, wanted = challengeBox.checked;
        if (!row || row.is_history) return;
        challengeBox.disabled = true; challengeStatus.textContent = 'Enregistrement du bonus…';
        try {
            await collaborationRpc('refonte_set_challenge_award', { p_copy: row.copy_id, p_awarded: wanted });
            if (chosen === selection) challengeStatus.textContent = wanted ? CHALLENGE_GRANTED : 'Bonus retiré pour cette copie.';
        } catch {
            if (chosen === selection) { challengeBox.checked = !wanted; challengeStatus.textContent = 'Action non confirmée : réessayez.'; }
        } finally { if (chosen === selection) challengeBox.disabled = false; }
    });
    element('save').addEventListener('click', () => mutate('save'));
    element('finish').addEventListener('click', () => mutate('finish'));
    window.addEventListener('beforeunload', event => {
        if (selected && (feedback.value !== savedComment || assisted.hasDraft() || assisted.isBusy())) { event.preventDefault(); event.returnValue = ''; }
    });
    db.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT' || (event === 'SIGNED_IN' && session?.user?.id !== userId)) {
            reset(); status.textContent = 'Connexion modifiée. Vérifiez votre compte professeur.';
            if (event === 'SIGNED_IN') setTimeout(() => load().catch(() => { status.textContent = 'Chargement interrompu. Reconnectez-vous.'; }), 0);
        }
    });
    load().catch(() => { status.textContent = 'Chargement interrompu. Reconnectez-vous.'; });
}

initTeacherTracking();
