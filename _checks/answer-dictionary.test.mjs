import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeAnswer, checkTableDictionary } from '../_supabase/functions/_shared/answer-dictionary.mjs';
import { prepareCopyProposal } from '../_supabase/functions/teacher-correction/proposal.mjs';

const question = { activite: 'a', id: 'q', cle: 'a_q', type: 'tableau', champs: ['cell1', 'cell2'] };
const rule = { activite: 'a', question: 'q', mode: 'professeur', points: 4, dictionnaire: [
    { champ: 'cell1', points: 2, reponses_acceptees: ['réponse fictive', 'variante acceptée'] },
    { champ: 'cell2', points: 2, reponses_acceptees: ['autre exemple'] }
] };
const check = values => checkTableDictionary(question, rule, new Map(Object.entries(values)));
test('normalisation limitée à la casse, aux accents et aux espaces', () => {
    assert.equal(normalizeAnswer('  RÉPONSE\u00a0  FICTIVE '), 'reponse fictive');
    assert.equal(check({ cell1: '  REPONSE FICTIVE ', cell2: 'autre exemple' }).points_proposes, 4);
});
test('réponse entière seulement : négation et phrase englobante non devinées', () => {
    for (const value of ['pas une réponse fictive', 'réponse fictive et autre chose', 'réponse']) {
        const result = check({ cell1: value }); assert.equal(result.resultats_cellules[0].etat, 'a_examiner'); assert.equal(result.points_proposes, null);
    }
});
test('dictionnaire propre à chaque cellule, inconnu jamais déclaré faux', () => {
    const result = check({ cell1: 'autre exemple', cell2: 'variante acceptée' });
    assert.equal(result.points_proposes, null); assert.ok(result.resultats_cellules.every(cell => cell.etat === 'a_examiner'));
});
test('tableau partiel : points acquis proposés, reliquat manuel sans zéro', () => {
    const schema = { seance: 'S', version: 'v1', questions: [question] };
    const result = prepareCopyProposal(schema, { seance: 'S', version_cours: 'v1', correction: [rule] }, [
        { question_key: 'cell1', reponse: 'réponse fictive', revision: 1 }, { question_key: 'cell2', reponse: 'exemple original', revision: 1 }
    ]);
    assert.equal(result.points_automatiques, 2); assert.equal(result.maximum_automatique, 2); assert.equal(result.maximum_a_examiner, 2);
    assert.equal(result.maximum_total, 4); assert.equal(result.questions_a_examiner, 1); assert.equal(result.note_finale, null);
    assert.equal(result.resultats[0].resultats_cellules[1].points_proposes, null);
    assert.doesNotMatch(JSON.stringify(result), /exemple original|reponses_acceptees/);
});
test('tableau vide ou complet : absence conservée, note jamais validée automatiquement', () => {
    assert.equal(check({}).etat, 'sans_reponse'); assert.equal(check({}).points_proposes, null);
    assert.equal(check({ cell1: 'variante acceptée', cell2: 'autre exemple' }).etat, 'correcte');
});
test('dictionnaire incohérent : aucun résultat partiel', () => {
    for (const dictionnaire of [[], [rule.dictionnaire[0], rule.dictionnaire[0]],
        [{ ...rule.dictionnaire[0], points: 3 }, rule.dictionnaire[1]],
        [{ ...rule.dictionnaire[0], reponses_acceptees: [' '] }, rule.dictionnaire[1]],
        [{ ...rule.dictionnaire[0], champ: 'foreign' }, rule.dictionnaire[1]]]) {
        assert.throws(() => checkTableDictionary(question, { ...rule, dictionnaire }, new Map()));
    }
});
test('points décimaux : reliquat exact et sans double comptage', () => {
    const small = { ...rule, points: 0.3, dictionnaire: rule.dictionnaire.map((cell, i) => ({ ...cell, points: i ? 0.2 : 0.1 })) };
    const result = prepareCopyProposal({ seance: 'S', version: 'v1', questions: [question] }, { seance: 'S', version_cours: 'v1', correction: [small] },
        [{ question_key: 'cell1', reponse: 'réponse fictive', revision: 1 }]);
    assert.equal(result.maximum_a_examiner, 0.2); assert.equal(result.points_automatiques, 0.1);
});

test('forme tolérante : ponctuation finale, article, apostrophe et pluriel simple reconnus', () => {
    for (const value of ['réponse fictive.', 'La réponse fictive', 'RÉPONSES FICTIVES !', '  réponse   fictive ']) {
        const result = check({ cell1: value }); assert.equal(result.resultats_cellules[0].etat, 'reconnue', value);
    }
});

import { checkKeywords } from '../_supabase/functions/_shared/answer-dictionary.mjs';
test('rédaction : critères repérés par mots-clés, proposition sans zéro automatique', () => {
    const q = { type: 'texte', champs: ['a01_q01'], cle: 'a01_q01' };
    const r = { points: 3, mots_cles: [{ critere: 'démontage', points: 2, variantes: ['démonter', 'démontage', 'ouvrir'] }, { critere: 'document cité', points: 1, variantes: ['document 1'] }] };
    const full = checkKeywords(q, r, 'D’après le document 1, on peut démonter facilement.');
    assert.equal(full.points_proposes, 3); assert.equal(full.etat, 'a_examiner');
    const part = checkKeywords(q, r, 'On peut l’ouvrir.');
    assert.equal(part.points_proposes, 2); assert.deepEqual(part.resultats_criteres.map(c => c.trouve), [true, false]);
    const none = checkKeywords(q, r, 'Je ne sais pas.');
    assert.equal(none.points_proposes, null);
    assert.equal(checkKeywords(q, r, '  ').etat, 'sans_reponse');
    assert.throws(() => checkKeywords(q, { points: 1, mots_cles: r.mots_cles }, 'x'));
});
test('mots-clés : préfixe « démont* » et expression de plusieurs mots', () => {
    const q = { type: 'texte', champs: ['k'], cle: 'k' };
    const r = { points: 2, mots_cles: [{ critere: 'démontage', points: 1, variantes: ['démont*'] }, { critere: 'hors tension', points: 1, variantes: ['hors tension', 'débranch*'] }] };
    assert.equal(checkKeywords(q, r, 'Il faut le démonter après avoir débranché.').points_proposes, 2);
    assert.equal(checkKeywords(q, r, 'Le démontage est simple.').points_proposes, 1);
    assert.equal(checkKeywords(q, r, 'Rien à voir.').points_proposes, null);
});
