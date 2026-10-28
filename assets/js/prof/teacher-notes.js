const labels = {
    duree: 'Durée', continuite: 'Lien avec les séances précédentes', observations_precedentes: 'À vérifier avec la classe',
    references_officielles: 'Repères du programme', vigilance: 'Points de vigilance', deroule: 'Déroulement proposé',
    phase: 'Étape', minutes: 'Minutes', conduite: 'Conduite de la séance', eleves: 'Travail des élèves',
    objectif: 'Objectif', demarche: 'Démarche à accompagner', relances: 'Questions à poser', difficultes: 'Difficultés possibles',
    aides: 'Aides graduées', approfondissement: 'Pour aller plus loin', attendu: 'Réponses possibles', explication: 'Explication',
    criteres: 'Critères de réussite', bareme_detaille: 'Répartition des points', repartition: 'Barème par case', erreurs_frequentes: 'Erreurs fréquentes', points: 'Points proposés',
    choix_attendus: 'Choix attendus', unite_attendue: 'Unité', tolerance_absolue: 'Tolérance',
    mode: 'Mode de correction', dictionnaire: 'Réponses reconnues par case', champ: 'Case', reponses_acceptees: 'Variantes acceptées', retour_pendant_travail: 'Retour pendant le travail',
    usage: 'Usage', validation_finale: 'Validation finale', prolongements_dans_note: 'Prolongements dans la note'
};
const correctionFields = new Set([
    'attendu', 'explication', 'points', 'criteres', 'repartition', 'choix_attendus',
    'erreurs_frequentes', 'reponses_acceptees', 'dictionnaire', 'bareme_detaille',
    'unite_attendue', 'tolerance_absolue', 'demarche'
]);
function text(tag, value) {
    const node = document.createElement(tag);
    node.textContent = value;
    return node;
}
function contents(parent, value, depth = 0) {
    if (depth > 12) throw new Error('invalid_content');
    if (Array.isArray(value)) {
        const list = document.createElement('ul');
        for (const item of value) { const li = document.createElement('li'); contents(li, item, depth + 1); list.append(li); }
        parent.append(list);
    } else if (value && typeof value === 'object') {
        for (const [key, item] of Object.entries(value)) {
            const section = document.createElement('section');
            section.append(text('h4', labels[key] || key));
            contents(section, item, depth + 1); parent.append(section);
        }
    } else parent.append(text('p', value === null ? 'Non renseigné' : String(value)));
}
function panel(title, value) {
    const node = document.createElement('details');
    node.dataset.teacherPrivate = 'true'; node.className = 'teacher-annotation'; node.open = true;
    node.append(text('summary', title)); contents(node, value);
    return node;
}
export function clearTeacherNotes(preview, summary) {
    preview.querySelectorAll('[data-teacher-private]').forEach(node => node.remove());
    summary.replaceChildren(); summary.hidden = true;
}
export function renderTeacherNotes(preview, summary, content, lesson) {
    clearTeacherNotes(preview, summary);
    if (content.seance !== lesson.seance || content.version_cours !== lesson.version) throw new Error('notes_mismatch');
    const staged = [];
    const id = value => typeof value === 'string' && /^[A-Za-z][A-Za-z0-9_-]{0,79}$/.test(value);
    for (const note of content.correction || []) {
        if (!id(note.activite) || !id(note.question)) throw new Error('invalid_question');
        const activity = preview.querySelector('#' + note.activite);
        const question = activity?.querySelector('[data-question="' + note.question + '"]');
        if (!question) throw new Error('question_missing');
        const body = Object.fromEntries(Object.entries(note).filter(([key]) => correctionFields.has(key)));
        staged.push([question, panel('Correction — professeur', body)]);
    }
    // Afficher uniquement le corrigé, sous la question correspondante.
    summary.replaceChildren();
    summary.hidden = true;
    for (const [target, annotation] of staged) {
        if (target.matches('.cours-activite')) target.insertBefore(annotation, target.querySelector('.cours-question'));
        else target.append(annotation);
    }
    summary.hidden = false;
}
