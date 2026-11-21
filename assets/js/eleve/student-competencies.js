const total = values => values.reduce((sum, value) => sum + Math.round(value * 1000000), 0) / 1000000;
const identity = row => JSON.stringify([row.etablissement, row.matiere, row.classe, row.seance]);

function validGrade(lesson, userId) {
    const grade = lesson.grade, copy = lesson.copy;
    if (!copy?.terminee || ![1, 2, 3].includes(copy.max_members) || !grade || !grade.id || !copy.current_evaluation_id || !userId || !Array.isArray(grade.recipient_ids) || !grade.recipient_ids.includes(userId) ||
        String(copy.id) !== String(grade.work_session_id) || String(copy.current_evaluation_id) !== String(grade.id) ||
        !copy.course_version || copy.course_version !== grade.course_version || grade.course_version !== lesson.version ||
        !Array.isArray(grade.marks) || !grade.marks.length || grade.marks.length > 1000) return false;
    const used = new Set();
    for (const mark of grade.marks) {
        if (!mark || typeof mark !== 'object' || typeof mark.cle !== 'string' || used.has(mark.cle) || !Number.isFinite(mark.points) || !Number.isFinite(mark.maximum) ||
            mark.maximum < 0 || mark.maximum > 20 || mark.points < 0 || mark.points > mark.maximum) return false;
        used.add(mark.cle);
        // Les cases d'un tableau sont déjà comptées dans le total de leur question.
        if (mark.details !== undefined) {
            if (!Array.isArray(mark.details) || !mark.details.length || mark.details.length > 1000) return false;
            const cells = new Set();
            for (const cell of mark.details) {
                if (!cell || typeof cell !== 'object' || typeof cell.cle !== 'string' || cells.has(cell.cle) || !Number.isFinite(cell.points) || !Number.isFinite(cell.maximum) ||
                    cell.maximum < 0 || cell.maximum > 20 || cell.points < 0 || cell.points > cell.maximum) return false;
                cells.add(cell.cle);
            }
            if (total(mark.details.map(cell => cell.points)) !== mark.points || total(mark.details.map(cell => cell.maximum)) !== mark.maximum) return false;
        }
    }
    return total(grade.marks.map(mark => mark.maximum)) === 20 && Number.isFinite(Number(grade.total)) &&
        grade.total !== null && grade.total !== '' && total(grade.marks.map(mark => mark.points)) === Number(grade.total);
}

export function skillResults(ref, skillId, lessons, mappings, userId) {
    const result = { individual: [], collective: [] }, seen = new Set();
    for (const lesson of lessons) {
        if (lesson.previousClass || lesson.etablissement !== ref.etablissement || lesson.matiere !== ref.matiere || !validGrade(lesson, userId)) continue;
        const candidates = mappings.filter(map => map.referentiel === ref.id && identity(map) === identity(lesson) && map.version === lesson.grade.course_version);
        if (candidates.length !== 1 || seen.has(String(lesson.grade.id))) continue;
        seen.add(String(lesson.grade.id));
        const mapping = candidates[0], destination = lesson.copy.max_members > 1 ? result.collective : result.individual;
        for (const mark of lesson.grade.marks) {
            if (!mapping.questions?.[mark.cle]?.includes(skillId) || mark.maximum === 0) continue;
            destination.push({ points: mark.points, maximum: mark.maximum, key: mark.cle, lesson, scope: mapping.perimetre });
        }
    }
    for (const type of ['individual', 'collective']) {
        const entries = result[type], points = total(entries.map(row => row.points)), maximum = total(entries.map(row => row.maximum));
        result[type] = { entries, points, maximum, percent: maximum ? Math.round(1000 * points / maximum) / 10 : null,
            copies: new Set(entries.map(row => String(row.lesson.copy.id))).size, toReview: entries.filter(row => row.points < row.maximum).length };
    }
    return result;
}

export function competencyOverview(references, profile, lessons, mappings = [], userId) {
    return references.filter(ref => ref.etablissement === profile.etablissement && ref.classes.includes(profile.classe)).map(ref => ({
        ...ref,
        themes: ref.themes.map(theme => ({ ...theme, competences: theme.competences.map(skill => ({
            ...skill,
            results: skillResults(ref, skill.id, lessons.filter(lesson => lesson.classe === profile.classe), mappings, userId),
            targeted: lessons.filter(lesson => !lesson.previousClass && lesson.etablissement === ref.etablissement && lesson.classe === profile.classe && lesson.matiere === ref.matiere &&
                ref.seances?.[lesson.seance]?.includes(skill.id)).length
        })) }))
    }));
}

export function renderCompetencyOverview({ root, references, profile, lessons, mappings = [], userId, page = document }) {
    const text = (tag, value, className) => {
        const node = page.createElement(tag); node.textContent = value;
        if (className) node.className = className;
        return node;
    };
    const scale = (percent, caption) => {
        const bar = text('span', '', 'student-competency-scale');
        bar.setAttribute('role', 'img');
        bar.setAttribute('aria-label', caption + ' : ' + (percent === null ? 'pas encore évalué' : percent.toLocaleString('fr-FR') + ' % de points obtenus'));
        if (percent === null) bar.setAttribute('data-empty', 'true');
        for (let i = 0; i < 4; i++) {
            const segment = text('i', ''); segment.setAttribute('aria-hidden', 'true');
            segment.setAttribute('style', '--segment-fill:' + (percent === null ? 0 : Math.max(0, Math.min(100, percent * 4 - i * 100))) + '%');
            bar.append(segment);
        }
        return bar;
    };
    const rows = competencyOverview(references, profile, lessons, mappings, userId);
    if (!rows.length) {
        root.append(text('p', 'Le graphique des compétences sera disponible après le rattachement du référentiel de ta formation.', 'student-muted'));
        return;
    }
    root.className = 'student-competency-overview';
    root.append(text('h3', 'Mes compétences en repères'), text('p', 'Ces repères résument les points des questions corrigées liées à chaque compétence. Ils montrent tes réussites sur ces travaux, sans certifier la maîtrise de tout le domaine. Pas encore évalué ne veut pas dire non acquis.', 'student-muted'));
    for (const ref of rows) {
        root.append(text('h4', ref.titre));
        for (const theme of ref.themes) {
            const group = text('section', '', 'student-competency-theme');
            group.append(text('h5', theme.titre));
            const list = text('ul', '', 'student-competency-chart');
            for (const skill of theme.competences) {
                const item = text('li', '', 'student-competency-item');
                const label = text('div', ''); label.append(text('span', skill.titre));
                if (skill.targeted) label.append(text('small', 'Objectif de ' + skill.targeted + ' séance(s) disponible(s)'));
                item.append(label);
                const observed = skill.results.individual.percent !== null || skill.results.collective.percent !== null;
                if (!observed) {
                    const row = text('div', '', 'student-competency-result student-competency-unknown');
                    row.append(scale(null, skill.titre), text('span', 'Pas encore évalué', 'student-competency-state'));
                    item.append(row);
                }
                for (const type of ['individual', 'collective']) {
                    const result = skill.results[type];
                    if (result.percent === null) continue;
                    const caption = type === 'individual' ? 'Travaux individuels' : 'Travaux de groupe';
                    const row = text('div', '', 'student-competency-result');
                    const value = result.percent.toLocaleString('fr-FR') + ' %';
                    row.append(text('span', type === 'individual' ? 'Seul' : 'Groupe'), scale(result.percent, caption), text('strong', value));
                    item.append(row);
                    const details = text('details', '', 'student-competency-evidence');
                    details.append(text('summary', caption + ' · ' + result.copies + ' copie(s) · ' + result.toReview + ' question(s) à relire'));
                    details.append(text('p', result.entries.length + ' question(s) liée(s) · ' + result.points.toLocaleString('fr-FR') + ' / ' + result.maximum.toLocaleString('fr-FR') + ' points'));
                    for (const entry of result.entries) {
                        const p = text('p', entry.lesson.titre + ' · ' + entry.key + ' : ' + entry.points.toLocaleString('fr-FR') + ' / ' + entry.maximum.toLocaleString('fr-FR') + ' · ' + entry.scope);
                        const link = text('a', 'Relire cette activité');
                        const anchor = /^a\d+_q\d+$/.test(entry.key) ? '#' + entry.key.split('_')[0] : '#course-evaluation';
                        link.href = entry.lesson.url + (entry.lesson.copy.max_members > 1 ? '?copie=' + encodeURIComponent(entry.lesson.copy.id) : '') + anchor;
                        p.append(text('span', ' '), link); details.append(p);
                    }
                    item.append(details);
                }
                if (skill.results.collective.percent !== null) item.append(text('small', 'Le résultat de groupe ne prouve pas, à lui seul, ce que tu sais faire individuellement.', 'student-competency-evidence'));
                list.append(item);
            }
            group.append(list); root.append(group);
        }
        const explanation = text('details', '', 'student-competency-source');
        explanation.append(text('summary', 'D’où viennent ces objectifs ?'));
        explanation.append(text('p', ref.description));
        explanation.append(text('p', 'Chaque segment représente 25 % des points possibles, pas un niveau officiel de maîtrise. Les segments en pointillés indiquent une absence de résultat.'));
        explanation.append(text('p', 'Calcul : somme des points obtenus ÷ somme des points possibles sur les questions reliées, uniquement pour les corrections validées de cette version du cours. Une question sans point n’entre pas dans le calcul. Les cases des tableaux ne sont pas recomptées. Une question à relire est une question qui n’a pas tous les points, pas un diagnostic automatique de compétence.'));
        const link = text('a', 'Consulter le programme officiel'); link.href = ref.source;
        explanation.append(link); root.append(explanation);
    }
}
