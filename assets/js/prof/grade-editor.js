/* Saisie locale des points ; validation distante activée après accord sur la migration. */
export function parseGrade(value, maximum) {
    const text = value.trim().replace(',', '.');
    if (!/^\d+(?:\.\d{1,6})?$/.test(text)) return null;
    const points = Number(text);
    return Number.isFinite(points) && points >= 0 && points <= maximum ? points : null;
}
export function initGradeEditor({ db, checkSession, page = document, onValidated = () => {} }) {
    const root = page.getElementById('copy-grade');
    let fields = [], mounts = [], proposal = null, actor = null, dirty = false, busy = false, generation = 0, evaluation = null;
    const enabled = root?.dataset.enabled === 'true';
    const total = page.getElementById('copy-grade-total'), status = page.getElementById('copy-grade-status');
    const button = page.getElementById('copy-grade-validate');
    function clear() {
        for (const cleanup of mounts.reverse()) cleanup();
        mounts = [];
        ++generation; fields = []; proposal = null; actor = null; dirty = false; busy = false; evaluation = null;
        if (root) { root.hidden = true; total.textContent = ''; status.textContent = ''; button.disabled = true; }
    }
    function marks() {
        if (!proposal?.bareme_complet || proposal.maximum_total !== 20 || fields.length !== proposal.resultats.length) return null;
        const rows = fields.map(({ row, controls, comment }) => {
            const details = controls.map(control => ({ cle: control.cle, maximum: control.maximum, points: parseGrade(control.input.value, control.maximum) }));
            const points = details.some(detail => detail.points === null) ? null : details.reduce((sum, detail) => sum + Math.round(detail.points * 1000000), 0) / 1000000;
            return { cle: row.cle, maximum: row.maximum, points, commentaire: comment.value,
                ...(row.resultats_cellules ? { details } : {}) };
        });
        return rows.some(row => row.points === null) ? null : rows;
    }
    function update() {
        if (evaluation) { total.textContent = 'Note validée : ' + evaluation.total + ' / 20'; button.disabled = true; return; }
        const rows = marks();
        for (const field of fields) if (field.subtotal) {
            const values = field.controls.map(control => parseGrade(control.input.value, control.maximum));
            field.subtotal.textContent = values.some(value => value === null) ? 'Tableau : notation à compléter / ' + field.row.maximum :
                'Total du tableau : ' + (values.reduce((sum, value) => sum + Math.round(value * 1000000), 0) / 1000000).toLocaleString('fr-FR') + ' / ' + field.row.maximum;
        }
        const sum = rows?.reduce((value, row) => value + Math.round(row.points * 1000000), 0) / 1000000;
        total.textContent = rows ? 'Note préparée : ' + sum.toLocaleString('fr-FR', { maximumFractionDigits: 6 }) + ' / 20' : 'Complétez les points de chaque question pour calculer la note sur 20.';
        button.disabled = !enabled || !rows || busy;
    }
    function begin(value, userId, savedEvaluation) {
        clear(); if (!root) return;
        proposal = value; actor = userId; evaluation = savedEvaluation || null; root.hidden = false;
        status.textContent = enabled ? 'Les points restent un brouillon jusqu’à la validation.' : 'Saisie en brouillon uniquement. L’enregistrement et le verrouillage attendent l’activation validée de Supabase.';
        if (evaluation) status.textContent = 'Correction validée, affichée en lecture seule. Rouvrez la copie pour effectuer une nouvelle correction ; l’ancienne restera dans l’historique.';
    }
    function attach(parent, row) {
        if (!root || !proposal) return;
        const saved = evaluation?.marks?.find(mark => mark.cle === row.cle);
        const answers = [...parent.querySelectorAll('[data-answer-id]')];
        const cells = row.resultats_cellules;
        const entries = cells || [{ champ: row.cle, maximum: row.maximum,
            points_proposes: ['correcte', 'incorrecte'].includes(row.etat) ? row.points_proposes : null }];
        const controls = [];
        for (const entry of entries) {
            const answer = cells ? answers.find(answer => answer.dataset.answerId === entry.champ) : answers[0];
            if (!answer) throw new Error('grade_answer_missing');
            const label = page.createElement('label'); label.className = 'copy-grade-field copy-grade-points';
            const caption = page.createElement('span'); caption.textContent = 'Note / ' + (entry.maximum ?? '—');
            const input = page.createElement('input'); input.type = 'text'; input.inputMode = 'decimal'; input.maxLength = 16;
            input.value = entry.points_proposes !== null ? String(entry.points_proposes) : '';
            const savedPoints = cells ? saved?.details?.find(detail => detail.cle === entry.champ)?.points : saved?.points;
            if (evaluation) input.value = savedPoints !== undefined ? String(savedPoints) : '';
            input.disabled = Boolean(evaluation) || entry.maximum === null; input.autocomplete = 'off';
            const answerLabel = answer.getAttribute?.('aria-label') || (row.activite ? 'Activité ' + row.activite + ', question ' + row.question : row.cle);
            input.setAttribute('aria-label', 'Note pour ' + answerLabel + ' sur ' + entry.maximum);
            label.append(caption, input);
            if (cells || answer.tagName === 'SELECT') {
                const wrapper = page.createElement('div'); wrapper.className = 'copy-answer-score';
                const original = answer.parentNode; original.insertBefore(wrapper, answer); wrapper.append(answer, label);
                mounts.push(() => { original.insertBefore(answer, wrapper); wrapper.remove(); });
            } else {
                answer.parentNode.insertBefore(label, answer.nextSibling); mounts.push(() => label.remove());
            }
            controls.push({ cle: entry.champ, maximum: entry.maximum, input });
        }
        let subtotal = null;
        if (cells) {
            subtotal = page.createElement('p'); subtotal.className = 'copy-grade-subtotal';
            if (evaluation) subtotal.textContent = 'Total validé du tableau : ' + (saved?.points ?? 'non renseigné') + ' / ' + row.maximum;
            parent.append(subtotal); mounts.push(() => subtotal.remove());
        }
        const details = page.createElement('details'); details.className = 'copy-grade-comment'; details.open = false;
        const summary = page.createElement('summary'); summary.textContent = cells ? 'Appréciation globale du tableau (facultative)' : 'Appréciation (facultative)'; details.append(summary);
        const feedbackLabel = page.createElement('label'); feedbackLabel.className = 'copy-grade-field';
        const feedbackCaption = page.createElement('span'); feedbackCaption.textContent = cells ? 'Commentaire sur le tableau' : 'Commentaire sur cette réponse';
        const comment = page.createElement('textarea'); comment.rows = 2; comment.maxLength = 2000; comment.value = saved?.commentaire || ''; comment.disabled = Boolean(evaluation);
        feedbackLabel.append(feedbackCaption, comment); details.append(feedbackLabel); parent.append(details); mounts.push(() => details.remove());
        fields.push({ row, controls, comment, subtotal });
        for (const control of [...controls.map(control => control.input), comment]) control.addEventListener('input', () => { if (!evaluation) { dirty = true; update(); } });
        update();
    }
    button?.addEventListener('click', async () => {
        const rows = marks(); if (!enabled || busy || !rows || !actor || evaluation) return;
        const current = generation, copy = proposal.copy_id, userId = actor;
        busy = true; button.disabled = true; for (const field of fields) { for (const control of field.controls) control.input.disabled = true; field.comment.disabled = true; }
        status.textContent = 'Validation de la correction et verrouillage…';
        try {
            const session = await checkSession();
            if (current !== generation) return;
            if (session.status !== 'authenticated' || session.user.id !== userId || session.profile.role !== 'teacher') { clear(); return; }
            const response = await db.functions.invoke('teacher-grade', { body: { copy_id: copy, marks: rows,
                course_version: proposal.cours.version, correction_fingerprint: proposal.empreinte_corrige,
                answer_revisions: proposal.revisions_reponses,
                ...(page.getElementById('tracking-feedback') ? { general_comment: page.getElementById('tracking-feedback').value } : {}) } });
            const verified = await checkSession();
            if (current !== generation) return;
            if (verified.status !== 'authenticated' || verified.user.id !== userId || verified.profile.role !== 'teacher') { clear(); return; }
            if (response.error || response.data?.validated !== true || response.data.copy_id !== copy) throw new Error('not_confirmed');
            dirty = false; proposal = null; evaluation = { ...response.data, marks: rows }; status.textContent = 'Correction et note enregistrées. La copie est verrouillée.';
            onValidated(response.data);
        } catch {
            if (current === generation) status.textContent = 'Validation non confirmée. Les points restent ici. La copie ou son corrigé a peut-être changé : actualisez avant de recommencer.';
        } finally {
            if (current === generation) { busy = false; if (proposal) for (const field of fields) { for (const control of field.controls) control.input.disabled = control.maximum === null; field.comment.disabled = false; } update(); }
        }
    });
    clear();
    return { clear, begin, attach, hasDraft: () => dirty, isBusy: () => busy };
}
