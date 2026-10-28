export function progressSnapshot(fields) {
    const required = fields.filter(field => field.dataset.required !== 'false');
    return { total: required.length, filled: required.filter(field => String(field.value || '').trim()).length };
}

export function missionSnapshot(activity) {
    const fields = [...activity.querySelectorAll('[data-answer-id]')].filter(field => field.dataset.required !== 'false');
    const filled = fields.filter(field => String(field.value || '').trim()).length;
    if (!fields.length || !filled) return { state: 'todo', filled, total: fields.length };
    if (filled === fields.length) return { state: 'complete', filled, total: fields.length };
    return { state: 'doing', filled, total: fields.length };
}

export function initProgress() {
    const fieldset = document.getElementById('course-answers');
    const label = document.getElementById('course-progress-label');
    const progress = document.getElementById('course-progress');
    const status = document.getElementById('course-save-status');
    const identity = document.getElementById('course-identity');
    if (!fieldset || !label || !progress || !status) return;
    function update() {
        for (const activity of fieldset.querySelectorAll('.cours-activite')) {
            const badge = activity.querySelector('[data-course-mission-status]');
            if (!badge) continue;
            const mission = missionSnapshot(activity);
            badge.dataset.state = mission.state;
            badge.textContent = mission.state === 'complete' ? 'Étape renseignée' : mission.state === 'doing' ? mission.filled + ' réponse(s) sur ' + mission.total : 'À commencer';
            activity.dataset.missionState = mission.state;
        }
        if (!identity?.textContent?.trim() || ['loading', 'load_error'].includes(status.dataset.state)) {
            progress.max = 1; progress.value = 0;
            label.textContent = 'Ouvre ta copie pour retrouver ton avancement.';
            return;
        }
        const state = progressSnapshot([...fieldset.querySelectorAll('[data-answer-id]')]);
        progress.max = state.total || 1;
        progress.value = state.filled;
        label.textContent = state.filled + ' / ' + state.total + ' réponses obligatoires renseignées';
    }
    fieldset.addEventListener('input', update);
    fieldset.addEventListener('change', update);
    const observer = new MutationObserver(update);
    observer.observe(status, { childList: true, characterData: true, subtree: true, attributes: true });
    observer.observe(fieldset, { attributes: true, attributeFilter: ['disabled'] });
    const stepLinks = [...(document.querySelectorAll?.('#course-step-list a[href^="#"]') || [])];
    const sections = stepLinks.map(link => document.getElementById(decodeURIComponent(link.hash.slice(1)))).filter(Boolean);
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window && stepLinks.length) {
        const navigationObserver = new IntersectionObserver(entries => {
            const active = entries.filter(entry => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top).at(0);
            if (!active) return;
            stepLinks.forEach(link => {
                if (link.hash === '#' + active.target.id) link.setAttribute('aria-current', 'step');
                else link.removeAttribute('aria-current');
            });
        }, { rootMargin: '-18% 0px -68% 0px', threshold: 0 });
        sections.forEach(section => navigationObserver.observe(section));
    }
    update();
}

initProgress();
