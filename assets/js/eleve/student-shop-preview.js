export const avatarStyles = Object.freeze([
    { id: 'explorateur', label: 'Explorateur' },
    { id: 'astronaute', label: 'Astronaute' },
    { id: 'inventeur', label: 'Inventeur' },
    { id: 'robot', label: 'Robot' }
]);

export const avatarPalettes = Object.freeze([
    { id: 'lagon', label: 'Lagon' },
    { id: 'soleil', label: 'Soleil' },
    { id: 'foret', label: 'Forêt' },
    { id: 'nebuleuse', label: 'Nébuleuse' }
]);

export function randomAvatar(random = Math.random) {
    const pick = list => list[Math.min(list.length - 1, Math.floor(random() * list.length))];
    return { style: pick(avatarStyles).id, palette: pick(avatarPalettes).id, accessory: random() >= 0.5 };
}

export function initStudentShopPreview(root = document) {
    const preview = root.getElementById('student-avatar-preview');
    const status = root.getElementById('avatar-preview-status');
    if (preview && status) {
        const styleButtons = [...root.querySelectorAll('button[data-avatar-style]')];
        const paletteButtons = [...root.querySelectorAll('button[data-avatar-palette]')];
        const accessoryButton = root.querySelector('[data-avatar-accessory]');
        const randomButton = root.querySelector('[data-avatar-random]');
        const state = {
            style: preview.dataset.avatarStyle,
            palette: preview.dataset.avatarPalette,
            accessory: preview.dataset.avatarAccessory === 'true'
        };
        const label = (choices, id) => choices.find(choice => choice.id === id)?.label || id;
        const render = () => {
            preview.dataset.avatarStyle = state.style;
            preview.dataset.avatarPalette = state.palette;
            preview.dataset.avatarAccessory = String(state.accessory);
            preview.setAttribute('aria-label', `Avatar ${label(avatarStyles, state.style)}, tenue ${label(avatarPalettes, state.palette)}${state.accessory ? ', avec badge' : ''}`);
            styleButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.avatarStyle === state.style)));
            paletteButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.avatarPalette === state.palette)));
            accessoryButton?.setAttribute('aria-pressed', String(state.accessory));
            status.textContent = `${label(avatarStyles, state.style)} — tenue ${label(avatarPalettes, state.palette)}${state.accessory ? ', badge étoile ajouté' : ''}. Cet aperçu ne sera pas sauvegardé.`;
        };
        styleButtons.forEach(button => button.addEventListener('click', () => {
            state.style = button.dataset.avatarStyle;
            render();
        }));
        paletteButtons.forEach(button => button.addEventListener('click', () => {
            state.palette = button.dataset.avatarPalette;
            render();
        }));
        accessoryButton?.addEventListener('click', () => {
            state.accessory = !state.accessory;
            render();
        });
        randomButton?.addEventListener('click', () => {
            Object.assign(state, randomAvatar());
            render();
        });
        render();
    }

    const progress = root.getElementById('shop-demo-progress');
    const fill = progress?.querySelector('[data-xp-demo-fill]');
    const count = root.getElementById('shop-demo-xp-count');
    const message = root.getElementById('shop-demo-xp-status');
    const addButton = root.querySelector('[data-xp-demo-add]');
    const resetButton = root.querySelector('[data-xp-demo-reset]');
    if (!progress || !fill || !count || !message) return;

    let points = 0;
    const renderProgress = () => {
        const complete = points >= 100;
        progress.setAttribute('aria-valuenow', String(points));
        progress.dataset.complete = String(complete);
        fill.style.width = `${points}%`;
        count.textContent = `${points} / 100 XP fictifs`;
        message.textContent = complete
            ? 'Bravo ! Le cadre d’avatar est gagné dans cette démonstration. Aucun point réel n’a été ajouté.'
            : `Encore ${100 - points} XP fictifs avant le cadre d’avatar.`;
    };
    addButton?.addEventListener('click', () => {
        points = Math.min(100, points + 20);
        renderProgress();
    });
    resetButton?.addEventListener('click', () => {
        points = 0;
        renderProgress();
    });
    renderProgress();
}

if (typeof document !== 'undefined') initStudentShopPreview();
