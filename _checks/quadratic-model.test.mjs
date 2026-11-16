import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const source = readFileSync(new URL('../assets/js/cours/quadratic-model.js', import.meta.url), 'utf8');
const { quadraticState } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
test('tangente : valeur et pente sont deux grandeurs distinctes', () => {
    const model = { a: 2, b: -8, c: 15 };
    assert.deepEqual(quadraticState(model, 1), { x: 1, value: 9, slope: -4 });
    assert.deepEqual(quadraticState(model, 2), { x: 2, value: 7, slope: 0 });
    assert.equal(quadraticState(model, 3).slope, 4);
});
test('paramètres non finis et fonction non quadratique refusés', () => {
    assert.throws(() => quadraticState({ a: 0, b: 1, c: 2 }, 1));
    assert.throws(() => quadraticState({ a: 1, b: NaN, c: 2 }, 1));
});
