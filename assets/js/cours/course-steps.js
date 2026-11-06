// Parcours pas à pas : une seule étape est affichée à la fois. La carte « Ta mission du jour »
// s'affiche en premier ; elle est ensuite remplacée par chaque mission, le défi, la conclusion
// puis le bilan final. On peut toujours revenir aux étapes précédentes.
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

function headingOf(step) {
    return step.querySelector('h1') || step.querySelector('h2');
}

// Options (cours professeur) : `reading` = zone de lecture, `stepList` = liste des étapes, `storageKey`,
// `updateHash` = false pour ne pas modifier l'adresse de la page hôte.
export function initCourseSteps(doc = document, options = {}) {
    const reading = options.reading || doc.querySelector('.course-reading');
    const work = doc.getElementById('course-work');
    if (!reading) return null;
    const steps = [...reading.querySelectorAll('[data-course-step]')];
    if (steps.length < 2) return null;
    const storageKey = options.storageKey || STORAGE_PREFIX + [work?.dataset.matiere, work?.dataset.classe, work?.dataset.seance].join('/');
    const stepList = options.stepList || doc.getElementById('course-step-list');
    const updateHash = options.updateHash !== false;
    const stepLinks = stepList ? [...stepList.querySelectorAll('a[href^="#"]')] : [];
    const reduceMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let current = -1;

    doc.body.dataset.courseSteps = 'on';
    reading.classList.add('course-steps-enabled');
    steps.forEach((step, index) => {
        const heading = headingOf(step);
        if (heading && !heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
        const counter = step.querySelector('[data-course-step-counter]');
        if (counter) counter.textContent = stepLabel(index, steps.length);
    });

    const byId = id => doc.getElementById(id);
    function markLinks() {
        const activeId = steps[current]?.id;
        stepLinks.forEach(link => {
            const target = byId(decodeURIComponent(link.hash.slice(1)));
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
        if (focus) headingOf(step)?.focus({ preventScroll: true });
    }

    function revealTarget(target, options) {
        const index = stepIndexFor(steps, target);
        if (index >= 0) show(index, options);
        return index;
    }

    // Boutons « Passer à l'étape suivante », « Étape précédente » et liens de la colonne « Étapes de la séance ».
    const onClick = event => {
        const link = event.target.closest?.('a[href^="#"]');
        if (!link || !reading.contains(link) && !(stepList && stepList.contains(link))) return;
        const target = byId(decodeURIComponent(link.hash.slice(1)));
        const index = stepIndexFor(steps, target);
        if (index < 0) return; // ancre hors des étapes : comportement normal
        event.preventDefault();
        show(index, { focus: true, scroll: true });
        if (updateHash) { try { window.history.replaceState(null, '', '#' + steps[index].id); } catch { /* adresse inchangée */ } }
    };
    doc.addEventListener('click', onClick);

    // Une ancre ouverte autrement (retour de correction, lien direct) affiche l'étape qui la contient.
    const onHash = () => {
        const target = byId(decodeURIComponent(window.location.hash.slice(1)));
        if (revealTarget(target, { scroll: true }) >= 0) target.scrollIntoView?.({ block: 'start' });
    };
    if (updateHash) window.addEventListener('hashchange', onHash);

    // Un champ qui reçoit le focus (tabulation, message d'erreur) ne doit jamais rester dans une étape cachée.
    const onFocus = event => {
        const index = stepIndexFor(steps, event.target);
        if (index >= 0 && index !== current) show(index);
    };
    reading.addEventListener('focusin', onFocus);

    const hashTarget = updateHash && window.location.hash ? byId(decodeURIComponent(window.location.hash.slice(1))) : null;
    show(initialStepIndex(steps.length, { hashIndex: stepIndexFor(steps, hashTarget), storedIndex: readStored(storageKey) }));
    function dispose() {
        doc.removeEventListener('click', onClick);
        window.removeEventListener('hashchange', onHash);
        reading.removeEventListener('focusin', onFocus);
    }
    return { steps, show, current: () => current, dispose };
}

if (typeof document !== 'undefined' && typeof window !== 'undefined' && document.getElementById('course-work')) initCourseSteps();
