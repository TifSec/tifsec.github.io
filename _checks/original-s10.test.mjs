import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { questionCatalogue } from './export-question-catalogue.mjs';
const root = new URL('../', import.meta.url);
const course = parse(readFileSync(new URL('_data/cours/techno/3e/S10R.yml', root), 'utf8'));
const read = path => readFileSync(new URL(path, root), 'utf8');

test('reprise originale : onze questions numérotées, trois tableaux, problème DNB et conclusion conservés', () => {
    const questions = course.activites.flatMap(row => row.questions);
    assert.equal(course.activites.length, 9);
    assert.equal(questions.length, 16);
    assert.deepEqual(questions.filter(row => row.numero).map(row => Number(row.numero)), Array.from({length:11},(_,i)=>i+1));
    assert.deepEqual(questions.filter(row => row.type === 'tableau').map(row => row.lignes.length), [5,4,6]);
    assert.equal(questionCatalogue().find(row => row.seance === 'S10R').questions.flatMap(row => row.champs).length, 37);
    assert.ok(course.activites.some(row => row.titre === 'Mini-question type DNB'));
    assert.ok(course.activites.some(row => row.titre.includes('trace')));
});

test('reprise originale : explications et exemples rendus dans leur ordre, sans notes privées', () => {
    const html = read('_site/cours/techno/3e/s10-original/index.html');
    const keys = [...html.matchAll(/data-answer-id="([^"]+)"/g)].map(match => match[1]);
    assert.equal(keys.length, 37); assert.equal(new Set(keys).size, 37);
    assert.ok(html.indexOf('Code à usage unique') < html.indexOf('Mise en commun : identification'));
    for (const value of ['Tracteur!Piano7Nuage', 'URGENT', 'localisation', 'historique de navigation', 'Mini-question type DNB', '4 à 6 lignes']) assert.ok(html.includes(value));
    assert.doesNotMatch(html, /ATTENDU\s*:|NOTE PROFESSEUR|POINT PIX|bareme_detaille/);
    assert.doesNotMatch(html, /LibreOffice|\.odt|deux catégories/);
    assert.ok(read('_site/eleve/index.html').includes('"seance":"S10R"'));
});

test('les énoncés reprennent l’archive sauf Q11 reformulée à la demande du professeur', () => {
    const archive = read('_archives/ancien-site/techno/3/index.html').split('<section id="session10" class="content-section">')[1].split('</section>')[0];
    const originals = [...archive.matchAll(/<p><strong>Q(\d+)\s*:<\/strong>([\s\S]*?)<\/p>/g)]
        .map(match => match[2].replace(/<[^>]*>/g,'').replace(/\s+/g,' ').trim());
    assert.equal(originals.length, 11);
    const questions = course.activites.flatMap(row => row.questions).filter(row => row.numero);
    assert.deepEqual(questions.slice(0,10).map(row => row.enonce), originals.slice(0,10));
    assert.notEqual(questions[10].enonce, originals[10]);
});
