import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createContext, SourceTextModule, SyntheticModule } from 'node:vm';
const turn = () => new Promise(done => setTimeout(done, 10));
const pupil = { status: 'authenticated', user: { id: 'a' }, profile: { role: 'student', enrollment_status: 'approved', etablissement: 'college', classe: '3e' } };
function element() {
    const listeners = new Map();
    return { textContent: '', disabled: false, children: [], dataset: {}, attributes: {}, setAttribute(k,v) { this.attributes[k]=v; }, querySelectorAll() { return this.children; }, addEventListener(name, fn) { listeners.set(name, fn); },
        fire(name, event = {}) { return listeners.get(name)?.(event); },
        append(...nodes) { this.children.push(...nodes); }, replaceChildren(...nodes) { this.children = nodes; } };
}
async function harness({ session = pupil, read = async () => ({}), grades = false, lessonRows = [], progressions = [] } = {}) {
    const elements = new Map(['student-lessons', 'student-stats', 'student-dashboard-status', 'student-refresh', 'seances-data', 'student-next-panel', 'student-next', 'progressions-data', 'student-history-panel', 'student-history', 'student-history-count', 'student-filters', 'student-followup-panel', 'student-followup'].map(id => [id, element()]));
    for (const view of ['all', 'started', 'finished', 'feedback']) { const button = element(); button.dataset.view = view; elements.get('student-filters').append(button); }
    elements.get('seances-data').textContent = '[]';
    elements.get('student-lessons').dataset = { grades: String(grades) };
    elements.get('student-next-panel').dataset = { enabled: 'true' };
    elements.get('progressions-data').textContent = JSON.stringify(progressions);
    const controls = { session, reads: 0 };
    const model = { lessons: lessonRows, started: 0, finished: 0, withFeedback: 0, corrected: lessonRows.filter(row => row.grade).length };
    const context = createContext({ setTimeout, clearTimeout, document: { visibilityState: 'visible', getElementById: id => elements.get(id), createElement: element, addEventListener() {} }, window: { addEventListener() {} } });
    const module = new SourceTextModule(readFileSync(new URL('../assets/js/eleve/student-dashboard.js', import.meta.url), 'utf8'), { context });
    const dependencies = {
        '../bdd/bdd-connect.js': { db: { auth: { onAuthStateChange(fn) { controls.auth = fn; } } } },
        '../auth/auth-session.js': { async checkSession() { return controls.session; } },
        './dashboard-model.js': { async readDashboard() { controls.reads++; return read(); }, dashboardModel() { return model; } }
    };
    const progressionModule = new SourceTextModule(readFileSync(new URL('../assets/js/eleve/course-progression.js', import.meta.url), 'utf8'), { context });
    await progressionModule.link(() => { throw new Error('unexpected_import'); });
    const viewModule = new SourceTextModule(readFileSync(new URL('../assets/js/eleve/dashboard-view.js', import.meta.url), 'utf8'), { context });
    await viewModule.link(() => { throw new Error('unexpected_import'); });
    const competencyModule = new SourceTextModule(readFileSync(new URL('../assets/js/eleve/student-competencies.js', import.meta.url), 'utf8'), { context });
    await competencyModule.link(() => { throw new Error('unexpected_import'); });
    await module.link(name => name === './student-competencies.js' ? competencyModule : name === './dashboard-view.js' ? viewModule : name === './course-progression.js' ? progressionModule : new SyntheticModule(Object.keys(dependencies[name]), function () { for (const [key, value] of Object.entries(dependencies[name])) this.setExport(key, value); }, { context }));
    await module.evaluate();
    await turn();
    return { elements, controls, model };
}
test('inscription en attente, visiteur et professeur : aucune lecture des copies', async () => {
    for (const session of [{ status: 'not_authenticated' }, { ...pupil, profile: { role: 'teacher' } }, { ...pupil, profile: { role: 'student', enrollment_status: 'pending' } }]) {
        const h = await harness({ session });
        assert.equal(h.controls.reads, 0);
        assert.equal(h.elements.get('student-stats').children.length, 0);
    }
});
test('déconnexion pendant la lecture : aucune donnée tardive réaffichée', async () => {
    let finish;
    const h = await harness({ read: () => new Promise(done => { finish = done; }) });
    h.controls.auth('SIGNED_OUT');
    finish({});
    await turn();
    assert.equal(h.elements.get('student-stats').children.length, 0);
    assert.equal(h.elements.get('student-dashboard-status').textContent, 'Tu es déconnecté.');
});
test('changement de compte : les anciennes statistiques sont effacées immédiatement', async () => {
    const h = await harness();
    assert.equal(h.elements.get('student-stats').children.length, 3);
    h.controls.session = { status: 'not_authenticated' };
    h.controls.auth('SIGNED_IN');
    assert.equal(h.elements.get('student-stats').children.length, 0);
    await turn();
    assert.equal(h.elements.get('student-lessons').children.length, 0);
});
test('échec de chargement : message de reprise, aucun faux zéro', async () => {
    const h = await harness({ read: async () => { throw new Error('offline'); } });
    assert.equal(h.elements.get('student-stats').children.length, 0);
    assert.match(h.elements.get('student-dashboard-status').textContent, /Impossible/);
    assert.equal(h.elements.get('student-refresh').disabled, false);
});

test('la carte élève affiche la note collective et le lien vers sa copie corrigée', async () => {
    const h = await harness({ grades: true, lessonRows: [{ matiere: 'techno', seance: 'S02', titre: 'Objets', state: 'finished',
        comments: [], count: 1, copy: { id: 42, max_members: 2 }, grade: { total: '0' }, url: '/cours/s02/' }] });
    const card = h.elements.get('student-lessons').children[0];
    assert.ok(card.children.some(node => node.textContent === 'Note validée : 0 / 20'));
    assert.ok(card.children.some(node => node.textContent.includes('commune au groupe')));
    const link = card.children.at(-1);
    assert.equal(link.textContent, 'Voir ma copie corrigée'); assert.equal(link.href, '/cours/s02/?copie=42');
    assert.equal(h.elements.get('student-stats').children.at(-1).children[1].textContent, '1');
});

test('profil devenu non validé pendant la lecture : aucun résultat affiché', async () => {
    let finish;
    const h = await harness({ read: () => new Promise(done => { finish = done; }) });
    h.controls.session = { ...pupil, profile: { role: 'student', enrollment_status: 'pending' } };
    finish({}); await turn();
    assert.equal(h.elements.get('student-stats').children.length, 0);
    assert.match(h.elements.get('student-dashboard-status').textContent, /Reconnecte/);
});

test('accueil : séance 10 mise en avant, puis masquée à la déconnexion', async () => {
    const lesson = { etablissement:'college', matiere:'techno', classe:'3e', seance:'S10R', titre:'Protéger ses comptes', url:'/cours/techno/3e/s10-original/', state:'new', comments:[] };
    const h = await harness({ lessonRows:[lesson], progressions:[{ etablissement:'college', matiere:'techno', classe:'3e', seances:[{ id:'S10R', numero:'S10' }] }] });
    const card = h.elements.get('student-next').children[0];
    assert.ok(card.children.some(node => node.textContent === 'S10 — Protéger ses comptes'));
    assert.equal(card.children.find(node => node.textContent === 'Commencer cette séance').href, lesson.url);
    h.controls.auth('SIGNED_OUT');
    assert.equal(h.elements.get('student-next').children.length, 0);
    assert.equal(h.elements.get('student-next-panel').hidden, true);
});

test('filtres locaux et nettoyage de l’historique', async () => {
    const base = { etablissement: 'college', classe: '3e', matiere: 'techno', comments: [], count: 0, url: '/cours/' };
    const h = await harness({ lessonRows: [
        { ...base, seance: 'S10R', titre: 'Actuelle', state: 'started' },
        { ...base, seance: 'S02', titre: 'Ancienne', state: 'finished', comments: ['<script>inert</script>'] }
    ], progressions: [{ ...base, seances: [{ id: 'S10R', numero: 'S10' }] }] });
    assert.equal(h.elements.get('student-lessons').children.length, 1);
    assert.equal(h.elements.get('student-history').children.length, 1);
    const filters = h.elements.get('student-filters').children;
    filters[3].fire('click');
    assert.equal(h.controls.reads, 1);
    assert.equal(h.elements.get('student-lessons').children.length, 0);
    assert.equal(h.elements.get('student-history-panel').open, true);
    const feedback = h.elements.get('student-history').children[0].children.find(node => node.className === 'student-feedback');
    assert.equal(feedback.open, undefined);
    assert.equal(feedback.children[1].textContent, '<script>inert</script>');
    assert.equal(filters[3].attributes['aria-pressed'], 'true');
    h.controls.auth('SIGNED_OUT');
    assert.equal(h.elements.get('student-history').children.length, 0);
    assert.ok(filters.every(button => button.disabled));
});

test('suivi : retours de groupe, attente de note et nettoyage à la déconnexion', async () => {
    const h = await harness({ lessonRows: [
        { matiere: 'techno', seance: 'S02', titre: '<b>Exemple</b>', state: 'finished', comments: ['À préciser'], grade: { total: 12 }, copy: { id: 42, max_members: 2 }, url: '/cours/' },
        { matiere: 'techno', seance: 'S10R', titre: 'Travail terminé', state: 'finished', comments: [], copy: { id: 43, max_members: 1 }, url: '/cours/' }
    ] });
    const panel = h.elements.get('student-followup-panel'), content = h.elements.get('student-followup');
    assert.equal(panel.hidden, false);
    assert.match(content.children.find(node => node.className === 'student-followup-waiting').textContent, /1 copie terminée attend/);
    const card = content.children.find(node => node.className === 'student-followup-item');
    assert.equal(card.children[0].textContent, 'Technologie · <b>Exemple</b>');
    assert.equal(card.children.at(-1).href, '/cours/?copie=42#course-evaluation');
    content.children.at(-1).fire('click');
    assert.equal(h.controls.reads, 1);
    assert.equal(h.elements.get('student-lessons').children.length, 1);
    h.controls.auth('SIGNED_OUT');
    assert.equal(panel.hidden, true); assert.equal(content.children.length, 0);
});
