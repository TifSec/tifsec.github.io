import { db } from '../bdd/bdd-connect.js';
import { checkSession } from '../auth/auth-session.js';
import { collaborationRpc } from '../cours/collaboration.js';

export const ENROLLMENT_LABELS = { pending: 'Inscription en attente', legacy: 'Compte existant — à vérifier', approved: 'Inscription validée' };
export function initStudents() {
    if (!document.getElementById('teacher-students')) return;
    const status = document.getElementById('students-status'), controls = document.getElementById('students-controls');
    const select = document.getElementById('students-class'), list = document.getElementById('students-list');
    let generation = 0, request = 0, userId = null, busy = false, currentClass = '', classes = [];
    let catalogue = {};
    try { catalogue = JSON.parse(document.getElementById('classes-data')?.textContent || '{}'); } catch { /* Libellés techniques en dernier recours. */ }
    const label = row => (catalogue[row.etablissement]?.nom || row.etablissement) + ' · ' +
        (catalogue[row.etablissement]?.classes?.find(c => c.id === row.classe)?.nom || row.classe);
    const key = row => row.etablissement + '|' + row.classe;
    function text(tag, content) { const node = document.createElement(tag); node.textContent = content; return node; }
    function reset() {
        ++generation; ++request; busy = false; userId = null; currentClass = ''; classes = [];
        list.replaceChildren(); select.replaceChildren(); controls.disabled = true;
    }
    async function roster() {
        if (busy) { select.value = currentClass; return; }
        currentClass = select.value;
        const chosen = classes.find(row => key(row) === currentClass), current = generation, reading = ++request;
        list.replaceChildren();
        if (!chosen) return;
        status.textContent = 'Chargement des élèves…';
        try {
            const rows = await collaborationRpc('refonte_students', { p_school: chosen.etablissement, p_class: chosen.classe });
            const verified = await checkSession();
            if (current !== generation || reading !== request) return;
            if (verified.status !== 'authenticated' || verified.user.id !== userId || verified.profile.role !== 'teacher') {
                reset(); status.textContent = 'Reconnectez-vous avec votre compte professeur.'; return;
            }
            for (const pupil of rows) {
                const card = document.createElement('article'); card.className = 'student-card';
                const state = text('p', ENROLLMENT_LABELS[pupil.enrollment_status] || 'État indisponible');
                state.className = 'student-state'; state.dataset.state = pupil.enrollment_status;
                card.append(text('h2', pupil.prenom + ' ' + pupil.nom), state);
                const form = document.createElement('fieldset'), destination = document.createElement('select');
                const destinationLabel = text('label', 'Affectation'); destinationLabel.append(destination);
                for (const row of classes) destination.add(new Option(label(row), key(row)));
                destination.value = key(pupil);
                const save = text('button', 'Enregistrer l’affectation'), approve = text('button', 'Valider l’inscription');
                save.type = approve.type = 'button'; approve.hidden = pupil.enrollment_status === 'approved';
                approve.className = 'student-approve';
                form.append(destinationLabel, save, approve); card.append(form); list.append(card);
                async function update(approval) {
                    if (busy || current !== generation) return;
                    const target = classes.find(row => key(row) === destination.value);
                    if (!target) return;
                    busy = true; controls.disabled = true;
                    list.querySelectorAll('fieldset').forEach(node => { node.disabled = true; });
                    try {
                        await collaborationRpc('refonte_update_student', { p_student: pupil.user_id,
                            p_school: target.etablissement, p_class: target.classe, p_approve: approval,
                            p_expected_school: pupil.etablissement, p_expected_class: pupil.classe, p_expected_status: pupil.enrollment_status });
                        if (current !== generation) return;
                        busy = false; await roster();
                        if (current === generation) status.textContent = approval ? 'Inscription validée. L’élève peut recharger son espace.' : 'Affectation enregistrée. Les anciens travaux sont conservés.';
                    } catch (error) {
                        if (current === generation) status.textContent = error?.code === '40001' ?
                            'Ce profil a changé entre-temps. Actualisez avant de recommencer.' : 'Modification non confirmée. Actualisez pour vérifier le profil avant de réessayer.';
                    } finally {
                        if (current === generation) { busy = false; controls.disabled = false; list.querySelectorAll('fieldset').forEach(node => { node.disabled = false; }); }
                    }
                }
                save.addEventListener('click', () => update(false)); approve.addEventListener('click', () => update(true));
            }
            status.textContent = rows.length ? rows.length + ' élève(s) dans cette classe.' : 'Aucun élève inscrit dans cette classe.';
        } catch { if (current === generation && reading === request) status.textContent = 'Impossible de charger les élèves. Réessayez en actualisant.'; }
    }
    async function load() {
        reset(); const current = generation;
        const session = await checkSession();
        if (current !== generation) return;
        if (session.status !== 'authenticated' || session.profile.role !== 'teacher') { status.textContent = 'Connectez-vous avec votre compte professeur.'; return; }
        userId = session.user.id;
        const result = await db.from('teacher_class_assignments').select('etablissement, classe').eq('teacher_id', userId);
        if (current !== generation) return;
        if (result.error) throw result.error;
        classes = [...new Map((result.data || []).map(row => [key(row), row])).values()].sort((a, b) => label(a).localeCompare(label(b), 'fr'));
        for (const row of classes) select.add(new Option(label(row), key(row)));
        controls.disabled = !classes.length;
        if (!classes.length) { status.textContent = 'Aucune classe affectée à votre compte.'; return; }
        await roster();
    }
    select.addEventListener('change', roster); document.getElementById('students-refresh').addEventListener('click', roster);
    db?.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT' || (event === 'SIGNED_IN' && session?.user?.id !== userId)) {
            reset(); status.textContent = 'Connexion modifiée. Vérifiez votre compte professeur.';
            if (event === 'SIGNED_IN') setTimeout(() => load().catch(() => { status.textContent = 'Chargement interrompu. Reconnectez-vous.'; }), 0);
        }
    });
    load().catch(() => { status.textContent = 'Impossible de charger vos classes. Reconnectez-vous.'; });
}
initStudents();
