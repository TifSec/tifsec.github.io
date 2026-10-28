import { checkQuestion, sumPoints } from './deterministic-checker.mjs';

export function normalizeAnswer(value) {
    return value.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('fr').trim().replace(/\s+/gu, ' ');
}

export function checkShortAnswer(question, rule, response) {
    if (question.type !== 'texte' || question.champs?.length !== 1 || question.champs[0] !== question.cle || !Array.isArray(rule.reponses_acceptees) || !rule.reponses_acceptees.length || rule.reponses_acceptees.length > 250 ||
        rule.reponses_acceptees.some(value => typeof value !== 'string' || value.length > 256 || !normalizeAnswer(value))) throw new Error('invalid_short_dictionary');
    const maximum = checkQuestion({ question, correction: rule, reponse: '' }).maximum;
    if (maximum === null) throw new Error('dictionary_points_missing');
    const known = new Set(rule.reponses_acceptees.map(normalizeAnswer)).has(normalizeAnswer(response));
    return { etat: !response.trim() ? 'sans_reponse' : known ? 'correcte' : 'a_examiner', raison: 'reponse_courte', maximum,
        points_proposes: known ? maximum : null, maximum_verifie: known ? maximum : 0 };
}

export function checkManualTable(question, rule, answers) {
    if (question.type !== 'tableau' || !Array.isArray(rule.repartition) || !question.champs.length || rule.repartition.length !== question.champs.length ||
        new Set(question.champs).size !== question.champs.length) throw new Error('invalid_cell_rubric');
    const maximum = checkQuestion({ question, correction: rule, reponse: '' }).maximum, cells = new Map();
    for (const cell of rule.repartition) {
        if (!question.champs.includes(cell.champ) || cells.has(cell.champ)) throw new Error('invalid_cell_rubric');
        const points = checkQuestion({ question: { type: 'texte' }, correction: { points: cell.points }, reponse: '' }).maximum;
        if (points === null) throw new Error('invalid_cell_rubric');
        cells.set(cell.champ, points);
    }
    if (maximum === null || sumPoints([...cells.values()]) !== maximum) throw new Error('invalid_cell_rubric');
    const resultats_cellules = question.champs.map(champ => ({ champ, maximum: cells.get(champ), points_proposes: null,
        etat: (answers.get(champ) || '').trim() ? 'a_examiner' : 'sans_reponse' }));
    return { etat: resultats_cellules.every(cell => cell.etat === 'sans_reponse') ? 'sans_reponse' : 'a_examiner', raison: 'bareme_par_cellule',
        maximum, points_proposes: null, maximum_verifie: 0, resultats_cellules };
}
export function checkTableDictionary(question, rule, answers) {
    if (question.type !== 'tableau' || !Array.isArray(rule.dictionnaire) || rule.dictionnaire.length !== question.champs.length ||
        !question.champs.length || new Set(question.champs).size !== question.champs.length) throw new Error('invalid_dictionary');
    const maximum = checkQuestion({ question, correction: rule, reponse: '' }).maximum;
    if (maximum === null) throw new Error('dictionary_points_missing');
    const cells = new Map();
    for (const cell of rule.dictionnaire) {
        if (!question.champs.includes(cell.champ) || cells.has(cell.champ) || !Array.isArray(cell.reponses_acceptees) ||
            !cell.reponses_acceptees.length || cell.reponses_acceptees.length > 250 ||
            cell.reponses_acceptees.some(text => typeof text !== 'string' || text.length > 256 || !normalizeAnswer(text))) throw new Error('invalid_dictionary');
        const points = checkQuestion({ question: { type: 'texte' }, correction: { points: cell.points }, reponse: '' }).maximum;
        if (points === null) throw new Error('dictionary_points_missing');
        cells.set(cell.champ, { points, accepted: new Set(cell.reponses_acceptees.map(normalizeAnswer)) });
    }
    if (sumPoints([...cells.values()].map(cell => cell.points)) !== maximum) throw new Error('dictionary_points_mismatch');
    const resultats_cellules = question.champs.map(champ => {
        const cell = cells.get(champ), response = answers.get(champ) || '';
        const known = cell.accepted.has(normalizeAnswer(response));
        return { champ, etat: !response.trim() ? 'sans_reponse' : known ? 'reconnue' : 'a_examiner',
            maximum: cell.points, points_proposes: known ? cell.points : null };
    });
    const recognized = resultats_cellules.filter(cell => cell.points_proposes !== null);
    const complete = recognized.length === resultats_cellules.length;
    return { etat: complete ? 'correcte' : resultats_cellules.every(cell => cell.etat === 'sans_reponse') ? 'sans_reponse' : 'a_examiner',
        raison: 'dictionnaire_par_cellule', maximum, points_proposes: recognized.length ? sumPoints(recognized.map(cell => cell.points_proposes)) : null,
        maximum_verifie: sumPoints(recognized.map(cell => cell.maximum)), resultats_cellules };
}
