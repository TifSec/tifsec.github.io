import test from 'node:test';
import assert from 'node:assert/strict';
import { checkQuestion, proposeCorrection, CorrectionRuleError } from '../_supabase/functions/_shared/deterministic-checker.mjs';

// Données entièrement fictives : aucun corrigé de cours réel dans les tests publics.
const number = (reponse, rules = {}) => checkQuestion({ question: { type: 'nombre' }, reponse,
    correction: { mode: 'deterministe', attendu: 12.5, points: 2, ...rules } });
const qcm = (reponse, rules = {}, choices = [{ id: 'a', texte: 'Premier choix fictif' }, { id: 'b', texte: 'Second choix fictif' }]) => checkQuestion({
    question: { type: 'qcm', choix: choices }, reponse, correction: { mode: 'deterministe', choix_attendus: ['b'], points: 1, ...rules }
});
test('virgule, point, espaces de bord, signe et zéros décimaux', () => {
    for (const value of ['12,5', '12.5', ' +12,500 ', '0012.500']) assert.equal(number(value).etat, 'correcte', value);
    assert.equal(number('12,6').etat, 'incorrecte');
    assert.equal(number('−12,5', { attendu: -12.5 }).etat, 'correcte');
    assert.equal(number(',5', { attendu: .5 }).etat, 'correcte');
});
test('zéro et réponse vide restent distincts, aucun zéro de note implicite pour une absence', () => {
    assert.equal(number('0', { attendu: 0 }).points_proposes, 2);
    for (const value of ['', '  ', null, undefined]) {
        const result = number(value);
        assert.equal(result.etat, 'sans_reponse'); assert.equal(result.points_proposes, null);
    }
});
test('groupement français des milliers, y compris espaces insécables', () => {
    for (const value of ['1 234,5', '1\u00a0234,5', '1\u202f234.5']) assert.equal(number(value, { attendu: 1234.5 }).etat, 'correcte');
    for (const value of ['12 34,5', '1,234.5', '1 23 456']) assert.equal(number(value).etat, 'format_invalide');
});
test('une unité configurée peut être saisie ou déjà affichée à côté du champ', () => {
    for (const value of ['12,5', '12,5 cm', '12.5cm']) assert.equal(number(value, { unite_attendue: 'cm' }).etat, 'correcte');
    assert.equal(number('12,5 m', { unite_attendue: 'cm' }).etat, 'format_invalide');
    assert.equal(number('12,5 cm').etat, 'format_invalide');
    assert.equal(number('12,5', { unite_attendue: 'cm', unite_obligatoire: true }).etat, 'format_invalide');
    assert.equal(number('12,5 cm', { unite_attendue: 'cm', unite_obligatoire: true }).etat, 'correcte');
});
test('tolérance explicite inclusive, sans marge supplémentaire flottante', () => {
    for (const value of ['9,9', '10,1', '10']) assert.equal(number(value, { attendu: 10, tolerance_absolue: .1 }).etat, 'correcte');
    assert.equal(number('10,10000000000001', { attendu: 10, tolerance_absolue: .1 }).etat, 'incorrecte');
    assert.equal(number('0,30000000000000001', { attendu: .3 }).etat, 'incorrecte');
    assert.equal(number('0,3000', { attendu: .3 }).etat, 'correcte');
});
test('entiers dépassant la précision JS possibles en chaînes, refus des nombres JS déjà imprécis', () => {
    const expected = '9007199254740993';
    assert.equal(number(expected, { attendu: expected }).etat, 'correcte');
    assert.equal(number('9007199254740992', { attendu: expected }).etat, 'incorrecte');
    assert.throws(() => number('1', { attendu: 9007199254740992 }), CorrectionRuleError);
});
test('petits attendus numériques sérialisés en notation scientifique sans perte de comparaison', () => {
    assert.equal(number('0,0000001', { attendu: 1e-7 }).etat, 'correcte');
    assert.equal(number('-0,0000001', { attendu: -1e-7 }).etat, 'correcte');
});
test('arrondi demandé : attendu arrondi, réponse déjà à la précision attendue', () => {
    assert.equal(number('1,24', { attendu: '1.235', arrondi_decimales: 2 }).etat, 'correcte');
    assert.equal(number('-1,24', { attendu: '-1.235', arrondi_decimales: 2 }).etat, 'correcte');
    assert.equal(number('1,2400', { attendu: '1.235', arrondi_decimales: 2 }).etat, 'correcte');
    assert.equal(number('1,235', { attendu: '1.235', arrondi_decimales: 2 }).etat, 'format_invalide');
    assert.equal(number('1,23', { attendu: '1.235', arrondi_decimales: 2 }).etat, 'incorrecte');
});
test('pas de calcul exécuté, de fraction devinée, de valeur infinie ou de coercition objet', () => {
    for (const value of ['2+3', '1/2', '1e3', 'Infinity', 'NaN', '0x10', '<script>alert(1)</script>', {}, 12.5]) assert.equal(number(value).etat, 'format_invalide');
});
test('limites de taille et de précision bornées', () => {
    assert.equal(number('1'.repeat(300)).etat, 'format_invalide');
    assert.equal(number('1'.repeat(100), { attendu: '1'.repeat(100) }).etat, 'correcte');
    assert.equal(number('1'.repeat(101)).etat, 'format_invalide');
});
test('QCM vérifié par identifiant, indépendamment de l’ordre et du texte', () => {
    assert.equal(qcm('b').etat, 'correcte'); assert.equal(qcm('a').etat, 'incorrecte');
    assert.equal(qcm('b', {}, [{ id: 'b', texte: 'Texte changé' }, { id: 'a', texte: 'Autre texte' }]).etat, 'correcte');
    assert.equal(qcm('Second choix fictif').etat, 'format_invalide');
    assert.equal(qcm('inconnu').points_proposes, null);
});
test('texte, tableau et types non pris en charge restent à examiner', () => {
    for (const type of ['texte', 'tableau', 'fraction']) {
        for (const mode of ['professeur', 'deterministe']) {
            const result = checkQuestion({ question: { type }, correction: { mode, points: 3 }, reponse: 'Essai fictif' });
            assert.equal(result.etat, 'a_examiner'); assert.equal(result.points_proposes, null);
        }
    }
    assert.equal(checkQuestion({ question: { type: 'nombre' }, reponse: '12' }).etat, 'a_examiner');
});
test('règle incomplète ou invalide : erreur de configuration sans fausse note', () => {
    for (const rule of [{ attendu: null }, { attendu: Infinity }, { tolerance_absolue: null }, { tolerance_absolue: -1 }, { tolerance_absolue: NaN },
        { points: -1 }, { points: 10001 }, { points: .0000001 }, { arrondi_decimales: -1 }, { arrondi_decimales: 1.5 },
        { unite_attendue: '' }, { unite_obligatoire: true }, { mode: 'automagique' }]) assert.throws(() => number('12,5', rule), CorrectionRuleError);
    for (const rule of [{ choix_attendus: [] }, { choix_attendus: ['a', 'b'] }, { choix_attendus: ['absent'] }]) assert.throws(() => qcm('a', rule), CorrectionRuleError);
    assert.throws(() => qcm('a', {}, [{ id: 'a' }, { id: 'a' }]), CorrectionRuleError);
});
test('résultat sans attendu, réponse brute, critères privés ou note finale', () => {
    const result = number('12,5', { explication: 'INDICATION_PRIVEE_FICTIVE' });
    const json = JSON.stringify(result);
    assert.equal(result.points_proposes, 2);
    for (const key of ['attendu', 'reponse', 'explication', 'note_finale']) assert.equal(Object.hasOwn(result, key), false);
    assert.ok(!json.includes('INDICATION_PRIVEE_FICTIVE'));
});
const entry = (cle, type, reponse, correction) => ({ cle, question: { type }, reponse, correction });
test('proposition mixte : seulement les points vérifiés, reliquat manuel et validation professeur', () => {
    const result = proposeCorrection([
        entry('a', 'nombre', '5', { mode: 'deterministe', attendu: 5, points: 2 }),
        entry('b', 'nombre', '8', { mode: 'deterministe', attendu: 9, points: 1 }),
        entry('c', 'texte', 'Explication fictive', { mode: 'professeur', points: 3 }),
        entry('d', 'nombre', '', { mode: 'deterministe', attendu: 4, points: 2 })
    ]);
    assert.equal(result.points_automatiques, 2); assert.equal(result.maximum_automatique, 3);
    assert.equal(result.maximum_a_examiner, 5); assert.equal(result.maximum_total, 8);
    assert.equal(result.questions_a_examiner, 2); assert.equal(result.bareme_complet, true);
    assert.equal(result.statut, 'proposition'); assert.equal(result.validation_requise, true); assert.equal(result.note_finale, null);
});
test('même entièrement correcte, la proposition ne devient jamais une note validée', () => {
    const result = proposeCorrection([entry('a', 'nombre', '1', { mode: 'deterministe', attendu: 1, points: 2 })]);
    assert.equal(result.questions_a_examiner, 0); assert.equal(result.validation_requise, true); assert.equal(result.note_finale, null);
});
test('points décimaux additionnés exactement, sans artefact de 0,1 + 0,2', () => {
    const result = proposeCorrection([entry('a', 'nombre', '1', { mode: 'deterministe', attendu: 1, points: .1 }), entry('b', 'nombre', '2', { mode: 'deterministe', attendu: 2, points: .2 })]);
    assert.equal(result.points_automatiques, .3); assert.equal(result.maximum_total, .3);
});
test('barème manquant ou copie vide : aucun maximum global inventé', () => {
    const result = proposeCorrection([entry('a', 'nombre', '1', { mode: 'deterministe', attendu: 1 })]);
    assert.equal(result.resultats[0].etat, 'correcte'); assert.equal(result.maximum_total, null);
    assert.equal(result.bareme_complet, false); assert.equal(result.questions_a_examiner, 1);
    assert.equal(proposeCorrection([]).maximum_total, null);
});
test('absence de clés, doublons et ensembles excessifs refusés avant restitution', () => {
    const row = entry('a', 'texte', '', { mode: 'professeur' });
    assert.throws(() => proposeCorrection([row, row]), CorrectionRuleError);
    assert.throws(() => proposeCorrection([{ ...row, cle: '' }]), CorrectionRuleError);
    assert.throws(() => proposeCorrection([{ ...row, cle: '  ' }]), CorrectionRuleError);
    assert.throws(() => proposeCorrection(Array(1001).fill(row)), CorrectionRuleError);
});
test('format invalide à examiner plutôt que transformé silencieusement en erreur notée zéro', () => {
    const result = proposeCorrection([entry('a', 'nombre', '2+3', { mode: 'deterministe', attendu: 5, points: 4 })]);
    assert.equal(result.resultats[0].etat, 'format_invalide');
    assert.equal(result.maximum_automatique, 0); assert.equal(result.maximum_a_examiner, 4);
    assert.equal(result.questions_a_examiner, 1); assert.equal(result.note_finale, null);
});
test('barème de zéro point permis sans se confondre avec un barème absent', () => {
    const result = proposeCorrection([entry('a', 'nombre', '1', { mode: 'deterministe', attendu: 1, points: 0 })]);
    assert.equal(result.bareme_complet, true); assert.equal(result.maximum_total, 0);
    assert.equal(result.questions_a_examiner, 0); assert.equal(result.note_finale, null);
});
