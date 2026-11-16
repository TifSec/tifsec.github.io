import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const source = readFileSync(new URL('../assets/js/eleve/theme-controller.js', import.meta.url), 'utf8');
const { themeController, validTheme, THEMES } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
const user = (id = 'a', theme = 'forest') => ({ status: 'authenticated', user: { id, user_metadata: { student_theme: theme } }, profile: { role: 'student' } });
function harness(options = {}) {
    const state = { session: user(), applied: [], rendered: [], writes: [] };
    const controller = themeController({
        checkSession: async () => state.session,
        update: async theme => { state.writes.push(theme); return { data: { user: { id: 'a', user_metadata: { student_theme: theme } } } }; },
        apply: theme => state.applied.push(theme), render: value => state.rendered.push(value), ...options
    });
    return { state, controller };
}
test('restauration depuis le compte et palette limitée', async () => {
    const { state, controller } = harness(); await controller.load();
    assert.equal(state.applied.at(-1), 'forest');
    assert.equal(validTheme('url(javascript:evil)'), 'ocean');
    await controller.choose('evil'); assert.equal(state.writes.length, 0);
});
test('sauvegarde confirmée, puis restauration sur une nouvelle connexion', async () => {
    const { state, controller } = harness(); await controller.load(); await controller.choose('plum');
    assert.deepEqual(state.writes, ['plum']); assert.equal(state.applied.at(-1), 'plum');
    assert.match(state.rendered.at(-1).message, /enregistrée/);
    state.session = user('a', 'plum'); await controller.load(); assert.equal(state.applied.at(-1), 'plum');
});
test('panne réseau : ancien thème et message permettant de réessayer', async () => {
    const { state, controller } = harness({ update: async () => { throw new Error('offline'); } });
    await controller.load(); await controller.choose('plum');
    assert.equal(state.applied.at(-1), 'forest'); assert.equal(state.rendered.at(-1).retry, true);
});
test('déconnexion pendant la sauvegarde : aucune restauration tardive', async () => {
    let finish;
    const { state, controller } = harness({ update: () => new Promise(done => { finish = done; }) });
    await controller.load(); const pending = controller.choose('plum'); await Promise.resolve();
    controller.reset(); finish({ data: { user: user('a', 'plum').user } }); await pending;
    assert.equal(state.applied.at(-1), null); assert.equal(state.rendered.at(-1).visible, false);
});
test('changement de compte avant sauvegarde : aucune écriture', async () => {
    const { state, controller } = harness(); await controller.load(); state.session = user('b'); await controller.choose('plum');
    assert.equal(state.writes.length, 0); assert.equal(state.applied.at(-1), null);
});
test('professeur et visiteur : pas de préférence élève appliquée', async () => {
    for (const session of [{ status: 'not_authenticated' }, { ...user(), profile: { role: 'teacher' } }]) {
        const { state, controller } = harness({ checkSession: async () => session }); await controller.load(); await controller.choose('plum');
        assert.equal(state.writes.length, 0); assert.equal(state.applied.at(-1), null);
    }
});
test('clics simultanés : une seule sauvegarde, pas de faux succès serveur', async () => {
    let finish, count = 0;
    const { state, controller } = harness({ update: () => { count++; return new Promise(done => { finish = done; }); } });
    await controller.load(); const first = controller.choose('plum'); await Promise.resolve(); await controller.choose('terracotta');
    assert.equal(count, 1); finish({ data: { user: user('b', 'plum').user } }); await first;
    assert.equal(state.applied.at(-1), 'forest'); assert.equal(state.rendered.at(-1).retry, true);
});
test('contraste des douze palettes : textes principaux au moins 4,5:1', () => {
    function luminance(hex) {
        const c = hex.match(/\w\w/g).map(v => parseInt(v, 16) / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
        return c[0] * .2126 + c[1] * .7152 + c[2] * .0722;
    }
    function ratio(a, b) { const x = [luminance(a), luminance(b)].sort((a,b) => b-a); return (x[0]+.05)/(x[1]+.05); }
    for (const [hero, accent, ink] of [['1c4256','b9ecd8','193d4e'],['244c3e','d6eac0','25402c'],['503660','ebd7f6','483052'],['713f30','f6ddbd','583720'],['852b3b','ffd9df','681d2d'],['3e4855','e0e6ed','28333f'],['292c34','dbe2f0','222630'],['85365f','ffd7ed','672346'],['192344','77f6ed','102b35'],['1b2340','ffe85b','252311'],['354c29','cce99e','2e4220'],['2d5138','f4dc83','443719']]) {
        assert.ok(ratio('ffffff', hero) >= 4.5); assert.ok(ratio(accent, ink) >= 4.5); assert.ok(ratio('d0e0e8', hero) >= 4.5);
    }
});

test('toutes les palettes proposées sont acceptées et sauvegardées', async () => {
    const markup = readFileSync(new URL('../_includes/config/student-theme.html', import.meta.url), 'utf8');
    for (const theme of THEMES) {
        assert.ok(markup.includes('value="' + theme + '"'));
        const { state, controller } = harness();
        await controller.load(); await controller.choose(theme);
        assert.equal(state.applied.at(-1), theme); assert.deepEqual(state.writes, [theme]);
    }
    assert.equal(THEMES.length, 12);
});
test('néon : contours seuls animés avec pause et réduction des animations', () => {
    const css = readFileSync(new URL('../assets/css/eleve/student-theme.css', import.meta.url), 'utf8');
    assert.match(css, /prefers-reduced-motion: reduce/);
    assert.match(css, /animation-play-state: paused/);
    assert.match(css, /conic-gradient/);
    assert.match(css, /student-rgb-orbit 7s linear infinite/);
    const frames = css.match(/@keyframes student-rgb-orbit\s*\{[^]*?\n\}/)[0];
    assert.ok(!/opacity|visibility|color:/.test(frames));
});

test('le professeur retrouve et sauvegarde son thème dans son propre espace', async () => {
    const session = { ...user('a', 'farming'), profile: { role: 'teacher' } };
    const { state, controller } = harness({ role: 'teacher', checkSession: async () => session });
    await controller.load(); assert.equal(state.applied.at(-1), 'farming');
    await controller.choose('cyberpunk'); assert.deepEqual(state.writes, ['cyberpunk']);
    assert.equal(state.applied.at(-1), 'cyberpunk');
    controller.reset(); assert.equal(state.applied.at(-1), null);
});
test('le contrôleur professeur ne s’active pas pour un compte élève', async () => {
    const { state, controller } = harness({ role: 'teacher' });
    await controller.load(); await controller.choose('neon');
    assert.equal(state.writes.length, 0); assert.equal(state.rendered.at(-1).visible, false);
});

function xpHarness({ balance = 34, unlocked = [], saved = 'forest', unlockResult } = {}) {
    const calls = [];
    const h = harness({
        loadXp: async () => ({ earned: balance, spent: 0, balance, unlocked }),
        unlock: async theme => { calls.push(theme); return unlockResult ? unlockResult(theme) : { data: [{ earned: balance, spent: THEME_COSTS[theme], balance: balance - THEME_COSTS[theme], unlocked: [...unlocked, theme] }] }; }
    });
    h.state.session = user('a', saved);
    return { ...h, calls };
}
const { THEME_COSTS } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
test('thèmes à débloquer : seul Océan est offert, un thème non acheté enregistré revient à Océan', async () => {
    const { state, controller } = xpHarness({ saved: 'neon' }); await controller.load();
    assert.equal(state.applied.at(-1), 'ocean');
    assert.deepEqual(state.rendered.at(-1).owned, ['ocean']);
    assert.equal(state.rendered.at(-1).xp.balance, 34);
    assert.equal(THEME_COSTS.ocean, 0); assert.equal(THEME_COSTS.midnight, 60); assert.equal(THEME_COSTS.farming, 100);
});
test('aperçu d’un thème verrouillé : appliqué sur la page, jamais enregistré, annulable', async () => {
    const { state, controller } = xpHarness({ saved: 'ocean' }); await controller.load();
    await controller.choose('cyberpunk');
    assert.equal(state.applied.at(-1), 'cyberpunk'); assert.equal(state.writes.length, 0);
    assert.equal(state.rendered.at(-1).preview, 'cyberpunk'); assert.match(state.rendered.at(-1).message, /manque 66 XP/);
    controller.cancelPreview(); assert.equal(state.applied.at(-1), 'ocean');
});
test('déblocage avec solde suffisant : achat côté serveur puis enregistrement du thème', async () => {
    const { state, controller, calls } = xpHarness({ saved: 'ocean' }); await controller.load();
    await controller.choose('forest'); await controller.buy();
    assert.deepEqual(calls, ['forest']); assert.deepEqual(state.writes, ['forest']);
    assert.equal(state.applied.at(-1), 'forest'); assert.equal(state.rendered.at(-1).xp.balance, 4);
    assert.ok(state.rendered.at(-1).owned.includes('forest'));
});
test('solde insuffisant refusé par la base : aucun enregistrement, message clair', async () => {
    const { state, controller } = xpHarness({ balance: 10, saved: 'ocean', unlockResult: () => ({ error: { message: 'insufficient_xp' } }) });
    await controller.load(); await controller.choose('plum'); await controller.buy();
    assert.equal(state.writes.length, 0); assert.match(state.rendered.at(-1).message, /assez d’XP/);
});
test('XP indisponible : le thème déjà porté reste utilisable, le travail n’est jamais bloqué', async () => {
    const { state, controller } = harness({ loadXp: async () => { throw new Error('offline'); } });
    await controller.load();
    assert.equal(state.applied.at(-1), 'forest'); assert.match(state.rendered.at(-1).message, /n’a pas pu être chargée/);
});
test('professeur : tous les thèmes disponibles sans XP', async () => {
    const teacher = { ...user('t', 'neon'), profile: { role: 'teacher' } };
    const { state, controller } = harness({ role: 'teacher', checkSession: async () => teacher, loadXp: async () => { throw new Error('jamais appelé'); } });
    await controller.load(); assert.equal(state.applied.at(-1), 'neon'); assert.equal(state.rendered.at(-1).owned.length, 12);
});
