/* ========== COPIES ET RÉPONSES INDIVIDUELLES ========== */

export class WorkError extends Error {
    constructor(code) {
        super(code);
        this.code = code;
    }
}

function checkAnswer(row) {
    if (!row || typeof row.question_key !== "string" || typeof row.reponse !== "string" ||
        !Number.isSafeInteger(Number(row.revision)) || Number(row.revision) < 0) {
        throw new WorkError("invalid_data");
    }
    return { key: row.question_key, value: row.reponse, revision: Number(row.revision) };
}

export function createWorkRepository(db) {
    const copyColumns = "id, terminee";
    const answerColumns = "question_key, reponse, revision";

    async function findCopy(userId, course, columns = copyColumns) {
        return db.from("work_sessions").select(columns)
            .eq("created_by", userId).eq("etablissement", course.etablissement)
            .eq("matiere", course.matiere).eq("classe", course.classe)
            .eq("seance", course.seance).eq("max_members", 1).maybeSingle();
    }

    return {
        async submitCopy(copyId, revisions) {
            const result = await db.rpc('refonte_submit_copy', { p_copy: copyId, p_revisions: revisions });
            if (result.error) throw new WorkError(result.error.code === '40001' ? 'conflict' : 'submit_failed');
            if (result.data !== true) throw new WorkError('submit_failed');
        },
        async loadCopy(userId, course, keys, copyId = null, options = {}) {
            const columns = copyColumns + (options.submission ? ',submitted_at' : '');
            if (options.collaborative && !copyId && !options.history) {
                const groups = await db.rpc('refonte_my_groups', { p_school: course.etablissement, p_subject: course.matiere,
                    p_class: course.classe, p_lesson: course.seance });
                if (groups.error || !Array.isArray(groups.data) || groups.data.length > 1) throw new WorkError('load_failed');
                if (groups.data.length) copyId = String(groups.data[0].copy_id);
            }
            if (copyId !== null && !/^[1-9][0-9]*$/.test(String(copyId))) throw new WorkError("load_failed");
            let result = copyId === null ? await findCopy(userId, course, columns) : await db.from("work_sessions").select(columns)
                .eq("id", copyId).eq("etablissement", course.etablissement).eq("matiere", course.matiere)
                .eq("classe", course.classe).eq("seance", course.seance).gt("max_members", 1).maybeSingle();
            if (result.error) {
                throw new WorkError("load_failed");
            }
            if (!result.data && options.history) throw new WorkError('history_missing');
            if (!result.data && copyId === null && !options.history) {
                result = await db.from("work_sessions").insert({
                    created_by: userId, etablissement: course.etablissement,
                    matiere: course.matiere, classe: course.classe, seance: course.seance, max_members: 1
                }).select(columns).single();
                if (result.error?.code === "23505") {
                    result = await findCopy(userId, course, columns);
                }
            }
            if (result.error || !result.data || !/^[1-9][0-9]*$/.test(String(result.data.id)) ||
                (typeof result.data.id === "number" && !Number.isSafeInteger(result.data.id)) ||
                typeof result.data.terminee !== "boolean") {
                throw new WorkError("load_failed");
            }
            const copy = result.data;
            const answers = await db.from("work_answers").select(answerColumns)
                .eq("work_session_id", copy.id).in("question_key", keys);
            if (answers.error || !Array.isArray(answers.data)) {
                throw new WorkError("load_failed");
            }
            const rows = answers.data.map(checkAnswer);
            if (new Set(rows.map(row => row.key)).size !== rows.length || rows.some(row => !keys.includes(row.key))) {
                throw new WorkError("invalid_data");
            }
            return { id: copy.id, locked: copy.terminee || Boolean(options.history), answers: rows,
                group: copyId !== null, history: Boolean(options.history), submitted: Boolean(copy.submitted_at) };
        },

        async saveAnswer(copyId, key, value, revision) {
            if (typeof value !== "string" || value.length > 20000) {
                throw new WorkError("invalid_answer");
            }
            let result;
            if (revision === null) {
                result = await db.from("work_answers").insert({ work_session_id: copyId, question_key: key, reponse: value })
                    .select(answerColumns).single();
            } else {
                result = await db.from("work_answers").update({ reponse: value })
                    .eq("work_session_id", copyId).eq("question_key", key).eq("revision", revision)
                    .select(answerColumns).maybeSingle();
            }
            if (result.error?.code === "23505" || (!result.error && !result.data)) {
                throw new WorkError("conflict");
            }
            if (result.error) {
                throw new WorkError("save_failed");
            }
            const answer = checkAnswer(result.data);
            if (answer.key !== key || answer.value !== value || (revision !== null && answer.revision <= revision)) {
                throw new WorkError("invalid_data");
            }
            return answer;
        }
    };
}
