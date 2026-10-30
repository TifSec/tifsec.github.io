/* ========== INVITATIONS ET GROUPES PROPRES À CHAQUE SÉANCE ========== */
import { db } from '../bdd/bdd-connect.js';
import { checkSession } from '../auth/auth-session.js';

export function lessonCatalogue() {
    try { return JSON.parse(document.getElementById('seances-data')?.textContent || '[]'); }
    catch { return []; }
}
export function lessonLink(row, copyId) {
    const lesson = lessonCatalogue().find(l => ['etablissement','matiere','classe','seance'].every(key => l[key] === row[key]));
    if (!lesson?.url?.startsWith('/') || lesson.url.startsWith('//')) return null;
    return lesson.url + '?copie=' + encodeURIComponent(copyId);
}
export async function collaborationRpc(name, params = {}) {
    const result = await db.rpc(name, params);
    if (result.error) throw result.error;
    return result.data;
}
export function collaborationError(error) {
    if (error?.message?.includes('already_in_group')) return 'Tu participes déjà à un groupe pour cette séance. Ouvre la copie existante.';
    if (error?.message?.includes('group_full')) return 'Ce groupe est complet.';
    if (error?.message?.includes('invitation_already_answered')) return 'Cette invitation a déjà reçu une réponse.';
    return 'Cette action n’a pas pu être confirmée. Actualise la liste avant de réessayer.';
}
function text(tag, value) {
    const element = document.createElement(tag); element.textContent = value; return element;
}

export async function initCourseGroups({ course, selectedCopy, onChoose, beforeCreate = async () => true, onCreateEnd = () => {}, isCurrent = () => true }) {
    const root = document.getElementById('course-collaboration');
    if (!root || root.dataset.enabled !== 'true') return null;
    const controls = document.getElementById('group-controls');
    const status = document.getElementById('group-status');
    const select = document.getElementById('group-copy');
    const roster = document.getElementById('group-classmates');
    const create = document.getElementById('group-create');
    const feedback = document.getElementById('course-feedback');
    const session = await checkSession();
    if (!isCurrent() || session.status !== 'authenticated' || session.profile.role !== 'student') return null;
    controls.hidden = false;
    const params = { p_school: course.etablissement, p_subject: course.matiere, p_class: course.classe, p_lesson: course.seance };
    let current = selectedCopy || '';
    let disposed = false;
    let busy = false;
    let hasGroup = false;

    async function refresh() {
        const rows = await collaborationRpc('refonte_my_groups', params);
        if (disposed || !isCurrent()) return;
        hasGroup = rows.length > 0;
        let historical = null;
        if (hasGroup) {
            const result = await db.from('work_sessions').select('id').eq('created_by', session.user.id)
                .eq('etablissement', course.etablissement).eq('matiere', course.matiere).eq('classe', course.classe)
                .eq('seance', course.seance).eq('max_members', 1).maybeSingle();
            if (result.error) throw result.error;
            historical = result.data?.id;
        }
        if (disposed || !isCurrent()) return;
        select.replaceChildren();
        if (!hasGroup) select.add(new Option('Ma copie individuelle', ''));
        else if (historical) select.add(new Option('Mon travail individuel — historique (lecture seule)', '__history__'));
        for (const row of rows) select.add(new Option('Groupe — ' + row.participants, String(row.copy_id)));
        select.value = current;
        document.getElementById('group-create-panel').hidden = rows.length > 0 || session.profile.etablissement !== course.etablissement || session.profile.classe !== course.classe;
    }
    const choose = async () => {
        if (disposed || !isCurrent()) return;
        const value = select.value;
        select.disabled = true;
        try {
            if (await onChoose(value || null)) { current = value; }
            else { select.value = current; }
        } finally { if (!disposed && isCurrent()) select.disabled = false; }
    };
    const invite = async () => {
        if (busy || disposed || !isCurrent()) return;
        const peers = [...roster.querySelectorAll('input:checked')].map(input => input.value);
        if (peers.length < 1 || peers.length > 2) { status.textContent = 'Choisis un ou deux camarades.'; return; }
        busy = true; create.disabled = true;
        let created = false;
        try {
            if (!await beforeCreate() || disposed || !isCurrent()) return;
            const id = await collaborationRpc('refonte_create_group', { ...params, p_invitees: peers });
            created = true;
            if (disposed || !isCurrent()) return;
            status.textContent = 'Invitations envoyées. Les camarades n’accèdent à cette copie qu’après leur acceptation.';
            await refresh();
            if (await onChoose(String(id))) { current = String(id); select.value = current; }
        } catch (error) { if (!disposed && isCurrent()) status.textContent = collaborationError(error); }
        finally { busy = false; if (!disposed && isCurrent()) { create.disabled = false; onCreateEnd(created); } }
    };
    const update = () => {
        refresh().catch(() => { if (!disposed && isCurrent()) status.textContent = 'Impossible d’actualiser les groupes.'; });
    };
    const refreshButton = document.getElementById('group-refresh');
    select.addEventListener('change', choose);
    create.addEventListener('click', invite);
    refreshButton.addEventListener('click', update);
    function dispose() {
        disposed = true;
        select.removeEventListener('change', choose); create.removeEventListener('click', invite);
        refreshButton.removeEventListener('click', update);
        if (isCurrent()) { controls.hidden = true; roster.replaceChildren(); feedback.replaceChildren(); }
    }
    try {
        await refresh();
        if (!isCurrent()) { dispose(); return null; }
        const sameClass = session.profile.etablissement === course.etablissement && session.profile.classe === course.classe;
        document.getElementById('group-create-panel').hidden = !sameClass || hasGroup;
        if (sameClass && !hasGroup) {
            const peers = await collaborationRpc('refonte_classmates');
            if (disposed || !isCurrent()) { dispose(); return null; }
            roster.replaceChildren();
            for (const peer of peers) {
                const label = document.createElement('label');
                const input = document.createElement('input'); input.type = 'checkbox'; input.value = peer.user_id;
                label.append(input, document.createTextNode(' ' + peer.prenom + ' ' + peer.nom)); roster.append(label);
            }
        }
        status.textContent = 'Chaque groupe concerne uniquement cette séance. Les autres copies et les anciens groupes sont conservés.';
    } catch (error) { if (!disposed && isCurrent()) status.textContent = collaborationError(error); }
    return {
        async showFeedback(copyId) {
            const { data, error } = await db.from('work_feedback').select('commentaire, updated_at').eq('work_session_id', copyId);
            if (disposed || !isCurrent()) return;
            feedback.replaceChildren();
            if (error) { feedback.append(text('p', 'Les retours professeur ne sont pas disponibles pour le moment.')); return; }
            for (const row of data || []) {
                if (row.commentaire) feedback.append(text('h3','Retour professeur'), text('p', row.commentaire));
            }
        },
        dispose
    };
}

export function initInvitations() {
    const root = document.getElementById('student-invitations');
    if (!root || root.dataset.enabled !== 'true') return;
    let generation = 0;
    let userId = null;
    let busy = false;
    async function refresh() {
        if (busy) return;
        const current = ++generation;
        const session = await checkSession();
        if (current !== generation) return;
        if (session.status !== 'authenticated' || session.profile.role !== 'student') {
            root.replaceChildren(); root.hidden = true; userId = null; return;
        }
        userId = session.user.id;
        if (session.profile.enrollment_status === 'pending') {
            root.replaceChildren(text('p', 'Les invitations seront disponibles après validation de ton inscription par ton professeur.'));
            root.hidden = false; return;
        }
        try {
            const rows = await collaborationRpc('refonte_invitations');
            if (current !== generation) return;
            root.replaceChildren(text('h2','Invitations à collaborer')); root.hidden = false;
            if (!rows.length) root.append(text('p','Aucune invitation en attente.'));
            for (const row of rows) {
                const card = document.createElement('article'); card.className = 'collaboration-card';
                const lesson = lessonCatalogue().find(l => ['etablissement','matiere','classe','seance'].every(key => l[key] === row[key]));
                card.append(text('h3', row.invited_by + ' t’invite à travailler ensemble'),
                    text('p', lesson?.titre || row.seance),
                    text('p','En acceptant, cette copie commune devient ton travail de référence pour la séance. Ton travail individuel reste consultable dans ton historique, sans fusion automatique.'));
                for (const [accepted,label] of [[true,'Accepter'],[false,'Refuser']]) {
                    const button = text('button',label); button.type = 'button';
                    button.addEventListener('click',async()=>{
                        if (busy) return; busy = true;
                        card.querySelectorAll('button').forEach(b=>{b.disabled=true;});
                        try {
                            const id = await collaborationRpc('refonte_reply_invitation',{p_invitation:row.invitation_id,p_accept:accepted});
                            if (current !== generation) return;
                            card.replaceChildren(text('p',accepted?'Invitation acceptée.':'Invitation refusée.'));
                            const href = accepted ? lessonLink(row,id) : null;
                            if (href) { const link=text('a','Ouvrir la copie collective'); link.href=href; card.append(link); }
                        } catch(error) {
                            if (current === generation) { card.append(text('p',collaborationError(error))); card.querySelectorAll('button').forEach(b=>{b.disabled=false;}); }
                        } finally { busy=false; }
                    }); card.append(button);
                }
                root.append(card);
            }
            const groups = await collaborationRpc('refonte_my_groups');
            if (current !== generation) return;
            root.append(text('h2', 'Mes copies collectives'));
            if (!groups.length) root.append(text('p', 'Aucune copie collective pour le moment.'));
            for (const copy of groups) {
                const href = lessonLink(copy, copy.copy_id);
                const lesson = lessonCatalogue().find(l => ['etablissement','matiere','classe','seance'].every(key => l[key] === copy[key]));
                if (href) { const p = text('p', ''); const link = text('a', lesson.titre + ' — ' + copy.participants); link.href = href; p.append(link); root.append(p); }
            }
        } catch { if(current===generation){root.replaceChildren(text('p','Impossible de charger les invitations.'));root.hidden=false;} }
    }
    db?.auth.onAuthStateChange((event,session)=>{
        if(event==='SIGNED_OUT'||(event==='SIGNED_IN'&&session?.user?.id!==userId)) {
            ++generation; root.replaceChildren(); root.hidden=true; userId=null;
            if(event==='SIGNED_IN')setTimeout(refresh,0);
        }
    });
    setInterval(()=>{if(document.visibilityState==='visible')refresh();},10000);
    refresh();
}
