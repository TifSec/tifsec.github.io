// Liste des séances et structure des questions (sans aucune réponse), lues sur le site publié :
// ajouter une séance au site suffit, sans redéployer les fonctions.
// Le fichier est produit par _checks/export-question-catalogue.mjs --write.
import { AccessError, boundedText } from './http.mjs';

export const CATALOGUE_PATH = '/assets/data/questions-seances.json';
const identity = ['etablissement', 'matiere', 'classe', 'seance', 'version'];
const segment = /^[A-Za-z0-9_-]{1,40}$/;
const cache = new Map();

export function validateCatalogue(value) {
    if (!Array.isArray(value) || value.length === 0 || value.length > 2000) throw new AccessError(503, 'unavailable');
    const seen = new Set();
    for (const row of value) {
        if (!row || typeof row !== 'object' || identity.some(key => typeof row[key] !== 'string' || !segment.test(row[key])) || !Array.isArray(row.questions))
            throw new AccessError(503, 'unavailable');
        const key = identity.slice(0, 4).map(name => row[name]).join('/');
        if (seen.has(key)) throw new AccessError(503, 'unavailable');
        seen.add(key);
    }
    return value;
}

// Chemin du fichier privé (corrigé, préparation) d'une séance dans le dépôt privé.
export function privatePath(lesson) {
    if (identity.some(key => typeof lesson[key] !== 'string' || !segment.test(lesson[key]))) throw new AccessError(404, 'course_unavailable');
    return lesson.matiere + '/' + lesson.classe + '/' + lesson.seance + '.' + lesson.version + '.yml';
}

export function siteCatalogue({ env, fetch: fetcher = fetch, ttl = 300000, now = Date.now }) {
    return async () => {
        const base = (env('COURSES_SITE_URL') || '').replace(/\/+$/, '');
        if (!/^https:\/\/[a-z0-9.-]+(\/[A-Za-z0-9_-]+)*$/.test(base)) throw new AccessError(503, 'not_configured', 'adresse du site refusée (' + base.length + ' caractères)');
        const url = base + CATALOGUE_PATH;
        const hit = cache.get(url);
        if (hit && now() - hit.at < ttl) return hit.value;
        let response;
        try { response = await fetcher(url, { redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(10000) }); }
        catch (error) { throw new AccessError(503, 'unavailable', url + ' : ' + (error?.name || 'erreur réseau')); }
        if (!response.ok) throw new AccessError(503, 'unavailable', url + ' : HTTP ' + response.status);
        let value;
        try { value = validateCatalogue(JSON.parse(await boundedText(response, 4194304))); }
        catch (error) { throw error instanceof AccessError ? new AccessError(error.status, error.code, url + ' : liste invalide') : new AccessError(503, 'unavailable', url + ' : JSON illisible'); }
        cache.set(url, { at: now(), value });
        return value;
    };
}

// Accepte une liste fixe (tests), une fonction asynchrone, ou rien (lecture sur le site).
export function catalogueGetter(catalogue, fallback) {
    if (Array.isArray(catalogue)) return async () => catalogue;
    if (typeof catalogue === 'function') return catalogue;
    let getter;
    return () => (getter ||= fallback())();
}
