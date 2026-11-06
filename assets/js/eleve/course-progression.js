export function nextLessons(progressions, profile, lessons) {
    const seen = new Set();
    return progressions.filter(row => row.etablissement === profile.etablissement && row.classe === profile.classe).map(row => {
        if (seen.has(row.matiere) || !Array.isArray(row.seances) || new Set(row.seances.map(item => item.id)).size !== row.seances.length) throw new Error('invalid_progression');
        seen.add(row.matiere);
        const sequence = row.seances.map(item => ({ ...item, lesson: lessons.find(lesson => lesson.etablissement === row.etablissement &&
            lesson.matiere === row.matiere && lesson.classe === row.classe && lesson.seance === item.id) }));
        const classroomIndex = sequence.findIndex(item => item.id === row.derniere_seance_en_classe);
        const next = sequence.slice(classroomIndex + 1).find(item => item.lesson?.state !== 'finished');
        return { matiere: row.matiere, next: next || null, completed: sequence.filter(item => item.lesson?.state === 'finished').length, total: sequence.length };
    });
}
