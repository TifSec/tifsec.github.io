import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createContext, SourceTextModule, SyntheticModule } from 'node:vm';
import { Element } from './fake-dom.mjs';
const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const tick = () => new Promise(resolve => setTimeout(resolve, 5));
const pupil = { status: 'authenticated', profile: { prenom: 'Alex', nom: 'Exemple', role: 'student',
    etablissement: 'college', classe: '3e', enrollment_status: 'approved' } };
async function fixture({ session = pupil, mobile = false, pending } = {}) {
    const ids = ['course-header','course-header-identity','course-welcome','course-logout','course-login','course-group-toggle',
        'course-collaboration','course-group-close','course-group-heading','group-controls','group-copy','course-copy-kind','course-step-list','classes-data'];
    const elements = new Map(ids.map(id => [id, new Element()]));
    const header = elements.get('course-header');
    const fields = ['matieres','etablissement','classe','validation'].map(name => {
        const field = new Element(); field.dataset.profileField = name; return field;
    });
    const profile = new Element('dl'); profile.className = 'student-profile'; profile.append(...fields); header.append(profile);
    elements.get('classes-data').textContent = JSON.stringify({ college: { nom: 'Collège', classes: [{ id: '3e', nom: '3e', matieres: ['techno'] }] } });
    elements.get('course-collaboration').dataset.enabled = 'true';
    const select = elements.get('group-copy'); select.value = '';
    for (const element of elements.values()) element.focus = () => { state.focus = element; };
    const state = { session, checks: 0, observers: [] };
    const context = createContext({ document: { getElementById: id => elements.get(id) },
        window: { addEventListener() {}, matchMedia() { return { matches: mobile, addEventListener() {} }; } },
        MutationObserver: class { constructor(fn) { state.observers.push(fn); } observe() {} }, setTimeout, clearTimeout });
    const deps = {
        '../bdd/bdd-connect.js': { db: { auth: { onAuthStateChange(fn) { state.auth = fn; } } } },
        '../auth/auth-session.js': { async checkSession() { state.checks++; return pending ? pending() : state.session; } },
        '../auth/auth-logout.js': { initLogout(id) { state.logout = id; } }
    };
    const presentation = new SourceTextModule(read('assets/js/auth/profile-presentation.js'), { context });
    await presentation.link(() => { throw new Error('unexpected_import'); });
    const module = new SourceTextModule(read('assets/js/cours/course-shell.js'), { context });
    await module.link(specifier => {
        if (specifier === '../auth/profile-presentation.js') return presentation;
        const values = deps[specifier]; assert.ok(values);
        return new SyntheticModule(Object.keys(values), function() { for (const [key, value] of Object.entries(values)) this.setExport(key, value); }, { context });
    });
    await module.evaluate(); await tick();
    return { state, elements, fields, controlsReady() { elements.get('group-controls').hidden = false; state.observers.forEach(fn => fn()); } };
}

test('cours : profil commun, matière exacte et collaboration ouverte uniquement à la demande', async () => {
    const f = await fixture();
    assert.equal(f.elements.get('course-header-identity').textContent, 'Alex Exemple');
    assert.equal(f.fields[0].textContent, 'Technologie');
    assert.equal(f.elements.get('course-login').hidden, true);
    assert.equal(f.elements.get('course-group-toggle').hidden, true);
    f.controlsReady();
    assert.equal(f.elements.get('course-collaboration').hidden, true);
    assert.equal(f.elements.get('course-group-toggle').hidden, false);
    assert.equal(f.elements.get('course-copy-kind').textContent, 'Travail individuel');
    await f.elements.get('course-group-toggle').fire('click');
    assert.equal(f.elements.get('course-collaboration').hidden, false);
    assert.equal(f.state.focus, f.elements.get('course-group-heading'));
    assert.equal(f.state.checks, 1);
    await f.elements.get('course-group-close').fire('click');
    assert.equal(f.elements.get('course-collaboration').hidden, true);
    assert.equal(f.state.focus, f.elements.get('course-group-toggle'));
    const select = f.elements.get('group-copy'); select.value = '9'; select.selectedOptions = [{textContent: 'Groupe — Alex, Sam'}];
    await select.fire('change');
    assert.equal(f.elements.get('course-copy-kind').textContent, 'Groupe — Alex, Sam');
});

test('cours : déconnexion et réponse tardive ne réaffichent aucun profil ni groupe', async () => {
    let resolve;
    const result = new Promise(done => { resolve = done; });
    const f = await fixture({ pending: () => result });
    f.state.auth('SIGNED_OUT'); resolve(pupil); await tick();
    assert.equal(f.elements.get('course-header-identity').textContent, '');
    assert.ok(f.fields.every(field => field.textContent === ''));
    assert.equal(f.elements.get('course-welcome').hidden, true);
    assert.equal(f.elements.get('course-group-toggle').hidden, true);
    assert.equal(f.elements.get('course-collaboration').hidden, true);
});

test('cours : étapes repliées sur mobile ; aperçu professeur et compte en attente sans sélection de groupe', async () => {
    for (const session of [{...pupil, profile:{...pupil.profile, role:'teacher'}},
        {...pupil, profile:{...pupil.profile, enrollment_status:'pending'}}, { status: 'not_authenticated' }]) {
        const f = await fixture({ session, mobile:true }); f.controlsReady();
        assert.equal(f.elements.get('course-step-list').open, false);
        assert.equal(f.elements.get('course-group-toggle').hidden, true);
        assert.equal(f.elements.get('course-collaboration').hidden, true);
    }
});

test('cours générés : un seul bandeau, un seul choix de thème et groupe masqué avant chargement', () => {
    for (const lesson of ['s02','s10','s10-original','s11','s12']) {
        const html = read('_site/cours/techno/3e/' + lesson + '/index.html');
        assert.equal((html.match(/id="student-theme-picker"/g) || []).length, 1);
        assert.equal((html.match(/class="student-header"/g) || []).length, 1);
        assert.ok(!html.includes('class="site-header"'));
        assert.match(html, /id="course-collaboration"[^>]*hidden/);
        assert.match(html, /id="course-group-toggle"[^>]*aria-expanded="false"/);
        assert.match(html, /student-header.css/);
        assert.match(html, /course-shell.js/);
        assert.match(html, /id="course-answers"[^>]*disabled/);
        assert.match(html, /id="classes-data"/);
    }
});
