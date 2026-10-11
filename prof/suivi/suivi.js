(() => {
    'use strict';
    const GROUPS = { tim: [['cheval', '4e/3e cheval'], ['multi', '3e multi-métiers'], ['capa1', 'CAPa 1'], ['capa2', 'CAPa 2'], ['2de', '2de Pro'], ['bp1a', 'Bac Pro 1 A'], ['bp1b', 'Bac Pro 1 B'], ['bp2a', 'Bac Pro 2 A'], ['bp2b', 'Bac Pro 2 B'], ['bts1', 'BTS ACS’AGRI 1'], ['bts2', 'BTS ACS’AGRI 2']], maths: [['cheval', '4e/3e cheval'], ['multi', '3e multi-métiers'], ['2de', '2de Pro'], ['bp1a', 'Bac Pro 1 A'], ['bp1b', 'Bac Pro 1 B'], ['bp2a', 'Bac Pro 2 A'], ['bp2b', 'Bac Pro 2 B']] };
    // const URLS = { tim: { cheval: '/mfr/3/', multi: '/mfr/3/', capa1: '/mfr/cap1/', capa2: '/mfr/cap2/', '2de': '/mfr/2de/', bp1a: '/mfr/1re/', bp1b: '/mfr/1re/', bp2a: '/mfr/term/', bp2b: '/mfr/term/', bts1: '/mfr/bts1/', bts2: '/mfr/bts2/' }, maths: { cheval: '/mfr/maths/4e-3e/', multi: '/mfr/maths/4e-3e/', '2de': '/mfr/maths/2de/', bp1a: '/mfr/maths/bacpro1/', bp1b: '/mfr/maths/bacpro1/', bp2a: '/mfr/maths/bacpro2/', bp2b: '/mfr/maths/bacpro2/' } };

    const URLS = {
        tim: {
            cheval: '/mfr/3/index.html',
            multi: '/mfr/3/index.html',
            capa1: '/mfr/capa1/index.html',
            capa2: '/mfr/capa2/index.html',
            '2de': '/mfr/2nd/index.html',
            bp1a: '/mfr/bacpro1/index.html',
            bp1b: '/mfr/bacpro1/index.html',
            bp2a: '/mfr/bacpro2/index.html',
            bp2b: '/mfr/bacpro2/index.html',
            bts1: '/mfr/bts1/index.html',
            bts2: '/mfr/bts2/index.html'
        },
        maths: {
            cheval: '/mfr/maths/4e-3e/index.html',
            multi: '/mfr/maths/4e-3e/index.html',
            '2de': '/mfr/maths/2nd/index.html',
            bp1a: '/mfr/maths/bacpro1/index.html',
            bp1b: '/mfr/maths/bacpro1/index.html',
            bp2a: '/mfr/maths/bacpro2/index.html',
            bp2b: '/mfr/maths/bacpro2/index.html'
        }
    };

    const KEY = 'mfr-prof-suivi-v1';
    const $ = id => document.getElementById(id); let state;
    try { state = JSON.parse(localStorage.getItem(KEY)) || {}; } catch { state = {}; } if (!state.groups) state.groups = {}; if (!state.planning) state.planning = [];
    const save = () => localStorage.setItem(KEY, JSON.stringify(state)); const key = () => `${$('subject').value}:${$('group').value}`;
    const bucket = () => { const k = key(); return state.groups[k] || (state.groups[k] = { total: null, done: {}, lessons: {} }); };
    const sNum = n => 'S' + String(n).padStart(2, '0'); const distinctSlot = x => `${x.date}|${x.start}|${x.end}|${x.subject}|${x.group}`;
    function groupOptions() { $('group').replaceChildren(); for (const [id, label] of GROUPS[$('subject').value]) { $('group').add(new Option(label, id)); } render(); }
    function groupFromLabel(s) { const t = s.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); if (/4EME EA|3EME EA A CHEVAL/.test(t)) return 'cheval'; if (/3EME EA B MULTI/.test(t)) return 'multi'; if (/CAPA?\s*1/.test(t)) return 'capa1'; if (/CAPA?\s*2/.test(t)) return 'capa2'; if (/BACPRO\s*1\s*A/.test(t)) return 'bp1a'; if (/BACPRO\s*1\s*B/.test(t)) return 'bp1b'; if (/BACPRO\s*2\s*A/.test(t)) return 'bp2a'; if (/BACPRO\s*2\s*B/.test(t)) return 'bp2b'; if (/BTS\s*1/.test(t)) return 'bts1'; if (/BTS\s*2/.test(t)) return 'bts2'; if (/2NDE|SECONDE|2DE/.test(t)) return '2de'; return null; }
    function parsePlanning(html) { const doc = new DOMParser().parseFromString(html, 'text/html'); const result = []; for (const node of doc.querySelectorAll('[data-jour][data-min_debut][data-min_fin]')) { const text = node.textContent.replace(/\s+/g, ' ').trim(); const match = text.match(/Cours\s*:\s*(.*?)\s*-\s*(.*?)\s+salle\s*:/i); if (!match) continue; const group = groupFromLabel(match[1]); const mat = match[2]; const subject = /MATHS|MATHEMATIQUES/i.test(mat) ? 'maths' : /TIM|INFORMATIQUE/i.test(mat) ? 'tim' : null; if (!subject || !group || !GROUPS[subject].some(x => x[0] === group)) continue; const date = node.dataset.jour; const start = Number(node.dataset.min_debut), end = Number(node.dataset.min_fin); if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(start) || !Number.isFinite(end) || end <= start) continue; result.push({ date, start, end, subject, group }); } return result; }
    // Merge duplicate group entries and adjoining one-hour segments into a single appointment.
    function normalizeSlots(input) { const slots = [...new Map(input.map(x => [distinctSlot(x), x])).values()].sort((a, b) => a.date.localeCompare(b.date) || a.start - b.start); const result = []; for (const x of slots) { const prev = result[result.length - 1]; if (prev && prev.date === x.date && prev.subject === x.subject && prev.group === x.group && x.start <= prev.end) { prev.end = Math.max(prev.end, x.end); } else result.push({ ...x }); } return result; }
    const clock = n => `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;
    function render() {
        const b = bucket(), done = Object.values(b.done).filter(Boolean).length, lessons = Object.keys(b.lessons).map(Number).sort((a, b) => a - b); let n = 1; while (b.done[n]) n++;
        $('done').textContent = done; $('remaining').textContent = b.total == null ? '—' : Math.max(0, b.total - done); $('ready').textContent = lessons.length; $('next').textContent = sNum(n); $('total').value = b.total ?? '';
        const count = Math.max(b.total || 0, ...lessons, ...Object.keys(b.done).map(Number), n, 0); $('sessions').replaceChildren(); for (let i = 1; i <= count; i++) { const row = document.createElement('div'); row.className = 'session'; const main = document.createElement('div'); main.className = 'session-main'; const title = document.createElement('strong'); title.textContent = `${sNum(i)} — ${b.lessons[i]?.title || 'Séance non détectée'}`; const meta = document.createElement('small'); meta.textContent = b.lessons[i] ? 'Présente sur le site' : 'Non détectée sur le site'; main.append(title, meta); const btn = document.createElement('button'); btn.className = 'mark' + (b.done[i] ? ' done' : ''); btn.textContent = b.done[i] ? '✓ Faite' : 'À faire'; btn.onclick = () => { if (b.done[i]) delete b.done[i]; else b.done[i] = new Date().toISOString(); save(); render(); }; row.append(main, btn); $('sessions').append(row); }
        // const selected = state.planning.filter(x => x.subject === $('subject').value && x.group === $('group').value).sort((a, b) => a.date.localeCompare(b.date) || a.start - b.start); $('schedule').replaceChildren(); if (!selected.length) { $('schedule').textContent = 'Aucun créneau importé pour ce groupe.'; return; }

        const now = new Date();
        const today = [
            now.getFullYear(),
            String(now.getMonth() + 1).padStart(2, '0'),
            String(now.getDate()).padStart(2, '0')
        ].join('-');

        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        const selected = state.planning
            .filter(x =>
                x.subject === $('subject').value &&
                x.group === $('group').value &&
                (
                    x.date > today ||
                    (x.date === today && x.end > currentMinutes)
                )
            )
            .sort((a, b) =>
                a.date.localeCompare(b.date) ||
                a.start - b.start
            );

        const pending = Array.from({ length: Math.max(selected.length, 1) }, (_, i) => i + 1).filter(i => !b.done[i]); let next = n; for (const slot of selected) { const row = document.createElement('div'); row.className = 'slot'; const left = document.createElement('div'); const label = document.createElement('strong'); label.textContent = `${slot.date} · ${clock(slot.start)}–${clock(slot.end)}`; const note = document.createElement('small'); note.textContent = 'Créneau importé (prévision, non preuve de réalisation)'; left.append(label, note); const right = document.createElement('span'); right.textContent = `Séance suggérée : ${sNum(next)}`; row.append(left, right); $('schedule').append(row); next++; while (b.done[next]) next++; }
    }
    async function scan() { const subject = $('subject').value, group = $('group').value, url = URLS[subject][group], b = bucket(); $('import-message').textContent = `Lecture de ${url}…`; try { const response = await fetch(url, { cache: 'no-store' }); if (!response.ok) throw Error('HTTP ' + response.status); const doc = new DOMParser().parseFromString(await response.text(), 'text/html'); const elements = doc.querySelectorAll('section[id^="session"]'); if (!elements.length) throw Error('Aucune section sessionX trouvée'); let count = 0; for (const el of elements) { const m = el.id.match(/^session(\d+)$/i); if (!m) continue; const n = Number(m[1]); if (!n) continue; const raw = el.dataset.sessionTitle || el.querySelector('h1,h2,h3')?.textContent || ''; const title = raw.trim().replace(/^séance\s*\d+\s*[-:–—]?\s*/i, '').replace(/\s*[-—]\s*PROF$/i, '').trim(); b.lessons[n] = { title: title || `Séance ${n}`, url }; count++; } save(); render(); $('import-message').textContent = `${count} séance(s) détectée(s) sur ${url}.`; } catch (e) { $('import-message').textContent = `Détection impossible sur ${url} : ${e.message}. Vérifier l'adresse ou l'existence des sections.`; } }
    $('subject').onchange = groupOptions; $('group').onchange = render; $('total').onchange = () => { const n = Number($('total').value); bucket().total = Number.isInteger(n) && n > 0 ? n : null; save(); render(); }; $('scan').onclick = scan;
    $('planning-file').onchange = async e => { const f = e.target.files[0]; if (!f) return; const parsed = parsePlanning(await f.text()); if (!parsed.length) { $('import-message').textContent = 'Aucun cours compatible trouvé dans ce HTML. Aucun planning modifié.'; return; } const before = state.planning.length; state.planning = normalizeSlots([...state.planning, ...parsed]); save(); render(); $('import-message').textContent = `${parsed.length} entrées identifiées, ${state.planning.length} créneaux distincts au total (ancien total : ${before}).`; e.target.value = ''; };
    $('export').onclick = () => { const blob = new Blob([JSON.stringify({ format: 'mfr-prof-suivi', version: 1, exportedAt: new Date().toISOString(), data: state }, null, 2)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `suivi-mfr-${new Date().toISOString().slice(0, 10)}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); };
    $('restore').onchange = async e => { try { const f = e.target.files[0]; if (!f) return; const obj = JSON.parse(await f.text()); if (obj.format !== 'mfr-prof-suivi' || obj.version !== 1 || !obj.data || typeof obj.data.groups !== 'object' || !Array.isArray(obj.data.planning)) throw Error('Format de sauvegarde incompatible'); if (!confirm('Remplacer le suivi local actuel par cette sauvegarde ?')) return; state = obj.data; save(); render(); $('import-message').textContent = 'Sauvegarde restaurée.'; } catch (err) { $('import-message').textContent = `Restauration refusée : ${err.message}`; } finally { e.target.value = ''; } };
    groupOptions();
})();
