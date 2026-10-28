import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createContext, SourceTextModule } from 'node:vm';
class Element {
    constructor() { this.children = []; this.events = {}; this.dataset = {}; this.disabled = false; this.hidden = false; this.textContent = ''; }
    replaceChildren(...nodes) { this.children = nodes; }
    append(...nodes) { this.children.push(...nodes); for (const node of nodes) { node.parent = this; node.parentNode = this; } }
    remove() { this.parent.children = this.parent.children.filter(node => node !== this); }
    querySelectorAll(selector) { return this.children.flatMap(node => [...((selector === '[data-answer-id]' ? node.dataset.answerId : node.className === selector.slice(1)) ? [node] : []), ...node.querySelectorAll(selector)]); }
    addEventListener(name, callback) { this.events[name] = callback; }
}
const teacher = { status: 'authenticated', user: { id: 'teacher' }, profile: { role: 'teacher' } };
const proposal = { copy_id: '12', statut: 'proposition', note_finale: null, enregistree: false, copie_terminee: false,
    maximum_automatique: 0, questions_a_examiner: 2, bareme_complet: false,
    resultats: [{ activite: 'a01', question: 'q01', etat: 'a_examiner', points_proposes: null,
        aide_professeur: { decision_professeur: true, elements: { attendu: ['Exemple fictif', '<img src=x onerror=alert(1)>'], criteres: { justification: 'Deux éléments expliqués' } },
            pistes_appreciation: ['Si les éléments sont justifiés : réponse complète.'], attribution: 'Points à décider par le professeur.' } }] };
async function harness() {
    const nodes = new Map(['copy-correction', 'copy-correction-prepare', 'copy-correction-status', 'copy-correction-results', 'tracking-preview'].map(id => [id, new Element()]));
    const activity = new Element(); activity.id = 'a01'; activity.className = 'cours-activite';
    for (const id of ['q01', 'q02']) { const question = new Element(); question.className = 'cours-question'; question.dataset.question = id; const cell = new Element(); const field = new Element(); field.dataset.answerId = 'a01_' + id; cell.append(field); question.append(cell); activity.append(question); }
    nodes.get('tracking-preview').append(activity);
    const control = { session: teacher, calls: [], auth: null, response: { data: { proposition: proposal }, error: null } };
    const page = { getElementById: id => nodes.get(id), createElement: () => new Element() };
    const context = createContext({ document: page, AbortController, window: { addEventListener() {} } });
    const module = new SourceTextModule(readFileSync(new URL('../assets/js/prof/copy-correction.js', import.meta.url), 'utf8'), { context });
    const grading = new SourceTextModule(readFileSync(new URL('../assets/js/prof/grade-editor.js', import.meta.url), 'utf8'), { context });
    await grading.link(() => { throw new Error('unexpected_import'); });
    await module.link(spec => { if (spec === './grade-editor.js') return grading; throw new Error('unexpected_import'); }); await module.evaluate();
    const component = module.namespace.initCopyCorrection({ document: page, checkSession: async () => control.session, db: {
        auth: { onAuthStateChange(fn) { control.auth = fn; } }, functions: { async invoke(name, config) { control.calls.push({ name, config }); return await control.response; } }
    } });
    return { nodes, control, component, button: nodes.get('copy-correction-prepare'), status: nodes.get('copy-correction-status'), results: nodes.get('copy-correction-results') };
}
const text = node => node.textContent + node.children.map(text).join(' ');
test('proposition : bouton explicite, appel limité à la copie, aucun zéro fictif', async () => {
    const h = await harness(); assert.equal(h.button.disabled, true);
    h.component.select({ copy_id: 12 }, 'teacher'); await h.button.events.click();
    assert.equal(h.control.calls[0].name, 'teacher-correction');
    assert.equal(JSON.stringify(h.control.calls[0].config.body), '{"copy_id":"12"}');
    assert.match(text(h.results), /Barème incomplet/); assert.doesNotMatch(text(h.results), /0 \/ 0/);
    assert.match(h.status.textContent, /Aucune note enregistrée/);
    const questions = h.nodes.get('tracking-preview').querySelectorAll('.cours-question');
    assert.match(text(questions[0]), /À examiner par le professeur/);
    assert.match(text(questions[0]), /Éléments attendus/);
    assert.match(text(questions[0]), /Deux éléments expliqués/);
    assert.match(text(questions[0]), /<img src=x onerror=alert\(1\)>/);
    assert.equal(questions[1].querySelectorAll('.copy-question-correction').length, 0);
    assert.doesNotMatch(text(h.results), /question q01/);
});

test('résultat par case : indication proche du champ, effacée avec la copie', async () => {
    const h = await harness();
    h.control.response = { data: { proposition: { ...proposal, resultats: [{ ...proposal.resultats[0], points_proposes: 2, maximum: 12, maximum_verifie: 2,
        resultats_cellules: [{ champ: 'a01_q01', etat: 'reconnue', points_proposes: 2, maximum: 2 }] }] } } };
    h.component.select({ copy_id: 12 }, 'teacher'); await h.button.events.click();
    const hints = h.nodes.get('tracking-preview').querySelectorAll('.copy-cell-correction');
    assert.equal(hints.length, 1); assert.match(text(hints[0]), /Réponse reconnue : 2 \/ 2/);
    h.component.clear(); assert.equal(h.nodes.get('tracking-preview').querySelectorAll('.copy-cell-correction').length, 0);
});
test('historique et compte élève : aucun calcul demandé', async () => {
    const h = await harness(); h.component.select({ copy_id: 12, is_history: true }, 'teacher'); await h.button.events.click();
    h.component.select({ copy_id: 12 }, 'teacher'); h.control.session = { ...teacher, profile: { role: 'student' } }; await h.button.events.click();
    assert.equal(h.control.calls.length, 0); assert.equal(h.nodes.get('copy-correction').hidden, true);
});
test('changement de copie : résultat tardif ignoré et requête interrompue', async () => {
    const h = await harness(); let resolve;
    h.control.response = new Promise(done => { resolve = done; });
    h.component.select({ copy_id: 12 }, 'teacher'); const pending = h.button.events.click(); await new Promise(done => setImmediate(done));
    h.component.select({ copy_id: 13 }, 'teacher');
    resolve({ data: { proposition: proposal } }); await pending;
    assert.equal(h.results.children.length, 0); assert.equal(h.control.calls[0].config.signal.aborted, true);
});
test('déconnexion ou changement de rôle après calcul : aucun résultat conservé', async () => {
    for (const event of ['SIGNED_OUT', 'SIGNED_IN', 'TOKEN_REFRESHED', 'USER_UPDATED']) {
        const h = await harness(); h.component.select({ copy_id: 12 }, 'teacher'); await h.button.events.click();
        h.control.auth(event); assert.equal(h.results.children.length, 0); assert.equal(h.nodes.get('copy-correction').hidden, true);
        assert.equal(h.nodes.get('tracking-preview').querySelectorAll('.copy-question-correction').length, 0);
    }
});

test('question inconnue : aucune annotation partielle ou attribuée à une autre question', async () => {
    const h = await harness();
    h.control.response = { data: { proposition: { ...proposal, resultats: [...proposal.resultats, { ...proposal.resultats[0], question: 'q99' }] } } };
    h.component.select({ copy_id: 12 }, 'teacher'); await h.button.events.click();
    assert.match(h.status.textContent, /Actualisez/);
    assert.equal(h.nodes.get('tracking-preview').querySelectorAll('.copy-question-correction').length, 0);
});

test('nouveau calcul et changement de copie : annotations remplacées puis effacées', async () => {
    const h = await harness(); h.component.select({ copy_id: 12 }, 'teacher');
    await h.button.events.click(); await h.button.events.click();
    assert.equal(h.nodes.get('tracking-preview').querySelectorAll('.copy-question-correction').length, 1);
    h.component.select({ copy_id: 13 }, 'teacher');
    assert.equal(h.nodes.get('tracking-preview').querySelectorAll('.copy-question-correction').length, 0);
});
test('erreur serveur ou réponse discordante : message utile, sans résultat partiel', async () => {
    for (const response of [{ error: new Error('private server detail') }, { data: { proposition: { ...proposal, copy_id: '13' } } }]) {
        const h = await harness(); h.control.response = response; h.component.select({ copy_id: 12 }, 'teacher'); await h.button.events.click();
        assert.match(h.status.textContent, /Actualisez/); assert.equal(h.results.children.length, 0); assert.equal(h.button.disabled, false);
        assert.doesNotMatch(h.status.textContent, /private server detail/);
    }
});
