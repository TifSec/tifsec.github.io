/* ========== SUIVI DES SÉANCES PIX DÉCLARÉES (PROFESSEUR) ========== */
import { db } from '../bdd/bdd-connect.js';
import { pixDateLabel } from '../cours/pix-declaration.js';

export function initTeacherPix(doc = document) {
    const button = doc.getElementById('tracking-pix-load');
    if (!button || !db) return null;
    const status = doc.getElementById('tracking-pix-status');
    const table = doc.getElementById('tracking-pix-table');
    const subject = doc.getElementById('tracking-subject'), schoolClass = doc.getElementById('tracking-class');
    let generation = 0;
    const clear = () => { ++generation; table.hidden = true; table.tBodies[0].replaceChildren(); status.textContent = ''; };
    subject?.addEventListener('change', clear); schoolClass?.addEventListener('change', clear);
    button.addEventListener('click', async () => {
        const [etablissement, classe] = String(schoolClass?.value || '').split('|');
        if (!subject?.value || !etablissement || !classe) { status.textContent = 'Choisissez d’abord une matière et une classe.'; return; }
        const current = ++generation; button.disabled = true; status.textContent = 'Lecture des séances Pix…';
        try {
            const { data, error } = await db.rpc('refonte_pix_class', { p_school: etablissement, p_subject: subject.value, p_class: classe });
            if (current !== generation) return;
            if (error || !Array.isArray(data)) throw new Error('pix_unavailable');
            const rows = data.map(row => {
                const tr = doc.createElement('tr');
                for (const value of [pixDateLabel(row.declared_on), row.eleve || 'Élève', row.seance]) { const td = doc.createElement('td'); td.textContent = String(value); tr.append(td); }
                return tr;
            });
            table.tBodies[0].replaceChildren(...rows); table.hidden = !rows.length;
            const students = new Set(data.map(row => row.eleve)).size;
            status.textContent = rows.length ? rows.length + ' séance(s) Pix signalée(s) par ' + students + ' élève(s).' : 'Aucune séance Pix signalée pour cette classe.';
        } catch { if (current === generation) status.textContent = 'Séances Pix indisponibles pour cette classe.'; }
        finally { button.disabled = false; }
    });
    return { clear };
}

if (typeof document !== 'undefined') initTeacherPix();
