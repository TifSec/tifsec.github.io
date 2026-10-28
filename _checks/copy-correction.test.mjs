import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseDocument, stringify } from 'yaml';
import { createTeacherCorrectionHandler } from '../_supabase/functions/teacher-correction/handler.mjs';
import { prepareCopyProposal, answerSnapshot } from '../_supabase/functions/teacher-correction/proposal.mjs';
import { questionCatalogue } from './export-question-catalogue.mjs';

const user = '00000000-0000-0000-0000-000000000003';
const lesson = { etablissement: 'college', matiere: 'techno', classe: '3e', seance: 'S02', version: 'v1', path: 'techno/3e/S02.v1.yml' };
const schema = { ...lesson, questions: [
    { activite: 'a01', id: 'q01', cle: 'a01_q01', type: 'nombre', champs: ['a01_q01'] },
    { activite: 'a01', id: 'q02', cle: 'a01_q02', type: 'texte', champs: ['a01_q02'] }
] };
const content = { seance: 'S02', version_cours: 'v1', preparation: {}, correction: [
    { activite: 'a01', question: 'q01', mode: 'deterministe', attendu: 123.5, points: 2 },
    { activite: 'a01', question: 'q02', mode: 'professeur', attendu: 'ATTENDU FICTIF CONFIDENTIEL', points: 3 }
] };
const answers = [{ question_key: 'a01_q01', reponse: '123,5', revision: 2 }, { question_key: 'a01_q02', reponse: 'TEXTE ELEVE FICTIF', revision: 1 }];
function harness(options = {}) {
    const calls = []; let answerReads = 0, copyReads = 0, referenceReads = 0;
    const envs = { SUPABASE_URL: 'https://example.supabase.co', SUPABASE_ANON_KEY: 'public-example', COURSES_ALLOWED_ORIGINS: 'http://127.0.0.1:4000',
        COURSES_GITHUB_TOKEN: 'private-example', COURSES_GITHUB_OWNER: 'Example', COURSES_GITHUB_REPO: 'private', COURSES_GITHUB_REF: 'main' };
    const handler = createTeacherCorrectionHandler({ env: name => envs[name], parseDocument, catalogue: options.catalogue || [lesson], questionSchemas: options.schemas || [schema],
        async fetch(address, config) {
            const url = new URL(address); calls.push({ url, config });
            assert.equal(config.redirect, 'error'); assert.equal(config.cache, 'no-store');
            if (url.hostname === 'api.github.com') {
                assert.equal(config.headers.Authorization, 'Bearer private-example');
                return url.pathname.includes('/contents/') ? new Response(stringify(options.content || content)) : Response.json({ private: options.privateRepo !== false });
            }
            assert.equal(config.headers.Authorization, 'Bearer fake.jwt.example');
            if (url.pathname === '/auth/v1/user') return Response.json({ id: user }, { status: options.authStatus || 200 });
            if (url.pathname.endsWith('/profiles')) return Response.json([{ role: options.role || 'teacher' }]);
            if (url.pathname.endsWith('/teacher_class_assignments')) return Response.json(options.unassigned ? [] : [{ teacher_id: user }]);
            if (url.pathname.endsWith('/work_sessions')) {
                ++copyReads;
                return Response.json(options.invisible ? [] : [{ id: 12, etablissement: 'college', matiere: 'techno', classe: '3e', seance: 'S02', max_members: options.members || 1,
                    terminee: Boolean(options.finished || (options.copyChanged && copyReads > 1)) }]);
            }
            if (url.pathname.endsWith('/refonte_teacher_copies')) {
                ++referenceReads; assert.equal(config.method, 'POST'); assert.equal(JSON.parse(config.body).p_history, false);
                assert.equal(url.searchParams.get('copy_id'), 'eq.12');
                return Response.json(options.history || (options.becomesHistory && referenceReads > 1) ? [] : [{ copy_id: 12, is_history: false }]);
            }
            if (url.pathname.endsWith('/work_answers')) {
                ++answerReads; assert.equal(config.headers.Prefer, 'count=exact');
                const rows = structuredClone(options.answers || answers);
                if (options.changed && answerReads > 1) rows[0][options.changed] = options.changed === 'revision' ? 3 : 'une autre réponse';
                return Response.json(rows, { headers: { 'Content-Range': '0-1/' + (options.truncated ? 1001 : rows.length) } });
            }
            throw new Error('unexpected_path');
        }
    });
    return { calls, request: (input = { copy_id: 12 }, headers = {}, method = 'POST') => handler(new Request('https://example.supabase.co/functions/v1/teacher-correction', {
        method, headers: { origin: 'http://127.0.0.1:4000', authorization: 'Bearer fake.jwt.example', ...headers },
        ...(method === 'POST' ? { body: JSON.stringify(input) } : {})
    })) };
}
test('catalogue déployé aligné sur les clés publiques, sans énoncés ni corrigés', () => {
    const generated = JSON.parse(readFileSync(new URL('../_supabase/functions/teacher-correction/question-catalogue.json', import.meta.url)));
    assert.deepEqual(generated, questionCatalogue());
    assert.equal(generated.find(row => row.matiere === 'techno' && row.classe === '3e' && row.seance === 'S02').questions.flatMap(row => row.champs).length, 8);
    assert.doesNotMatch(JSON.stringify(generated), /enonce|attendu|correction/);
});
test('proposition individuelle et collective : calcul réel, manuel conservé, aucune écriture', async () => {
    for (const members of [1, 2, 3]) {
        const h = harness({ members }); const response = await h.request(); assert.equal(response.status, 200);
        assert.match(response.headers.get('cache-control'), /no-store/);
        const data = await response.json(), proposal = data.proposition;
        assert.equal(proposal.points_automatiques, 2); assert.equal(proposal.questions_a_examiner, 1);
        assert.equal(proposal.note_finale, null); assert.equal(proposal.enregistree, false);
        assert.equal(proposal.revisions_reponses[0].revision, '2'); assert.match(proposal.empreinte_corrige, /^[a-f0-9]{64}$/);
        assert.doesNotMatch(JSON.stringify(data), /TEXTE ELEVE|123,5/);
        assert.equal(proposal.resultats[1].aide_professeur.elements.attendu, 'ATTENDU FICTIF CONFIDENTIEL');
        assert.equal(proposal.resultats[1].points_proposes, null);
        assert.ok(h.calls.filter(call => call.config.method).every(call => call.url.pathname.endsWith('/refonte_teacher_copies')));
    }
});
test('visiteur, jeton invalide, élève, copie inaccessible : aucun appel GitHub', async () => {
    for (const [options, status] of [[{ authStatus: 401 }, 401], [{ role: 'student' }, 403], [{ invisible: true }, 403], [{ history: true }, 409]]) {
        const h = harness(options); const response = await h.request(); assert.equal(response.status, status);
        assert.doesNotMatch(await response.text(), /ATTENDU FICTIF|aide_professeur/);
        assert.ok(h.calls.every(call => call.url.hostname !== 'api.github.com'));
    }
    const h = harness(); assert.equal((await h.request({ copy_id: 12 }, { authorization: '' })).status, 401); assert.equal(h.calls.length, 0);
});

test('aide manuelle : critères privés et pistes conditionnelles, aucune comparaison de mots-clés', () => {
    const rule = { ...content, correction: content.correction.map(row => row.question === 'q02' ? { ...row,
        criteres: ['Justification explicite'], autre_secret: 'NE PAS TRANSMETTRE' } : row) };
    const first = prepareCopyProposal(schema, rule, answers).resultats[1];
    const second = prepareCopyProposal(schema, rule, answers.map(row => row.question_key === 'a01_q02' ? { ...row, reponse: 'ATTENDU FICTIF CONFIDENTIEL' } : row)).resultats[1];
    assert.deepEqual(first, second);
    assert.equal(first.points_proposes, null);
    assert.deepEqual(first.aide_professeur.elements.criteres, ['Justification explicite']);
    assert.match(first.aide_professeur.pistes_appreciation[0], /^Si /);
    assert.match(first.aide_professeur.attribution, /0 à 3/);
    assert.doesNotMatch(JSON.stringify(first), /NE PAS TRANSMETTRE/);
});
test('affectation et confidentialité du dépôt revérifiées par la passerelle existante', async () => {
    const h = harness({ unassigned: true }); assert.equal((await h.request()).status, 403);
    assert.ok(h.calls.every(call => call.url.hostname !== 'api.github.com'));
    assert.equal((await harness({ privateRepo: false }).request()).status, 503);
});

test('service professeur : dictionnaire partiel, points reconnus seulement et liste privée non recopiée', async () => {
    const tableSchema = { ...schema, questions: [{ ...schema.questions[0], type: 'tableau', champs: ['a01_q01', 'a01_q02'] }] };
    const privateContent = { ...content, correction: [{ activite: 'a01', question: 'q01', mode: 'professeur', points: 4, dictionnaire: [
        { champ: 'a01_q01', points: 2, reponses_acceptees: ['123,5'] },
        { champ: 'a01_q02', points: 2, reponses_acceptees: ['AUTRE VARIANTE PRIVEE'] }
    ] }] };
    const response = await harness({ schemas: [tableSchema], content: privateContent }).request(); assert.equal(response.status, 200);
    const data = await response.json(); assert.equal(data.proposition.points_automatiques, 2); assert.equal(data.proposition.maximum_a_examiner, 2);
    assert.equal(data.proposition.resultats[0].resultats_cellules[1].etat, 'a_examiner');
    assert.doesNotMatch(JSON.stringify(data), /AUTRE VARIANTE PRIVEE|TEXTE ELEVE|123,5/);
});
test('requête limitée à un identifiant, origines et méthodes contrôlées', async () => {
    for (const input of [{ copy_id: 12, points: 20 }, { copy_id: '../12' }, { copy_id: 0 }, { copy_id: 1.2 }, [], null, { copy_id: 9007199254740992 }]) {
        const h = harness(); assert.equal((await h.request(input)).status, 400); assert.equal(h.calls.length, 0);
    }
    const h = harness(); assert.equal((await h.request({}, { origin: 'https://evil.test' })).status, 403);
    assert.equal((await h.request({}, {}, 'OPTIONS')).status, 204); assert.equal((await h.request({}, {}, 'GET')).status, 405);
});
test('versions absentes ou ambiguës refusées', async () => {
    for (const options of [{ catalogue: [] }, { catalogue: [lesson, lesson] }, { schemas: [] }]) assert.equal((await harness(options).request()).status, 409);
});
test('réponses ou statut modifiés pendant le calcul : proposition refusée', async () => {
    for (const options of [{ changed: 'revision' }, { changed: 'reponse' }, { copyChanged: true }, { becomesHistory: true }]) {
        const response = await harness(options).request(); assert.equal(response.status, 409); assert.equal((await response.json()).proposition, undefined);
    }
});
test('réponses tronquées, inconnues ou règle incohérente : aucun résultat partiel', async () => {
    for (const options of [{ truncated: true }, { answers: [{ question_key: 'unknown', reponse: 'x', revision: 1 }] },
        { content: { ...content, correction: [...content.correction, content.correction[0]] } }]) assert.equal((await harness(options).request()).status, 503);
});
test('copie vide, barème absent et tableau : pas de zéro arbitraire', () => {
    const table = { ...schema, questions: [{ activite: 'a01', id: 'q02', cle: 'a01_q02', type: 'tableau', champs: ['cell1', 'cell2'] }] };
    const privateData = { ...content, correction: [{ activite: 'a01', question: 'q02', mode: 'professeur' }] };
    const blank = prepareCopyProposal(table, privateData, []);
    assert.equal(blank.maximum_total, null); assert.equal(blank.resultats[0].points_proposes, null); assert.equal(blank.resultats[0].etat, 'sans_reponse');
    const filled = prepareCopyProposal(table, privateData, [{ question_key: 'cell2', reponse: '0', revision: 1 }]);
    assert.equal(filled.resultats[0].etat, 'a_examiner');
});
test('instantané strict : doublons et révisions illisibles refusés', () => {
    assert.throws(() => answerSnapshot([answers[0], answers[0]], schema));
    for (const revision of [-1, '1.2', '01', null, Number.MAX_SAFE_INTEGER + 1]) assert.throws(() => answerSnapshot([{ ...answers[0], revision }], schema));
});
test('prolongements facultatifs exclus sauf règle explicite', () => {
    const optional = { ...schema, questions: schema.questions.map(row => ({ ...row, facultatif: row.id === 'q02' })) };
    assert.equal(prepareCopyProposal(optional, content, answers).resultats.length, 1);
    assert.equal(prepareCopyProposal(optional, { ...content, evaluation: { prolongements_dans_note: true } }, answers).resultats.length, 2);
});
