import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const code = readFileSync(new URL('../assets/js/eleve/dashboard-view.js', import.meta.url), 'utf8');
const { followupSummary } = await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));
const lesson = values => ({ state: 'new', comments: [], ...values });
test('attente de note séparée du retour, aucune maîtrise déduite des points', () => {
    const rows = [lesson({ copy: {}, state: 'finished' }), lesson({ copy: {}, state: 'finished', comments: ['Bravo'] }), lesson({ grade: { total: 20 } }), lesson({ grade: { total: 0 } })];
    const result = followupSummary(rows);
    assert.equal(result.waiting, 2); assert.equal(result.reviews.length, 3);
    assert.equal(result.preview[0], rows[1]);
    assert.equal(result.preview.filter(row => row.grade).length, 2);
});
test('anciennes classes exclues du résumé courant et limite à trois aperçus', () => {
    const rows = [lesson({ previousClass: true, comments: ['Ancien'] }), ...Array.from({ length: 5 }, () => lesson({ comments: ['Retour'] }))];
    const before = JSON.stringify(rows); const result = followupSummary(rows);
    assert.equal(result.reviews.length, 5); assert.equal(result.preview.length, 3);
    assert.equal(JSON.stringify(rows), before);
});
test('pas de copie, copie commencée ou copie corrigée : pas d’attente inventée', () => {
    assert.equal(followupSummary([lesson({ state: 'finished' }), lesson({ copy: {}, state: 'started' }), lesson({ copy: {}, state: 'finished', grade: { total: 10 } })]).waiting, 0);
    assert.deepEqual(followupSummary([]), { waiting: 0, reviews: [], preview: [] });
});
