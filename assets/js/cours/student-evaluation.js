/* Lecture des seules notes validées : aucun accès aux fichiers professeur. */
const sum = values => values.reduce((total, value) => total + Math.round(value * 1000000), 0) / 1000000;
const validPoints = (points, maximum) => typeof points === 'number' && typeof maximum === 'number' &&
    Number.isFinite(points) && Number.isFinite(maximum) && maximum >= 0 && maximum <= 20 && points >= 0 && points <= maximum;
const format = value => value.toLocaleString('fr-FR', { maximumFractionDigits: 6 });

export function renderStudentEvaluation({ root, summary, evaluation, collective = false, page = document }) {
    if (!Array.isArray(evaluation.marks) || !evaluation.marks.length || evaluation.marks.length > 1000 ||
        !validPoints(Number(evaluation.total), 20)) throw new Error('invalid_evaluation');
    const questions = new Map(), used = new Set();
    for (const activity of root.querySelectorAll('.cours-activite')) for (const question of activity.querySelectorAll('.cours-question')) {
        const key = activity.id + '_' + question.dataset.question;
        if (questions.has(key)) throw new Error('duplicate_question');
        questions.set(key, question);
    }
    const placements = evaluation.marks.map(mark => {
        const question = questions.get(mark.cle);
        if (!question || used.has(mark.cle) || !validPoints(mark.points, mark.maximum) || typeof mark.commentaire !== 'string' || mark.commentaire.length > 2000) throw new Error('invalid_mark');
        used.add(mark.cle);
        const answers = [...question.querySelectorAll('[data-answer-id]')];
        const details = mark.details;
        if (details !== undefined && (!Array.isArray(details) || !details.length || details.length > 1000)) throw new Error('invalid_details');
        const seen = new Set();
        const entries = (details || [mark]).map(entry => {
            const answer = answers.find(answer => answer.dataset.answerId === entry.cle);
            if (!validPoints(entry.points, entry.maximum) || seen.has(entry.cle) || (details && !answer)) throw new Error('invalid_cell');
            seen.add(entry.cle);
            return { entry, answer };
        });
        if (details && (sum(details.map(cell => cell.points)) !== mark.points || sum(details.map(cell => cell.maximum)) !== mark.maximum)) throw new Error('invalid_cell_total');
        return { mark, question, entries };
    });
    if (sum(evaluation.marks.map(mark => mark.maximum)) !== 20 || sum(evaluation.marks.map(mark => mark.points)) !== Number(evaluation.total)) throw new Error('invalid_total');
    const cleanups = [];
    function clear() { for (const cleanup of cleanups.reverse()) cleanup(); cleanups.length = 0; summary.replaceChildren(); summary.hidden = true; }
    try {
        for (const { mark, question, entries } of placements) {
            for (const { entry, answer } of entries) {
                const badge = page.createElement('span'); badge.className = 'student-answer-mark';
                badge.textContent = 'Note : ' + format(entry.points) + ' / ' + format(entry.maximum);
                if (answer && answer.tagName !== 'TEXTAREA') {
                    const wrapper = page.createElement('div'); wrapper.className = 'student-answer-score';
                    const parent = answer.parentNode; parent.insertBefore(wrapper, answer); wrapper.append(answer, badge);
                    cleanups.push(() => { parent.insertBefore(answer, wrapper); wrapper.remove(); });
                } else if (answer) {
                    answer.parentNode.insertBefore(badge, answer.nextSibling); cleanups.push(() => badge.remove());
                } else { question.append(badge); cleanups.push(() => badge.remove()); }
            }
            if (mark.commentaire.trim()) {
                const details = page.createElement('details'); details.className = 'student-mark-comment'; details.open = false;
                const caption = page.createElement('summary'); caption.textContent = mark.details ? 'Appréciation du tableau' : 'Appréciation du professeur';
                const text = page.createElement('p'); text.textContent = mark.commentaire;
                details.append(caption, text); question.append(details); cleanups.push(() => details.remove());
            }
        }
        const title = page.createElement('h2'); title.textContent = 'Ta copie corrigée';
        const score = page.createElement('p'); score.textContent = 'Note validée : ' + format(Number(evaluation.total)) + ' / 20';
        const explanation = page.createElement('p'); explanation.textContent = collective ?
            'Cette note est commune aux participants de ta copie. Retrouve les points près de chaque réponse et déplie les appréciations pour comprendre ce que tu peux améliorer.' :
            'Retrouve les points près de chaque réponse et déplie les appréciations pour comprendre ce que tu peux améliorer.';
        summary.replaceChildren(title, score, explanation); summary.hidden = false;
        return clear;
    } catch (error) { clear(); throw error; }
}

export function createStudentEvaluation({ db, checkSession, root, summary, enabled = false, page = document }) {
    let generation = 0, remove = null, cached = null;
    function removeView() { remove?.(); remove = null; cached = null; if (summary) { summary.replaceChildren(); summary.hidden = true; } }
    function clear() { ++generation; removeView(); }
    async function load(copy, userId, { history = false } = {}) {
        const current = ++generation;
        if (!enabled || !summary || history || !copy.locked) { removeView(); return; }
        if (cached && (cached.copyId !== String(copy.id) || cached.userId !== userId)) removeView();
        try {
            const authorized = session => session.status === 'authenticated' && session.user.id === userId && session.profile.role === 'student' &&
                ['approved', 'legacy'].includes(session.profile.enrollment_status);
            const session = await checkSession();
            if (current !== generation) return;
            if (!authorized(session)) { removeView(); return; }
            const readCopy = () => db.from('work_sessions').select('id, terminee, current_evaluation_id').eq('id', copy.id).maybeSingle();
            const first = await readCopy();
            if (current !== generation) return;
            if (first.error) throw new Error('grade_unavailable');
            if (!first.data?.terminee || !first.data.current_evaluation_id || String(first.data.id) !== String(copy.id)) { removeView(); return; }
            const revisions = (copy.answers || []).map(answer => ({ cle: answer.key, revision: String(answer.revision) })).sort((a, b) => a.cle < b.cle ? -1 : a.cle > b.cle ? 1 : 0);
            const revisionKey = JSON.stringify(revisions);
            if (cached?.evaluationId === String(first.data.current_evaluation_id) && cached.revisionKey === revisionKey) return;
            removeView();
            const grade = await db.from('work_evaluations').select('id, work_session_id, total, marks, answer_revisions')
                .eq('id', first.data.current_evaluation_id).eq('work_session_id', copy.id).maybeSingle();
            const fresh = await readCopy();
            const verified = await checkSession();
            if (current !== generation) return;
            if (!authorized(verified)) { removeView(); return; }
            if (grade.error || fresh.error) throw new Error('grade_unavailable');
            if (!grade.data || !fresh.data?.terminee || String(fresh.data.current_evaluation_id) !== String(grade.data.id) ||
                String(grade.data.id) !== String(first.data.current_evaluation_id) || String(grade.data.work_session_id) !== String(copy.id)) return;
            if (revisionKey !== JSON.stringify(grade.data.answer_revisions)) throw new Error('copy_changed');
            remove = renderStudentEvaluation({ root, summary, evaluation: grade.data, collective: Boolean(copy.group), page });
            cached = { copyId: String(copy.id), userId, evaluationId: String(grade.data.id), revisionKey };
        } catch {
            if (current !== generation) return;
            removeView();
            const text = page.createElement('p'); text.textContent = 'La correction ne peut pas être affichée pour le moment. Recharge ta copie pour réessayer.';
            summary.append(text); summary.hidden = false;
        }
    }
    return { clear, load };
}
