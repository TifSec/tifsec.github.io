// Vérifie qu'un site compilé ne liste aucune séance marquée « statut: brouillon »
// et que les pages de brouillon n'affichent que l'avis « Séance en préparation ».
// Usage : node _checks/check-drafts.mjs <dossier du site compilé>
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const root = fileURLToPath(new URL('../', import.meta.url));
const site = resolve(process.argv[2] || resolve(root, '_site'));
const catalogue = parse(readFileSync(resolve(root, '_data/seances.yml'), 'utf8'));
const drafts = [];
for (const [subject, classes] of Object.entries(catalogue)) for (const [schoolClass, lessons] of Object.entries(classes))
    for (const lesson of lessons) if (lesson.statut === 'brouillon') drafts.push({ subject, schoolClass, ...lesson });
const problems = [];
const listing = readFileSync(resolve(site, 'eleve/index.html'), 'utf8').match(/<script id="seances-data"[^>]*>([\s\S]*?)<\/script>/);
if (!listing) problems.push('liste des séances introuvable dans eleve/index.html');
else {
    const listed = JSON.parse(listing[1]);
    for (const draft of drafts) if (listed.some(row => row.matiere === draft.subject && row.classe === draft.schoolClass && row.seance === draft.id))
        problems.push('brouillon listé : ' + draft.subject + ' ' + draft.schoolClass + ' ' + draft.id);
}
for (const draft of drafts) {
    const page = resolve(site, draft.url.replace(/^\//, ''), 'index.html');
    if (!existsSync(page)) continue;
    const html = readFileSync(page, 'utf8');
    if (!html.includes('course-draft-notice') || html.includes('id="course-answers"')) problems.push('page de brouillon exposée : ' + draft.url);
}
if (problems.length) { for (const problem of problems) console.error(problem); process.exitCode = 1; }
else console.log('OK : ' + drafts.length + ' brouillons, aucun listé ni exposé.');
