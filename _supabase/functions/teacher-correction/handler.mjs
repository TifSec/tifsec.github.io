import { AccessError, boundedText, createPrivateCourseHandler } from '../teacher-course/handler.mjs';
import { siteCatalogue, catalogueGetter } from '../_shared/site-catalogue.mjs';
import { prepareCopyProposal, answerSnapshot } from './proposal.mjs';

const identityKeys = ['etablissement', 'matiere', 'classe', 'seance'];
const copyColumns = ['id', ...identityKeys, 'max_members', 'terminee'];
export function createTeacherCorrectionHandler({ env, fetch: fetcher = fetch, parseDocument, catalogue, questionSchemas }) {
    // Par défaut, la liste des séances et la structure des questions sont lues sur le site publié.
    const fromSite = catalogueGetter(undefined, () => siteCatalogue({ env, fetch: fetcher }));
    const getCatalogue = catalogue ? catalogueGetter(catalogue) : fromSite;
    const getSchemas = questionSchemas ? catalogueGetter(questionSchemas) : fromSite;
    const privateHandler = createPrivateCourseHandler({ env, fetch: fetcher, parseDocument, catalogue: getCatalogue });
    return async request => {
        const origin = request.headers.get('origin');
        const origins = (env('COURSES_ALLOWED_ORIGINS') || '').split(',').map(value => value.trim()).filter(Boolean);
        const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'private, no-store, max-age=0', 'Pragma': 'no-cache', 'Vary': 'Origin', 'X-Content-Type-Options': 'nosniff' };
        if (origin && origins.includes(origin)) Object.assign(headers, { 'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info', 'Access-Control-Allow-Methods': 'POST, OPTIONS' });
        const reply = (status, value) => new Response(JSON.stringify(value), { status, headers });
        if (origin && !origins.includes(origin)) return reply(403, { error: 'forbidden' });
        if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
        if (request.method !== 'POST') return reply(405, { error: 'method_not_allowed' });
        try {
            const authorization = request.headers.get('authorization') || '';
            if (!/^Bearer [A-Za-z0-9._-]+$/.test(authorization) || authorization.length > 8192) throw new AccessError(401, 'unauthenticated');
            const input = JSON.parse(await boundedText(request, 4096));
            if (!input || Object.keys(input).length !== 1 || !Object.hasOwn(input, 'copy_id') ||
                !['string', 'number'].includes(typeof input.copy_id) || !/^[1-9][0-9]*$/.test(String(input.copy_id)) || String(input.copy_id).length > 19 ||
                (typeof input.copy_id === 'number' && !Number.isSafeInteger(input.copy_id))) throw new AccessError(400, 'invalid_request');
            const copyId = String(input.copy_id);
            const baseUrl = env('SUPABASE_URL'), apiKey = env('COURSES_SUPABASE_PUBLISHABLE_KEY') || env('SUPABASE_ANON_KEY');
            if (!baseUrl?.startsWith('https://') || !apiKey) throw new AccessError(503, 'unavailable');
            const authHeaders = { apikey: apiKey, Authorization: authorization };
            const signal = AbortSignal.timeout(25000);
            async function read(path, options = {}, count = false) {
                const response = await fetcher(baseUrl + path, { ...options, headers: { ...authHeaders, ...options.headers },
                    signal, redirect: 'error', cache: 'no-store' });
                if (!response.ok) throw new AccessError([401, 403].includes(response.status) ? response.status : 503, 'unavailable');
                const data = JSON.parse(await boundedText(response, 2097152));
                if (count) {
                    const total = response.headers.get('content-range')?.match(/\/(\d+)$/)?.[1];
                    if (!Array.isArray(data) || total === undefined || Number(total) !== data.length || data.length > 1000) throw new AccessError(503, 'incomplete_answers');
                }
                return data;
            }
            const user = await read('/auth/v1/user');
            if (typeof user.id !== 'string' || !/^[a-f0-9-]{36}$/i.test(user.id) || user.is_anonymous === true) throw new AccessError(401, 'unauthenticated');
            const profiles = await read('/rest/v1/profiles?' + new URLSearchParams({ select: 'role', user_id: 'eq.' + user.id }));
            if (!Array.isArray(profiles) || profiles.length !== 1 || profiles[0].role !== 'teacher') throw new AccessError(403, 'forbidden');
            async function readCopy() {
                const rows = await read('/rest/v1/work_sessions?' + new URLSearchParams({ select: copyColumns.join(','), id: 'eq.' + copyId }));
                if (!Array.isArray(rows) || rows.length !== 1 || String(rows[0].id) !== copyId ||
                    (typeof rows[0].id === 'number' && !Number.isSafeInteger(rows[0].id)) || typeof rows[0].terminee !== 'boolean' || ![1, 2, 3].includes(rows[0].max_members)) throw new AccessError(403, 'copy_unavailable');
                return rows[0];
            }
            const copy = await readCopy();
            const candidates = (await getCatalogue()).filter(row => identityKeys.every(key => row[key] === copy[key]));
            if (candidates.length !== 1) throw new AccessError(409, 'course_version_unavailable');
            const lesson = candidates[0];
            const questionSchema = (await getSchemas()).find(row => [...identityKeys, 'version'].every(key => row[key] === lesson[key]));
            if (!questionSchema) throw new AccessError(409, 'course_version_unavailable');
            async function requireReferenceCopy() {
                const rows = await read('/rest/v1/rpc/refonte_teacher_copies?' + new URLSearchParams({ select: 'copy_id,is_history', copy_id: 'eq.' + copyId }), {
                    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
                        p_school: copy.etablissement, p_subject: copy.matiere, p_class: copy.classe, p_lesson: copy.seance, p_history: false }) });
                if (!Array.isArray(rows) || rows.length !== 1 || String(rows[0].copy_id) !== copyId || rows[0].is_history !== false) throw new AccessError(409, 'reference_copy_required');
            }
            await requireReferenceCopy();
            const answerPath = '/rest/v1/work_answers?' + new URLSearchParams({ select: 'question_key,reponse,revision', work_session_id: 'eq.' + copyId, order: 'question_key.asc', limit: '1001' });
            const rows = await read(answerPath, { headers: { Prefer: 'count=exact' } }, true);
            const snapshot = answerSnapshot(rows, questionSchema);
            // Réutiliser le contrôle existant du rôle, des affectations et du dépôt GitHub privé.
            const privateResponse = await privateHandler(new Request(request.url, { method: 'POST', headers: { authorization, ...(origin ? { origin } : {}) },
                body: JSON.stringify(Object.fromEntries([...identityKeys, 'version'].map(key => [key, lesson[key]]))) }));
            if (!privateResponse.ok) throw new AccessError(privateResponse.status, 'private_course_unavailable');
            const { content } = await privateResponse.json();
            const proposition = prepareCopyProposal(questionSchema, content, rows);
            const fresh = await read(answerPath, { headers: { Prefer: 'count=exact' } }, true);
            const freshCopy = await readCopy();
            await requireReferenceCopy();
            if (JSON.stringify(snapshot) !== JSON.stringify(answerSnapshot(fresh, questionSchema)) ||
                JSON.stringify(rows) !== JSON.stringify(fresh) || copyColumns.some(key => String(copy[key]) !== String(freshCopy[key]))) throw new AccessError(409, 'copy_changed');
            const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(content)));
            const fingerprint = [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
            return reply(200, { proposition: { ...proposition, copy_id: copyId, cours: Object.fromEntries([...identityKeys, 'version'].map(key => [key, lesson[key]])),
                copie_terminee: copy.terminee, calcule_le: new Date().toISOString(), empreinte_corrige: fingerprint,
                version_moteur: '2', enregistree: false } });
        } catch (error) {
            // Aucune réponse élève, attendu ou erreur distante journalisée.
            if (error instanceof AccessError) return reply(error.status, { error: error.code });
            return reply(error instanceof SyntaxError ? 400 : 503, { error: error instanceof SyntaxError ? 'invalid_request' : 'correction_unavailable' });
        }
    };
}
