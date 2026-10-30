const keys = ['etablissement', 'matiere', 'classe'];
export function lessonsInScope(catalogue, scope) {
    return scope ? catalogue.filter(lesson => keys.every(key => lesson[key] === scope[key])) : [];
}
export function initialCourseScope(assignments, catalogue, query) {
    const candidates = assignments.filter(scope => keys.every(key => !query.has(key) || query.get(key) === scope[key]));
    return candidates.find(scope => lessonsInScope(catalogue, scope).length) || candidates[0] || null;
}
