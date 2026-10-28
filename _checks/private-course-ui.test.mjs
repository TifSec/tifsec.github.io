import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createContext, SourceTextModule, SyntheticModule } from 'node:vm';
import { Element, courseFixture } from './fake-dom.mjs';
const turn = () => new Promise(done => setTimeout(done, 10));
const node = tag => new Element(tag);
async function harness({ enabled = true, session = { status: 'authenticated', user: { id: 'teacher' }, profile: { role: 'teacher' } }, invoke, preview, query = '', assignments = [{ etablissement: 'college', matiere: 'techno', classe: '3e' }] } = {}) {
    const elements = new Map(['teacher-course', 'teacher-course-select', 'teacher-course-open', 'teacher-course-private', 'teacher-course-hide', 'teacher-course-status', 'teacher-course-preview', 'teacher-course-notes', 'seances-data', 'teacher-course-subject', 'teacher-course-class', 'teacher-course-context', 'teacher-course-copies'].map(id => [id, node()]));
    elements.get('teacher-course').dataset.enabled = String(enabled);
    elements.get('seances-data').textContent = JSON.stringify([{ etablissement: 'college', matiere: 'techno', classe: '3e', seance: 'S02', version: 'v1' }]);
    const controls = { session, invocations: 0, reads: 0, previews: 0 };
    const context = createContext({ setTimeout, clearTimeout, AbortController, URL, URLSearchParams, document: { getElementById: id => elements.get(id), createElement: node }, window: { location: { href: 'http://local/prof/cours/' + query }, addEventListener() {} }, Option: class extends Element { constructor(text, value) { super('option'); this.textContent = text; this.value = value; } } });
    const dependencies = {
        '../bdd/bdd-connect.js': { db: { auth: { onAuthStateChange(fn) { controls.auth = fn; } }, functions: { async invoke() { controls.invocations++; return invoke ? invoke() : { data: { content: { seance: 'S02', version_cours: 'v1', preparation: { duree: '<script>exemple</script>' }, correction: [{ activite: 'a01', question: 'q01', attendu: '<script>corrige</script>' }] } } }; } }, from() { controls.reads++; return { select() { return this; }, async eq() { return { data: assignments }; } }; } } },
        './course-preview.js': { async loadCoursePreview(root, lesson, signal, isCurrent) { controls.previews++; if (preview) await preview(); if (!isCurrent()) return false; root.replaceChildren(...courseFixture().preview.children); return true; } },
        '../auth/auth-session.js': { async checkSession() { return controls.session; } }
    };
    const module = new SourceTextModule(readFileSync(new URL('../assets/js/prof/private-course.js', import.meta.url), 'utf8'), { context });
    await module.link(name => {
        if (['./teacher-notes.js', './course-selection.js'].includes(name)) return new SourceTextModule(readFileSync(new URL('../assets/js/prof/' + name.slice(2), import.meta.url), 'utf8'), { context });
        return new SyntheticModule(Object.keys(dependencies[name]), function () { for (const [key, value] of Object.entries(dependencies[name])) this.setExport(key, value); }, { context });
    });
    await module.evaluate(); await turn();
    return { elements, controls, module };
}
test('élève et visiteur : ni catalogue affecté ni demande de corrigé', async () => {
    for (const session of [{ status: 'not_authenticated' }, { status: 'authenticated', user: { id: 'a' }, profile: { role: 'student' } }]) {
        const h = await harness({ session });
        await h.elements.get('teacher-course-private').fire('click');
        assert.equal(h.controls.reads, 0); assert.equal(h.controls.invocations, 0);
    }
});
test('fonction désactivée : aucune invocation malgré un clic forcé', async () => {
    const h = await harness({ enabled: false });
    await h.elements.get('teacher-course-private').fire('click');
    assert.equal(h.controls.invocations, 0);
});
test('les contenus HTML des notes sont rendus par textContent uniquement', async () => {
    const h = await harness();
    await h.elements.get('teacher-course-private').fire('click');
    // Préparation (en tête) et corrigé (sous sa question) sont rendus comme texte brut.
    const root = h.elements.get('teacher-course-notes');
    assert.equal(root.hidden, false);
    const flatten = item => [item.textContent, ...item.children.flatMap(flatten)];
    assert.ok(flatten(root).some(value => value.includes('<script>exemple</script>')));
    assert.equal(root.innerHTML, undefined);
    const question = h.elements.get('teacher-course-preview').querySelector('[data-question="q01"]');
    assert.ok(flatten(question).some(value => value.includes('<script>corrige</script>')));
    assert.equal(question.querySelector('script'), null);
});
test('déconnexion pendant la demande : le corrigé tardif ne se réaffiche pas', async () => {
    let finish;
    const h = await harness({ invoke: () => new Promise(done => { finish = done; }) });
    const loading = h.elements.get('teacher-course-private').fire('click');
    await turn(); h.controls.auth('SIGNED_OUT');
    finish({ data: { content: { preparation: { duree: 'privé' }, correction: [] } } });
    await loading;
    assert.equal(h.elements.get('teacher-course-notes').hidden, true);
    assert.equal(h.elements.get('teacher-course-notes').children.length, 0);
});
test('masquer efface les notes et annule une demande en cours', async () => {
    const h = await harness();
    await h.elements.get('teacher-course-private').fire('click');
    h.elements.get('teacher-course-hide').fire('click');
    assert.equal(h.elements.get('teacher-course-notes').hidden, true);
    assert.equal(h.elements.get('teacher-course-notes').children.length, 0);
    assert.equal(h.elements.get('teacher-course-preview').querySelectorAll('[data-teacher-private]').length, 0);
});
test('le cours professeur charge aussi le cours élève et place le corrigé près de sa question', async () => {
    const h = await harness();
    await h.elements.get('teacher-course-private').fire('click');
    assert.equal(h.controls.previews, 1);
    const question = h.elements.get('teacher-course-preview').querySelector('[data-question="q01"]');
    assert.equal(question.querySelectorAll('[data-teacher-private]').length, 1);
    assert.equal(h.elements.get('teacher-course').dataset.mode, 'private');
});

test('cours public affiché d’abord, puis notes privées demandées après contrôle du professeur',async()=>{
    let finish;const waiting=new Promise(done=>{finish=done;});const h=await harness({preview:()=>waiting});
    // Depuis le 28 octobre : le cours élève est affiché d'abord, puis le corrigé est demandé.
    const loading=h.elements.get('teacher-course-private').fire('click');await turn();
    assert.equal(h.controls.previews,1);assert.equal(h.controls.invocations,0);
    assert.equal(h.elements.get('teacher-course-notes').hidden,true);finish();await loading;
    assert.equal(h.controls.invocations,1);
    assert.equal(h.elements.get('teacher-course').dataset.mode,'private');
});
test('la version élève retire tous les corrigés intégrés sans recharger les notes privées', async () => {
    const h = await harness();
    await h.elements.get('teacher-course-private').fire('click');
    await h.elements.get('teacher-course-open').fire('click');
    assert.equal(h.controls.invocations, 1);
    assert.equal(h.elements.get('teacher-course-preview').querySelectorAll('[data-teacher-private]').length, 0);
    assert.equal(h.elements.get('teacher-course-notes').hidden, true);
    assert.equal(h.elements.get('teacher-course').dataset.mode, 'student');
});
const scopes = [{ etablissement: 'college', matiere: 'techno', classe: '5e' }, { etablissement: 'college', matiere: 'techno', classe: '3e' }];
test('lien Technologie 5e : classe conservée, aucune séance 3e affichée en remplacement', async () => {
    const h = await harness({ query: '?matiere=techno&etablissement=college&classe=5e', assignments: scopes });
    assert.equal(h.elements.get('teacher-course-class').value, 'college|5e');
    assert.match(h.elements.get('teacher-course-context').textContent, /5e/);
    assert.match(h.elements.get('teacher-course-status').textContent, /Aucune séance.*cette classe/);
    assert.equal(h.elements.get('teacher-course-select').children.length, 0);
    assert.equal(h.elements.get('teacher-course-copies').hidden, true);
    await h.elements.get('teacher-course-private').fire('click');
    assert.equal(h.controls.invocations, 0);
});
test('passage de 5e à 3e : S02 disponible et suivi explicitement accessible dans le même périmètre', async () => {
    const h = await harness({ query: '?matiere=techno&etablissement=college&classe=5e', assignments: scopes });
    h.elements.get('teacher-course-class').value = 'college|3e';
    h.elements.get('teacher-course-class').fire('change');
    assert.equal(h.elements.get('teacher-course-select').children.length, 1);
    assert.equal(h.elements.get('teacher-course-private').disabled, false);
    assert.equal(h.elements.get('teacher-course-copies').hidden, false);
    assert.match(h.elements.get('teacher-course-copies').href, /classe=3e/);
    await h.elements.get('teacher-course-private').fire('click');
    assert.equal(h.controls.invocations, 1);
});
test('paramètres hors affectation : aucune sélection implicite dans une autre classe', async () => {
    const h = await harness({ query: '?matiere=maths&etablissement=mfr&classe=3e' });
    assert.equal(h.elements.get('teacher-course-select').children.length, 0);
    assert.equal(h.elements.get('teacher-course-private').disabled, true);
    assert.match(h.elements.get('teacher-course-status').textContent, /affectations/);
});
test('changer de classe pendant le chargement privé empêche sa réapparition tardive', async () => {
    let finish;
    const h = await harness({ assignments: scopes, invoke: () => new Promise(done => { finish = done; }) });
    const pending = h.elements.get('teacher-course-private').fire('click');
    await turn();
    h.elements.get('teacher-course-class').value = 'college|5e';
    h.elements.get('teacher-course-class').fire('change');
    finish({ data: { content: { seance: 'S02', version_cours: 'v1', preparation: {}, correction: [] } } });
    await pending;
    assert.equal(h.elements.get('teacher-course-notes').hidden, true);
    assert.equal(h.elements.get('teacher-course-preview').children.length, 0);
});
