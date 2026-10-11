
(() => {
    'use strict';

    const GROUPS = {
        tim: [
            ['cheval', '4e/3e cheval'],
            ['multi', '3e multi-métiers'],
            ['capa1', 'CAPa 1'],
            ['capa2', 'CAPa 2'],
            ['2de', '2de Pro'],
            ['bp1a', 'Bac Pro 1 A'],
            ['bp1b', 'Bac Pro 1 B'],
            ['bp2a', 'Bac Pro 2 A'],
            ['bp2b', 'Bac Pro 2 B'],
            ['bts1', 'BTS ACS’AGRI 1'],
            ['bts2', 'BTS ACS’AGRI 2']
        ],
        maths: [
            ['cheval', '4e/3e cheval'],
            ['multi', '3e multi-métiers'],
            ['2de', '2de Pro'],
            ['bp1a', 'Bac Pro 1 A'],
            ['bp1b', 'Bac Pro 1 B'],
            ['bp2a', 'Bac Pro 2 A'],
            ['bp2b', 'Bac Pro 2 B']
        ]
    };

    // Chemins actuellement fonctionnels sur ton site.
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
    const $ = id => document.getElementById(id);

    let state;

    try {
        state = JSON.parse(localStorage.getItem(KEY)) || {};
    } catch {
        state = {};
    }

    if (!state.groups || typeof state.groups !== 'object') {
        state.groups = {};
    }

    if (!Array.isArray(state.planning)) {
        state.planning = [];
    }

    function save() {
        try {
            localStorage.setItem(KEY, JSON.stringify(state));
            return true;
        } catch (error) {
            console.error('Sauvegarde locale impossible :', error);
            $('import-message').textContent =
                'Attention : sauvegarde locale impossible. Exporte une copie JSON.';
            return false;
        }
    }

    function key() {
        return `${$('subject').value}:${$('group').value}`;
    }

    function bucket() {
        const k = key();

        if (!state.groups[k]) {
            state.groups[k] = {
                total: null,
                done: {},
                lessons: {}
            };
        }

        return state.groups[k];
    }

    function sNum(n) {
        return 'S' + String(n).padStart(2, '0');
    }

    function distinctSlot(x) {
        return [
            x.date,
            x.start,
            x.end,
            x.subject,
            x.group
        ].join('|');
    }

    function groupOptions() {
        $('group').replaceChildren();

        const subject = $('subject').value;

        for (const [id, label] of GROUPS[subject]) {
            $('group').add(new Option(label, id));
        }

        render();
    }

    // Normalisation des intitulés venant d'iPlanning.
    function normalizeText(value) {
        return String(value || '')
            .toUpperCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[\u2019']/g, ' ')
            .replace(/[-_/]+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    /*
     * Identification des groupes MFR.
     *
     * 4EME EA + 3EME EA A cheval :
     *     un même groupe pédagogique "cheval".
     *
     * 3EME EA B multi-métiers :
     *     groupe indépendant "multi".
     *
     * Les intitulés ambigus sont ignorés plutôt
     * que d'être attribués au mauvais groupe.
     */
    function groupFromLabel(label) {
        const t = normalizeText(label);

        // Multi-métiers : priorité absolue.
        if (
            /\b3\s*(?:EME|E)\b/.test(t) &&
            (
                /\bMULTI\b/.test(t) ||
                /\bMETIERS\b/.test(t)
            )
        ) {
            return 'multi';
        }

        // Autre écriture possible du groupe B.
        if (
            /\b3\s*(?:EME|E)\b/.test(t) &&
            /\bEA\s+B\b/.test(t)
        ) {
            return 'multi';
        }

        // 4EME EA, toujours avec les 3e cheval.
        if (
            /\b4\s*(?:EME|E)\b/.test(t) &&
            /\bEA\b/.test(t)
        ) {
            return 'cheval';
        }

        // 3EME EA A cheval.
        if (
            /\b3\s*(?:EME|E)\b/.test(t) &&
            (
                /\bEA\s+A\b/.test(t) ||
                /\bCHEVAL\b/.test(t)
            )
        ) {
            return 'cheval';
        }

        // Autres groupes.
        if (/\bCAP\s*A?\s*1\b/.test(t)) return 'capa1';
        if (/\bCAP\s*A?\s*2\b/.test(t)) return 'capa2';

        if (/\bBAC\s*PRO\s*1\s*A\b/.test(t)) return 'bp1a';
        if (/\bBAC\s*PRO\s*1\s*B\b/.test(t)) return 'bp1b';
        if (/\bBAC\s*PRO\s*2\s*A\b/.test(t)) return 'bp2a';
        if (/\bBAC\s*PRO\s*2\s*B\b/.test(t)) return 'bp2b';

        if (/\bBTS\s*1\b/.test(t)) return 'bts1';
        if (/\bBTS\s*2\b/.test(t)) return 'bts2';

        if (/\b(?:2NDE|SECONDE|2DE)\b/.test(t)) {
            return '2de';
        }

        return null;
    }

    function subjectFromLabel(label) {
        const t = normalizeText(label);

        if (/\bMATHS?\b|\bMATHEMATIQUES\b/.test(t)) {
            return 'maths';
        }

        if (/\bTIM\b|\bINFORMATIQUE\b/.test(t)) {
            return 'tim';
        }

        return null;
    }

    /*
     * Analyse locale du fichier HTML iPlanning.
     *
     * Le contenu du planning n'est jamais envoyé
     * vers un serveur.
     */
    function parsePlanning(html) {
        const doc = new DOMParser().parseFromString(
            html,
            'text/html'
        );

        const result = [];

        const stats = {
            examined: 0,
            recognized: 0,
            ignored: 0
        };

        const nodes = doc.querySelectorAll(
            '[data-jour][data-min_debut]'
        );

        for (const node of nodes) {
            const text = node.textContent
                .replace(/\s+/g, ' ')
                .trim();

            if (!/\bCours\s*:/i.test(text)) {
                continue;
            }

            stats.examined++;

            /*
             * Exemple :
             * Cours : 3EME EA B multi-métiers - MATHS
             * Mathématiques
             * salle : SALLE 5
             */
            const match = text.match(
                /Cours\s*:\s*(.*?)\s+-\s+(.*?)(?=\s+salle\s*:|$)/i
            );

            if (!match) {
                stats.ignored++;
                continue;
            }

            const groupLabel = match[1];
            const subjectLabel = match[2];

            const group = groupFromLabel(groupLabel);
            const subject = subjectFromLabel(subjectLabel);

            if (
                !group ||
                !subject ||
                !GROUPS[subject].some(([id]) => id === group)
            ) {
                stats.ignored++;
                continue;
            }

            const date = node.dataset.jour;
            const start = Number(node.dataset.min_debut);

            let end = Number(node.dataset.min_fin);

            // Certaines versions d'iPlanning indiquent
            // la durée plutôt que la minute de fin.
            if (
                !Number.isFinite(end) ||
                !node.hasAttribute('data-min_fin')
            ) {
                const duration = Number(node.dataset.duree);

                if (Number.isFinite(duration)) {
                    end = start + duration;
                }
            }

            if (
                !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
                !Number.isFinite(start) ||
                !Number.isFinite(end) ||
                start < 0 ||
                end > 1440 ||
                end <= start
            ) {
                stats.ignored++;
                continue;
            }

            result.push({
                date,
                start,
                end,
                subject,
                group
            });

            stats.recognized++;
        }

        return { slots: result, stats };
    }

    /*
     * Fusion :
     * - doublons exacts ;
     * - cours chevauchants ;
     * - cours consécutifs.
     *
     * Uniquement lorsque date, matière et groupe
     * sont tous identiques.
     */
    function normalizeSlots(input) {
        const unique = [
            ...new Map(
                input.map(x => [distinctSlot(x), { ...x }])
            ).values()
        ];

        unique.sort((a, b) =>
            a.date.localeCompare(b.date) ||
            a.subject.localeCompare(b.subject) ||
            a.group.localeCompare(b.group) ||
            a.start - b.start ||
            a.end - b.end
        );

        const result = [];

        for (const slot of unique) {
            const previous = result[result.length - 1];

            if (
                previous &&
                previous.date === slot.date &&
                previous.subject === slot.subject &&
                previous.group === slot.group &&
                slot.start <= previous.end
            ) {
                previous.end = Math.max(
                    previous.end,
                    slot.end
                );
            } else {
                result.push({ ...slot });
            }
        }

        return result.sort((a, b) =>
            a.date.localeCompare(b.date) ||
            a.start - b.start ||
            a.subject.localeCompare(b.subject) ||
            a.group.localeCompare(b.group)
        );
    }

    function clock(minutes) {
        return (
            String(Math.floor(minutes / 60)).padStart(2, '0') +
            ':' +
            String(minutes % 60).padStart(2, '0')
        );
    }

    /*
     * Créneaux à venir.
     *
     * Les créneaux terminés ne sont plus affichés,
     * mais restent enregistrés dans le JSON.
     */
    function futureSlots(subject, group) {
        const now = new Date();

        const today = [
            now.getFullYear(),
            String(now.getMonth() + 1).padStart(2, '0'),
            String(now.getDate()).padStart(2, '0')
        ].join('-');

        const currentMinutes =
            now.getHours() * 60 + now.getMinutes();

        return state.planning
            .filter(slot =>
                slot.subject === subject &&
                slot.group === group &&
                (
                    slot.date > today ||
                    (
                        slot.date === today &&
                        slot.end > currentMinutes
                    )
                )
            )
            .sort((a, b) =>
                a.date.localeCompare(b.date) ||
                a.start - b.start
            );
    }

    function render() {
        const b = bucket();

        const done = Object.values(b.done)
            .filter(Boolean)
            .length;

        const lessons = Object.keys(b.lessons)
            .map(Number)
            .filter(Number.isFinite)
            .sort((a, b) => a - b);

        let nextNumber = 1;

        while (b.done[nextNumber]) {
            nextNumber++;
        }

        $('done').textContent = done;

        $('remaining').textContent =
            b.total == null
                ? '—'
                : Math.max(0, b.total - done);

        $('ready').textContent = lessons.length;
        $('next').textContent = sNum(nextNumber);
        $('total').value = b.total ?? '';

        const doneNumbers = Object.keys(b.done)
            .map(Number)
            .filter(Number.isFinite);

        const count = Math.max(
            b.total || 0,
            ...lessons,
            ...doneNumbers,
            nextNumber,
            0
        );

        $('sessions').replaceChildren();

        for (let i = 1; i <= count; i++) {
            const row = document.createElement('div');
            row.className = 'session';

            const main = document.createElement('div');
            main.className = 'session-main';

            const title = document.createElement('strong');

            title.textContent =
                `${sNum(i)} — ` +
                (b.lessons[i]?.title ||
                    'Séance non détectée');

            const meta = document.createElement('small');

            meta.textContent = b.lessons[i]
                ? 'Présente sur le site'
                : 'Non détectée sur le site';

            main.append(title, meta);

            const button = document.createElement('button');

            button.className =
                'mark' + (b.done[i] ? ' done' : '');

            button.textContent =
                b.done[i] ? '✓ Faite' : 'À faire';

            button.onclick = () => {
                if (b.done[i]) {
                    delete b.done[i];
                } else {
                    b.done[i] = new Date().toISOString();
                }

                save();
                render();
            };

            row.append(main, button);
            $('sessions').append(row);
        }

        // Planning à venir pour le groupe sélectionné.
        const selected = futureSlots(
            $('subject').value,
            $('group').value
        );

        $('schedule').replaceChildren();

        if (!selected.length) {
            $('schedule').textContent =
                'Aucun créneau à venir pour ce groupe.';
            return;
        }

        let suggested = nextNumber;

        for (const slot of selected) {
            const row = document.createElement('div');
            row.className = 'slot';

            const left = document.createElement('div');

            const label = document.createElement('strong');

            label.textContent =
                `${slot.date} · ` +
                `${clock(slot.start)}–${clock(slot.end)}`;

            const note = document.createElement('small');

            note.textContent =
                'Créneau importé ' +
                '(prévision, non preuve de réalisation)';

            left.append(label, note);

            const right = document.createElement('span');

            right.textContent =
                `Séance suggérée : ${sNum(suggested)}`;

            row.append(left, right);
            $('schedule').append(row);

            suggested++;

            while (b.done[suggested]) {
                suggested++;
            }
        }
    }

    /*
     * Détection des séances disponibles
     * sur le site GitHub Pages.
     */
    async function scan() {
        const subject = $('subject').value;
        const group = $('group').value;

        const url = URLS[subject][group];
        const b = bucket();

        $('import-message').textContent =
            `Lecture de ${url}…`;

        try {
            const response = await fetch(url, {
                cache: 'no-store'
            });

            if (!response.ok) {
                throw new Error('HTTP ' + response.status);
            }

            const html = await response.text();

            const doc = new DOMParser().parseFromString(
                html,
                'text/html'
            );

            const elements = doc.querySelectorAll(
                'section[id^="session"]'
            );

            if (!elements.length) {
                throw new Error(
                    'Aucune section sessionX trouvée'
                );
            }

            let count = 0;
            const detected = {};

            for (const element of elements) {
                const match = element.id.match(
                    /^session(\d+)$/i
                );

                if (!match) continue;

                const number = Number(match[1]);

                if (!number) continue;

                const raw =
                    element.dataset.sessionTitle ||
                    element.querySelector('h1,h2,h3')
                        ?.textContent ||
                    '';

                const title = raw
                    .trim()
                    .replace(
                        /^séance\s*\d+\s*[-:–—]?\s*/i,
                        ''
                    )
                    .replace(
                        /\s*[-—]\s*PROF$/i,
                        ''
                    )
                    .trim();

                detected[number] = {
                    title: title || `Séance ${number}`,
                    url
                };

                count++;
            }

            // Actualisation des cours détectés uniquement.
            // Les séances cochées ne sont pas modifiées.
            b.lessons = detected;

            save();
            render();

            $('import-message').textContent =
                `${count} séance(s) détectée(s) sur ${url}.`;

        } catch (error) {
            console.error(error);

            $('import-message').textContent =
                `Détection impossible sur ${url} : ` +
                `${error.message}.`;
        }
    }

    /*
     * Création automatique du bouton
     * "Remplacer le planning".
     *
     * Aucune modification de index.html nécessaire.
     */
    function createReplaceButton() {
        const importInput = $('planning-file');

        if (!importInput) return;

        const button = document.createElement('button');

        button.type = 'button';
        button.id = 'replace-planning';
        button.textContent = 'Remplacer le planning';

        button.title =
            'Effacer uniquement les créneaux importés, ' +
            'sans supprimer les séances cochées';

        button.style.margin = '0 8px';
        button.style.padding = '10px 14px';
        button.style.border = '1px solid #cbd5e1';
        button.style.borderRadius = '8px';
        button.style.background = '#fff';
        button.style.cursor = 'pointer';

        // Insérer à proximité du bouton d'import existant.
        const anchor =
            importInput.closest('label') || importInput;

        anchor.insertAdjacentElement('afterend', button);

        button.onclick = () => {
            if (!state.planning.length) {
                $('import-message').textContent =
                    'Le planning est déjà vide.';
                return;
            }

            const confirmed = confirm(
                'Remplacer le planning importé ?\n\n' +
                'Tous les anciens créneaux seront effacés.\n' +
                'Les séances cochées et les cours détectés ' +
                'seront conservés.\n\n' +
                'Tu pourras ensuite importer le nouveau HTML.'
            );

            if (!confirmed) return;

            const previous = state.planning.length;

            state.planning = [];

            save();
            render();

            $('import-message').textContent =
                `${previous} créneau(x) supprimé(s). ` +
                'Les séances cochées sont conservées. ' +
                'Tu peux importer le nouveau planning HTML.';
        };
    }

    // Sélection de la matière.
    $('subject').addEventListener(
        'change',
        groupOptions
    );

    // Sélection du groupe.
    $('group').addEventListener(
        'change',
        render
    );

    // Nombre total de séances prévues.
    $('total').addEventListener('change', () => {
        const n = Number($('total').value);

        bucket().total =
            Number.isInteger(n) && n > 0
                ? n
                : null;

        save();
        render();
    });

    // Détection des cours du site.
    $('scan').addEventListener('click', scan);

    /*
     * Import du planning HTML.
     *
     * Par défaut, le nouveau planning est ajouté
     * à celui déjà présent, avec suppression
     * des doublons.
     */
    $('planning-file').addEventListener(
        'change',
        async event => {
            const file = event.target.files[0];

            if (!file) return;

            try {
                const { slots, stats } = parsePlanning(
                    await file.text()
                );

                if (!slots.length) {
                    $('import-message').textContent =
                        'Aucun cours compatible trouvé ' +
                        'dans ce HTML. ' +
                        'Aucun planning modifié.';
                    return;
                }

                const previous = state.planning.length;

                state.planning = normalizeSlots([
                    ...state.planning,
                    ...slots
                ]);

                save();
                render();

                $('import-message').textContent =
                    `${stats.recognized} entrée(s) reconnue(s), ` +
                    `${stats.ignored} ignorée(s). ` +
                    `${state.planning.length} créneau(x) ` +
                    `distinct(s) au total ` +
                    `(ancien total : ${previous}).`;

            } catch (error) {
                console.error(error);

                $('import-message').textContent =
                    'Erreur lors de la lecture du planning : ' +
                    error.message;

            } finally {
                event.target.value = '';
            }
        }
    );

    /*
     * Export JSON.
     *
     * Format compatible avec les sauvegardes V1.
     */
    $('export').addEventListener('click', () => {
        const backup = {
            format: 'mfr-prof-suivi',
            version: 1,
            exportedAt: new Date().toISOString(),
            data: state
        };

        const blob = new Blob(
            [JSON.stringify(backup, null, 2)],
            { type: 'application/json' }
        );

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;

        link.download =
            'suivi-mfr-' +
            new Date().toISOString().slice(0, 10) +
            '.json';

        document.body.appendChild(link);
        link.click();
        link.remove();

        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 1000);
    });

    /*
     * Restauration d'une sauvegarde JSON.
     */
    $('restore').addEventListener(
        'change',
        async event => {
            try {
                const file = event.target.files[0];

                if (!file) return;

                const obj = JSON.parse(await file.text());

                if (
                    obj.format !== 'mfr-prof-suivi' ||
                    obj.version !== 1 ||
                    !obj.data ||
                    typeof obj.data.groups !== 'object' ||
                    !Array.isArray(obj.data.planning)
                ) {
                    throw new Error(
                        'Format de sauvegarde incompatible'
                    );
                }

                if (!confirm(
                    'Remplacer le suivi local actuel ' +
                    'par cette sauvegarde ?'
                )) {
                    return;
                }

                state = obj.data;

                save();
                render();

                $('import-message').textContent =
                    'Sauvegarde restaurée.';

            } catch (error) {
                console.error(error);

                $('import-message').textContent =
                    'Restauration refusée : ' +
                    error.message;

            } finally {
                event.target.value = '';
            }
        }
    );

    // Initialisation.
    createReplaceButton();
    groupOptions();
})();
