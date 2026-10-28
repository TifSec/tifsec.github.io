import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { questionCatalogue } from './export-question-catalogue.mjs';
const course = parse(readFileSync(new URL('../_data/cours/maths/term/S05.yml', import.meta.url), 'utf8'));

test('S05 actuelle : conserver les cinq exercices de bases, sans revenir aux anciens automatismes', () => {
    assert.deepEqual(course.activites[0].questions.map(q => q.enonce), [
        'Calculer 7² et expliquer ce que signifie le petit 2.',
        'Calculer (-4)² puis -4². Expliquer la différence.',
        'Résoudre x² = 25. Combien existe-t-il de solutions ?',
        'Calculer 2 × 5² - 3 × 5 en respectant les priorités.',
        'Développer (x - 3)².'
    ]);
});

test('S05 actuelle : sept parties, modèle de coût, forme canonique et défi intact', () => {
    assert.deepEqual(course.activites.map(a => a.questions.length), [5,6,5,2,7,5,4,6]);
    assert.equal(course.activites[7].facultatif, true);
    assert.match(JSON.stringify(course.activites), /5x² - 40x \+ 260/);
    assert.match(JSON.stringify(course.activites), /5\(x - 4\)² \+ 180/);
    assert.equal(course.activites[5].questions.at(-1).enonce, 'Rédiger un conseil argumenté au responsable du centre équestre.');
    const schema = questionCatalogue().find(row => row.matiere === 'maths' && row.classe === 'term' && row.seance === 'S05');
    assert.equal(schema.questions.filter(q => !q.facultatif).length, 34);
    assert.equal(schema.questions.filter(q => q.facultatif).length, 6);
    assert.equal(schema.questions.flatMap(q => q.champs).length, 45);
});

test('S05 actuelle : tableau horizontal, deux valeurs fournies conservées et six cellules à compléter', () => {
    const table = course.activites[2].questions[0];
    assert.equal(table.type, 'tableau');
    assert.equal(table.colonnes.length, 9);
    assert.equal(table.lignes[0].filter(cell => cell === '').length, 6);
    assert.equal(table.lignes[0].filter(cell => cell === '200').length, 2);
    assert.ok(!JSON.stringify(course).includes('PROF Q'));
});
