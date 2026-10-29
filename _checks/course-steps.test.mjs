import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createContext, SourceTextModule } from 'node:vm';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

// Mini-DOM suffisant pour le parcours pas à pas (aucun navigateur lancé).
class Node {
    constructor(tag, { id = '', attrs = {} } = {}) {
        this.tagName = tag.toUpperCase(); this.id = id; this.children = []; this.parent = null; this.attrs = { ...attrs };
        this.dataset = {}; this.classes = new Set(); this.handlers = {}; this.textContent = ''; this.focused = false; this.scrolled = 0;
        this.classList = { add: c => this.classes.add(c), contains: c => this.classes.has(c), toggle: (c, on) => (on ? this.classes.add(c) : this.classes.delete(c)) };
    }
    append(...nodes) { nodes.forEach(n => { n.parent = this; this.children.push(n); }); return this; }
    contains(node) { for (let n = node; n; n = n.parent) if (n === this) return true; return false; }
    all() { return this.children.flatMap(n => [n, ...n.all()]); }
    matches(sel) {
        if (sel === 'h2') return this.tagName === 'H2';
        if (sel === '[data-course-step]') return 'data-course-step' in this.attrs;
        if (sel === '[data-course-step-counter]') return 'data-course-step-counter' in this.attrs;
        if (sel === '.course-reading') return this.classes.has('course-reading');
        if (sel === '#course-step-list a[href^="#"]') return this.tagName === 'A' && this.parent?.id === 'course-step-list';
        if (sel === 'a[href^="#"]') return this.tagName === 'A' && String(this.attrs.href || '').startsWith('#');
        return false;
    }
    querySelectorAll(sel) { return this.all().filter(n => n.matches(sel)); }
    querySelector(sel) { return this.querySelectorAll(sel)[0] || null; }
    closest(sel) { for (let n = this; n; n = n.parent) { if (sel === '#course-step-list' ? n.id === 'course-step-list' : n.matches(sel)) return n; } return null; }
    hasAttribute(name) { return name in this.attrs; }
    setAttribute(name, value) { this.attrs[name] = String(value); }
    removeAttribute(name) { delete this.attrs[name]; }
    toggleAttribute(name, on) { if (on) this.attrs[name] = ''; else delete this.attrs[name]; }
    addEventListener(name, fn) { this.handlers[name] = fn; }
    focus() { this.focused = true; }
    scrollIntoView() { this.scrolled += 1; }
    get hash() { return this.attrs.href; }
}

async function harness({ hash = '', stored = null } = {}) {
    const body = new Node('body');
    const work = new Node('div', { id: 'course-work' }); Object.assign(work.dataset, { matiere: 'techno', classe: '5e', seance: 'S01' });
    const nav = new Node('nav', { id: 'course-step-list' });
    const reading = new Node('div'); reading.classList.add('course-reading');
    const intro = new Node('header', { id: 'course-intro' });
    const step = (id, title) => new Node('article', { id, attrs: { 'data-course-step': '' } })
        .append(new Node('span', { attrs: { 'data-course-step-counter': '' } }), Object.assign(new Node('h2'), { textContent: title }));
    const a01 = step('a01', 'Mission 1'), a02 = step('a02', 'Mission 2'), final = step('course-final', 'Fin');
    const summary = new Node('section', { id: 'course-summary' }); final.append(summary);
    const field = new Node('textarea'); a02.append(field);
    const next = new Node('a', { attrs: { href: '#a02' } }); a01.append(next);
    reading.append(intro, a01, a02, final);
    ['#course-intro', '#a01', '#a02', '#course-summary'].forEach(href => nav.append(new Node('a', { attrs: { href } })));
    body.append(work, nav, reading);
    const byId = id => body.all().find(n => n.id === id) || null;
    const store = new Map(stored === null ? [] : [['tifsec-etape:techno/5e/S01', String(stored)]]);
    const windowHandlers = {};
    const window = { location: { hash }, history: { replaceState: (a, b, url) => { window.location.hash = url; } },
        sessionStorage: { getItem: k => store.get(k) ?? null, setItem: (k, v) => store.set(k, v) },
        matchMedia: () => ({ matches: false }), addEventListener: (name, fn) => { windowHandlers[name] = fn; } };
    const document = { body, getElementById: byId, querySelector: sel => body.querySelector(sel), querySelectorAll: sel => body.querySelectorAll(sel),
        addEventListener: (name, fn) => { document.handlers[name] = fn; }, handlers: {} };
    const context = createContext({ document, window });
    const module = new SourceTextModule(read('assets/js/cours/course-steps.js'), { context });
    await module.link(() => {}); await module.evaluate();
    const visible = () => [a01, a02, final].filter(s => !s.classList.contains('course-step-hidden')).map(s => s.id);
    const click = link => { let prevented = false; document.handlers.click({ target: link, preventDefault: () => { prevented = true; } }); return prevented; };
    return { module, body, reading, intro, a01, a02, final, summary, field, next, nav, store, window, windowHandlers, visible, click, byId };
}

test('calculs purs : étape d’une ancre, étape de départ et libellé', async () => {
    const { module } = await harness();
    const { stepIndexFor, initialStepIndex, stepLabel } = module.namespace;
    const child = {}; const steps = [{ contains: n => n === child }, { contains: () => false }];
    assert.equal(stepIndexFor(steps, child), 0);
    assert.equal(stepIndexFor(steps, null), -1);
    assert.equal(initialStepIndex(3, { hashIndex: 2, storedIndex: '1' }), 2);
    assert.equal(initialStepIndex(3, { hashIndex: -1, storedIndex: '1' }), 1);
    assert.equal(initialStepIndex(3, { hashIndex: -1, storedIndex: '9' }), 0);
    assert.equal(initialStepIndex(0), -1);
    assert.equal(stepLabel(1, 3), 'Étape 2 sur 3');
});

test('une seule étape visible, la carte « Ta mission du jour » toujours affichée', async () => {
    const h = await harness();
    assert.equal(h.body.dataset.courseSteps, 'on');
    assert.ok(h.reading.classList.contains('course-steps-enabled'));
    assert.deepEqual(h.visible(), ['a01']);
    assert.equal(h.intro.classList.contains('course-step-hidden'), false);
    assert.equal(h.a01.querySelector('[data-course-step-counter]').textContent, 'Étape 1 sur 3');
});

test('« Passer à l’étape suivante » remplace l’étape, et on peut toujours revenir en arrière', async () => {
    const h = await harness();
    assert.equal(h.click(h.next), true);
    assert.deepEqual(h.visible(), ['a02']);
    assert.equal(h.a02.querySelector('h2').focused, true);
    assert.equal(h.window.location.hash, '#a02');
    assert.equal(h.store.get('tifsec-etape:techno/5e/S01'), '1');
    const back = h.nav.children.find(link => link.attrs.href === '#a01');
    assert.equal(h.click(back), true);
    assert.deepEqual(h.visible(), ['a01']);
    assert.equal(back.attrs['aria-current'], 'step');
    const summary = h.nav.children.find(link => link.attrs.href === '#course-summary');
    h.click(summary);
    assert.deepEqual(h.visible(), ['course-final']);
    assert.ok('data-step-done' in h.nav.children.find(link => link.attrs.href === '#a02').attrs);
    const intro = h.nav.children.find(link => link.attrs.href === '#course-intro');
    assert.equal(h.click(intro), false, 'le lien vers l’objectif garde son comportement normal');
    assert.deepEqual(h.visible(), ['course-final']);
});

test('reprise : ancre de l’adresse, étape mémorisée et focus clavier dans une étape cachée', async () => {
    assert.deepEqual((await harness({ hash: '#course-summary' })).visible(), ['course-final']);
    assert.deepEqual((await harness({ stored: 1 })).visible(), ['a02']);
    const h = await harness();
    h.reading.handlers.focusin({ target: h.field });
    assert.deepEqual(h.visible(), ['a02']);
    h.window.location.hash = '#a01'; h.windowHandlers.hashchange();
    assert.deepEqual(h.visible(), ['a01']);
});

test('gabarits : étapes balisées, bilan final avec retour, styles et script chargés', () => {
    const activities = read('_includes/cours/cours-activites.html');
    const layout = read('_layouts/cours.html');
    const styles = read('assets/css/cours/course-quest-ui.css');
    assert.match(activities, /class="cours-activite" id="\{\{ activite\.id \}\}" data-course-step/);
    assert.match(activities, /data-course-step-counter/);
    assert.match(layout, /id="course-final" data-course-step/);
    assert.match(layout, /course-final-controls[\s\S]*derniere_activite\.id/);
    assert.match(layout, /course-steps\.js[\s\S]*course-progress\.js/);
    assert.match(styles, /course-steps-enabled \.course-step-hidden \{ display: none !important; \}/);
    assert.match(styles, /@media print[\s\S]*course-step-hidden \{ display: block !important; \}/);
});
