import { db } from '../bdd/bdd-connect.js';
import { checkSession } from '../auth/auth-session.js';
import { dashboardModel, readDashboard } from './dashboard-model.js';
import { nextLessons } from './course-progression.js';
import { renderCompetencyOverview } from './student-competencies.js';
import { dashboardSections, followupSummary } from './dashboard-view.js';

export function initDashboard() {
    const lessons = document.getElementById('student-lessons');
    const stats = document.getElementById('student-stats');
    const status = document.getElementById('student-dashboard-status');
    const refreshButton = document.getElementById('student-refresh');
    const nextPanel = document.getElementById('student-next-panel');
    const nextContent = document.getElementById('student-next');
    const historyPanel = document.getElementById('student-history-panel');
    const historyContent = document.getElementById('student-history');
    const historyCount = document.getElementById('student-history-count');
    const followupPanel = document.getElementById('student-followup-panel');
    const followupContent = document.getElementById('student-followup');
    const rewardShop = document.getElementById('student-card-shop');
    const isLocalPreview = ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);
    const filters = [...(document.getElementById('student-filters')?.querySelectorAll('[data-view]') || [])];
    if (!lessons || !stats || !status || !refreshButton) return;
    let generation = 0;
    let timer;
    let lastLoaded = 0;
    let view = 'all', viewState = null;
    const text = (tag, value, className) => {
        const node = document.createElement(tag);
        node.textContent = value;
        if (className) node.className = className;
        return node;
    };
    function clear() {
        ++generation;
        if (rewardShop) rewardShop.hidden = true;
        lessons.replaceChildren();
        stats.replaceChildren();
        viewState = null;
        followupContent?.replaceChildren(); if (followupPanel) followupPanel.hidden = true;
        historyContent?.replaceChildren(); if (historyPanel) historyPanel.hidden = true;
        if (historyCount) historyCount.textContent = '';
        filters.forEach(button => { button.disabled = true; });
        nextContent?.replaceChildren(); if (nextPanel) nextPanel.hidden = true;
        status.textContent = 'Chargement de tes séances…';
    }
    function lessonCard(lesson) {
        const card = text('article', '', 'student-lesson');
        card.dataset.state = lesson.state;
        const subject = { techno: 'Technologie', tim: 'TIM', maths: 'Mathématiques' }[lesson.matiere] || lesson.matiere;
        card.append(text('p', subject + ' · ' + lesson.displayNumber + (lesson.previousClass ? ' · Ancienne classe' : ''), 'student-lesson-meta'), text('h3', lesson.titre));
        const state = lesson.grade ? 'Corrigée' : lesson.copy?.submitted_at && !lesson.copy.terminee ? 'Terminée · encore modifiable' :
            { new: 'À commencer', started: 'En cours', finished: 'Clôturée par le professeur' }[lesson.state];
        card.append(text('p', state, 'student-lesson-state'));
        if (lesson.copy) card.append(text('p', (lesson.copy.max_members > 1 ? 'Travail en groupe' : 'Travail individuel') + (lesson.count ? ' · ' + lesson.count + ' réponse(s) enregistrée(s)' : ''), 'student-lesson-context'));
        if (lesson.comments.length) {
            const details = text('details', '', 'student-feedback');
            details.append(text('summary', 'Lire le retour du professeur'));
            for (const comment of lesson.comments) details.append(text('p', comment));
            card.append(details);
        }
        if (lesson.grade) {
            card.append(text('p', 'Note validée : ' + Number(lesson.grade.total).toLocaleString('fr-FR', { maximumFractionDigits: 6 }) + ' / 20', 'student-grade'));
            if (lesson.copy.max_members > 1) card.append(text('p', 'Cette note est commune au groupe. Les points et appréciations sont dans ta copie.'));
        }
        const link = text('a', lesson.grade ? 'Voir ma copie corrigée' : lesson.copy?.submitted_at && !lesson.copy.terminee ? 'Relire ou compléter mon travail' : lesson.state === 'finished' ? 'Consulter mon travail' : lesson.state === 'started' ? 'Reprendre ma séance' : 'Ouvrir la séance');
        link.href = lesson.url + (lesson.copy?.max_members > 1 ? '?copie=' + encodeURIComponent(lesson.copy.id) : '');
        card.append(link);
        return card;
    }
    function renderLessons() {
        if (!viewState) return;
        const sections = dashboardSections(viewState.model.lessons, viewState.progressions, viewState.profile, view);
        if (!historyContent) { sections.main.push(...sections.history); sections.history = []; }
        lessons.replaceChildren(...sections.main.map(lessonCard));
        historyContent?.replaceChildren(...sections.history.map(lessonCard));
        if (historyPanel) { historyPanel.hidden = !sections.history.length; if (view !== 'all') historyPanel.open = true; }
        if (historyCount) historyCount.textContent = sections.history.length ? '(' + sections.history.length + ')' : '';
        filters.forEach(button => { button.disabled = false; button.setAttribute('aria-pressed', String(button.dataset.view === view)); });
        const count = sections.main.length + sections.history.length;
        status.textContent = !viewState.model.lessons.length ? 'Les séances de ta classe apparaîtront ici dès qu’elles seront disponibles.' :
            count ? count + ' séance' + (count > 1 ? 's' : '') + (view === 'all' ? ' disponible' + (count > 1 ? 's' : '') : ' pour ce filtre') + '.' : 'Aucune séance pour ce filtre pour le moment.';
    }
    function renderFollowup(model) {
        if (!followupPanel || !followupContent) return;
        const summary = followupSummary(model.lessons);
        const nodes = [];
        if (summary.waiting) nodes.push(text('p', summary.waiting + ' copie' + (summary.waiting > 1 ? 's terminées attendent' : ' terminée attend') + ' une note validée. Tu peux passer à la suite sans attendre la correction.', 'student-followup-waiting'));
        if (!summary.reviews.length) nodes.push(text('p', 'Tu retrouveras ici les retours et les notes validées de ton professeur dès qu’ils seront disponibles.', 'student-muted'));
        else {
            nodes.push(text('p', 'Relis les remarques de ton professeur pour comprendre ce que tu as réussi et ce que tu peux améliorer.', 'student-muted'));
            for (const lesson of summary.preview) {
                const row = text('article', '', 'student-followup-item');
                const subject = { techno: 'Technologie', tim: 'TIM', maths: 'Mathématiques' }[lesson.matiere] || lesson.matiere;
                row.append(text('p', subject + ' · ' + lesson.titre, 'student-followup-label'));
                row.append(text('p', lesson.grade ? 'Correction validée · points et appréciations dans ta copie' : 'Un retour de ton professeur est disponible'));
                if (lesson.copy?.max_members > 1) row.append(text('p', 'Retour sur votre copie de groupe.'));
                const link = text('a', lesson.grade ? 'Comprendre ma correction' : 'Lire le retour dans ma copie');
                link.href = lesson.url + (lesson.copy?.max_members > 1 ? '?copie=' + encodeURIComponent(lesson.copy.id) : '') + (lesson.grade ? '#course-evaluation' : '#course-feedback');
                row.append(link); nodes.push(row);
            }
            const all = text('button', 'Voir tous mes retours et notes (' + summary.reviews.length + ')');
            all.type = 'button';
            all.addEventListener('click', () => {
                view = 'feedback'; renderLessons();
                const workCard = document.getElementById('student-card-work');
                if (workCard) workCard.open = true;
                document.getElementById('student-lessons-title')?.focus();
                document.getElementById('student-lessons-title')?.scrollIntoView?.({ block: 'start' });
            });
            nodes.push(all);
        }
        const overview = document.createElement('div');
        const references = JSON.parse(document.getElementById('referentiels-data')?.textContent || '[]');
        const mappings = JSON.parse(document.getElementById('competences-evaluees-data')?.textContent || '[]');
        renderCompetencyOverview({ root: overview, references, profile: viewState.profile, lessons: model.lessons, mappings, userId: viewState.userId });
        followupContent.replaceChildren(overview, ...nodes);
        followupPanel.hidden = false;
    }
    async function refresh() {
        clear();
        const current = generation;
        refreshButton.disabled = true;
        try {
            const session = await checkSession();
            if (current !== generation) return;
            if (session.status !== 'authenticated' || session.profile.role !== 'student') {
                status.textContent = 'Connecte-toi avec ton compte élève pour retrouver ton travail.';
                return;
            }
            if (session.profile.enrollment_status === 'pending') {
                status.textContent = 'Ton inscription attend la validation de ton professeur. Tes séances seront accessibles après validation.';
                return;
            }
            const catalogue = JSON.parse(document.getElementById('seances-data')?.textContent || '[]');
            const data = await readDashboard(db, { grades: lessons.dataset?.grades === 'true', submission: lessons.dataset?.submission === 'true', competencies: Boolean(document.getElementById('competences-evaluees-data')) });
            const verified = await checkSession();
            if (current !== generation) return;
            if (verified.status !== 'authenticated' || verified.user.id !== session.user.id || verified.profile.role !== 'student' ||
                !['approved', 'legacy'].includes(verified.profile.enrollment_status)) {
                status.textContent = 'Reconnecte-toi pour retrouver ton travail.'; return;
            }
            const model = dashboardModel({ catalogue, profile: verified.profile, userId: session.user.id, ...data });
            if (rewardShop) rewardShop.hidden = verified.profile.etablissement !== 'college' && !isLocalPreview;
            const progressions = JSON.parse(document.getElementById('progressions-data')?.textContent || '[]');
            viewState = { model, progressions, profile: verified.profile, userId: verified.user.id };
            lastLoaded = Date.now();
            if (nextPanel?.dataset.enabled === 'true' && nextContent) {
                const progression = nextLessons(progressions, verified.profile, model.lessons);
                nextPanel.hidden = false;
                if (!progression.length) nextContent.append(text('p', 'Ton professeur précisera la prochaine séance. Tes travaux restent disponibles ci-dessous.'));
                for (const row of progression) {
                    const subject = { techno: 'Technologie', tim: 'TIM', maths: 'Mathématiques' }[row.matiere] || row.matiere;
                    const card = text('article', '', 'student-next-lesson');
                    card.append(text('p', subject, 'student-lesson-meta'));
                    if (!row.next) card.append(text('h3', 'Tu as terminé les séances prévues dans ce parcours.'), text('p', 'Ton professeur t’indiquera la suite.'));
                    else {
                        card.append(text('h3', (row.next.numero || row.next.id) + ' — ' + (row.next.lesson?.titre || row.next.titre)));
                        if (!row.next.lesson) card.append(text('p', 'Cette séance est la suivante dans le parcours. Elle n’est pas encore disponible sur le site.'));
                        else {
                            const link = text('a', row.next.lesson.state === 'started' ? 'Continuer cette séance' : 'Commencer cette séance');
                            link.href = row.next.lesson.url + (row.next.lesson.copy?.max_members > 1 ? '?copie=' + encodeURIComponent(row.next.lesson.copy.id) : '');
                            card.append(link, text('p', 'Tes réponses s’enregistrent automatiquement.'));
                        }
                    }
                    nextContent.append(card);
                }
            }
            for (const [label, count] of [['En cours', model.started], ['Terminées', model.finished], ['Retours prof', model.withFeedback]]) {
                const row = text('div', '');
                row.append(text('dt', label), text('dd', String(count)));
                stats.append(row);
            }
            if (lessons.dataset?.grades === 'true') {
                const row = text('div', ''); row.append(text('dt', 'Copies corrigées'), text('dd', String(model.corrected || 0))); stats.append(row);
            }
            renderLessons();
            renderFollowup(model);
        } catch {
            if (current === generation) {
                lessons.replaceChildren(); stats.replaceChildren();
                viewState = null; historyContent?.replaceChildren(); if (historyPanel) historyPanel.hidden = true;
                followupContent?.replaceChildren(); if (followupPanel) followupPanel.hidden = true;
                filters.forEach(button => { button.disabled = true; });
                nextContent?.replaceChildren(); if (nextPanel) nextPanel.hidden = true;
                status.textContent = 'Impossible de charger ton avancement. Utilise Actualiser pour réessayer.';
            }
        } finally {
            if (current === generation) refreshButton.disabled = false;
        }
    }
    refreshButton.addEventListener('click', refresh);
    filters.forEach(button => button.addEventListener('click', () => {
        if (button.disabled || !viewState) return;
        view = button.dataset.view;
        if (view === 'all' && historyPanel) historyPanel.open = false;
        renderLessons();
    }));
    db?.auth.onAuthStateChange(event => {
        if (!['SIGNED_OUT', 'SIGNED_IN', 'TOKEN_REFRESHED', 'USER_UPDATED'].includes(event)) return;
        clearTimeout(timer);
        if (['SIGNED_OUT', 'SIGNED_IN'].includes(event)) { view = 'all'; if (historyPanel) historyPanel.open = false; }
        clear();
        if (event === 'SIGNED_OUT') {
            status.textContent = 'Tu es déconnecté.';
            refreshButton.disabled = false;
        } else timer = setTimeout(refresh, 0);
    });
    window.addEventListener('pageshow', event => { if (event.persisted) refresh(); });
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && !refreshButton.disabled && Date.now() - lastLoaded >= 60000) refresh();
    });
    refresh();
}

initDashboard();
