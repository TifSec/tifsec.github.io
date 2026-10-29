import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { questionCatalogue } from './export-question-catalogue.mjs';
import { privatePath } from '../_supabase/functions/_shared/site-catalogue.mjs';
const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const yaml = path => parse(read(path));
const source = read('assets/js/eleve/course-progression.js');
const techno3e = row => row.matiere === 'techno' && row.classe === '3e';
const { nextLessons } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));

// Progression 2026 (29/10/2026) : S11 et S12 de 3e sont régénérées ; on vérifie la structure commune.
test('3e S11/S12 : clés uniques du contenu jusqu’au rendu et au catalogue serveur', () => {
    const schemas = questionCatalogue();
    const deployed = JSON.parse(read('assets/data/questions-seances.json'));
    assert.deepEqual(deployed, schemas);
    for (const id of ['S11', 'S12']) {
        const course = yaml('_data/cours/techno/3e/' + id + '.yml');
        const schema = schemas.find(row => techno3e(row) && row.seance === id);
        const html = read('_site/cours/techno/3e/' + id.toLowerCase() + '/index.html');
        const keys = [...html.matchAll(/data-answer-id="([^"]+)"/g)].map(row => row[1]);
        assert.ok(schema.questions.length >= 4);
        assert.equal(new Set(keys).size, keys.length);
        assert.deepEqual(keys, schema.questions.flatMap(row => row.champs));
        assert.equal(privatePath(schema), 'techno/3e/' + id + '.' + schema.version + '.yml');
        assert.ok(course.activites.some(row => row.defi && row.facultatif));
        assert.ok(course.activites.at(-1).conclusion);
        assert.ok(html.includes('Pourquoi on change d’exercice ?'));
        assert.ok(html.includes('Sources et ressources officielles'));
        assert.ok(html.includes('course-submit'));
        assert.doesNotMatch(JSON.stringify(course), /"(correction|attendu|points|choix_attendus|repartition|criteres|mots_cles|reponses_acceptees)"\s*:/);
        assert.ok(html.includes('course-progress'));
        assert.ok(html.includes('cours-question'));
    }
});

test('documents en code et tableaux échappés, sans réponses fantômes (4e S36)', () => {
    const html = read('_site/cours/techno/4e/s36/index.html');
    assert.ok(html.includes('<pre class="cours-code"><code>au démarrage'));
    const blocks = read('_includes/cours/cours-blocs.html');
    assert.match(blocks, /when 'code'[\s\S]*?bloc\.texte \| escape/);
    assert.match(blocks, /when 'tableau'[\s\S]*?cellule \| escape/);
    const schema = questionCatalogue().find(row => row.matiere === 'techno' && row.classe === '4e' && row.seance === 'S36');
    const keys = [...html.matchAll(/data-answer-id="([^"]+)"/g)].map(row => row[1]);
    assert.deepEqual(keys, schema.questions.flatMap(row => row.champs));
});

test('chaque question des séances 2026 a un coup de pouce rendu juste après sa zone de réponse', () => {
    for (const [classe, id] of [['5e', 'S04'], ['4e', 'S20'], ['3e', 'S11']]) {
        const course = yaml('_data/cours/techno/' + classe + '/' + id + '.yml');
        assert.ok(course.activites.every(activity => (activity.questions || []).every(question => typeof question.aide === 'string' && question.aide.length > 5)));
        const html = read('_site/cours/techno/' + classe + '/' + id.toLowerCase() + '/index.html');
        const questions = (html.match(/class="cours-question"/g) || []).length;
        assert.equal((html.match(/<summary>Un coup de pouce<\/summary>/g) || []).length, questions);
    }
});

test('parcours réel 3e (progression 2026) : S01 remise → S02 accessible → S03 accessible', () => {
    const progression = yaml('_data/progressions.yml');
    const profile = { etablissement: 'college', classe: '3e' };
    const lessons = questionCatalogue().filter(techno3e).map(row => ({ ...row, state: row.seance === 'S01' ? 'finished' : 'new',
        url: '/cours/techno/3e/' + row.seance.toLowerCase() + '/' }));
    let next = nextLessons(progression, profile, lessons)[0].next;
    assert.equal(next.id, 'S02'); assert.ok(next.lesson.url);
    lessons.find(row => row.seance === 'S02').state = 'finished';
    next = nextLessons(progression, profile, lessons)[0].next;
    assert.equal(next.id, 'S03'); assert.ok(next.lesson.url);
});

test('suivi : chaque question S11/S12 est reliée à une compétence existante de la matière', () => {
    const mappings = yaml('_data/competences_evaluees.yml');
    const reference = yaml('_data/referentiels.yml').find(row => row.id === 'techno-cycle4-2024');
    const valid = new Set(reference.themes.flatMap(row => row.competences.map(skill => skill.id)));
    for (const schema of questionCatalogue().filter(row => techno3e(row) && ['S11', 'S12'].includes(row.seance))) {
        const map = mappings.find(row => techno3e(row) && row.seance === schema.seance && row.version === schema.version);
        assert.deepEqual(Object.keys(map.questions).sort(), schema.questions.map(row => row.cle).sort());
        for (const skills of Object.values(map.questions)) assert.ok(skills.length && skills.every(id => valid.has(id)));
    }
});
