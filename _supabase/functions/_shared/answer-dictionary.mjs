import { checkQuestion, sumPoints } from './deterministic-checker.mjs';

export function normalizeAnswer(value) {
    return value.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('fr').trim().replace(/\s+/gu, ' ');
}

// Forme tolérante : ponctuation, apostrophes, articles en tête et pluriels simples ignorés.
// « L’acquérir. » , « acquerir » et « les capteurs » / « capteur » sont rapprochés.
const ARTICLES = new Set(['le', 'la', 'les', 'l', 'un', 'une', 'des', 'du', 'de', 'd', 'au', 'aux']);
export function looseAnswer(value) {
    const words = normalizeAnswer(value).replace(/[’`´]/gu, "'").replace(/[^\p{L}\p{N}%°,.+=:/()\-]+/gu, ' ')
        .replace(/[.,;:!?()]+(?=\s|$)/gu, ' ').split(/[\s']+/u).filter(Boolean);
    while (words.length > 1 && ARTICLES.has(words[0])) words.shift();
    return words.map(word => word.length > 3 ? word.replace(/(?<=[a-z])[sx]$/u, '') : word).join(' ');
}
function matches(accepted, response) {
    const strict = normalizeAnswer(response), loose = looseAnswer(response);
    return accepted.some(item => item.strict === strict || (item.loose && item.loose === loose));
}
function acceptedForms(values) { return values.map(value => ({ strict: normalizeAnswer(value), loose: looseAnswer(value) })); }

export function checkShortAnswer(question, rule, response) {
    if (question.type !== 'texte' || question.champs?.length !== 1 || question.champs[0] !== question.cle || !Array.isArray(rule.reponses_acceptees) || !rule.reponses_acceptees.length || rule.reponses_acceptees.length > 250 ||
        rule.reponses_acceptees.some(value => typeof value !== 'string' || value.length > 256 || !normalizeAnswer(value))) throw new Error('invalid_short_dictionary');
    const maximum = checkQuestion({ question, correction: rule, reponse: '' }).maximum;
    if (maximum === null) throw new Error('dictionary_points_missing');
    const known = matches(acceptedForms(rule.reponses_acceptees), response);
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
        cells.set(cell.champ, { points, accepted: acceptedForms(cell.reponses_acceptees) });
    }
    if (sumPoints([...cells.values()].map(cell => cell.points)) !== maximum) throw new Error('dictionary_points_mismatch');
    const resultats_cellules = question.champs.map(champ => {
        const cell = cells.get(champ), response = answers.get(champ) || '';
        const known = Boolean(response.trim()) && matches(cell.accepted, response);
        return { champ, etat: !response.trim() ? 'sans_reponse' : known ? 'reconnue' : 'a_examiner',
            maximum: cell.points, points_proposes: known ? cell.points : null };
    });
    const recognized = resultats_cellules.filter(cell => cell.points_proposes !== null);
    const complete = recognized.length === resultats_cellules.length;
    return { etat: complete ? 'correcte' : resultats_cellules.every(cell => cell.etat === 'sans_reponse') ? 'sans_reponse' : 'a_examiner',
        raison: 'dictionnaire_par_cellule', maximum, points_proposes: recognized.length ? sumPoints(recognized.map(cell => cell.points_proposes)) : null,
        maximum_verifie: sumPoints(recognized.map(cell => cell.maximum)), resultats_cellules };
}

// Rédaction : chaque critère est associé à des mots-clés (synonymes, tournures). Les critères repérés
// donnent une proposition de points que le professeur valide ou corrige ; rien n'est retiré automatiquement.
export function checkKeywords(question, rule, response) {
    if (question.type !== 'texte' || question.champs?.length !== 1 || !Array.isArray(rule.mots_cles) || !rule.mots_cles.length || rule.mots_cles.length > 20) throw new Error('invalid_keywords');
    const maximum = checkQuestion({ question, correction: rule, reponse: '' }).maximum;
    if (maximum === null) throw new Error('dictionary_points_missing');
    const groups = rule.mots_cles.map(group => {
        if (!group || typeof group.critere !== 'string' || !group.critere.trim() || group.critere.length > 300 || !Array.isArray(group.variantes) ||
            !group.variantes.length || group.variantes.length > 60 || group.variantes.some(text => typeof text !== 'string' || text.length > 120 || !looseAnswer(text))) throw new Error('invalid_keywords');
        const points = checkQuestion({ question: { type: 'texte' }, correction: { points: group.points }, reponse: '' }).maximum;
        if (points === null) throw new Error('dictionary_points_missing');
        // « démont* » : tout mot qui commence par « démont » (démonter, démontage…).
        return { critere: group.critere, points, variantes: group.variantes.map(text => ({ prefix: text.trim().endsWith('*'), text: looseAnswer(text.replace(/\*+\s*$/u, '')) })) };
    });
    if (sumPoints(groups.map(group => group.points)) > maximum) throw new Error('dictionary_points_mismatch');
    const text = ' ' + looseAnswer(response) + ' ';
    const resultats_criteres = groups.map(group => {
        const found = group.variantes.find(variant => variant.text && (variant.prefix ? text.includes(' ' + variant.text) : text.includes(' ' + variant.text + ' ')));
        return { critere: group.critere, maximum: group.points, trouve: Boolean(found) };
    });
    const found = resultats_criteres.filter(row => row.trouve);
    const proposed = found.length ? sumPoints(found.map(row => row.maximum)) : null;
    return { etat: !response.trim() ? 'sans_reponse' : 'a_examiner', raison: 'mots_cles', maximum,
        points_proposes: response.trim() ? proposed : null, maximum_verifie: 0, resultats_criteres };
}
