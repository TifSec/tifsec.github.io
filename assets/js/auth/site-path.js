// Le même site fonctionne à la racine et sous une adresse de test GitHub Pages.
const basePath = /^https?:/.test(import.meta.url || '') ? new URL('../../../', import.meta.url).pathname.replace(/\/$/, '') : '';

export function sitePath(path) {
    if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//')) throw new Error('invalid_site_path');
    return basePath + path;
}
