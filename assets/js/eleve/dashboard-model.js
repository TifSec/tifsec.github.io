const identityKeys = ['etablissement', 'matiere', 'classe', 'seance'];
export const lessonIdentity = row => JSON.stringify(identityKeys.map(key => row[key]));

export function dashboardModel({ catalogue, profile, copies, answers, feedback, evaluations = [], userId }) {
    const byLesson = new Map();
    for (const copy of copies) {
        const key = lessonIdentity(copy);
        const selected = byLesson.get(key);
        // Les RLS n’autorisent que les groupes acceptés ; le collectif remplace l’individuel historique.
        if (!selected || (copy.max_members > 1 && selected.max_members === 1)) byLesson.set(key, copy);
        else if (copy.max_members > 1 && selected.max_members > 1) throw new Error('ambiguous_copy');
    }
    const counts = new Map();
    for (const answer of answers) {
        if (typeof answer.reponse === 'string' && answer.reponse.trim()) {
            const key = String(answer.work_session_id);
            counts.set(key, (counts.get(key) || 0) + 1);
        }
    }
    const lessons = catalogue.filter(lesson => (lesson.etablissement === profile.etablissement && lesson.classe === profile.classe) || byLesson.has(lessonIdentity(lesson)))
        .map(lesson => {
            if (typeof lesson.url !== 'string' || !lesson.url.startsWith('/') || lesson.url.startsWith('//') || /[\\\s]/.test(lesson.url)) throw new Error('invalid_url');
            const copy = byLesson.get(lessonIdentity(lesson));
            const count = counts.get(String(copy?.id)) || 0;
            const comments = copy ? feedback.filter(row => String(row.work_session_id) === String(copy.id) && row.commentaire?.trim()).map(row => row.commentaire) : [];
            const grade = copy?.terminee && copy.current_evaluation_id ? evaluations.find(row =>
                String(row.id) === String(copy.current_evaluation_id) && String(row.work_session_id) === String(copy.id) &&
                userId && row.recipient_ids?.includes(userId)) : null;
            if (grade && (grade.total === null || !Number.isFinite(Number(grade.total)) || Number(grade.total) < 0 || Number(grade.total) > 20)) throw new Error('invalid_grade');
            return { ...lesson, copy, count, comments, grade: grade || null, previousClass: lesson.etablissement !== profile.etablissement || lesson.classe !== profile.classe,
                state: copy?.terminee || copy?.submitted_at ? 'finished' : count > 0 ? 'started' : 'new' };
        });
    return { lessons, started: lessons.filter(row => row.state === 'started').length,
        finished: lessons.filter(row => row.state === 'finished').length,
        corrected: lessons.filter(row => row.grade).length,
        withFeedback: lessons.filter(row => row.comments.length).length };
}

export async function readDashboard(db, { grades = false, submission = false, competencies = false } = {}) {
    async function all(table, columns, order) {
        const rows = [];
        for (let offset = 0; ; offset += 500) {
            let query = db.from(table).select(columns);
            for (const key of order) query = query.order(key);
            const result = await query.range(offset, offset + 499);
            if (result.error || !Array.isArray(result.data)) throw new Error('dashboard_unavailable');
            rows.push(...result.data);
            if (result.data.length < 500) return rows;
        }
    }
    // Lecture seule avec le client de l’élève : les politiques existantes restent l’autorité.
    const columns = 'id,etablissement,matiere,classe,seance,max_members,terminee' + (grades ? ',current_evaluation_id' + (competencies ? ',course_version' : '') : '') + (submission ? ',submitted_at' : '');
    let copies = await all('work_sessions', columns, ['id']);
    const [answers, feedback, evaluations] = await Promise.all([
        all('work_answers', 'id,work_session_id,reponse', ['id']),
        all('work_feedback', 'work_session_id,teacher_id,commentaire', ['work_session_id', 'teacher_id']),
        grades && copies.some(copy => copy.terminee && copy.current_evaluation_id) ?
            all('work_evaluations', 'id,work_session_id,total,recipient_ids' + (competencies ? ',course_version,marks' : ''), ['id']) : []
    ]);
    // Recontrôler les références après la lecture des notes : une réouverture les retire.
    if (evaluations.length) copies = await all('work_sessions', columns, ['id']);
    return { copies, answers, feedback, evaluations };
}
