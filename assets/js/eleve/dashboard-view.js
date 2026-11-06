export const lessonKey = lesson => JSON.stringify([lesson.etablissement, lesson.matiere, lesson.classe, lesson.seance]);
export function followupSummary(lessons) {
    const current = lessons.filter(lesson => !lesson.previousClass);
    const reviews = current.filter(lesson => lesson.grade || lesson.comments.length);
    return {
        waiting: current.filter(lesson => lesson.copy && lesson.state === 'finished' && !lesson.grade).length,
        reviews,
        // Aucun indicateur « non lu » : la consultation n'est pas enregistrée.
        preview: [...reviews].sort((a, b) => Number(Boolean(b.comments.length)) - Number(Boolean(a.comments.length))).slice(0, 3)
    };
}
export function dashboardSections(lessons, progressions, profile, filter = 'all') {
    const current = progressions.filter(row => row.etablissement === profile.etablissement && row.classe === profile.classe);
    const subjects = new Set(current.map(row => row.matiere));
    const sequence = new Map(current.flatMap(row => row.seances.map(item => [lessonKey({ ...row, seance: item.id }), item])));
    const matches = lesson => filter === 'all' || (filter === 'started' && lesson.state === 'started') ||
        (filter === 'finished' && lesson.state === 'finished') || (filter === 'feedback' && (lesson.grade || lesson.comments.length));
    const main = [], history = [];
    for (const lesson of lessons.filter(matches)) {
        const item = { ...lesson, displayNumber: sequence.get(lessonKey(lesson))?.numero || lesson.seance };
        if (lesson.previousClass || (subjects.has(lesson.matiere) && !sequence.has(lessonKey(lesson)))) history.push(item);
        else main.push(item);
    }
    return { main, history };
}
