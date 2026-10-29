import { db } from '../bdd/bdd-connect.js';
import { checkSession } from '../auth/auth-session.js';

import { loadCoursePreview } from './course-preview.js';
import { initCourseSteps } from '../cours/course-steps.js';
import { clearTeacherNotes, renderTeacherNotes } from './teacher-notes.js';
import { initialCourseScope, lessonsInScope } from './course-selection.js';

export function initPrivateCourse() {
    const root = document.getElementById('teacher-course');
    if (!root) return;
    const select = document.getElementById('teacher-course-select');
    const open = document.getElementById('teacher-course-open');
    const loadPrivate = document.getElementById('teacher-course-private');
    const hide = document.getElementById('teacher-course-hide');
    const status = document.getElementById('teacher-course-status');
    const preview = document.getElementById('teacher-course-preview');
    const notes = document.getElementById('teacher-course-notes');
    const subject = document.getElementById('teacher-course-subject');
    const schoolClass = document.getElementById('teacher-course-class');
    const context = document.getElementById('teacher-course-context');
    const copiesLink = document.getElementById('teacher-course-copies');
    let generation = 0, userId = null, controller, timer, steps = null;
    let lessons = [];
    let scopes = [], catalogue = [];
    const labels = { techno: 'Technologie', tim: 'TIM', maths: 'Mathématiques' };
    const classKey = scope => scope.etablissement + '|' + scope.classe;
    function options(control, entries) {
        control.replaceChildren();
        for (const [value, label] of entries) control.add(new Option(label, value));
    }
    function selectedScope() {
        return scopes.find(scope => scope.matiere === subject.value && classKey(scope) === schoolClass.value);
    }
    function updateLessons() {
        clearNotes(); clearSteps(); preview.replaceChildren();
        const scope = selectedScope();
        lessons = lessonsInScope(catalogue, scope);
        options(select, lessons.map((lesson, index) => [String(index), lesson.seance + ' — ' + lesson.titre]));
        if (lessons.length) select.value = '0';
        select.disabled = !lessons.length; open.disabled = !lessons.length;
        loadPrivate.disabled = root.dataset.enabled !== 'true' || !lessons.length;
        context.textContent = scope ? (labels[scope.matiere] || scope.matiere) + ' · ' + (scope.etablissement === 'college' ? 'Collège' : 'MFR') + ' · ' + scope.classe : '';
        copiesLink.hidden = !lessons.length;
        if (scope) copiesLink.href = (copiesLink.dataset.baseUrl || '/prof/suivi/') + '?' + new URLSearchParams({ matiere: scope.matiere, etablissement: scope.etablissement, classe: scope.classe });
        status.textContent = lessons.length ? 'Choisissez une séance, puis le cours professeur, la version élève ou les copies à consulter.' : scope ? 'Aucune séance n’est encore intégrée pour cette classe dans le nouveau site. Les cours apparaîtront ici après leur adaptation.' : 'Cette matière ou cette classe ne correspond pas à vos affectations. Choisissez parmi les classes autorisées.';
    }
    function updateClasses(preferred) {
        const available = scopes.filter(scope => scope.matiere === subject.value);
        options(schoolClass, available.map(scope => [classKey(scope), (scope.etablissement === 'college' ? 'Collège' : 'MFR') + ' · ' + scope.classe]));
        schoolClass.value = preferred || (available[0] ? classKey(available[0]) : '');
        schoolClass.disabled = !available.length;
        updateLessons();
    }
    function clearSteps() { steps?.dispose(); steps = null; }
    function startSteps(lesson) {
        clearSteps();
        steps = initCourseSteps(document, { reading: preview.querySelector('.course-reading'), stepList: preview.querySelector('#course-step-list'),
            storageKey: 'tifsec-etape-prof:' + [lesson.matiere, lesson.classe, lesson.seance].join('/'), updateHash: false });
    }
    function clearNotes() {
        ++generation; controller?.abort();
        clearTeacherNotes(preview, notes);
        root.dataset.mode = 'student';
    }
    function reset() {
        clearNotes(); clearSteps(); preview.replaceChildren(); select.replaceChildren();
        select.disabled = true; open.disabled = true; loadPrivate.disabled = true; userId = null;
        subject.replaceChildren(); schoolClass.replaceChildren();
        subject.disabled = true; schoolClass.disabled = true; context.textContent = ''; copiesLink.hidden = true;
        scopes = []; catalogue = []; lessons = [];
    }
    async function start() {
        reset();
        const current = generation;
        try {
            const session = await checkSession();
            if (current !== generation) return;
            if (session.status !== 'authenticated' || session.profile.role !== 'teacher') { status.textContent = 'Connectez-vous avec votre compte professeur.'; return; }
            const assignments = await db.from('teacher_class_assignments').select('etablissement,matiere,classe').eq('teacher_id', session.user.id);
            if (current !== generation) return;
            if (assignments.error || !Array.isArray(assignments.data)) throw new Error('scope_unavailable');
            userId = session.user.id;
            catalogue = JSON.parse(document.getElementById('seances-data')?.textContent || '[]');
            scopes = assignments.data;
            const subjects = [...new Set(scopes.map(scope => scope.matiere))];
            options(subject, subjects.map(value => [value, labels[value] || value]));
            subject.disabled = !subjects.length;
            const scope = initialCourseScope(scopes, catalogue, new URL(window.location.href).searchParams);
            subject.value = scope?.matiere || '';
            updateClasses(scope ? classKey(scope) : '');
        } catch { if (current === generation) status.textContent = 'Impossible de charger les séances. Rechargez la page pour réessayer.'; }
    }
    async function show(privateMode) {
        clearNotes();
        const current = generation, lesson = lessons[Number(select.value)], actor = userId;
        if (!lesson || !actor || (privateMode && root.dataset.enabled !== 'true')) return;
        let courseLoaded = false;
        controller = new AbortController();
        open.disabled = true; loadPrivate.disabled = true;
        status.textContent = privateMode ? 'Vérification et chargement des notes privées…' : 'Chargement du cours…';
        try {
            const verified = await checkSession();
            if (current !== generation) return;
            if (verified.status !== 'authenticated' || verified.user.id !== actor || verified.profile.role !== 'teacher') { reset(); status.textContent = 'Votre connexion a changé. Rechargez la page.'; return; }
            const body = Object.fromEntries(['etablissement', 'matiere', 'classe', 'seance', 'version'].map(key => [key, lesson[key]]));
            const shown = await loadCoursePreview(preview, lesson, controller.signal, () => current === generation);
            if (current !== generation || !shown) return;
            courseLoaded = true;
            startSteps(lesson);
            if (privateMode) {
                status.textContent = 'Cours chargé. Vérification et chargement des corrections privées…';
                const response = await db.functions.invoke('teacher-course', { body, signal: controller.signal });
                // Réponse arrivée après un changement de classe, de séance ou de compte : ne rien afficher.
                if (current !== generation) return;
                if (response.error || !response.data?.content) throw new Error('private_unavailable');
                renderTeacherNotes(preview, notes, response.data.content, lesson);
                root.dataset.mode = 'private';
                status.textContent = 'Version professeur chargée : les conseils et corrigés accompagnent les activités. Passez en version élève avant de projeter.';
            } else {
                status.textContent = 'Version élève affichée : les notes privées ont été effacées.';
            }
        } catch { if (current === generation) { clearTeacherNotes(preview, notes); root.dataset.mode = 'student'; status.textContent = courseLoaded ? 'Le cours est affiché, mais ses corrections privées n’ont pas pu être chargées. Vérifiez votre connexion professeur et réessayez.' : 'Le cours n’a pas pu être chargé. Vérifiez votre connexion et réessayez.'; } }
        finally { if (current === generation) { open.disabled = false; loadPrivate.disabled = root.dataset.enabled !== 'true'; } }
    }
    select.addEventListener('change', () => {
        clearNotes(); clearSteps(); preview.replaceChildren(); open.disabled = false; loadPrivate.disabled = root.dataset.enabled !== 'true';
        status.textContent = 'Séance changée. Ouvrez le cours ou ses notes privées.';
    });
    subject.addEventListener('change', () => updateClasses());
    schoolClass.addEventListener('change', updateLessons);
    open.addEventListener('click', () => show(false));
    loadPrivate.addEventListener('click', () => show(true));
    hide.addEventListener('click', () => { clearNotes(); open.disabled = !userId || !lessons.length; loadPrivate.disabled = !userId || !lessons.length || root.dataset.enabled !== 'true'; status.textContent = 'Les notes privées ont été effacées de cet affichage.'; });
    db?.auth.onAuthStateChange(event => {
        if (!['SIGNED_OUT', 'SIGNED_IN', 'TOKEN_REFRESHED', 'USER_UPDATED'].includes(event)) return;
        clearTimeout(timer); reset();
        if (event === 'SIGNED_OUT') status.textContent = 'Vous êtes déconnecté.';
        else timer = setTimeout(start, 0);
    });
    window.addEventListener('pagehide', reset);
    window.addEventListener('pageshow', event => { if (event.persisted) start(); });
    start();
}

initPrivateCourse();
