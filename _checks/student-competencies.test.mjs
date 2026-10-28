import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const code = readFileSync(new URL('../assets/js/eleve/student-competencies.js', import.meta.url), 'utf8');
const { competencyOverview, renderCompetencyOverview, skillResults } = await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));
const ref = { etablissement: 'college', classes: ['3e'], matiere: 'techno', titre: 'Technologie', source: 'https://www.education.gouv.fr/bo/2024/Hebdo9/MENE2402802A', description: 'Synthèse', seances: { S10R: ['proteger'] }, themes: [{ titre: 'Usages', competences: [{ id: 'proteger', titre: 'Utiliser le numérique avec précaution' }] }] };
const profile = { etablissement: 'college', classe: '3e' };
const lesson = { ...profile, matiere: 'techno', seance: 'S10R' };
const node = () => ({ children: [], attributes: {}, textContent: '', setAttribute(k,v) { this.attributes[k]=v; }, append(...items) { this.children.push(...items); } });
test('référentiel limité à l’établissement et à la classe', () => {
    assert.equal(competencyOverview([ref], profile, []).length, 1);
    assert.equal(competencyOverview([ref], { etablissement: 'mfr', classe: '3e' }, []).length, 0);
    assert.equal(competencyOverview([ref], { ...profile, classe: 'term' }, []).length, 0);
});
test('compétence ciblée : ni autre matière, ni autre classe, ni historique', () => {
    const result = competencyOverview([ref], profile, [lesson, { ...lesson, matiere: 'maths' }, { ...lesson, classe: '4e' }, { ...lesson, previousClass: true }]);
    assert.equal(result[0].themes[0].competences[0].targeted, 1);
});
test('note, remise et collectif ne sont jamais transformés en maîtrise', () => {
    const a = competencyOverview([ref], profile, [lesson]);
    const b = competencyOverview([ref], profile, [{ ...lesson, grade: { total: 20 }, state: 'finished', copy: { max_members: 3 } }]);
    assert.deepEqual(a, b);
});
test('rendu explicite non évalué, graphique décoratif et source accessible', () => {
    const root = node(); renderCompetencyOverview({ root, references: [ref], profile, lessons: [lesson], page: { createElement: node } });
    const flatten = item => [item, ...item.children.flatMap(flatten)]; const nodes = flatten(root);
    assert.ok(nodes.some(item => item.textContent === 'Pas encore évalué'));
    assert.ok(nodes.some(item => item.href === ref.source));
    assert.ok(!nodes.some(item => item.className === 'student-competency-progress'));
});

const assessed = (id, points, maximum = 4, group = 1) => {
    const row = { ...lesson, version: 'v1', seance: 'S' + id, titre: 'Séance', url: '/cours/', copy: { id, terminee: true, course_version: 'v1', current_evaluation_id: id + 100, max_members: group } };
    row.grade = { id: id + 100, work_session_id: id, course_version: 'v1', recipient_ids: ['a'], total: points + 20 - maximum, marks: [{ cle: 'a01_q01', points, maximum }, { cle: 'a01_q02', points: 20 - maximum, maximum: 20 - maximum }] };
    return row;
};
const reference = { ...ref, id: 'ref' };
const mapping = row => ({ ...lesson, seance: row.seance, version: 'v1', referentiel: 'ref', perimetre: 'Sous-compétence', questions: { a01_q01: ['proteger'] } });
const result = (rows, maps = rows.map(mapping), userId = 'a') => skillResults(reference, 'proteger', rows, maps, userId);
test('moyenne pondérée des points liés, pas moyenne des notes globales', () => {
    const rows = [assessed(1, 3, 4), assessed(2, 1, 2)];
    const value = result(rows).individual;
    assert.equal(value.percent, 66.7); assert.equal(value.points, 4); assert.equal(value.maximum, 6);
    assert.equal(value.copies, 2); assert.equal(value.toReview, 2);
});
test('zéro évalué différent du non évalué, barème nul exclu', () => {
    assert.equal(result([assessed(1, 0)]).individual.percent, 0);
    assert.equal(result([]).individual.percent, null);
    assert.equal(result([assessed(1, 0, 0)]).individual.percent, null);
});
test('collectif séparé du résultat individuel', () => {
    const value = result([assessed(1, 1, 4), assessed(2, 4, 4, 3)]);
    assert.equal(value.individual.percent, 25); assert.equal(value.collective.percent, 100);
    assert.equal(value.individual.copies, 1); assert.equal(value.collective.copies, 1);
});
test('tableau : ses cases ne sont jamais ajoutées au total de la question', () => {
    const row = assessed(1, 3);
    row.grade.marks[0].details = [{ cle: 'cell1', points: 1, maximum: 2 }, { cle: 'cell2', points: 2, maximum: 2 }];
    const value = result([row]).individual; assert.equal(value.points, 3); assert.equal(value.maximum, 4); assert.equal(value.entries.length, 1);
    row.grade.marks[0].details[0].points = 0;
    assert.equal(result([row]).individual.percent, null);
});
test('versions, destinataires, référence courante et clôture contrôlés', () => {
    for (const mutate of [r => r.version = 'v2', r => r.copy.course_version = 'v2', r => r.grade.course_version = 'v2',
        r => r.copy.terminee = false, r => r.copy.current_evaluation_id = 999, r => r.grade.work_session_id = 99,
        r => r.grade.recipient_ids = ['b'], r => r.previousClass = true]) {
        const row = assessed(1, 3); mutate(row); assert.equal(result([row]).individual.percent, null);
    }
    assert.equal(result([assessed(1, 3)], undefined, 'b').individual.percent, null);
});
test('doublons et rattachements ambigus exclus', () => {
    const row = assessed(1, 3), map = mapping(row);
    assert.equal(result([row, row], [map]).individual.copies, 1);
    assert.equal(result([row], [map, map]).individual.percent, null);
    assert.equal(result([row], []).individual.percent, null);
});
test('correction incohérente : aucun pourcentage trompeur', () => {
    for (const mutate of [r => r.grade.total = 20, r => r.grade.marks[0].points = -1, r => r.grade.marks[0].maximum = '4',
        r => r.grade.marks.push(r.grade.marks[0]), r => r.grade.marks[0].points = NaN]) {
        const row = assessed(1, 3); mutate(row); assert.equal(result([row]).individual.percent, null);
    }
});
