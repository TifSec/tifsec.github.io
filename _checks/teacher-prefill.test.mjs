import test from 'node:test';
import assert from 'node:assert/strict';
import { expectedFieldValues } from '../assets/js/prof/teacher-notes.js';

const field = (tagName, answerId) => ({ tagName, dataset: { answerId } });

test('corrigé professeur : QCM, nombre et cases de tableau pré-remplis', () => {
    const select = field('SELECT', 'a01_q01');
    assert.equal(expectedFieldValues({ mode: 'deterministe', choix_attendus: ['b'] }, [select]).get(select), 'b');
    const number = field('INPUT', 'a01_q02');
    assert.equal(expectedFieldValues({ mode: 'deterministe', attendu: 2.1 }, [number]).get(number), '2,1');
    const cells = [field('INPUT', 'a01_q03_r0_c1'), field('INPUT', 'a01_q03_r1_c1')];
    const values = expectedFieldValues({ dictionnaire: [{ champ: 'a01_q03_r0_c1', reponses_acceptees: ['acquérir', 'acquerir'] }, { champ: 'a01_q03_r1_c1', reponses_acceptees: ['traiter'] }] }, cells);
    assert.deepEqual([...values.values()], ['acquérir', 'traiter']);
});

test('corrigé professeur : une rédaction n’est jamais pré-remplie', () => {
    const area = field('TEXTAREA', 'a02_q01');
    assert.equal(expectedFieldValues({ mode: 'professeur', attendu: 'Une réponse rédigée' }, [area]).size, 0);
    const input = field('INPUT', 'a02_q02');
    assert.equal(expectedFieldValues({ mode: 'professeur', attendu: 'Phrase libre' }, [input]).size, 0);
});
