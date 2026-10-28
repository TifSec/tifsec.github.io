export const THEMES = ['ocean', 'forest', 'plum', 'terracotta', 'ruby', 'slate', 'midnight', 'rose', 'neon', 'cyberpunk', 'minecraft', 'farming'];
export const validTheme = value => THEMES.includes(value) ? value : 'ocean';

// La préférence ne sert jamais à décider des droits d'accès.
export function themeController({ checkSession, update, apply, render, role = 'student' }) {
    let revision = 0, owner = null, saved = 'ocean', saving = false;
    function reset() {
        ++revision; owner = null; saving = false; saved = 'ocean';
        apply(null); render({ visible: false, disabled: true, theme: saved, message: '' });
    }
    async function load() {
        reset();
        const current = revision;
        try {
            const session = await checkSession();
            if (current !== revision || session.status !== 'authenticated' || session.profile.role !== role) return;
            owner = session.user.id;
            saved = validTheme(session.user.user_metadata?.student_theme);
            apply(saved);
            render({ visible: true, disabled: false, theme: saved, message: 'Ce choix te suivra sur les autres ordinateurs.' });
        } catch { /* Le thème ne bloque jamais l'accès au travail. */ }
    }
    async function choose(theme) {
        if (!owner || saving || !THEMES.includes(theme)) return;
        saving = true;
        const current = revision, userId = owner;
        render({ visible: true, disabled: true, theme, message: 'Enregistrement…' });
        try {
            const session = await checkSession();
            if (current !== revision) return;
            if (session.status !== 'authenticated' || session.user.id !== userId || session.profile.role !== role) { reset(); return; }
            const result = await update(theme);
            if (current !== revision) return;
            if (result.error || result.data?.user?.id !== userId || result.data.user.user_metadata?.student_theme !== theme) throw new Error('theme_not_saved');
            saved = theme;
            apply(saved);
            render({ visible: true, disabled: false, theme: saved, message: 'Apparence enregistrée dans ton compte.' });
        } catch {
            if (current === revision) {
                apply(saved);
                render({ visible: true, disabled: false, theme: saved, retry: true, message: 'Choix non enregistré. Ton ancienne apparence est conservée. Réessaie.' });
            }
        } finally { if (current === revision) saving = false; }
    }
    return { load, choose, reset, isSaving: () => saving };
}
