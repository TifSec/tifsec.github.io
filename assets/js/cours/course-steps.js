// Parcours pas à pas : la carte « Ta mission du jour » reste visible, une seule étape
// (mission, défi, conclusion ou bilan final) est affichée à la fois.
// Sans JavaScript, toutes les étapes restent visibles : rien n'est masqué dans le HTML.

const STORAGE_PREFIX = 'tifsec-etape:';

// Calcul pur : position de l'étape qui contient l'élément visé par une ancre.
export function stepIndexFor(steps, target) {
    if (!target) return -1;
    return steps.findIndex(step => step === target || (typeof step.contains === 'function' && step.contains(target)));
}

// Calcul pur : étape à afficher au chargement (ancre de l'adresse, sinon étape mémorisée, sinon la première).
export function initialStepIndex(count, { hashIndex = -1, storedIndex = null } = {}) {
    if (!count) return -1;
    if (Number.isInteger(hashIndex) && hashIndex >= 0 && hashIndex < count) return hashIndex;
    const stored = Number(storedIndex);
    if (storedIndex !== null && Number.isInteger(stored) && stored >= 0 && stored < count) return stored;
    return 0;
}

export function stepLabel(index, count) {
    return 'Étape ' + (index + 1) + ' sur ' + count;
}

function readStored(key) {
    try { return window.sessionStorage.getItem(key); } catch { return null; }
}
function writeStored(key, value) {
    try { window.sessionStorage.setItem(key, String(value)); } catch { /* stockage indisponible : on garde seulement l'état de la page */ }
}

export function initCourseSteps(doc = document) {
    const reading = doc.querySelector('.course-reading');
    const work = doc.getElementById('course-work');
    if (!reading) return null;
    const steps = [...reading.querySelectorAll('[data-course-step]')];
    if (steps.length < 2) return null;
    const storageKey = STORAGE_PREFIX + [work?.dataset.matiere, work?.dataset.classe, work?.dataset.seance].join('/');
    const stepLinks = [...doc.querySelectorAll('#course-step-list a[href^="#"]')];
    const reduceMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let current = -1;

    doc.body.dataset.courseSteps = 'on';
    reading.classList.add('course-steps-enabled');
    steps.forEach((step, index) => {
        const heading = step.querySelector('h2');
        if (heading && !heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
        const counter = step.querySelector('[data-course-step-counter]');
        if (counter) counter.textContent = stepLabel(index, steps.length);
    });

    function markLinks() {
        const activeId = steps[current]?.id;
        stepLinks.forEach(link => {
            const target = doc.getElementById(decodeURIComponent(link.hash.slice(1)));
            const index = stepIndexFor(steps, target);
            link.toggleAttribute('data-step-done', index >= 0 && index < current);
            if (index === current && activeId) link.setAttribute('aria-current', 'step');
            else link.removeAttribute('aria-current');
        });
    }

    function show(index, { focus = false, scroll = false } = {}) {
        if (index < 0 || index >= steps.length) return;
        current = index;
        steps.forEach((step, position) => {
            const visible = position === index;
            step.classList.toggle('course-step-hidden', !visible);
            step.toggleAttribute('data-step-current', visible);
            if (visible) step.removeAttribute('aria-hidden'); else step.setAttribute('aria-hidden', 'true');
        });
        writeStored(storageKey, index);
        markLinks();
        const step = steps[index];
        if (scroll) step.scrollIntoView?.({ block: 'start', behavior: reduceMotion ? 'auto' : 'smooth' });
        if (focus) step.querySelector('h2')?.focus({ preventScroll: true });
    }

    function revealTarget(target, options) {
        const index = stepIndexFor(steps, target);
        if (index >= 0) show(index, options);
        return index;
    }

    // Boutons « Passer à l'étape suivante », « Étape précédente » et liens de la colonne « Étapes de la séance ».
    doc.addEventListener('click', event => {
        const link = event.target.closest?.('a[href^="#"]');
        if (!link || !reading.contains(link) && !link.closest('#course-step-list')) return;
        const target = doc.getElementById(decodeURIComponent(link.hash.slice(1)));
        const index = stepIndexFor(steps, target);
        if (index < 0) return; // ancre hors des étapes (ex. : « Comprendre l'objectif ») : comportement normal
        event.preventDefault();
        show(index, { focus: true, scroll: true });
        try { window.history.replaceState(null, '', '#' + steps[index].id); } catch { /* adresse inchangée */ }
    });

    // Une ancre ouverte autrement (retour de correction, lien direct) affiche l'étape qui la contient.
    window.addEventListener('hashchange', () => {
        const target = doc.getElementById(decodeURIComponent(window.location.hash.slice(1)));
        if (revealTarget(target, { scroll: true }) >= 0) target.scrollIntoView?.({ block: 'start' });
    });

    // Un champ qui reçoit le focus (tabulation, message d'erreur) ne doit jamais rester dans une étape cachée.
    reading.addEventListener('focusin', event => {
        const index = stepIndexFor(steps, event.target);
        if (index >= 0 && index !== current) show(index);
    });

    const hashTarget = window.location.hash ? doc.getElementById(decodeURIComponent(window.location.hash.slice(1))) : null;
    show(initialStepIndex(steps.length, { hashIndex: stepIndexFor(steps, hashTarget), storedIndex: readStored(storageKey) }));
    return { steps, show, current: () => current };
}

if (typeof document !== 'undefined' && typeof window !== 'undefined') initCourseSteps();
