import { db } from '../bdd/bdd-connect.js';
import { checkSession } from '../auth/auth-session.js';
import { themeController, THEME_COSTS } from './theme-controller.js';

const picker = document.getElementById('student-theme-picker');
const select = document.getElementById('student-theme-select');
const status = document.getElementById('student-theme-status');
const retry = document.getElementById('student-theme-retry');
const xpLine = document.getElementById('student-theme-xp');
const unlockButton = document.getElementById('student-theme-unlock');
const cancelButton = document.getElementById('student-theme-cancel');
if (picker && select && status && retry && db) {
    let requested = 'ocean', timer, lastAction = 'choose';
    const labels = new Map([...select.options].map(option => [option.value, option.textContent]));
    const isTeacher = document.body.classList.contains('prof-shell');
    const controller = themeController({
        checkSession,
        role: isTeacher ? 'teacher' : 'student',
        update: theme => db.auth.updateUser({ data: { student_theme: theme } }),
        loadXp: async () => {
            const { data, error } = await db.rpc('refonte_my_xp');
            if (error) throw error;
            return Array.isArray(data) ? data[0] : data;
        },
        unlock: theme => db.rpc('refonte_unlock_theme', { p_theme: theme }),
        apply(theme) {
            if (theme) document.documentElement.dataset.studentTheme = theme;
            else delete document.documentElement.dataset.studentTheme;
        },
        render(state) {
            picker.hidden = !state.visible;
            select.disabled = state.disabled;
            const owned = new Set(state.owned || []);
            for (const option of select.options) {
                const base = labels.get(option.value) || option.value;
                const locked = state.owned && !owned.has(option.value);
                option.textContent = locked ? base + ' — 🔒 ' + THEME_COSTS[option.value] + ' XP' : base;
            }
            select.value = state.theme;
            status.textContent = state.message;
            retry.hidden = !state.retry;
            if (xpLine) {
                xpLine.hidden = !state.xp;
                xpLine.textContent = state.xp ? 'Ton expérience : ' + state.xp.balance + ' XP à dépenser (' + state.xp.earned + ' gagnés).' : '';
            }
            const preview = state.preview;
            if (unlockButton) {
                unlockButton.hidden = !preview;
                unlockButton.disabled = state.disabled || !preview || (state.xp?.balance ?? 0) < THEME_COSTS[preview];
                unlockButton.textContent = preview ? 'Débloquer pour ' + THEME_COSTS[preview] + ' XP' : 'Débloquer';
            }
            if (cancelButton) { cancelButton.hidden = !preview; cancelButton.disabled = state.disabled; }
            // Boutique de l'espace élève : solde réel.
            const balance = document.querySelector('.student-shop-balance-value');
            if (balance && state.xp) {
                balance.textContent = state.xp.balance + ' XP';
                const note = balance.parentElement?.querySelector('p span');
                if (note) note.textContent = state.xp.earned + ' XP gagnés : 10 par séance remise, plus ta note sur 20 quand le professeur corrige' +
                    (document.querySelector('meta[name="tifsec-bonus-defi"]') ? ', et 5 de plus pour chaque petit défi réussi.' : '.');
            }
        }
    });
    select.addEventListener('change', () => { requested = select.value; lastAction = 'choose'; controller.choose(requested); });
    unlockButton?.addEventListener('click', () => { lastAction = 'buy'; controller.buy(); });
    cancelButton?.addEventListener('click', () => controller.cancelPreview());
    retry.addEventListener('click', () => { if (lastAction === 'buy') controller.buy(requested); else controller.choose(requested); });
    db.auth.onAuthStateChange(event => {
        if (!['SIGNED_OUT', 'SIGNED_IN', 'TOKEN_REFRESHED', 'USER_UPDATED'].includes(event)) return;
        if (event === 'USER_UPDATED' && controller.isSaving()) return;
        clearTimeout(timer);
        controller.reset();
        if (event !== 'SIGNED_OUT') timer = setTimeout(() => { controller.load(); }, 0);
    });
    window.addEventListener('pageshow', event => { if (event.persisted) controller.load(); });
    controller.load();
}
