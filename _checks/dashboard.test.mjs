import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../assets/js/eleve/dashboard-model.js', import.meta.url), 'utf8');
const { dashboardModel, readDashboard } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
const lesson = { etablissement: 'college', matiere: 'techno', classe: '3e', seance: 'S02', titre: 'Exemple', url: '/cours/exemple/' };
const profile = { etablissement: 'college', classe: '3e' };
const copy = { ...lesson, id: 1, max_members: 1, terminee: false };
const model = data => dashboardModel({ catalogue: [lesson], profile, copies: [], answers: [], feedback: [], ...data });

test('une visite ou une copie vide ne suffit pas à commencer une séance', () => {
    assert.equal(model({ copies: [copy] }).started, 0);
    assert.equal(model({ copies: [copy], answers: [{ work_session_id: 1, reponse: '  ' }] }).lessons[0].state, 'new');
});
test('seules les réponses enregistrées non vides comptent, sans mesure de maîtrise', () => {
    const result = model({ copies: [copy], answers: [{ work_session_id: 1, reponse: 'essai' }] });
    assert.equal(result.started, 1);
    assert.equal(result.lessons[0].count, 1);
    assert.equal(result.finished, 0);
    assert.equal(result.mastery, undefined);
});
test('le collectif de référence remplace l’individuel dans les compteurs et retours', () => {
    const group = { ...copy, id: 2, max_members: 3 };
    for (const copies of [[copy, group], [group, copy]]) {
        const result = model({ copies, answers: [{ work_session_id: 1, reponse: 'ancien' }, { work_session_id: 2, reponse: 'commun' }],
            feedback: [{ work_session_id: 1, commentaire: 'historique' }, { work_session_id: 2, commentaire: 'retour commun' }] });
        assert.equal(result.lessons.length, 1);
        assert.equal(result.started, 1);
        assert.equal(result.lessons[0].count, 1);
        assert.deepEqual(result.lessons[0].comments, ['retour commun']);
    }
});
test('clôture professeur et réouverture déterminent le statut terminé', () => {
    assert.equal(model({ copies: [{ ...copy, terminee: true }] }).finished, 1);
    assert.equal(model({ copies: [copy] }).finished, 0);
});

test('déclaration de fin : séance accomplie sans clôture, sans grade inventé', () => {
    const result=model({copies:[{...copy,submitted_at:'2026-10-20T12:00:00Z'}]});
    assert.equal(result.finished,1);assert.equal(result.lessons[0].copy.terminee,false);assert.equal(result.lessons[0].grade,null);
});
test('catalogue limité à la classe, avec maintien des anciens travaux autorisés', () => {
    const old = { ...lesson, classe: '4e', url: '/ancien/' };
    assert.equal(model({ catalogue: [old] }).lessons.length, 0);
    const result = model({ catalogue: [old], copies: [{ ...old, id: 3, max_members: 2 }] });
    assert.equal(result.lessons[0].previousClass, true);
});
test('deux groupes pour une même séance provoquent une erreur explicite', () => {
    assert.throws(() => model({ copies: [{ ...copy, max_members: 2 }, { ...copy, id: 2, max_members: 2 }] }), /ambiguous/);
});
test('les liens de cours ne peuvent pas devenir des liens externes ou du script', () => {
    for (const url of ['//evil.test', 'javascript:alert(1)', '/\\evil.test', '/cours/\n']) {
        assert.throws(() => model({ catalogue: [{ ...lesson, url }] }), /invalid_url/);
    }
});
test('lecture seule paginée, y compris les clés composites des retours', async () => {
    const calls = [];
    const db = { from(table) {
        const call = { table, orders: [] }; calls.push(call);
        return { select(columns) { call.columns = columns; return this; }, order(key) { call.orders.push(key); return this; },
            async range(start, end) { call.range = [start, end]; return { data: table === 'work_sessions' && start === 0 ? Array.from({ length: 500 }, (_, id) => ({ id })) : [], error: null }; } };
    } };
    const result = await readDashboard(db);
    assert.equal(result.copies.length, 500);
    assert.deepEqual(calls.filter(row => row.table === 'work_sessions').map(row => row.range), [[0, 499], [500, 999]]);
    assert.deepEqual(calls.find(row => row.table === 'work_feedback').orders, ['work_session_id', 'teacher_id']);
});
test('une erreur réseau ne se transforme pas en statistiques à zéro', async () => {
    const db = { from() { return { select() { return this; }, order() { return this; }, async range() { return { data: null, error: { message: 'offline' } }; } }; } };
    await assert.rejects(readDashboard(db), /dashboard_unavailable/);
});

test('note validée : zéro conservé, référence et destinataire strictement vérifiés', () => {
    const marked = { ...copy, terminee: true, current_evaluation_id: 9 };
    const grade = { id: 9, work_session_id: 1, total: '0', recipient_ids: ['a'] };
    const data = { copies: [marked], evaluations: [grade], userId: 'a' };
    assert.equal(model(data).corrected, 1);
    assert.equal(model(data).lessons[0].grade.total, '0');
    for (const patch of [{ userId: 'b' }, { copies: [{ ...marked, terminee: false }] },
        { copies: [{ ...marked, current_evaluation_id: 10 }] }, { evaluations: [{ ...grade, work_session_id: 2 }] }]) {
        assert.equal(model({ ...data, ...patch }).corrected, 0);
    }
    for (const total of [null, -1, 21, 'erreur']) assert.throws(() => model({ ...data, evaluations: [{ ...grade, total }] }), /invalid_grade/);
});

test('la note individuelle historique ne remplace pas la note collective', () => {
    const result = model({ userId: 'a', copies: [{ ...copy, terminee: true, current_evaluation_id: 9 }, { ...copy, id: 2, max_members: 2 }],
        evaluations: [{ id: 9, work_session_id: 1, total: 18, recipient_ids: ['a'] }] });
    assert.equal(result.corrected, 0);
});

test('lecture de notes légère, puis nouvelle vérification des copies après réouverture', async () => {
    const calls = []; let reads = 0;
    const db = { from(table) {
        const call = { table }; calls.push(call);
        return { select(columns) { call.columns = columns; return this; }, order() { return this; },
            async range() { return { error: null, data: table === 'work_sessions' ? [{ ...copy, terminee: ++reads === 1, current_evaluation_id: reads === 1 ? 9 : null }] :
                table === 'work_evaluations' ? [{ id: 9, work_session_id: 1, total: 12, recipient_ids: ['a'] }] : [] }; } };
    } };
    const result = await readDashboard(db, { grades: true });
    assert.equal(reads, 2);
    assert.equal(model({ ...result, userId: 'a' }).corrected, 0);
    assert.equal(calls.find(row => row.table === 'work_evaluations').columns, 'id,work_session_id,total,recipient_ids');
});
test('suivi par compétence : champs nécessaires sans requête supplémentaire', async () => {
    const calls = [];
    const db = { from(table) { const entry = { table }; calls.push(entry); return {
        select(columns) { entry.columns = columns; return this; }, order() { return this; },
        async range() { return { error: null, data: table === 'work_sessions' ? [{ ...copy, terminee: true, current_evaluation_id: 8, course_version: 'v1' }] : table === 'work_evaluations' ? [{ id: 8 }] : [] }; }
    }; } };
    await readDashboard(db, { grades: true, competencies: true });
    assert.equal(calls.length, 5);
    assert.equal(calls.find(row => row.table === 'work_evaluations').columns, 'id,work_session_id,total,recipient_ids,course_version,marks');
    assert.match(calls[0].columns, /course_version/);
});
