import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createContext, SourceTextModule } from 'node:vm';
import { Element, courseFixture } from './fake-dom.mjs';
const lesson = { seance: 'DEMO', version: 'v1' };
async function renderer() {
    const context = createContext({ document: { createElement: tag => new Element(tag) } });
    const module = new SourceTextModule(readFileSync(new URL('../assets/js/prof/teacher-notes.js', import.meta.url), 'utf8'), { context });
    await module.link(() => {}); await module.evaluate(); return module.namespace;
}
const content = () => ({ seance: 'DEMO', version_cours: 'v1', preparation: { duree: '50 minutes' },
    accompagnement: [{ activite: 'a01', relances: ['Question fictive'] }], correction: [{ activite: 'a01', question: 'q01', attendu: '<img src=x onerror=alert(1)>' }], evaluation: { usage: 'Exemple fictif' } });
test('indications d’activité et corrigé attachés aux bonnes cibles, préparation repliée', async () => {
    const api = await renderer(), fixture = courseFixture(), summary = new Element();
    api.renderTeacherNotes(fixture.preview, summary, content(), lesson);
    // Depuis le 28 octobre, seul le corrigé est affiché, sous sa question : ni relances ni préparation.
    assert.equal(fixture.preview.querySelectorAll('[data-teacher-private]').length, 1);
    assert.equal(fixture.question.querySelectorAll('[data-teacher-private]').length, 1);
    assert.equal(summary.children.length, 0);
    assert.equal(fixture.input.dataset.answerId, 'a01_q01');
    assert.equal(fixture.question.querySelector('img'), null);
});
test('effacer conserve le cours public et retire toutes les annotations, même repliées', async () => {
    const api = await renderer(), fixture = courseFixture(), summary = new Element();
    api.renderTeacherNotes(fixture.preview, summary, content(), lesson);
    fixture.question.querySelector('[data-teacher-private]').open = false;
    api.clearTeacherNotes(fixture.preview, summary);
    assert.equal(fixture.preview.querySelectorAll('[data-teacher-private]').length, 0);
    assert.equal(summary.children.length, 0);
    assert.equal(fixture.question.children[0], fixture.input);
});
test('version, question ou activité discordantes : aucun corrigé partiellement affiché', async () => {
    const api = await renderer();
    for (const changes of [{ version_cours: 'v2' }, { correction: [{ activite: 'a01', question: 'absente', attendu: 'FICTIF' }] }, { correction: [{ activite: 'a01] script', question: 'q01', attendu: 'FICTIF' }] }]) {
        const fixture = courseFixture(), summary = new Element();
        assert.throws(() => api.renderTeacherNotes(fixture.preview, summary, { ...content(), ...changes }, lesson));
        assert.equal(fixture.preview.querySelectorAll('[data-teacher-private]').length, 0);
        assert.equal(summary.children.length, 0);
    }
});
