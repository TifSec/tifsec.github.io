// Calcul pur : aucun accès réseau, aucune écriture, aucun attendu dans les résultats.
// Les règles viennent du fichier professeur privé, jamais d’un score fourni par l’élève.
export class CorrectionRuleError extends Error {
    constructor(code) { super(code); this.name = 'CorrectionRuleError'; this.code = code; }
}
const fail = code => { throw new CorrectionRuleError(code); };
const MAX_DIGITS = 100;
const MAX_QUESTIONS = 1000;
const power = scale => 10n ** BigInt(scale);

function normalize(decimal) {
    let { coefficient, scale } = decimal;
    while (scale > 0 && coefficient % 10n === 0n) { coefficient /= 10n; scale--; }
    return { coefficient, scale };
}
function decimalFromText(text) {
    if (typeof text !== 'string' || text.length > 256) return null;
    const value = text.trim().replace(/[\u00a0\u202f]/g, ' ').replace(/^−/, '-');
    if (!/^[+-]?(?:(?:\d+|\d{1,3}(?: \d{3})+)(?:[.,]\d+)?|[.,]\d+)$/.test(value)) return null;
    const canonical = value.replaceAll(' ', '').replace(',', '.');
    const [whole, fraction = ''] = canonical.replace(/^[+-]/, '').split('.');
    const digits = (whole || '0') + fraction;
    if (digits.length > MAX_DIGITS || fraction.length > MAX_DIGITS) return null;
    const sign = canonical.startsWith('-') ? -1n : 1n;
    return normalize({ coefficient: sign * BigInt(digits), scale: fraction.length });
}
function decimalFromRule(value, code) {
    let text;
    if (typeof value === 'number') {
        if (!Number.isFinite(value) || (Number.isInteger(value) && !Number.isSafeInteger(value))) fail(code);
        text = String(value);
        // Les petits nombres YAML peuvent être sérialisés avec un exposant par JavaScript.
        const scientific = text.match(/^(-?)(\d+)(?:\.(\d+))?e([+-]?\d+)$/i);
        if (scientific) {
            const digits = scientific[2] + (scientific[3] || '');
            const position = scientific[2].length + Number(scientific[4]);
            if (Math.abs(position) > MAX_DIGITS) fail(code);
            text = scientific[1] + (position <= 0 ? '0.' + '0'.repeat(-position) + digits :
                position >= digits.length ? digits + '0'.repeat(position - digits.length) : digits.slice(0, position) + '.' + digits.slice(position));
        }
    } else if (typeof value === 'string') text = value;
    else fail(code);
    const decimal = decimalFromText(text);
    if (!decimal) fail(code);
    return decimal;
}
function align(decimal, scale) { return decimal.coefficient * power(scale - decimal.scale); }
function rounded(decimal, places) {
    if (decimal.scale <= places) return decimal;
    const factor = power(decimal.scale - places);
    const sign = decimal.coefficient < 0n ? -1n : 1n;
    const absolute = decimal.coefficient * sign;
    let coefficient = absolute / factor;
    if ((absolute % factor) * 2n >= factor) coefficient++;
    return normalize({ coefficient: coefficient * sign, scale: places });
}
function pointsOf(rule) {
    if (rule?.points === undefined) return null;
    const points = decimalFromRule(rule.points, 'invalid_points');
    if (points.coefficient < 0n || points.scale > 6 || points.coefficient > 10000n * power(points.scale)) fail('invalid_points');
    return Number(points.coefficient) / 10 ** points.scale;
}
function numericRule(rule) {
    let expected = decimalFromRule(rule.attendu, 'invalid_expected_number');
    const tolerance = decimalFromRule(rule.tolerance_absolue === undefined ? 0 : rule.tolerance_absolue, 'invalid_tolerance');
    if (tolerance.coefficient < 0n) fail('invalid_tolerance');
    const places = rule.arrondi_decimales;
    if (places !== undefined) {
        if (!Number.isInteger(places) || places < 0 || places > 12) fail('invalid_rounding');
        expected = rounded(expected, places);
    }
    const unit = rule.unite_attendue;
    if (unit !== undefined && (typeof unit !== 'string' || !unit.trim() || unit.length > 30 || unit !== unit.trim())) fail('invalid_unit');
    if (rule.unite_obligatoire !== undefined && typeof rule.unite_obligatoire !== 'boolean') fail('invalid_unit');
    if (rule.unite_obligatoire && !unit) fail('invalid_unit');
    return { expected, tolerance, places, unit };
}
function qcmRule(question, rule) {
    if (!Array.isArray(question.choix) || !question.choix.length || question.choix.length > 1000) fail('invalid_choices');
    const ids = question.choix.map(choice => choice?.id);
    if (ids.some(id => typeof id !== 'string' || !id || id !== id.trim() || id.length > 100) || new Set(ids).size !== ids.length) fail('invalid_choices');
    if (!Array.isArray(rule.choix_attendus) || rule.choix_attendus.length !== 1 || !ids.includes(rule.choix_attendus[0])) fail('invalid_expected_choice');
    return { ids, expected: rule.choix_attendus[0] };
}

export function checkQuestion({ question, correction, reponse }) {
    if (!question || typeof question.type !== 'string') fail('invalid_question');
    if (correction !== undefined && (correction === null || typeof correction !== 'object' || Array.isArray(correction))) fail('invalid_rule');
    const maximum = pointsOf(correction);
    const result = (etat, raison) => ({ etat, raison, maximum,
        points_proposes: maximum === null ? null : etat === 'correcte' ? maximum : etat === 'incorrecte' ? 0 : null });
    const deterministic = correction?.mode === 'deterministe';
    if (correction?.mode !== undefined && !['deterministe', 'professeur'].includes(correction.mode)) fail('invalid_mode');
    const numeric = deterministic && question.type === 'nombre' ? numericRule(correction) : null;
    const qcm = deterministic && question.type === 'qcm' ? qcmRule(question, correction) : null;
    if (reponse === undefined || reponse === null || (typeof reponse === 'string' && !reponse.trim())) return result('sans_reponse', 'reponse_absente');
    if (!deterministic || (!numeric && !qcm)) return result('a_examiner', !correction ? 'regle_absente' : deterministic ? 'type_non_pris_en_charge' : 'correction_professeur');
    if (typeof reponse !== 'string' || reponse.length > 20000) return result('format_invalide', 'reponse_illisible');
    if (qcm) {
        const chosen = reponse.trim();
        if (!qcm.ids.includes(chosen)) return result('format_invalide', 'choix_inconnu');
        return result(chosen === qcm.expected ? 'correcte' : 'incorrecte', 'choix_verifie');
    }
    let value = reponse.trim();
    const hasUnit = numeric.unit && value.endsWith(numeric.unit);
    if (hasUnit) value = value.slice(0, -numeric.unit.length).trim();
    else if (correction.unite_obligatoire) return result('format_invalide', 'unite_absente_ou_incompatible');
    const parsed = decimalFromText(value);
    if (!parsed) return result('format_invalide', 'nombre_ou_unite_invalide');
    if (numeric.places !== undefined && parsed.scale > numeric.places) return result('format_invalide', 'arrondi_a_revoir');
    const scale = Math.max(parsed.scale, numeric.expected.scale, numeric.tolerance.scale);
    const difference = align(parsed, scale) - align(numeric.expected, scale);
    const distance = difference < 0n ? -difference : difference;
    return result(distance <= align(numeric.tolerance, scale) ? 'correcte' : 'incorrecte', 'nombre_verifie');
}

export function sumPoints(values) {
    // Six décimales maximum au barème ; somme entière pour éviter 0,1 + 0,2 = 0,300…
    const sum = values.reduce((total, value) => {
        const decimal = decimalFromRule(value, 'invalid_points');
        return total + align(decimal, 6);
    }, 0n);
    return Number(sum) / 1000000;
}
export function proposeCorrection(entries) {
    if (!Array.isArray(entries) || entries.length > MAX_QUESTIONS) fail('invalid_questions');
    const seen = new Set();
    const resultats = entries.map(entry => {
        if (!entry || typeof entry.cle !== 'string' || !entry.cle.trim() || entry.cle.length > 200 || seen.has(entry.cle)) fail('duplicate_or_missing_key');
        seen.add(entry.cle);
        return { cle: entry.cle, ...checkQuestion(entry) };
    });
    return summarizeCorrection(resultats);
}

export function summarizeCorrection(resultats) {
    // Les propositions par mots-clés restent « à examiner » : elles ne comptent pas dans la part vérifiée.
    const automatic = resultats.filter(row => row.points_proposes !== null && row.raison !== 'mots_cles');
    const pending = resultats.filter(row => !['correcte', 'incorrecte'].includes(row.etat) || row.points_proposes === null);
    const baremeComplet = resultats.length > 0 && resultats.every(row => row.maximum !== null);
    return {
        statut: 'proposition', validation_requise: true, note_finale: null, resultats,
        points_automatiques: sumPoints(automatic.map(row => row.points_proposes)),
        maximum_automatique: sumPoints(automatic.map(row => row.maximum_verifie ?? row.maximum)),
        maximum_a_examiner: sumPoints(pending.filter(row => row.maximum !== null).map(row => sumPoints([row.maximum, -(row.maximum_verifie || 0)]))),
        questions_a_examiner: pending.length, bareme_complet: baremeComplet,
        maximum_total: baremeComplet ? sumPoints(resultats.map(row => row.maximum)) : null
    };
}
