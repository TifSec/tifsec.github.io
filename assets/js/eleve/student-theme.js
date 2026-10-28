import { db } from '../bdd/bdd-connect.js';
import { checkSession } from '../auth/auth-session.js';
import { themeController } from './theme-controller.js';

const picker = document.getElementById('student-theme-picker');
const select = document.getElementById('student-theme-select');
const status = document.getElementById('student-theme-status');
const retry = document.getElementById('student-theme-retry');
if (picker && select && status && retry && db) {
    let requested = 'ocean', timer;
    const controller = themeController({
        checkSession,
        role: document.body.classList.contains('prof-shell') ? 'teacher' : 'student',
        update: theme => db.auth.updateUser({ data: { student_theme: theme } }),
        apply(theme) {
            if (theme) document.documentElement.dataset.studentTheme = theme;
            else delete document.documentElement.dataset.studentTheme;
        },
        render(state) {
            picker.hidden = !state.visible;
            select.disabled = state.disabled;
            select.value = state.theme;
            status.textContent = state.message;
            retry.hidden = !state.retry;
        }
    });
    select.addEventListener('change', () => { requested = select.value; controller.choose(requested); });
    retry.addEventListener('click', () => { controller.choose(requested); });
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
