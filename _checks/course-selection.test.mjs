import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const source = readFileSync(new URL('../assets/js/prof/course-selection.js', import.meta.url), 'utf8');
const { initialCourseScope, lessonsInScope } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
const five = { etablissement: 'college', matiere: 'techno', classe: '5e' };
const three = { ...five, classe: '3e' };
const mfr = { etablissement: 'mfr', matiere: 'maths', classe: '3e' };
const catalogue = [{ ...three, seance: 'S02' }];
test('respect de la classe demandée même sans cours disponible', () => {
    assert.equal(initialCourseScope([five, three], catalogue, new URLSearchParams(five)), five);
    assert.deepEqual(lessonsInScope(catalogue, five), []);
});
test('aucun filtre : accès initial à une séance disponible sans perdre les classes vides', () => {
    assert.equal(initialCourseScope([five, three], catalogue, new URLSearchParams()), three);
});
test('matières et établissements restent distincts, les affectations limitent la sélection', () => {
    assert.equal(initialCourseScope([five, three], catalogue, new URLSearchParams(mfr)), null);
    assert.equal(initialCourseScope([five, three, mfr], catalogue, new URLSearchParams(mfr)), mfr);
    assert.deepEqual(lessonsInScope(catalogue, mfr), []);
});
