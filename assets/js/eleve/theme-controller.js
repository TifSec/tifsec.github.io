export const THEMES = ['ocean', 'forest', 'plum', 'terracotta', 'ruby', 'slate', 'midnight', 'rose', 'neon', 'cyberpunk', 'minecraft', 'farming'];
// Prix en XP (identiques à refonte_private.theme_cost côté base ; la base reste seule juge).
export const THEME_COSTS = Object.freeze({ ocean: 0, forest: 30, plum: 30, terracotta: 30, ruby: 30, slate: 30, rose: 30, midnight: 60, neon: 60, cyberpunk: 100, minecraft: 100, farming: 100 });
export const validTheme = value => THEMES.includes(value) ? value : 'ocean';

// La préférence ne sert jamais à décider des droits d'accès.
// loadXp / unlock (facultatifs) : sans eux, tous les thèmes sont disponibles (professeur, tests).
export function themeController({ checkSession, update, apply, render, role = 'student', loadXp, unlock }) {
    let revision = 0, owner = null, saved = 'ocean', saving = false, preview = null;
    let owned = new Set(THEMES), xp = null;
    const state = (extra = {}) => ({ visible: true, disabled: false, theme: preview || saved, saved, preview, owned: [...owned], xp, costs: THEME_COSTS, ...extra });
    function reset() {
        ++revision; owner = null; saving = false; saved = 'ocean'; preview = null; owned = new Set(THEMES); xp = null;
        apply(null); render({ visible: false, disabled: true, theme: saved, message: '' });
    }
    function setXp(value) {
        if (!value || !Number.isInteger(value.balance) || !Array.isArray(value.unlocked)) throw new Error('xp_unavailable');
        xp = { earned: value.earned, spent: value.spent, balance: value.balance };
        owned = new Set(['ocean', ...value.unlocked.filter(theme => THEMES.includes(theme))]);
    }
    async function load() {
        reset();
        const current = revision;
        try {
            const session = await checkSession();
            if (current !== revision || session.status !== 'authenticated' || session.profile.role !== role) return;
            owner = session.user.id;
            saved = validTheme(session.user.user_metadata?.student_theme);
            let message = 'Ce choix te suivra sur les autres ordinateurs.';
            if (loadXp && role === 'student') {
                try { setXp(await loadXp()); }
                catch { owned = new Set(['ocean', saved]); message = 'Ton expérience n’a pas pu être chargée : les thèmes déjà choisis restent utilisables.'; }
                if (current !== revision) return;
                if (!owned.has(saved)) saved = 'ocean';
            }
            apply(saved);
            render(state({ message }));
        } catch { /* Le thème ne bloque jamais l'accès au travail. */ }
    }
    async function save(theme) {
        saving = true;
        const current = revision, userId = owner;
        render(state({ disabled: true, theme, message: 'Enregistrement…' }));
        try {
            const session = await checkSession();
            if (current !== revision) return;
            if (session.status !== 'authenticated' || session.user.id !== userId || session.profile.role !== role) { reset(); return; }
            const result = await update(theme);
            if (current !== revision) return;
            if (result.error || result.data?.user?.id !== userId || result.data.user.user_metadata?.student_theme !== theme) throw new Error('theme_not_saved');
            saved = theme; preview = null;
            apply(saved);
            render(state({ message: 'Apparence enregistrée dans ton compte.' }));
        } catch {
            if (current === revision) {
                preview = null; apply(saved);
                render(state({ retry: true, message: 'Choix non enregistré. Ton ancienne apparence est conservée. Réessaie.' }));
            }
        } finally { if (current === revision) saving = false; }
    }
    // Thème débloqué : enregistré. Thème verrouillé : simple aperçu sur la page, rien n'est enregistré.
    async function choose(theme) {
        if (!owner || saving || !THEMES.includes(theme)) return;
        if (owned.has(theme)) return save(theme);
        preview = theme;
        apply(theme);
        const cost = THEME_COSTS[theme], balance = xp?.balance ?? 0;
        render(state({ message: 'Aperçu du thème. Il coûte ' + cost + ' XP' + (balance >= cost ? ' : tu peux le débloquer.' : ' : il te manque ' + (cost - balance) + ' XP.') }));
    }
    function cancelPreview() {
        if (!owner || !preview) return;
        preview = null; apply(saved);
        render(state({ message: 'Retour à ton apparence.' }));
    }
    async function buy(theme = preview) {
        if (!owner || saving || !unlock || !THEMES.includes(theme) || owned.has(theme)) return;
        saving = true;
        const current = revision;
        render(state({ disabled: true, message: 'Déblocage…' }));
        try {
            const result = await unlock(theme);
            if (current !== revision) return;
            if (result?.error) throw result.error;
            setXp(Array.isArray(result?.data) ? result.data[0] : result?.data);
            if (!owned.has(theme)) throw new Error('not_unlocked');
        } catch (error) {
            if (current === revision) {
                saving = false;
                const missing = /insufficient_xp/.test(error?.message || '');
                render(state({ retry: !missing, message: missing ? 'Pas encore assez d’XP pour ce thème. Remets tes séances pour en gagner.' : 'Déblocage impossible pour le moment. Réessaie.' }));
            }
            return;
        }
        saving = false;
        await save(theme);
    }
    return { load, choose, buy, cancelPreview, reset, isSaving: () => saving };
}
