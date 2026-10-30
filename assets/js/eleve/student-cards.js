export function initStudentCards(page = document) {
    const cards = [...page.querySelectorAll('.student-expand-card')];
    let active = null;
    function close(restore = false) {
        const previous = active;
        cards.forEach(card => { card.open = false; });
        active = null;
        if (restore) previous?.querySelector('summary')?.focus();
    }
    function open(card) {
        active = card;
        cards.forEach(other => { other.open = other === card; });
    }
    for (const card of cards) {
        const summary = card.querySelector('summary');
        summary.addEventListener('click', event => {
            event.preventDefault();
            if (active === card) close();
            else { open(card); card.querySelector('[data-card-close]')?.focus(); }
        });
        card.querySelector('[data-card-close]')?.addEventListener('click', () => { close(true); });
        // Permet aussi l'ouverture depuis un lien interne du tableau de bord.
        card.addEventListener('toggle', () => { if (card.open && active !== card) open(card); });
    }
    page.addEventListener('keydown', event => {
        if (event.key === 'Escape' && active) { event.preventDefault(); close(true); }
    });
    page.addEventListener('pointerdown', event => { if (active && !active.contains(event.target)) close(); });
    return { close };
}
if (typeof document !== 'undefined') initStudentCards();
