import { privateCatalogue } from './catalogue.mjs';
import { readPrivateYaml } from './yaml-reader.mjs';

const fields = ['etablissement', 'matiere', 'classe', 'seance', 'version'];
export class AccessError extends Error {
    constructor(status, code) { super(code); this.status = status; this.code = code; }
}
export async function boundedText(response, maximum) {
    if (Number(response.headers.get('content-length')) > maximum) throw new AccessError(503, 'unavailable');
    const reader = response.body?.getReader();
    if (!reader) return '';
    const chunks = [];
    let size = 0;
    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            size += value.byteLength;
            if (size > maximum) throw new AccessError(503, 'unavailable');
            chunks.push(value);
        }
    } finally { await reader.cancel().catch(() => {}); }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}

export function createPrivateCourseHandler({ env, fetch: fetcher = fetch, parseDocument, catalogue = privateCatalogue }) {
    return async request => {
        const origin = request.headers.get('origin');
        const origins = (env('COURSES_ALLOWED_ORIGINS') || '').split(',').map(item => item.trim()).filter(Boolean);
        const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'private, no-store, max-age=0',
            'Pragma': 'no-cache', 'Vary': 'Origin', 'X-Content-Type-Options': 'nosniff' };
        if (origin && origins.includes(origin)) Object.assign(headers, { 'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info', 'Access-Control-Allow-Methods': 'POST, OPTIONS' });
        const reply = (status, data) => new Response(JSON.stringify(data), { status, headers });
        if (origin && !origins.includes(origin)) return reply(403, { error: 'forbidden' });
        if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
        if (request.method !== 'POST') return reply(405, { error: 'method_not_allowed' });
        try {
            const authorization = request.headers.get('authorization') || '';
            if (!/^Bearer [A-Za-z0-9._-]+$/.test(authorization) || authorization.length > 8192) throw new AccessError(401, 'unauthenticated');
            const input = JSON.parse(await boundedText(request, 4096));
            if (!input || Array.isArray(input) || Object.keys(input).some(key => !fields.includes(key)) || fields.some(key => typeof input[key] !== 'string' || input[key].length > 80)) throw new AccessError(400, 'invalid_request');
            const lesson = catalogue.find(row => fields.every(key => row[key] === input[key]));
            if (!lesson) throw new AccessError(404, 'course_unavailable');
            const supabaseUrl = env('SUPABASE_URL');
            const apiKey = env('COURSES_SUPABASE_PUBLISHABLE_KEY') || env('SUPABASE_ANON_KEY');
            if (!supabaseUrl?.startsWith('https://') || !apiKey) throw new AccessError(503, 'unavailable');
            const signal = AbortSignal.timeout(12000);
            async function get(url, options, limit = 262144) {
                const response = await fetcher(url, { ...options, signal, redirect: 'error', cache: 'no-store' });
                if (!response.ok) throw new AccessError(response.status === 401 ? 401 : 503, response.status === 401 ? 'unauthenticated' : 'unavailable');
                return boundedText(response, limit);
            }
            const authHeaders = { apikey: apiKey, Authorization: authorization };
            const user = JSON.parse(await get(supabaseUrl + '/auth/v1/user', { headers: authHeaders }, 65536));
            if (typeof user.id !== 'string' || !/^[a-f0-9-]{36}$/i.test(user.id) || user.is_anonymous === true) throw new AccessError(401, 'unauthenticated');
            const profileQuery = new URLSearchParams({ select: 'role', user_id: 'eq.' + user.id });
            const profiles = JSON.parse(await get(supabaseUrl + '/rest/v1/profiles?' + profileQuery, { headers: authHeaders }));
            if (!Array.isArray(profiles) || profiles.length !== 1 || profiles[0].role !== 'teacher') throw new AccessError(403, 'forbidden');
            const scopeQuery = new URLSearchParams({ select: 'teacher_id', teacher_id: 'eq.' + user.id,
                etablissement: 'eq.' + lesson.etablissement, matiere: 'eq.' + lesson.matiere, classe: 'eq.' + lesson.classe });
            const assignments = JSON.parse(await get(supabaseUrl + '/rest/v1/teacher_class_assignments?' + scopeQuery, { headers: authHeaders }));
            if (!Array.isArray(assignments) || assignments.length !== 1 || assignments[0].teacher_id !== user.id) throw new AccessError(403, 'forbidden');
            const token = env('COURSES_GITHUB_TOKEN');
            const owner = env('COURSES_GITHUB_OWNER');
            const repo = env('COURSES_GITHUB_REPO');
            const ref = env('COURSES_GITHUB_REF');
            if (!token || !/^[A-Za-z0-9-]+$/.test(owner || '') || !/^[A-Za-z0-9_.-]+$/.test(repo || '') || !ref) throw new AccessError(503, 'not_configured');
            const repoUrl = 'https://api.github.com/repos/' + owner + '/' + repo;
            const githubHeaders = { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
            const metadata = JSON.parse(await get(repoUrl, { headers: githubHeaders }));
            if (metadata.private !== true) throw new AccessError(503, 'unavailable');
            const path = lesson.path.split('/').map(encodeURIComponent).join('/');
            const yaml = await get(repoUrl + '/contents/' + path + '?ref=' + encodeURIComponent(ref), { headers: { ...githubHeaders, Accept: 'application/vnd.github.raw+json' } });
            const content = readPrivateYaml(yaml, parseDocument, lesson);
            return reply(200, { content });
        } catch (error) {
            // Ne jamais journaliser les réponses, les fichiers privés, les jetons ou l’erreur distante.
            if (error instanceof AccessError) return reply(error.status, { error: error.code });
            return reply(error instanceof SyntaxError ? 400 : 503, { error: error instanceof SyntaxError ? 'invalid_request' : 'unavailable' });
        }
    };
}
