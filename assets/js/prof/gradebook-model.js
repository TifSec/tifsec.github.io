const sameScope = (a, b) => ['etablissement', 'matiere', 'classe'].every(key => a[key] === b[key]);
const id = value => String(value);
export function gradebookModel({ scope, catalogue, students, copies, members, evaluations }) {
    const sessions = copies.filter(copy => sameScope(copy, scope));
    const byCopy = new Map(sessions.map(copy => [id(copy.id), copy]));
    const recipients = new Map(sessions.map(copy => [id(copy.id), new Set(copy.max_members === 1 ? [copy.created_by] : [])]));
    for (const member of members) if ((!member.status || member.status==='accepted') && recipients.has(id(member.work_session_id))) recipients.get(id(member.work_session_id)).add(member.user_id);
    const grades = evaluations.filter(grade => byCopy.has(id(grade.work_session_id)));
    for (const grade of grades) if (grade.total === null || !Number.isFinite(Number(grade.total)) || Number(grade.total) < 0 || Number(grade.total) > 20 || !Array.isArray(grade.recipient_ids)) throw new Error('invalid_grade');
    const lessons = new Map(catalogue.filter(lesson => sameScope(lesson, scope)).map(lesson => [lesson.seance, lesson]));
    for (const copy of sessions) if (!lessons.has(copy.seance)) lessons.set(copy.seance, { ...scope, seance: copy.seance, titre: 'Séance ' + copy.seance });
    const lessonRows = [...lessons.values()].sort((a,b) => a.seance.localeCompare(b.seance,'fr',{numeric:true}));
    const pupils = students.filter(pupil => sameScope({ ...pupil, matiere: scope.matiere }, scope)).map(pupil => ({ ...pupil }));
    const known = new Set(pupils.map(pupil => pupil.user_id));
    let former = 0;
    for (const grade of grades) for (const userId of grade.recipient_ids) if (!known.has(userId)) {
        known.add(userId); pupils.push({ user_id: userId, prenom: 'Ancien élève '+(++former), nom: '', former: true });
    }
    pupils.sort((a,b) => Number(Boolean(a.former))-Number(Boolean(b.former)) || (a.nom+' '+a.prenom).localeCompare(b.nom+' '+b.prenom,'fr'));
    let validated = 0;
    const rows = pupils.map(pupil => ({ pupil, cells: lessonRows.map(lesson => {
        const personal = sessions.filter(copy => copy.seance === lesson.seance && recipients.get(id(copy.id)).has(pupil.user_id));
        const groups = personal.filter(copy => copy.max_members > 1), candidates = groups.length ? groups : personal;
        const history = grades.filter(grade => grade.recipient_ids.includes(pupil.user_id) && byCopy.get(id(grade.work_session_id)).seance === lesson.seance)
            .sort((a,b) => String(b.validated_at).localeCompare(String(a.validated_at)) || Number(b.id)-Number(a.id));
        const copy = candidates.length === 1 ? candidates[0] : null;
        const current = copy?.terminee ? history.find(grade => id(grade.id) === id(copy.current_evaluation_id) && id(grade.work_session_id) === id(copy.id)) : null;
        let state = 'missing';
        if (candidates.length > 1) state = 'ambiguous';
        else if (current) { state = 'validated'; validated++; }
        else if (copy) state = copy.submitted_at ? 'to_grade' : history.some(grade => id(grade.work_session_id) === id(copy.id)) ? 'reopened' : copy.terminee ? 'to_grade' : 'open';
        return { lesson, copy, current, history, state, collective: Boolean(copy && copy.max_members > 1) };
    }) }));
    return { lessons: lessonRows, rows, validated };
}

async function pages(query, order) {
    const rows=[];
    for(let start=0;;start+=500) {
        let page=query(); for(const key of order)page=page.order(key);
        const result=await page.range(start,start+499);
        if(result.error || !Array.isArray(result.data))throw new Error('gradebook_unavailable');
        rows.push(...result.data);if(result.data.length<500)return rows;
    }
}
async function batches(ids, read) {
    const rows=[];
    for(let start=0;start<ids.length;start+=100)rows.push(...await read(ids.slice(start,start+100)));
    return rows;
}
export async function readGradebook(db, scope, { submission = false } = {}) {
    const [roster,copies] = await Promise.all([
        db.rpc('refonte_students',{p_school:scope.etablissement,p_class:scope.classe}),
        pages(()=>db.from('work_sessions').select('id,etablissement,matiere,classe,seance,created_by,max_members,terminee,current_evaluation_id'+(submission?',submitted_at':''))
            .eq('etablissement',scope.etablissement).eq('matiere',scope.matiere).eq('classe',scope.classe),['id'])
    ]);
    if(roster.error || !Array.isArray(roster.data) || roster.data.length>=1000)throw new Error('roster_unavailable');
    const ids=copies.map(copy=>copy.id);
    const [members,evaluations]=await Promise.all([
        batches(copies.filter(copy=>copy.max_members>1).map(copy=>copy.id),chunk=>pages(()=>db.from('work_session_members')
            .select('work_session_id,user_id').in('work_session_id',chunk).eq('status','accepted'),['work_session_id','user_id'])),
        batches(ids,chunk=>pages(()=>db.from('work_evaluations').select('id,work_session_id,total,recipient_ids,validated_at,course_version,teacher_id')
            .in('work_session_id',chunk),['id']))
    ]);
    return {students:roster.data,copies,members,evaluations};
}

export function copyTrackingUrl(base, scope, lesson, copyId, history = false) {
    if(!base.startsWith('/') || base.startsWith('//') || /[\\\s]/.test(base))throw new Error('invalid_url');
    const query = new URLSearchParams({ etablissement: scope.etablissement, matiere: scope.matiere, classe: scope.classe, seance: lesson.seance });
    if(copyId !== null && copyId !== undefined)query.set('copie',String(copyId));
    if(history)query.set('historique','1');
    return base+'?'+query;
}
