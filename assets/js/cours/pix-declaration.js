/* ========== SÉANCE PIX : DÉCLARATION HORS PROGRESSION ET HORS NOTE ========== */
import { db } from '../bdd/bdd-connect.js';
import { checkSession } from '../auth/auth-session.js';

export function pixDateLabel(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ''));
    return match ? match[3] + '/' + match[2] + '/' + match[1] : '';
}

export function initPixDeclaration(doc = document) {
    const root = doc.getElementById('course-pix');
    if (!root || !db) return null;
    const button = doc.getElementById('course-pix-declare');
    const status = doc.getElementById('course-pix-status');
    const course = { p_school: root.dataset.etablissement, p_subject: root.dataset.matiere, p_class: root.dataset.classe, p_lesson: root.dataset.seance };
    let busy = false;
    const done = date => { button.disabled = true; button.textContent = 'Séance Pix signalée'; status.textContent = 'Séance Pix enregistrée le ' + pixDateLabel(date) + '. Ta progression en technologie n’a pas bougé.'; };
    async function load() {
        const session = await checkSession();
        if (session.status !== 'authenticated' || session.profile.role !== 'student') { status.textContent = 'Connecte-toi avec ton compte élève pour signaler une séance Pix.'; return; }
        if (session.profile.etablissement !== course.p_school || session.profile.classe !== course.p_class) { status.textContent = ''; root.hidden = true; return; }
        const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' }).format(new Date());
        const { data, error } = await db.from('pix_declarations').select('declared_on').eq('matiere', course.p_subject).eq('declared_on', today).maybeSingle();
        if (!error && data) { done(data.declared_on); return; }
        button.disabled = false;
    }
    button.addEventListener('click', async () => {
        if (busy || button.disabled) return;
        busy = true; button.disabled = true; status.textContent = 'Enregistrement…';
        try {
            const { data, error } = await db.rpc('refonte_declare_pix', course);
            if (error || typeof data !== 'string') throw new Error('pix_failed');
            done(data);
        } catch { button.disabled = false; status.textContent = 'La séance Pix n’a pas pu être signalée. Réessaie dans un instant.'; }
        finally { busy = false; }
    });
    load().catch(() => { status.textContent = 'Signalement Pix indisponible pour le moment.'; });
    return { load };
}

if (typeof document !== 'undefined') initPixDeclaration();
