import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseDocument } from 'yaml';
import { readPrivateYaml } from '../_supabase/functions/teacher-course/yaml-reader.mjs';
import { prepareCopyProposal } from '../_supabase/functions/teacher-correction/proposal.mjs';
import { questionCatalogue } from './export-question-catalogue.mjs';

export function validateCoursePair(course, content, schema, { minutes = 50, original = false } = {}) {
    for (const key of ['titre', 'theme', 'problematique', 'pourquoi', 'application', 'lien_precedent', 'bilan'])
        if (typeof course[key] !== 'string' || !course[key].trim()) throw new Error('missing_pedagogy');
    const forbidden = new Set(['correction', 'attendu', 'choix_attendus', 'criteres', 'bareme_detaille', 'dictionnaire', 'reponses_acceptees', 'points']);
    function scan(value) {
        if (!value || typeof value !== 'object') return;
        for (const [key, child] of Object.entries(value)) { if (forbidden.has(key)) throw new Error('private_field_in_public_course'); scan(child); }
    }
    scan(course);
    if (!Array.isArray(course.activites) || !course.activites.length) throw new Error('missing_activities');
    const ids = new Set();
    for (const activity of course.activites) {
        if (!/^[a-z][a-z0-9]*$/.test(activity.id) || ids.has(activity.id)) throw new Error('invalid_activity_id'); ids.add(activity.id);
        if (!original && (!activity.pourquoi || !Array.isArray(activity.demarche) || !activity.demarche.length)) throw new Error('missing_method');
        const questions = new Set();
        for (const question of activity.questions || []) {
            if (!/^[a-z][a-z0-9]*$/.test(question.id) || questions.has(question.id)) throw new Error('invalid_question_id'); questions.add(question.id);
            if (!['texte', 'qcm', 'nombre', 'tableau'].includes(question.type)) throw new Error('unsupported_question');
        }
    }
    const phases = content.preparation?.deroule;
    if (minutes !== null && (!Array.isArray(phases) || phases.some(phase => !Number.isInteger(phase.minutes) || phase.minutes <= 0) ||
        phases.reduce((total, phase) => total + phase.minutes, 0) !== minutes)) throw new Error('invalid_duration');
    const mandatory = schema.questions.filter(question => !question.facultatif);
    for (const question of mandatory) {
        const rules = content.correction.filter(rule => rule.activite + '_' + rule.question === question.cle);
        if (rules.length !== 1 || !Number.isFinite(rules[0].points) || rules[0].points <= 0 || !rules[0].attendu ||
            !rules[0].explication || !Array.isArray(rules[0].criteres) || !rules[0].criteres.length) throw new Error('incomplete_rubric');
    }
    if (content.evaluation?.validation_finale !== 'professeur' || content.evaluation?.prolongements_dans_note !== false) throw new Error('invalid_validation');
    const proposal = prepareCopyProposal(schema, content, []);
    if (proposal.resultats.reduce((total, result) => total + Math.round(result.maximum * 1000000), 0) !== 20000000) throw new Error('rubric_not_twenty');
    for (const question of mandatory.filter(question => question.type === 'qcm')) {
        const rule = content.correction.find(rule => rule.activite + '_' + rule.question === question.cle);
        if (rule.mode !== 'deterministe' || !Array.isArray(rule.choix_attendus) || rule.choix_attendus.length !== 1 ||
            !question.choix.some(choice => choice.id === rule.choix_attendus[0])) throw new Error('invalid_expected_choice');
        const checked = prepareCopyProposal(schema, content, [{ question_key: question.cle, reponse: rule.choix_attendus[0], revision: 1 }]);
        if (checked.resultats.find(result => result.cle === question.cle)?.points_proposes !== rule.points) throw new Error('invalid_choice_score');
    }
    return { questions: mandatory.length, minutes, maximum: 20 };
}

if (resolve(process.argv[1] || '') === fileURLToPath(import.meta.url)) {
    const [subject, schoolClass, lessonId, privatePath] = process.argv.slice(2);
    try {
        const schema = questionCatalogue().find(row => row.matiere === subject && row.classe === schoolClass && row.seance === lessonId);
        if (!schema || !privatePath) throw new Error('missing_course');
        const root = fileURLToPath(new URL('../', import.meta.url));
        const course = parseDocument(readFileSync(resolve(root, '_data/cours', subject, schoolClass, lessonId + '.yml'), 'utf8')).toJS();
        const content = readPrivateYaml(readFileSync(resolve(privatePath), 'utf8'), parseDocument, schema);
        const original = process.argv.includes('--original');
        console.log('OK : contenu élève/professeur, identifiants et barème validés.', validateCoursePair(course, content, schema, original ? { original: true, minutes: null } : {}));
    } catch { console.error('Échec du contrôle : vérifier les formats, la correspondance, la durée et le barème. Aucun contenu privé affiché.'); process.exitCode = 1; }
}
