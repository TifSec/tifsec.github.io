import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createContext, SourceTextModule, SyntheticModule } from 'node:vm';
import { Element, courseFixture } from './fake-dom.mjs';
const lesson = { etablissement: 'college', matiere: 'techno', classe: '3e', seance: 'S02', url: '/cours/pilote/' };
function clone(source) {
    const node = new Element(source.tagName);
    node.className = source.className; node.id = source.id; node.dataset = { ...source.dataset }; node.value = source.value;
    node.textContent = source.textContent; node.append(...source.children.map(clone)); return node;
}
async function loader({ identity = lesson, ok = true } = {}) {
    const calls = [];
    const fixture = courseFixture();
    const context = createContext({ document: { createElement: tag => new Element(tag), importNode: clone },
        async fetch(url, options) { calls.push({ url, options }); return { ok, async text() { return 'PUBLIC_FIXTURE'; } }; },
        DOMParser: class { parseFromString() { return { getElementById() { return { dataset: identity }; }, querySelectorAll: selector => fixture.preview.querySelectorAll(selector) }; } }
    });
    const module = new SourceTextModule(readFileSync(new URL('../assets/js/prof/course-preview.js', import.meta.url), 'utf8'), { context });
    await module.link(() => new SyntheticModule(['mountCourseGraphs'], function() { this.setExport('mountCourseGraphs', () => {}); }, { context })); await module.evaluate();
    return { load: module.namespace.loadCoursePreview, calls };
}
test('la vue professeur reprend les sections du cours et désactive la saisie', async () => {
    const h = await loader(), root = new Element();
    assert.equal(await h.load(root, lesson, undefined, () => true), true);
    assert.ok(root.querySelector('.course-navigation'));
    assert.equal(root.querySelector('[data-answer-id]').disabled, true);
    assert.equal(root.querySelector('[data-answer-id]').value, '');
    assert.equal(h.calls[0].options.cache, 'no-cache');
});
test('cours discordant ou réponse tardive : aucun remplacement du cours affiché', async () => {
    const root = new Element(), marker = new Element(); root.append(marker);
    const wrong = await loader({ identity: { ...lesson, seance: 'AUTRE' } });
    await assert.rejects(wrong.load(root, lesson, undefined, () => true), /course_mismatch/);
    assert.equal(root.children[0], marker);
    const late = await loader();
    assert.equal(await late.load(root, lesson, undefined, () => false), false);
    assert.equal(root.children[0], marker);
});
test('URL externe ou ambiguë refusée avant tout téléchargement', async () => {
    const h = await loader();
    for (const url of ['https://external.test/', '//external.test/', '/\\external.test/', '/cours/\n']) await assert.rejects(h.load(new Element(), { ...lesson, url }, undefined, () => true), /invalid_url/);
    assert.equal(h.calls.length, 0);
});

test('réouverture : HTML public réutilisé, réponses et annotations jamais réutilisées', async () => {
    const h = await loader(), root = new Element();
    await h.load(root, lesson, undefined, () => true);
    root.querySelector('[data-answer-id]').value = 'SAISIE_PRIVEE';
    await h.load(root, lesson, undefined, () => true);
    assert.equal(h.calls.length, 1);
    assert.equal(root.querySelector('[data-answer-id]').value, '');
    await h.load(root, { ...lesson, version: 'v2' }, undefined, () => true);
    assert.equal(h.calls.length, 2);
});
