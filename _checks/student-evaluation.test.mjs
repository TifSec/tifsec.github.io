import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createContext, SourceTextModule } from 'node:vm';
import { Element } from './fake-dom.mjs';
const student = { status: 'authenticated', user: { id: 'student' }, profile: { role: 'student', enrollment_status: 'approved' } };
const revisions = ['a01_q01_r0_c1','a01_q01_r0_c2','a01_q02','a01_q03'].map(cle => ({ cle, revision: '1' }));
const evaluation = { id: 42, work_session_id: 12, total: '16.000000', answer_revisions: revisions, marks: [
    { cle: 'a01_q01', points: 9, maximum: 12, commentaire: 'Comparer les deux exemples.', details: [
        { cle: 'a01_q01_r0_c1', points: 6, maximum: 6 }, { cle: 'a01_q01_r0_c2', points: 3, maximum: 6 }
    ] }, { cle: 'a01_q02', points: 5, maximum: 6, commentaire: '<img src=x onerror=alert(1)>' },
    { cle: 'a01_q03', points: 2, maximum: 2, commentaire: '' }
] };
const copy = { id: 12, locked: true, group: false, answers: revisions.map(row => ({ key: row.cle, revision: 1 })) };
const text = node => node.textContent + node.children.map(text).join(' ');
async function harness({ enabled = true } = {}) {
    const root = new Element('fieldset'), summary = new Element('section'), activity = new Element('article');
    activity.id = 'a01'; activity.className = 'cours-activite'; root.append(activity); root.disabled = true;
    for (const [id, tag] of [['q01','input'],['q02','textarea'],['q03','select']]) {
        const question = new Element(); question.className = 'cours-question'; question.dataset.question = id;
        for (const key of id === 'q01' ? revisions.slice(0,2).map(row => row.cle) : ['a01_' + id]) {
            const field = new Element(tag); field.dataset.answerId = key; field.value = 'Réponse fictive'; field.disabled = true;
            if (id === 'q01') { const cell = new Element('td'); cell.append(field); question.append(cell); } else question.append(field);
        }
        activity.append(question);
    }
    const page = { createElement: tag => new Element(tag) };
    const context = createContext({ document: page });
    const module = new SourceTextModule(readFileSync(new URL('../assets/js/cours/student-evaluation.js', import.meta.url), 'utf8'), { context });
    await module.link(() => { throw new Error('unexpected_import'); }); await module.evaluate();
    const control = { session: student, checks: 0, calls: [], grade: structuredClone(evaluation), reopened: false, copyReads: 0, pending: null, failure: false };
    const db = { from(table) {
        const filters = []; let selected;
        return { select(columns) { selected = columns; return this; }, eq(key, value) { filters.push([key,value]); return this; }, async maybeSingle() {
            control.calls.push({ table, selected, filters });
            if (control.failure) return { error: new Error('private remote detail') };
            if (table === 'work_sessions') {
                control.copyReads++;
                return { data: { id: 12, terminee: !control.reopened || control.copyReads === 1, current_evaluation_id: control.reopened && control.copyReads > 1 ? null : 42 } };
            }
            if (control.pending) await control.pending;
            return { data: control.grade };
        } };
    } };
    const view = module.namespace.createStudentEvaluation({ root, summary, db, enabled, page,
        checkSession: async () => { control.checks++; return control.session; } });
    return { root, summary, module, control, view, render: value => module.namespace.renderStudentEvaluation({ root, summary, page, evaluation: value }) };
}
test('restitution élève : points par case, texte et QCM, appréciations repliées', async () => {
    const h = await harness(); const clear = h.render(evaluation);
    assert.equal(h.root.querySelectorAll('.student-answer-mark').length, 4);
    assert.match(text(h.summary), /16 \/ 20/);
    assert.equal(h.root.querySelectorAll('.student-mark-comment').length, 2);
    assert.ok(h.root.querySelectorAll('.student-mark-comment').every(node => node.open === false));
    assert.match(text(h.root), /<img src=x onerror=alert\(1\)>/); assert.equal(h.root.querySelectorAll('img').length, 0);
    const textarea = h.root.querySelectorAll('textarea')[0]; assert.equal(textarea.nextSibling.className, 'student-answer-mark');
    assert.ok(h.root.querySelectorAll('[data-answer-id]').every(field => field.disabled && field.value === 'Réponse fictive'));
    clear(); assert.equal(h.root.querySelectorAll('.student-answer-mark').length, 0); assert.equal(h.root.querySelectorAll('[data-answer-id]').length, 4);
});
test('aucun dictionnaire, corrigé, champ de notation ou code HTML interprété côté élève', async () => {
    const h = await harness(); h.render({ ...evaluation, attendu: 'SECRET ATTENDU', dictionnaire: ['SECRET VARIANTE'] });
    assert.doesNotMatch(text(h.root) + text(h.summary), /SECRET/);
    assert.equal(h.root.querySelectorAll('input').length, 2); assert.equal(h.root.querySelectorAll('textarea').length, 1);
});

test('zéro validé : affiché comme une note, jamais confondu avec une absence',async()=>{
    const h=await harness();const grade=structuredClone(evaluation);grade.total=0;
    for(const mark of grade.marks){mark.points=0;for(const detail of mark.details||[])detail.points=0;}
    h.render(grade);assert.match(text(h.summary),/0 \/ 20/);assert.match(text(h.root),/Note : 0 \/ 6/);
});
test('cible ou somme incohérente : aucun affichage partiel', async () => {
    for (const value of [{ ...evaluation, total: 20 }, { ...evaluation, marks: [{ ...evaluation.marks[0], cle: 'unknown' }, ...evaluation.marks.slice(1)] },
        { ...evaluation, marks: [{ ...evaluation.marks[0], details: [{ cle:'unknown',points:9,maximum:12 }] }, ...evaluation.marks.slice(1)] }]) {
        const h = await harness(); assert.throws(() => h.render(value)); assert.equal(h.root.querySelectorAll('.student-answer-mark').length, 0);
    }
});
test('activation absente, copie ouverte ou historique : aucune requête de notes', async () => {
    for (const [enabled, value, options] of [[false, copy, {}],[true, { ...copy, locked:false }, {}],[true, copy, {history:true}]]) {
        const h = await harness({enabled}); await h.view.load(value, 'student', options); assert.equal(h.control.calls.length, 0); assert.equal(h.control.checks, 0);
    }
});
test('rôle ou compte incorrect : aucune lecture de note', async () => {
    for (const session of [{status:'not_authenticated'},{...student,profile:{role:'teacher'}},{...student,profile:{role:'student',enrollment_status:'pending'}},{...student,user:{id:'other'}}]) {
        const h=await harness();h.control.session=session;await h.view.load(copy,'student');assert.equal(h.control.calls.length,0);
    }
});
test('lecture limitée à la copie et à sa correction courante, pas de service privé', async () => {
    const h=await harness();await h.view.load({...copy,group:true},'student');
    assert.match(text(h.summary),/commune aux participants/);assert.equal(h.control.calls.length,3);
    const grade=h.control.calls.find(row=>row.table==='work_evaluations');assert.deepEqual(grade.filters,[['id',42],['work_session_id',12]]);
    assert.doesNotMatch(grade.selected,/attendu|corrige|dictionnaire/);
});
test('actualisation inchangée : ne referme pas une appréciation ouverte', async () => {
    const h=await harness();await h.view.load(copy,'student');const details=h.root.querySelectorAll('.student-mark-comment')[0];details.open=true;
    await h.view.load(copy,'student');assert.equal(details.open,true);assert.equal(h.control.calls.filter(row=>row.table==='work_evaluations').length,1);
});
test('réouverture pendant lecture, autre copie ou révisions différentes : pas de note ancienne', async () => {
    for(const mode of ['reopened','other','revision']) {
        const h=await harness();if(mode==='reopened')h.control.reopened=true;if(mode==='other')h.control.grade.work_session_id=99;if(mode==='revision')h.control.grade.answer_revisions=[];
        await h.view.load(copy,'student');assert.equal(h.root.querySelectorAll('.student-answer-mark').length,0);
    }
});
test('réponse tardive après déconnexion effacée, sans données de note réaffichées', async () => {
    const h=await harness();let resolve;h.control.pending=new Promise(done=>{resolve=done;});const pending=h.view.load(copy,'student');
    await new Promise(done=>setImmediate(done));h.view.clear();resolve();await pending;
    assert.equal(h.summary.hidden,true);assert.equal(h.root.querySelectorAll('.student-answer-mark').length,0);
});
test('erreur de service : réponses intactes et message de réessai sans détails privés', async () => {
    const h=await harness();h.control.failure=true;await h.view.load(copy,'student');
    assert.match(text(h.summary),/Recharge ta copie/);assert.doesNotMatch(text(h.summary),/private remote/);
    assert.ok(h.root.querySelectorAll('[data-answer-id]').every(field=>field.value==='Réponse fictive'));
});
