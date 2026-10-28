export function readPrivateYaml(source, parseDocument, lesson) {
    const document = parseDocument(source, { schema: 'core', uniqueKeys: true, customTags: [], merge: false, strict: true });
    if (document.errors.length || document.warnings.length) throw new Error('invalid_yaml');
    const value = document.toJS({ maxAliasCount: 0 });
    if (!value || Array.isArray(value) || typeof value !== 'object' || value.seance !== lesson.seance || value.version_cours !== lesson.version) throw new Error('version_mismatch');
    let nodes = 0;
    function check(item, depth = 0) {
        if (++nodes > 5000 || depth > 12) throw new Error('invalid_yaml');
        if (item === null || typeof item === 'boolean') return;
        if (typeof item === 'number' && Number.isFinite(item)) return;
        if (typeof item === 'string' && item.length <= 20000) return;
        if (Array.isArray(item) && item.length <= 1000) { item.forEach(child => check(child, depth + 1)); return; }
        if (item && typeof item === 'object' && Object.getPrototypeOf(item) === Object.prototype) {
            for (const [key, child] of Object.entries(item)) {
                if (['__proto__', 'prototype', 'constructor'].includes(key) || key.length > 100) throw new Error('invalid_yaml');
                check(child, depth + 1);
            }
            return;
        }
        throw new Error('invalid_yaml');
    }
    check(value);
    if (!value.preparation || typeof value.preparation !== 'object' || !Array.isArray(value.correction)) throw new Error('invalid_yaml');
    return value;
}
