import { createTeacherCorrectionHandler } from '../teacher-correction/handler.mjs';
import { boundedText, AccessError } from '../teacher-course/handler.mjs';
import { checkQuestion, sumPoints } from '../_shared/deterministic-checker.mjs';

export function validateMarks(input, proposal) {
    if (input.course_version !== proposal.cours.version || input.correction_fingerprint !== proposal.empreinte_corrige ||
        JSON.stringify(input.answer_revisions) !== JSON.stringify(proposal.revisions_reponses)) throw new AccessError(409, 'proposal_changed');
    if (!proposal.bareme_complet || proposal.maximum_total !== 20 || !Array.isArray(input.marks) || input.marks.length !== proposal.resultats.length) throw new AccessError(400, 'invalid_marks');
    const allowed = new Map(proposal.resultats.map(row => [row.cle, row])), seen = new Set();
    const marks = input.marks.map(row => {
        if (!row || !allowed.has(row.cle) || Object.keys(row).length !== (allowed.get(row.cle).resultats_cellules ? 5 : 4) || seen.has(row.cle) ||
            row.maximum !== allowed.get(row.cle).maximum || typeof row.points !== 'number' || !Number.isFinite(row.points) || row.points < 0 || row.points > row.maximum ||
            typeof row.commentaire !== 'string' || row.commentaire.length > 2000) throw new AccessError(400, 'invalid_marks');
        checkQuestion({ question: { type: 'texte' }, correction: { points: row.points }, reponse: '' });
        let details;
        const cells = allowed.get(row.cle).resultats_cellules;
        if (cells) {
            if (!Array.isArray(row.details) || row.details.length !== cells.length) throw new AccessError(400, 'cell_marks_required');
            const cellMaxima = new Map(cells.map(cell => [cell.champ, cell.maximum])), cellKeys = new Set();
            details = row.details.map(cell => {
                if (!cell || Object.keys(cell).length !== 3 || !cellMaxima.has(cell.cle) || cellKeys.has(cell.cle) || cell.maximum !== cellMaxima.get(cell.cle) ||
                    typeof cell.points !== 'number' || !Number.isFinite(cell.points) || cell.points < 0 || cell.points > cell.maximum) throw new AccessError(400, 'invalid_cell_marks');
                checkQuestion({ question: { type: 'texte' }, correction: { points: cell.points }, reponse: '' });
                cellKeys.add(cell.cle); return { cle: cell.cle, points: cell.points, maximum: cell.maximum };
            });
            if (sumPoints(details.map(cell => cell.points)) !== row.points || sumPoints(details.map(cell => cell.maximum)) !== row.maximum) throw new AccessError(400, 'cell_total_mismatch');
        }
        seen.add(row.cle); return { cle: row.cle, points: row.points, maximum: row.maximum, commentaire: row.commentaire, ...(details ? { details } : {}) };
    });
    return { marks, total: sumPoints(marks.map(row => row.points)) };
}

export function createTeacherGradeHandler({ env, fetch: fetcher = fetch, parseDocument, correctionHandler }) {
    const correction = correctionHandler || createTeacherCorrectionHandler({ env, fetch: fetcher, parseDocument });
    return async request => {
        const origin = request.headers.get('origin');
        const origins = (env('COURSES_ALLOWED_ORIGINS') || '').split(',').map(value => value.trim());
        const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'private, no-store, max-age=0', 'Pragma': 'no-cache', 'Vary': 'Origin', 'X-Content-Type-Options': 'nosniff' };
        if (origin && origins.includes(origin)) Object.assign(headers, { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info', 'Access-Control-Allow-Methods': 'POST, OPTIONS' });
        const reply = (status, body) => new Response(JSON.stringify(body), { status, headers });
        if (origin && !origins.includes(origin)) return reply(403, { error: 'forbidden' });
        if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
        if (request.method !== 'POST') return reply(405, { error: 'method_not_allowed' });
        try {
            const authorization = request.headers.get('authorization') || '';
            if (!/^Bearer [A-Za-z0-9._-]+$/.test(authorization) || authorization.length > 8192) throw new AccessError(401, 'unauthenticated');
            const input = JSON.parse(await boundedText(request, 1048576));
            const keys = ['copy_id', 'marks', 'course_version', 'correction_fingerprint', 'answer_revisions'];
            if (!input || Object.keys(input).some(key => ![...keys, 'general_comment'].includes(key)) || keys.some(key => !Object.hasOwn(input, key)) ||
                (input.general_comment !== undefined && (typeof input.general_comment !== 'string' || input.general_comment.length > 20000)) ||
                !['string','number'].includes(typeof input.copy_id) || !/^[1-9][0-9]{0,18}$/.test(String(input.copy_id)) ||
                (typeof input.copy_id === 'number' && !Number.isSafeInteger(input.copy_id))) throw new AccessError(400, 'invalid_request');
            const copyId = String(input.copy_id);
            const checked = await correction(new Request(request.url, { method: 'POST', headers: { authorization, ...(origin ? { origin } : {}) }, body: JSON.stringify({ copy_id: copyId }) }));
            if (!checked.ok) throw new AccessError(checked.status, 'correction_unavailable');
            const proposal = (await checked.json()).proposition;
            const { marks, total } = validateMarks(input, proposal);
            const base = env('SUPABASE_URL'), key = env('COURSES_SUPABASE_PUBLISHABLE_KEY') || env('SUPABASE_ANON_KEY');
            if (!base?.startsWith('https://') || !key) throw new AccessError(503, 'unavailable');
            async function read(path, options = {}) {
                const response = await fetcher(base + path, { ...options, headers: { apikey: key, Authorization: authorization, ...options.headers },
                    signal: AbortSignal.timeout(20000), redirect: 'error', cache: 'no-store' });
                if (!response.ok) {
                    let code; try { code = JSON.parse(await boundedText(response, 8192)).code; } catch {}
                    throw new AccessError(code === '40001' ? 409 : [401,403].includes(response.status) ? response.status : 503, 'validation_failed');
                }
                return JSON.parse(await boundedText(response, 65536));
            }
            const copies = await read('/rest/v1/work_sessions?' + new URLSearchParams({ select: 'id,course_version,current_evaluation_id', id: 'eq.' + copyId }));
            if (!Array.isArray(copies) || copies.length !== 1 || String(copies[0].id) !== copyId) throw new AccessError(403, 'copy_unavailable');
            if (copies[0].course_version !== proposal.cours.version || copies[0].current_evaluation_id !== null) throw new AccessError(409, 'reopen_required');
            const evaluation = await read('/rest/v1/rpc/refonte_validate_grade', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
                p_copy: copyId, p_version: proposal.cours.version, p_fingerprint: proposal.empreinte_corrige,
                p_revisions: proposal.revisions_reponses, p_marks: marks, p_expected: null, p_comment: input.general_comment ?? null }) });
            if (!['string','number'].includes(typeof evaluation) || !/^[1-9][0-9]*$/.test(String(evaluation)) ||
                (typeof evaluation === 'number' && !Number.isSafeInteger(evaluation))) throw new AccessError(503, 'validation_unconfirmed');
            return reply(200, { validated: true, copy_id: copyId, evaluation_id: String(evaluation), total, marks, saved_feedback: input.general_comment ?? null });
        } catch (error) {
            // Ne journaliser ni copies, ni corrigés, ni commentaires.
            if (error instanceof AccessError) return reply(error.status, { error: error.code });
            return reply(error instanceof SyntaxError ? 400 : 503, { error: error instanceof SyntaxError ? 'invalid_request' : 'validation_unavailable' });
        }
    };
}
