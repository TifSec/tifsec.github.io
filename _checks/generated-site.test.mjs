import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
const read = path => readFileSync(new URL('../_site/' + path, import.meta.url), 'utf8');

test('bibliothèque Supabase locale figée, intègre et préchargée sans CDN externe',()=>{
    const path='assets/vendor/supabase/supabase-2.118.0.js';
    const bytes=readFileSync(new URL('../_site/'+path,import.meta.url));
    const integrity='sha384-'+createHash('sha384').update(bytes).digest('base64');
    assert.equal(createHash('sha256').update(bytes).digest('hex'),'bee24fc29228ed5a370f76a2ba1ca3c399549edad2fef23453c80148856a49af');
    for(const page of ['prof/index.html','prof/cours/index.html','eleve/index.html','connexion/index.html','cours/techno/3e/s02/index.html']) {
        const html=read(page);assert.match(html,/rel="preload" as="script"/);assert.ok(html.includes('integrity="'+integrity+'"'));
        assert.ok(html.includes('src="/'+path+'"'));assert.doesNotMatch(html,/cdn\.jsdelivr\.net\/npm\/@supabase/);
    }
});
test('nouvel espace élève : bandeau protégé, statistiques, catalogue, invitations et ressources', () => {
    const html = read('eleve/index.html');
    for (const id of ['eleve-content', 'eleve-identity', 'eleve-logout', 'student-stats', 'student-lessons', 'student-invitations']) assert.ok(html.includes('id="' + id + '"'), id);
    assert.match(html, /id="eleve-content" hidden/);
    assert.match(html, /data-profile-field="validation"/);
    assert.match(html, /student-dashboard.js/);
    assert.match(html, /student-dashboard.css/);
});

test('progression élève : point de départ S10 et bouton activé, protégé avant restauration', () => {
    const html = read('eleve/index.html');
    assert.match(html, /id="student-next-panel"[^>]*data-enabled="true"/);
    const sequence = JSON.parse(html.match(/id="progressions-data"[^>]*>([\s\S]*?)<\/script>/)[1]);
    const progression = sequence.find(row => row.etablissement === 'college' && row.matiere === 'techno' && row.classe === '3e');
    assert.equal(progression.derniere_seance_en_classe, 'S09');
    const last = progression.seances.findIndex(lesson => lesson.id === progression.derniere_seance_en_classe);
    assert.ok(last >= 0);
    assert.equal(progression.seances[last + 1].id, 'S10R');
    const course = read('cours/techno/3e/s10-original/index.html');
    assert.match(course, /id="course-submit"[^>]*data-enabled="true"[^>]*hidden disabled/);
    assert.ok(course.indexOf('id="course-submit"') > course.indexOf('id="course-answers"'));
});
test('pilote : sept identifiants préservés et un QCM ajouté, navigation et synthèse communes', () => {
    const html = read('cours/techno/3e/s02/index.html');
    const keys = [...html.matchAll(/data-answer-id="([^"]+)"/g)].map(match => match[1]);
    assert.deepEqual(keys, ['a01_q01_r0_c1', 'a01_q01_r0_c2', 'a01_q01_r1_c1', 'a01_q01_r1_c2', 'a01_q01_r2_c1', 'a01_q01_r2_c2', 'a01_q02', 'a01_q03']);
    assert.match(html, /<select[^>]*data-answer-id="a01_q03"/);
    assert.match(html, /course-progress.js/);
    assert.match(html, /id="course-summary"/);
    assert.match(html, /Pourquoi cette activité/);
    assert.match(html, /id="course-evaluation"[^>]*data-enabled="true"[^>]*hidden/);
    assert.match(html, /student-evaluation.css/);
});
test('accès privé activé localement, notes masquées avant chargement autorisé', () => {
    const html = read('prof/cours/index.html');
    assert.match(html, /id="teacher-course" data-enabled="true"/);
    assert.match(html, /id="teacher-course-notes"[^>]*hidden/);
    assert.match(html, /private-course.js/);
});
test('aucun backend, test ou document de préparation publié', () => {
    for (const path of ['_supabase', '_checks', '_documentation', '_archives', '.env']) assert.equal(existsSync(new URL('../_site/' + path, import.meta.url)), false, path);
});

test('S10 utilise le moteur commun sans corrigé embarqué', () => {
    const html = read('cours/techno/3e/s10/index.html');
    assert.deepEqual([...html.matchAll(/data-answer-id="([^"]+)"/g)].map(match => match[1]), ['a01_q01','a01_q02','a02_q01','a02_q02','a03_q01']);
    for (const resource of ['course-progress.js', 'course-work.js', 'course-layout.css']) assert.ok(html.includes(resource));
    assert.match(html, /activité facultative/);
    assert.doesNotMatch(html, /choix_attendus|bareme_detaille|pistes_appreciation/);
    assert.match(read('eleve/index.html'), /"seance":"S10"/);
});

test('suivi : préparation de correction explicite, masquée avant sélection', () => {
    const html = read('prof/suivi/index.html');
    assert.match(html, /id="copy-correction"[^>]*hidden/);
    assert.match(html, /id="copy-correction-prepare" disabled/);
    assert.match(html, /copy-correction.css/);
    assert.match(html, /id="copy-correction-status" role="status"/);
    assert.match(html, /id="copy-grade"[^>]*data-enabled="true"[^>]*hidden/);
    assert.match(html, /id="copy-grade-validate" disabled/);
});
test('les liens des classes mènent aux séances et conservent matière et établissement', () => {
    const html = read('prof/techno/index.html');
    assert.match(html, /href="\/prof\/cours\/\?matiere=techno&amp;etablissement=college&amp;classe=5e"/);
    assert.doesNotMatch(html, /href="\/prof\/suivi\/\?matiere=techno/);
    for (const subject of ['tim', 'maths']) assert.match(read('prof/' + subject + '/index.html'), new RegExp('/prof/cours/\\?matiere=' + subject + '&amp;etablissement=mfr'));
});

test('tableau des notes : page protégée, filtres et navigation dédiés',()=>{
    const html=read('prof/notes/index.html');assert.match(html,/id="prof-content" hidden/);assert.match(html,/id="teacher-gradebook" data-enabled="true"/);
    for(const id of ['notes-subject','notes-class','notes-lesson','notes-table','notes-detail'])assert.ok(html.includes('id="'+id+'"'));
    assert.match(html,/gradebook.js/);assert.match(html,/gradebook.css/);
    assert.match(html,/href="\/prof\/notes\/" aria-current="page"/);
    assert.match(read('prof/index.html'),/Tableau des notes/);
});
