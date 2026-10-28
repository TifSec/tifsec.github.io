import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createContext, SourceTextModule } from 'node:vm';
async function progressHarness() {
    const node = () => ({ textContent: '', value: '', dataset: {}, handlers: {}, addEventListener(name, fn) { this.handlers[name] = fn; } });
    const elements = new Map(['course-answers', 'course-progress-label', 'course-progress', 'course-save-status', 'course-identity'].map(id => [id, node()]));
    const fields = [{ dataset: {}, value: 'restaurée' }, { dataset: {}, value: '' }, { dataset: { required: 'false' }, value: '' }];
    elements.get('course-answers').querySelectorAll = selector => selector === '.cours-activite' ? [] : fields;
    let update;
    const context = createContext({ document: { getElementById: id => elements.get(id) }, MutationObserver: class { constructor(fn) { update = fn; } observe() {} } });
    const module = new SourceTextModule(readFileSync(new URL('../assets/js/cours/course-progress.js', import.meta.url), 'utf8'), { context });
    await module.link(() => {}); await module.evaluate();
    return { elements, fields, update, module };
}
test('progression : restauration, facultatif et déconnexion', async () => {
    const h = await progressHarness();
    assert.equal(h.elements.get('course-progress').value, 0);
    h.elements.get('course-identity').textContent = 'Compte fictif'; h.update();
    assert.equal(h.elements.get('course-progress').max, 2);
    assert.equal(h.elements.get('course-progress').value, 1);
    h.fields[1].value = 'réponse saisie'; h.elements.get('course-answers').handlers.input();
    assert.equal(h.elements.get('course-progress').value, 2);
    assert.match(h.elements.get('course-progress-label').textContent, /renseignées/);
    h.elements.get('course-identity').textContent = ''; h.update();
    assert.equal(h.elements.get('course-progress').value, 0);
});
test('une restauration en cours ou en erreur ne présente pas un avancement acquis', async () => {
    const h = await progressHarness();
    h.elements.get('course-identity').textContent = 'Compte fictif';
    for (const state of ['loading', 'load_error']) {
        h.elements.get('course-save-status').dataset.state = state; h.update();
        assert.equal(h.elements.get('course-progress').value, 0);
    }
});

test('les pastilles de mission suivent uniquement les réponses obligatoires renseignées', async () => {
    const h = await progressHarness();
    const activity = { querySelectorAll: () => h.fields };
    assert.deepEqual({ ...h.module.namespace.missionSnapshot(activity) }, { state: 'doing', filled: 1, total: 2 });
    h.fields[1].value = 'réponse';
    assert.deepEqual({ ...h.module.namespace.missionSnapshot(activity) }, { state: 'complete', filled: 2, total: 2 });
    h.fields[0].value = '';
    assert.deepEqual({ ...h.module.namespace.missionSnapshot(activity) }, { state: 'doing', filled: 1, total: 2 });
});
