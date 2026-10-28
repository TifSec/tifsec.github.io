import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const root = fileURLToPath(new URL('../', import.meta.url));
export function questionCatalogue() {
    const catalogue = parse(readFileSync(resolve(root, '_data/seances.yml'), 'utf8'));
    const result = [];
    for (const [subject, classes] of Object.entries(catalogue)) for (const [schoolClass, lessons] of Object.entries(classes)) for (const lesson of lessons) {
        const course = parse(readFileSync(resolve(root, '_data/cours', subject, schoolClass, lesson.id + '.yml'), 'utf8'));
        const questions = [];
        for (const activity of course.activites || []) for (const question of activity.questions || []) {
            const key = activity.id + '_' + question.id;
            const fields = question.type === 'tableau' ? question.lignes.flatMap((row, r) => row.flatMap((cell, c) => cell === '' ? [key + '_r' + r + '_c' + c] : [])) : [key];
            questions.push({ activite: activity.id, id: question.id, type: question.type, cle: key, champs: fields,
                facultatif: Boolean(activity.facultatif || activity.obligatoire === false || question.facultatif || question.obligatoire === false),
                ...(question.type === 'qcm' ? { choix: question.choix.map(choice => ({ id: choice.id })) } : {}) });
        }
        result.push({ etablissement: lesson.etablissement, matiere: subject, classe: schoolClass, seance: lesson.id, version: lesson.version || 'v1', questions });
    }
    return result;
}
if (resolve(process.argv[1] || '') === fileURLToPath(import.meta.url)) {
    const output = JSON.stringify(questionCatalogue(), null, 4) + '\n';
    if (process.argv.includes('--write')) writeFileSync(resolve(root, '_supabase/functions/teacher-correction/question-catalogue.json'), output);
    else process.stdout.write(output);
}
