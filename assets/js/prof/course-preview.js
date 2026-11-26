import { mountCourseGraphs } from '../cours/course-graph.js';
import { openCoursePaperTab } from '../cours/course-paper-tab.js';

const publicCourses = new Map();
const maximumCourses = 6;
const freshness = 5 * 60 * 1000;

export async function loadCoursePreview(root, lesson, signal, isCurrent) {
    if (!lesson.url?.startsWith('/') || lesson.url.startsWith('//') || /[\\\s]/.test(lesson.url)) throw new Error('invalid_url');
    const key = lesson.url + '|' + (lesson.version || '');
    let entry = publicCourses.get(key);
    if (!entry || Date.now() - entry.time >= freshness) {
        const response = await fetch(lesson.url, { credentials: 'same-origin', cache: 'no-cache', signal });
        if (!response.ok) throw new Error('course_unavailable');
        entry = { html: await response.text(), time: Date.now() };
    }
    const html = entry.html;
    if (!isCurrent()) return false;
    const course = new DOMParser().parseFromString(html, 'text/html');
    const identity = course.getElementById('course-work')?.dataset;
    if (!identity || !['etablissement', 'matiere', 'classe', 'seance'].every(key => identity[key] === lesson[key])) throw new Error('course_mismatch');
    const sections = course.querySelectorAll('.cours-intro, .cours-activites, .cours-synthese');
    if (!sections.length) throw new Error('course_unavailable');
    const paperSource = course.getElementById('course-paper-version');
    // Uniquement le HTML public original : jamais les notes privées ni les réponses.
    publicCourses.delete(key); publicCourses.set(key, entry);
    if (publicCourses.size > maximumCourses) publicCourses.delete(publicCourses.keys().next().value);
    const columns = document.createElement('div'); columns.className = 'course-columns';
    const navigation = document.createElement('aside'); navigation.className = 'course-navigation';
    const heading = document.createElement('h2'); heading.textContent = 'Étapes de la séance';
    const nav = document.createElement('nav'); nav.setAttribute('aria-label', 'Étapes du cours professeur');
    const list = document.createElement('ol'); nav.append(list); navigation.append(heading, nav);
    list.id = 'course-step-list';
    const reading = document.createElement('div'); reading.className = 'course-reading';
    for (const node of sections) {
        const copy = document.importNode(node, true);
        if (!String(copy.className || '').split(/\s+/).includes('cours-synthese')) { reading.append(copy); continue; }
        // Comme pour l'élève : le bilan est la dernière carte du parcours.
        const final = document.createElement('section');
        final.className = 'course-final-step'; final.id = 'course-final'; final.setAttribute('data-course-step', '');
        final.setAttribute('aria-label', 'Fin de la séance'); final.append(copy); reading.append(final);
    }
    for (const section of reading.querySelectorAll('#course-intro, .cours-activite, #course-final')) {
        const li = document.createElement('li'), link = document.createElement('a');
        link.href = '#' + encodeURIComponent(section.id);
        link.textContent = section.id === 'course-final' ? 'Faire le point' : section.querySelector('h1, h2')?.textContent || 'Étape';
        li.append(link); list.append(li);
    }
    columns.append(navigation, reading);
    const content = [columns];
    if (paperSource) {
        const actions = document.createElement('div');
        actions.className = 'teacher-course-paper-actions';
        const toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.textContent = 'Version papier';
        const paper = document.importNode(paperSource, true);
        paper.hidden = true;
        toggle.addEventListener('click', () => {
            if (!openCoursePaperTab(paper)) {
                const status = root.querySelector('[role="status"]');
                if (status) status.textContent = 'Le nouvel onglet a été bloqué. Autorise les fenêtres surgissantes pour ouvrir la fiche.';
            }
        });
        // Source cachée gardée dans la page : le corrigé papier du professeur la recopie.
        paper.setAttribute('data-paper-source', '');
        actions.append(toggle, paper);
        content.unshift(actions);
    }
    root.replaceChildren(...content);
    root.querySelectorAll('[data-answer-id]').forEach(field => { field.disabled = true; field.value = ''; });
    mountCourseGraphs(root);
    return true;
}

// Corrigé de la version papier (maths) : même fiche que celle des élèves, réponses à la place des lignes.
// Réponses reprises dans l'ordre des questions ; si le nombre ne correspond pas, aucun bouton.
// Le bouton porte data-teacher-private : il disparaît avec les autres notes privées.
export function addPaperCorrection(preview, content) {
    const fiche = content?.corrige_version_papier?.fiche;
    const actions = preview.querySelector('.teacher-course-paper-actions');
    const source = actions?.querySelector('[data-paper-source]');
    if (!Array.isArray(fiche) || !source) return false;
    const answers = fiche.flatMap(part => Array.isArray(part?.reponses) ? part.reponses.map(item => String(item?.reponse ?? '')) : []);
    if (!answers.length || answers.length !== source.querySelectorAll('.course-paper-questions > li').length) return false;
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Version papier — corrigé professeur';
    button.setAttribute('data-teacher-private', '');
    button.addEventListener('click', () => {
        const copy = source.cloneNode(true);
        copy.removeAttribute('data-paper-source');
        copy.querySelectorAll('.course-paper-questions > li').forEach((item, index) => {
            item.querySelectorAll('.course-paper-answer-lines, .course-paper-zone-label, .course-paper-resultat').forEach(node => node.remove());
            const answer = document.createElement('span');
            answer.className = 'course-paper-corrige';
            answer.textContent = answers[index];
            item.append(answer);
        });
        const header = copy.querySelector('.course-paper-sheet > header');
        const banner = document.createElement('p');
        banner.className = 'course-paper-corrige-banner';
        banner.textContent = 'Corrigé professeur — ne pas distribuer';
        header?.prepend(banner);
        header?.querySelector('h2')?.prepend('Corrigé — ');
        if (!openCoursePaperTab(copy)) {
            const status = preview.parentElement?.querySelector('[role="status"]');
            if (status) status.textContent = 'Le nouvel onglet a été bloqué. Autorise les fenêtres surgissantes pour ouvrir le corrigé.';
        }
    });
    actions.append(button);
    return true;
}
