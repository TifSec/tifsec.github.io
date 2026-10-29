/* Proposition temporaire : aucune note ni réponse enregistrée ici. */
import { initGradeEditor } from './grade-editor.js?v=20261029-prof-2';
export function initCopyCorrection({ db, checkSession, document: page = document, onValidated }) {
    const root = page.getElementById('copy-correction');
    if (!root) return { clear() {}, select() {}, hasDraft: () => false, isBusy: () => false };
    const grading = initGradeEditor({ db, checkSession, page, onValidated(result) {
        if (selected?.id === result.copy_id) selected.evaluation = { id: result.evaluation_id, total: result.total, marks: result.marks };
        onValidated?.(result);
    } });
    const button = page.getElementById('copy-correction-prepare');
    const status = page.getElementById('copy-correction-status');
    const results = page.getElementById('copy-correction-results');
    const preview = page.getElementById('tracking-preview');
    let annotations = [];
    let generation = 0, selected = null, controller;
    function clearResults() {
        grading.clear();
        for (const annotation of annotations) annotation.remove();
        annotations = []; results.replaceChildren();
    }
    function clear() {
        ++generation; controller?.abort(); selected = null;
        root.hidden = true; button.disabled = true; status.textContent = ''; clearResults();
    }
    function select(row, userId) {
        clear();
        if (row.is_history) return;
        selected = { id: String(row.copy_id), userId, evaluation: row.evaluation }; root.hidden = false; button.disabled = false;
        status.textContent = 'Préparez une proposition à partir des dernières réponses enregistrées.';
    }
    const labels = { correcte: 'Réponse correcte', incorrecte: 'Réponse à revoir', a_examiner: 'À examiner par le professeur',
        sans_reponse: 'Aucune réponse', format_invalide: 'Format à vérifier par le professeur' };
    function paragraph(text) { const node = page.createElement('p'); node.textContent = text; results.append(node); }
    function guidance(parent, help) {
        if (!help || help.decision_professeur !== true) return;
        const labels = { attendu: 'Éléments attendus', explication: 'Démarche et explication', criteres: 'Critères de réussite et points partiels',
            bareme_detaille: 'Répartition des points', erreurs_frequentes: 'Erreurs possibles à vérifier', choix_attendus: 'Choix attendus', unite_attendue: 'Unité attendue',
            tolerance_absolue: 'Tolérance', arrondi_decimales: 'Décimales demandées' };
        function contents(target, value, depth = 0) {
            if (depth > 12) throw new Error('invalid_guidance');
            if (Array.isArray(value)) {
                const list = page.createElement('ul');
                for (const child of value) { const item = page.createElement('li'); contents(item, child, depth + 1); list.append(item); }
                target.append(list);
            } else if (value && typeof value === 'object') {
                for (const [key, child] of Object.entries(value)) {
                    const label = page.createElement('strong'); label.textContent = key; target.append(label); contents(target, child, depth + 1);
                }
            } else { const text = page.createElement('p'); text.textContent = value === null ? 'Non renseigné' : String(value); target.append(text); }
        }
        const details = page.createElement('details'); details.open = false;
        const summary = page.createElement('summary'); summary.textContent = 'Repères de correction — réservés au professeur'; details.append(summary);
        let available = false;
        for (const [key, label] of Object.entries(labels)) {
            if (!Object.hasOwn(help.elements || {}, key)) continue;
            available = true; const heading = page.createElement('h4'); heading.textContent = label;
            details.append(heading); contents(details, help.elements[key]);
        }
        if (!available) contents(details, 'Les attendus et critères restent à compléter dans le fichier professeur privé.');
        const heading = page.createElement('h4'); heading.textContent = 'Pistes d’appréciation à adapter après lecture'; details.append(heading);
        contents(details, help.pistes_appreciation || []); contents(details, help.attribution || 'Décision réservée au professeur.');
        parent.append(details);
    }
    function render(proposal) {
        if (proposal.statut !== 'proposition' || proposal.note_finale !== null || proposal.enregistree !== false ||
            !Array.isArray(proposal.resultats) || proposal.resultats.length > 1000) throw new Error('invalid_proposal');
        // Résoudre toutes les cibles avant affichage : jamais de correction sous la mauvaise question.
        const targets = new Map();
        for (const activity of preview.querySelectorAll('.cours-activite')) {
            for (const question of activity.querySelectorAll('.cours-question')) {
                const key = activity.id + '_' + question.dataset.question;
                if (targets.has(key)) throw new Error('duplicate_question');
                targets.set(key, question);
            }
        }
        const seen = new Set();
        const placements = proposal.resultats.map(row => {
            const key = row.activite + '_' + row.question;
            if (!targets.has(key) || seen.has(key)) throw new Error('question_missing');
            seen.add(key);
            return { row, target: targets.get(key) };
        });
        for (const { row, target } of placements) {
            const fields = new Set([...target.querySelectorAll('[data-answer-id]')].map(field => field.dataset.answerId));
            const seenCells = new Set();
            for (const cell of row.resultats_cellules || []) {
                if (!fields.has(cell.champ) || seenCells.has(cell.champ)) throw new Error('cell_missing');
                seenCells.add(cell.champ);
            }
        }
        clearResults();
        grading.begin(proposal, selected.userId, selected.evaluation);
        paragraph(proposal.copie_terminee ? 'Copie terminée : proposition à examiner.' : 'Copie en cours : les élèves peuvent encore modifier leurs réponses.');
        if (proposal.maximum_automatique > 0) paragraph('Part vérifiée automatiquement : ' + proposal.points_automatiques + ' / ' + proposal.maximum_automatique + ' points proposés.');
        else paragraph('Aucun point proposé automatiquement pour cette copie.');
        paragraph(proposal.questions_a_examiner + ' question(s) à examiner. ' + (proposal.bareme_complet ? 'La note finale reste à votre appréciation.' : 'Barème incomplet ou absent : aucune note globale proposée.'));
        for (const { row, target } of placements) {
            const annotation = page.createElement('aside');
            annotation.className = 'copy-question-correction';
            annotation.dataset.state = Object.hasOwn(labels, row.etat) ? row.etat : 'a_examiner';
            const title = page.createElement('strong'); title.textContent = 'Aide à la correction';
            const detail = page.createElement('p');
            detail.textContent = (labels[row.etat] || 'À examiner') +
                (row.points_proposes !== null ? ' — ' + row.points_proposes + ' / ' + row.maximum + ' points proposés' +
                    (row.resultats_cellules && row.maximum_verifie < row.maximum ? ' pour les cases reconnues ; le reste est à examiner' : '') : '');
            if (row.raison === 'mots_cles') detail.textContent = (row.etat === 'sans_reponse' ? 'Aucune réponse' : 'Proposition d’après les mots-clés — à relire et valider') +
                (row.points_proposes !== null ? ' — ' + row.points_proposes + ' / ' + row.maximum + ' points pré-remplis' : '');
            annotation.append(title, detail);
            if (Array.isArray(row.resultats_criteres) && row.resultats_criteres.length && row.etat !== 'sans_reponse') {
                const list = page.createElement('ul'); list.className = 'copy-keyword-criteria';
                for (const item of row.resultats_criteres.slice(0, 20)) {
                    const li = page.createElement('li'); li.dataset.state = item.trouve ? 'reconnue' : 'a_examiner';
                    li.textContent = (item.trouve ? '✓ Repéré : ' : '… Non repéré : ') + String(item.critere) + ' (' + item.maximum + ' pt)';
                    list.append(li);
                }
                annotation.append(list);
            }
            guidance(annotation, row.aide_professeur);
            grading.attach(target, row);
            target.append(annotation); annotations.push(annotation);
            for (const cell of row.resultats_cellules || []) {
                const field = [...target.querySelectorAll('[data-answer-id]')].find(field => field.dataset.answerId === cell.champ);
                const hint = page.createElement('p'); hint.className = 'copy-cell-correction';
                hint.dataset.state = cell.etat;
                hint.textContent = cell.etat === 'reconnue' ? 'Réponse reconnue : ' + cell.points_proposes + ' / ' + cell.maximum + ' points proposés.' :
                    cell.etat === 'sans_reponse' ? 'Case vide — à examiner.' : 'Réponse non répertoriée — à examiner, pas nécessairement fausse.';
                const container = field.parentNode.className === 'copy-answer-score' ? field.parentNode.parentNode : field.parentNode;
                container.append(hint); annotations.push(hint);
            }
        }
        if (proposal.questions_facultatives_ecartees) paragraph(proposal.questions_facultatives_ecartees + ' question(s) facultative(s) exclue(s) du barème.');
        paragraph('Proposition temporaire, non enregistrée. Les réponses sont celles présentes au moment du calcul ; actualisez la copie pour les relire.');
    }
    button.addEventListener('click', async () => {
        if (!selected || button.disabled || grading.isBusy()) return;
        if (grading.hasDraft() && !window.confirm('Remplacer les points et appréciations non validés par une nouvelle proposition ?')) return;
        const current = ++generation, target = selected;
        controller?.abort(); controller = new AbortController();
        button.disabled = true; clearResults(); status.textContent = 'Préparation de la correction…';
        try {
            const session = await checkSession();
            if (current !== generation) return;
            if (session.status !== 'authenticated' || session.user.id !== target.userId || session.profile.role !== 'teacher') { clear(); return; }
            const response = await db.functions.invoke('teacher-correction', { body: { copy_id: target.id }, signal: controller.signal });
            const verified = await checkSession();
            if (current !== generation) return;
            if (verified.status !== 'authenticated' || verified.user.id !== target.userId || verified.profile.role !== 'teacher') { clear(); return; }
            if (response.error || !response.data?.proposition || response.data.proposition.copy_id !== target.id) throw new Error('unavailable');
            render(response.data.proposition); status.textContent = 'Aide affichée sous chaque question. Aucune note enregistrée.';
        } catch {
            if (current === generation) { clearResults(); status.textContent = 'Correction non disponible ou copie modifiée pendant le calcul. Actualisez les copies puis réessayez.'; }
        } finally { if (current === generation) button.disabled = false; }
    });
    db.auth.onAuthStateChange(event => { if (['SIGNED_OUT', 'SIGNED_IN', 'TOKEN_REFRESHED', 'USER_UPDATED'].includes(event)) clear(); });
    window.addEventListener('pagehide', clear);
    clear();
    return { clear, select, hasDraft: grading.hasDraft, isBusy: grading.isBusy };
}
