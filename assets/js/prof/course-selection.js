const keys = ['etablissement', 'matiere', 'classe'];
export function lessonsInScope(catalogue, scope) {
    return scope ? catalogue.filter(lesson => keys.every(key => lesson[key] === scope[key])) : [];
}
export function initialCourseScope(assignments, catalogue, query) {
    const candidates = assignments.filter(scope => keys.every(key => !query.has(key) || query.get(key) === scope[key]));
    return candidates.find(scope => lessonsInScope(catalogue, scope).length) || candidates[0] || null;
}

// Classes déclarées dans _data/classes.yml : chaque classe n'apparaît que pour ses matières
// (ex. maths : 2de et Bac Pro 1 ; TIM : toutes les classes MFR sauf la terminale).
function classCatalogue() {
    try { return JSON.parse(globalThis.document?.getElementById?.('classes-data')?.textContent || '{}'); } catch { return {}; }
}
export function catalogueScopes(rows) {
    const allowed = new Set();
    for (const [school, data] of Object.entries(classCatalogue())) for (const entry of data?.classes || []) {
        allowed.add(school + '|*|' + entry.id);
        if (!Array.isArray(entry.matieres)) allowed.add(school + '|any|' + entry.id);
        for (const subject of entry.matieres || []) allowed.add(school + '|' + subject + '|' + entry.id);
    }
    if (!allowed.size) return rows;
    return (rows || []).filter(row => allowed.has(row.etablissement + '|any|' + row.classe) || allowed.has(row.etablissement + '|' + (row.matiere ?? '*') + '|' + row.classe));
}
export function classLabel(scope) {
    const school = classCatalogue()[scope.etablissement];
    const entry = school?.classes?.find(item => item.id === scope.classe);
    return (school?.nom || (scope.etablissement === 'college' ? 'Collège' : 'MFR')) + ' · ' + (entry?.nom || scope.classe);
}
