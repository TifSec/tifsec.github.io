import { proposeCorrection, summarizeCorrection } from '../_shared/deterministic-checker.mjs';
import { checkTableDictionary, checkShortAnswer, checkManualTable } from '../_shared/answer-dictionary.mjs';

function teacherGuidance(rule, result) {
    // Ces champs privés ne sont restitués que par l'opération professeur protégée.
    const elements = Object.fromEntries(['attendu', 'explication', 'criteres', 'bareme_detaille', 'erreurs_frequentes', 'choix_attendus',
        'unite_attendue', 'tolerance_absolue', 'arrondi_decimales'].filter(key => rule?.[key] !== undefined).map(key => [key, rule[key]]));
    let pistes;
    if (result.etat === 'sans_reponse') pistes = ['Aucune réponse enregistrée : vérifier avec l’élève avant de décider des points.'];
    else if (result.etat === 'format_invalide') pistes = ['Format non reconnu : vérifier la valeur, l’unité ou le choix avant de statuer.'];
    else if (['correcte', 'incorrecte'].includes(result.etat)) pistes = ['Vérification déterministe effectuée ; vérifier séparément la démarche si elle fait partie des critères.'];
    else pistes = [
        'Si les éléments attendus sont présents et justifiés : « Réponse complète et expliquée. »',
        'Si une partie seulement est acquise : « Une partie de la réponse est juste ; préciser les éléments manquants. »',
        'Si le raisonnement ne répond pas encore à la question : « Reprendre la démarche à partir des critères ci-dessus. »'
    ];
    return { elements, pistes_appreciation: pistes,
        attribution: result.raison === 'bareme_par_cellule' ? 'Attribuer les points par case selon les critères. Aucun point automatique pour les justifications.' : result.resultats_cellules ? 'Points proposés uniquement pour les cases reconnues. Les autres réponses restent à examiner, sans zéro automatique.' : result.points_proposes !== null ? 'Points proposés par la vérification déterministe, à valider par le professeur.' :
            result.maximum !== null ? 'Attribuer de 0 à ' + result.maximum + ' points selon les critères, sans note automatique pour cette réponse.' : 'Barème non renseigné : ne pas proposer de points arbitraires.',
        decision_professeur: true };
}

export function answerSnapshot(rows, schema) {
    const allowed = new Set(schema.questions.flatMap(question => question.champs));
    const seen = new Set();
    if (!Array.isArray(rows) || rows.length > 1000) throw new Error('invalid_answers');
    return rows.map(row => {
        const revision = String(row.revision);
        if (!allowed.has(row.question_key) || seen.has(row.question_key) || typeof row.reponse !== 'string' || row.reponse.length > 20000 ||
            !/^(0|[1-9][0-9]*)$/.test(revision) || (typeof row.revision === 'number' && !Number.isSafeInteger(row.revision))) throw new Error('invalid_answers');
        seen.add(row.question_key);
        return { cle: row.question_key, revision };
    }).sort((a, b) => a.cle < b.cle ? -1 : a.cle > b.cle ? 1 : 0);
}

export function prepareCopyProposal(schema, content, rows) {
    if (content.seance !== schema.seance || content.version_cours !== schema.version || !Array.isArray(content.correction)) throw new Error('schema_mismatch');
    const snapshot = answerSnapshot(rows, schema);
    const answers = new Map(rows.map(row => [row.question_key, row.reponse]));
    const rules = new Map();
    for (const rule of content.correction) {
        const key = rule.activite + '_' + rule.question;
        if (rules.has(key) || !schema.questions.some(question => question.cle === key)) throw new Error('schema_mismatch');
        rules.set(key, rule);
    }
    const questions = schema.questions.filter(question => !question.facultatif || content.evaluation?.prolongements_dans_note === true);
    const result = proposeCorrection(questions.map(question => ({ cle: question.cle, question,
        correction: rules.get(question.cle), reponse: question.champs.map(key => answers.get(key) || '').join('\n').trim() })));
    const checked = result.resultats.map((row, index) => {
        const question = questions[index], rule = rules.get(question.cle);
        if (rule?.dictionnaire !== undefined) return { cle: row.cle, ...checkTableDictionary(question, rule, answers) };
        if (rule?.reponses_acceptees !== undefined) return { cle: row.cle, ...checkShortAnswer(question, rule, answers.get(question.cle) || '') };
        if (rule?.repartition !== undefined) return { cle: row.cle, ...checkManualTable(question, rule, answers) };
        return row;
    });
    return { ...summarizeCorrection(checked), resultats: checked.map((row, index) => ({ ...row, activite: questions[index].activite, question: questions[index].id,
        aide_professeur: teacherGuidance(rules.get(questions[index].cle), row) })),
        revisions_reponses: snapshot, questions_facultatives_ecartees: schema.questions.length - questions.length };
}
