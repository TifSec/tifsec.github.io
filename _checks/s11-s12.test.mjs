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

test('S11/S12 : clés uniques du contenu jusqu’au rendu et au catalogue serveur', () => {
    const schemas = questionCatalogue();
    const deployed = JSON.parse(read('assets/data/questions-seances.json'));
    assert.deepEqual(deployed, schemas);
    for (const id of ['S11', 'S12']) {
        const course = yaml('_data/cours/techno/3e/' + id + '.yml');
        const schema = schemas.find(row => techno3e(row) && row.seance === id);
        const html = read('_site/cours/techno/3e/' + id.toLowerCase() + '/index.html');
        const keys = [...html.matchAll(/data-answer-id="([^"]+)"/g)].map(row => row[1]);
        assert.equal(schema.questions.length, 6);
        assert.equal(new Set(keys).size, keys.length);
        assert.deepEqual(keys, schema.questions.flatMap(row => row.champs));
        assert.equal(privatePath(schema), 'techno/3e/' + id + '.' + schema.version + '.yml');
        assert.ok(course.activites.at(-1).facultatif);
        assert.equal(course.activites.at(-1).questions.length, 0);
        assert.ok(html.includes('course-submit'));
        assert.doesNotMatch(JSON.stringify(course), /"(correction|attendu|points|choix_attendus|repartition|criteres)"\s*:/);
        assert.ok(html.includes('course-progress'));
        assert.ok(html.includes('cours-question'));
        assert.equal(schema.questions.filter(row => row.type === 'qcm').length, 1);
    }
});

test('S12 : documents tabulaires et algorithmes échappés rendus sans créer de réponses fantômes', () => {
    const html = read('_site/cours/techno/3e/s12/index.html');
    assert.ok(html.includes('<caption>Dossier — Entrées du modèle</caption>'));
    assert.ok(html.includes('<pre class="cours-code"><code>RÉPÉTER INDÉFINIMENT'));
    assert.ok(html.includes('CONDITION_DE_MONTEE'));
    const blocks = read('_includes/cours/cours-blocs.html');
    assert.match(blocks, /when 'code'[\s\S]*?bloc\.texte \| escape/);
    assert.match(blocks, /when 'tableau'[\s\S]*?cellule \| escape/);
    assert.equal(questionCatalogue().find(row => techno3e(row) && row.seance === 'S12').questions.flatMap(row => row.champs).length, 9);
});

test('S11 : les deux trajets à compléter apparaissent avant la zone de réponse', () => {
    const html = read('_site/cours/techno/3e/s11/index.html');
    const start = html.indexOf('id="a02-q02-label"');
    const fragment = html.slice(start, html.indexOf('</textarea>', start));
    assert.ok(fragment.indexOf('Tu appuies sur Monter') < fragment.indexOf('<textarea'));
    assert.ok(fragment.indexOf('La plateforme arrive en haut') < fragment.indexOf('<textarea'));
    assert.ok(fragment.includes('interface de puissance'));
    assert.ok(fragment.includes('carte de commande'));
});

test('parcours réel : S10 remise → S11 accessible → S12 accessible → S13 annoncée sans faux lien', () => {
    const progression = yaml('_data/progressions.yml');
    const profile = { etablissement: 'college', classe: '3e' };
    const lessons = questionCatalogue().filter(techno3e).map(row => ({ ...row, state: row.seance === 'S10R' ? 'finished' : 'new',
        url: '/cours/techno/3e/' + row.seance.toLowerCase() + '/' }));
    let next = nextLessons(progression, profile, lessons)[0].next;
    assert.equal(next.id, 'S11'); assert.ok(next.lesson.url);
    lessons.find(row => row.seance === 'S11').state = 'finished';
    next = nextLessons(progression, profile, lessons)[0].next;
    assert.equal(next.id, 'S12'); assert.ok(next.lesson.url);
    lessons.find(row => row.seance === 'S12').state = 'finished';
    next = nextLessons(progression, profile, lessons)[0].next;
    assert.equal(next.id, 'S13'); assert.equal(next.lesson, undefined);
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
