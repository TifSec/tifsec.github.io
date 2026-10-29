import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { validateCoursePair } from './check-course-import.mjs';
import { questionCatalogue } from './export-question-catalogue.mjs';

// Exemple fictif : aucun corrigé réel dans le dépôt public.
function fixture() {
    const course = Object.fromEntries(['titre','theme','problematique','pourquoi','application','lien_precedent','bilan'].map(key => [key, 'Exemple fictif']));
    course.activites = [{ id: 'a01', pourquoi: 'Comprendre', demarche: ['Observer'], questions: [{ id: 'q01', type: 'texte' }] }];
    const schema = { seance: 'DEMO', version: 'v1', questions: [{ activite: 'a01', id: 'q01', cle: 'a01_q01', champs: ['a01_q01'], type: 'texte', facultatif: false }] };
    const content = { seance: 'DEMO', version_cours: 'v1', preparation: { deroule: [{ minutes: 50 }] },
        correction: [{ activite: 'a01', question: 'q01', mode: 'professeur', points: 20, attendu: 'Exemple fictif', explication: 'Exemple fictif', criteres: ['Exemple fictif'] }],
        evaluation: { validation_finale: 'professeur', prolongements_dans_note: false } };
    return { course, content, schema };
}
test('import : durée, accompagnement et barème complet sur 20', () => {
    const { course, content, schema } = fixture();
    assert.deepEqual(validateCoursePair(course, content, schema), { questions: 1, minutes: 50, maximum: 20 });
});
test('import refusé si barème incomplet, durée fausse ou validation automatique', () => {
    for (const mutate of [data => data.content.correction[0].points = 19,
        data => data.content.correction[0].criteres = [], data => data.content.correction = [],
        data => data.content.preparation.deroule[0].minutes = 45,
        data => data.content.evaluation.validation_finale = 'automatique',
        data => data.course.activites[0].questions[0].type = 'inconnu']) {
        const data = fixture(); mutate(data); assert.throws(() => validateCoursePair(data.course, data.content, data.schema));
    }
});
test('import refusé si un champ réservé au professeur entre dans le YAML public', () => {
    const data = fixture(); data.course.activites[0].questions[0].attendu = 'Exemple fictif';
    assert.throws(() => validateCoursePair(data.course, data.content, data.schema), /private_field/);
});
test('3e S10 (progression 2026) : questions notées, défi facultatif sans note', () => {
    const course = parse(readFileSync(new URL('../_data/cours/techno/3e/S10.yml', import.meta.url), 'utf8'));
    const schema = questionCatalogue().find(row => row.matiere === 'techno' && row.classe === '3e' && row.seance === 'S10');
    assert.ok(schema.questions.filter(row => !row.facultatif).length >= 4);
    const defi = course.activites.find(activity => activity.defi);
    assert.equal(defi.facultatif, true);
    assert.ok(schema.questions.filter(row => row.facultatif).every(row => row.activite === defi.id));
    assert.match(course.titre, /^Séance 10 : /);
});
