(() => {

    'use strict';

    const CONFIG = window.TECHNO_CONFIG;


    if (!CONFIG) {

        console.error(
            'TECHNO_CONFIG introuvable. Charge config.js avant techno.js.'
        );

        return;
    }



    /* =========================================================
       CONTEXTE DE LA PAGE

       Priorité :
       URL → attributs du <body>
       ========================================================= */

    function getPageContext() {

        const params =
            new URLSearchParams(
                window.location.search
            );

        const body =
            document.body;


        const establishmentId =

            params.get('etab') ||

            body?.dataset.etablissement ||

            '';


        const level =

            params.get('niveau') ||

            body?.dataset.niveau ||

            '';


        let group =

            params.get('groupe') ||

            body?.dataset.groupe ||

            '';


        const establishment =
            CONFIG.establishments[
                establishmentId
            ];


        if (!establishment) {

            console.error(
                `Établissement inconnu : "${establishmentId}"`
            );

            return null;
        }


        const levelConfig =
            establishment
                .courses?.[level];


        if (!levelConfig) {

            console.error(
                `Niveau inconnu : "${level}"`
            );

            return null;
        }


        let courseConfig =
            levelConfig;

        let groupLabel = '';


        /* Gestion des groupes */

        if (levelConfig.groups) {

            if (!group) {

                group =

                    levelConfig.defaultGroup ||

                    Object.keys(
                        levelConfig.groups
                    )[0];

            }


            courseConfig =
                levelConfig.groups[group];


            if (!courseConfig) {

                console.error(
                    `Groupe inconnu : "${group}"`
                );

                return null;
            }


            groupLabel =
                courseConfig.label ||
                group;
        }


        return {

            establishmentId,

            establishment,

            level,

            group,

            groupLabel,

            courseConfig
        };
    }



    /* =========================================================
       OUTILS DE DATE
       ========================================================= */

    function parseISODate(
        dateString
    ) {

        const [
            year,
            month,
            day
        ] =
            dateString
                .split('-')
                .map(Number);


        return new Date(

            year,

            month - 1,

            day,

            12,
            0,
            0,
            0
        );
    }



    function dateToString(
        date
    ) {

        const year =
            date.getFullYear();

        const month =
            String(
                date.getMonth() + 1
            ).padStart(2, '0');

        const day =
            String(
                date.getDate()
            ).padStart(2, '0');


        return (
            `${year}-${month}-${day}`
        );
    }



    function formatFrenchDate(
        dateString
    ) {

        const [
            year,
            month,
            day
        ] =
            dateString.split('-');


        return (
            `${day}/${month}/${year}`
        );
    }



    function todayString() {

        return dateToString(
            new Date()
        );
    }



    /* =========================================================
       VACANCES
       ========================================================= */

    function isInVacation(
        dateString
    ) {

        return CONFIG.vacations.some(

            vacation =>

                dateString >=
                    vacation.start

                &&

                dateString <=
                    vacation.end
        );
    }



    function getVacationName(
        dateString
    ) {

        const vacation =
            CONFIG.vacations.find(

                vacation =>

                    dateString >=
                        vacation.start

                    &&

                    dateString <=
                        vacation.end
            );


        return (
            vacation?.name || ''
        );
    }



    /* =========================================================
       SEMAINES A / B
       ========================================================= */

    function getWeekType(
        date
    ) {

        const reference =
            parseISODate(
                CONFIG
                    .academicYear
                    .weekAReference
            );


        const referenceUTC =
            Date.UTC(

                reference.getFullYear(),

                reference.getMonth(),

                reference.getDate()
            );


        const dateUTC =
            Date.UTC(

                date.getFullYear(),

                date.getMonth(),

                date.getDate()
            );


        const diffDays =
            Math.floor(

                (
                    dateUTC -
                    referenceUTC
                )

                / 86400000
            );


        const diffWeeks =
            Math.floor(
                diffDays / 7
            );


        return (
            Math.abs(
                diffWeeks % 2
            ) === 0
                ? 'A'
                : 'B'
        );
    }



    /* =========================================================
       VÉRIFIE SI UN CRÉNEAU A LIEU CE JOUR
       ========================================================= */

    function slotAppliesToDate(
        slot,
        date
    ) {

        if (
            date.getDay() !==
            slot.day
        ) {

            return false;
        }


        if (
            !slot.weeks ||
            slot.weeks === 'all'
        ) {

            return true;
        }


        return (
            getWeekType(date) ===
            slot.weeks
        );
    }



    /* =========================================================
       EXCEPTIONS

       Exemple dans config.js :

       exceptions: [
           {
               date: '2026-10-05',
               action: 'cancel',
               reason: 'Sortie scolaire'
           }
       ]

       Pour cibler seulement un cours
       lorsqu'il y en a deux le même jour :

       {
           date: '2026-10-05',
           time: '15h50 à 16h45',
           action: 'cancel',
           reason: 'Intervention'
       }
       ========================================================= */

    function getCourseException(
        courseConfig,
        dateString,
        time
    ) {

        return (
            courseConfig
                .exceptions || []
        ).find(

            exception => {

                if (
                    exception.date !==
                    dateString
                ) {

                    return false;
                }


                if (
                    exception.time &&

                    exception.time !==
                    time
                ) {

                    return false;
                }


                return true;
            }
        );
    }



    /* =========================================================
       RÉCUPÉRATION DES SÉANCES DANS LE HTML
       ========================================================= */

    function getSessionElement(
        sessionNumber
    ) {

        return (

            document.getElementById(
                `session${sessionNumber}`
            )

            ||

            document.querySelector(
                `[data-session="${sessionNumber}"]`
            )
        );
    }



    function getSessionTitle(
        sessionNumber
    ) {

        const session =
            getSessionElement(
                sessionNumber
            );


        if (!session) {

            return (
                `Séance ${sessionNumber} : À définir`
            );
        }


        /*
         * Permet éventuellement de forcer
         * un titre avec data-title.
         */

        if (
            session.dataset.title
        ) {

            return (
                session
                    .dataset
                    .title
                    .trim()
            );
        }


        /*
         * Sinon récupération automatique
         * du premier titre.
         */

        const title =
            session.querySelector(
                'h2, h1, h3'
            );


        return (

            title
                ?.textContent
                .trim()

            ||

            `Séance ${sessionNumber} : À définir`
        );
    }



    function getExistingSessionNumbers() {

        const numbers =
            new Set();


        document
            .querySelectorAll(
                '[id^="session"], [data-session]'
            )
            .forEach(

                element => {

                    const dataNumber =
                        Number(
                            element.dataset.session
                        );


                    const idMatch =
                        element.id
                            ?.match(
                                /^session(\d+)$/
                            );


                    const idNumber =
                        idMatch
                            ? Number(
                                idMatch[1]
                            )
                            : NaN;


                    const number =

                        Number.isFinite(
                            dataNumber
                        )

                        &&

                        dataNumber > 0

                            ? dataNumber

                            : idNumber;


                    if (
                        Number.isFinite(number)

                        &&

                        number > 0
                    ) {

                        numbers.add(
                            number
                        );
                    }
                }
            );


        return [...numbers]
            .sort(
                (a, b) =>
                    a - b
            );
    }



    /* =========================================================
       ÉTAT D'UNE DATE
       ========================================================= */

    function getEventStatus(
        courseConfig,
        dateString,
        time
    ) {

        const exception =
            getCourseException(

                courseConfig,

                dateString,

                time
            );


        /* Cours annulé */

        if (
            exception?.action ===
            'cancel'
        ) {

            return {

                type: 'closure',

                label:
                    exception.reason ||
                    'Cours annulé'
            };
        }


        /* Fermeture générale */

        if (
            CONFIG
                .globalClosures
                ?.[dateString]
        ) {

            return {

                type: 'closure',

                label:
                    CONFIG
                        .globalClosures[
                            dateString
                        ]
            };
        }


        /* Jour férié */

        if (
            CONFIG
                .holidays
                ?.[dateString]
        ) {

            return {

                type: 'holiday',

                label:
                    CONFIG
                        .holidays[
                            dateString
                        ]
            };
        }


        /* Vacances */

        if (
            isInVacation(
                dateString
            )
        ) {

            return {

                type: 'vacation',

                label:
                    getVacationName(
                        dateString
                    )
            };
        }


        return {

            type: 'session',

            label: ''
        };
    }



    /* =========================================================
       CRÉATION DE TOUTES LES DATES DE COURS
       ========================================================= */

    function buildCalendarEvents(
        context
    ) {

        const start =
            parseISODate(
                CONFIG
                    .academicYear
                    .start
            );


        const end =
            parseISODate(
                CONFIG
                    .academicYear
                    .end
            );


        const events = [];


        for (

            let date =
                new Date(start);

            date <= end;

            date.setDate(
                date.getDate() + 1
            )

        ) {


            const matchingSlots =

                (
                    context
                        .courseConfig
                        .slots || []
                )

                .map(

                    (slot, index) => ({

                        ...slot,

                        _index: index
                    })
                )

                .filter(

                    slot =>
                        slotAppliesToDate(
                            slot,
                            date
                        )
                )

                .sort(

                    (a, b) =>

                        (
                            a.order ??
                            a._index
                        )

                        -

                        (
                            b.order ??
                            b._index
                        )
                );


            if (
                matchingSlots.length ===
                0
            ) {

                continue;
            }


            const dateString =
                dateToString(
                    date
                );


            matchingSlots.forEach(

                slot => {

                    const status =
                        getEventStatus(

                            context
                                .courseConfig,

                            dateString,

                            slot.time
                        );


                    events.push({

                        date:
                            dateString,

                        time:
                            slot.time || '',

                        week:
                            getWeekType(date),

                        status:
                            status.type,

                        statusLabel:
                            status.label,

                        order:
                            slot.order ??
                            slot._index
                    });
                }
            );
        }


        /* Numérotation des vraies séances */

        let sessionNumber =

            Number(
                context
                    .courseConfig
                    .startSession || 1
            )

            - 1;


        events.forEach(

            event => {

                /*
                 * Vacances, jours fériés
                 * et cours annulés
                 * NE FONT PAS avancer
                 * le compteur.
                 */

                if (
                    event.status ===
                    'session'
                ) {

                    sessionNumber++;


                    event.sessionNumber =
                        sessionNumber;


                    event.title =
                        getSessionTitle(
                            sessionNumber
                        );
                }
            }
        );


        return events;
    }



    /* =========================================================
       AFFICHAGE DU CALENDRIER

       Nouvelle structure :
       DATE | HORAIRE | SÉANCE
       ========================================================= */

    function renderCalendar(
        context,
        events
    ) {

        const calendarBody =
            document.getElementById(
                'calendar-body'
            );


        if (!calendarBody) {

            return;
        }


        calendarBody.innerHTML = '';


        const today =
            todayString();


        /*
         * Première séance encore à venir.
         */

        const nextSession =
            events.find(

                event =>

                    event.status ===
                        'session'

                    &&

                    event.date >=
                        today
            );


        /*
         * Évite d'afficher deux fois
         * "Vacances" le même jour
         * lorsqu'il y a normalement
         * deux créneaux.
         */

        const renderedInactiveDates =
            new Set();



        events.forEach(

            event => {


                if (
                    event.status !==
                    'session'
                ) {

                    const key =
                        `${event.date}:${event.status}`;


                    if (
                        renderedInactiveDates
                            .has(key)
                    ) {

                        return;
                    }


                    renderedInactiveDates
                        .add(key);
                }



                const row =
                    document.createElement(
                        'tr'
                    );


                const dateCell =
                    document.createElement(
                        'td'
                    );


                const timeCell =
                    document.createElement(
                        'td'
                    );


                const descriptionCell =
                    document.createElement(
                        'td'
                    );


                row.dataset.date =
                    event.date;


                dateCell.className =
                    'calendar-date';


                timeCell.className =
                    'calendar-time';


                descriptionCell.className =
                    'calendar-description';


                dateCell.textContent =
                    formatFrenchDate(
                        event.date
                    );



                /* =============================================
                   JOUR DE COURS
                   ============================================= */

                if (
                    event.status ===
                    'session'
                ) {


                    timeCell.textContent =
                        event.time;


                    const target =
                        getSessionElement(
                            event.sessionNumber
                        );


                    /*
                     * Si le cours existe dans le HTML,
                     * son titre devient cliquable.
                     */

                    if (target) {

                        const link =
                            document.createElement(
                                'a'
                            );


                        link.href =
                            `#session${event.sessionNumber}`;


                        link.textContent =
                            event.title;


                        link.addEventListener(

                            'click',

                            eventClick => {

                                eventClick
                                    .preventDefault();


                                showSession(
                                    `session${event.sessionNumber}`
                                );
                            }
                        );


                        descriptionCell
                            .appendChild(
                                link
                            );

                    }

                    /*
                     * Le cours n'a pas encore été créé.
                     */

                    else {

                        const label =
                            document.createElement(
                                'span'
                            );


                        label.textContent =
                            event.title;


                        label.className =
                            'session-not-created';


                        descriptionCell
                            .appendChild(
                                label
                            );
                    }


                    row.classList.add(
                        'calendar-session'
                    );


                    /* Séance passée */

                    if (
                        event.date <
                        today
                    ) {

                        row.classList.add(
                            'past-session'
                        );
                    }


                    /* Séance du jour */

                    if (
                        event.date ===
                        today
                    ) {

                        row.classList.add(

                            'current-session',

                            'today'
                        );
                    }


                    /* Prochaine séance */

                    if (

                        nextSession

                        &&

                        event.sessionNumber ===
                            nextSession
                                .sessionNumber

                    ) {

                        row.classList.add(
                            'next-session'
                        );
                    }
                }


                /* =============================================
                   VACANCES / FÉRIÉS / FERMETURES
                   ============================================= */

                else {


                    timeCell.textContent =
                        '';


                    descriptionCell.textContent =
                        event.statusLabel;


                    row.classList.add(
                        event.status
                    );


                    if (

                        event.status ===
                            'holiday'

                        ||

                        event.status ===
                            'closure'

                    ) {

                        dateCell.classList.add(
                            'holiday'
                        );


                        descriptionCell
                            .classList
                            .add(
                                'holiday'
                            );
                    }


                    if (
                        event.status ===
                        'vacation'
                    ) {

                        dateCell.classList.add(
                            'vacation'
                        );


                        descriptionCell
                            .classList
                            .add(
                                'vacation'
                            );
                    }
                }


                if (
                    event.date ===
                    today
                ) {

                    row.classList.add(
                        'today'
                    );
                }


                calendarBody
                    .appendChild(
                        row
                    );
            }
        );


        updateCourseStatus(
            context,
            events
        );
    }



    /* =========================================================
       BANDEAU :
       AUJOURD'HUI / PROCHAINE SÉANCE

       Facultatif.
       Il suffira d'avoir :

       <div id="course-status"></div>
       ========================================================= */

    function updateCourseStatus(
        context,
        events
    ) {

        const statusElement =
            document.getElementById(
                'course-status'
            );


        if (!statusElement) {

            return;
        }


        const today =
            todayString();


        const todaySessions =
            events.filter(

                event =>

                    event.status ===
                        'session'

                    &&

                    event.date ===
                        today
            );


        let text = '';


        if (
            todaySessions.length > 0
        ) {


            if (
                todaySessions.length ===
                1
            ) {

                const event =
                    todaySessions[0];


                text =
                    `Aujourd'hui : ${event.title} — ${event.time}`;

            }

            else {

                text =
                    `Aujourd'hui : ${todaySessions.length} séances prévues`;
            }

        }

        else {


            const next =
                events.find(

                    event =>

                        event.status ===
                            'session'

                        &&

                        event.date >
                            today
                );


            if (next) {

                text =
                    `Prochaine séance : ${next.title} — ${formatFrenchDate(next.date)} à ${next.time}`;

            }

            else {

                text =
                    'Aucune autre séance prévue dans le calendrier.';
            }
        }


        statusElement.textContent =
            text;
    }



    /* =========================================================
       MENU AUTOMATIQUE

       Si #session-nav existe,
       plus besoin d'écrire ses liens à la main.
       ========================================================= */

    function buildSessionMenu() {

        const menu =
            document.getElementById(
                'session-nav'
            );


        if (!menu) {

            return;
        }


        menu.innerHTML = '';


        /* Calendrier */

        const calendarLink =
            document.createElement(
                'a'
            );


        calendarLink.href =
            '#calendar';


        calendarLink.textContent =
            '📅 Calendrier';


        calendarLink.dataset.target =
            'calendar';


        calendarLink.addEventListener(

            'click',

            event => {

                event.preventDefault();

                showSession(
                    'calendar'
                );
            }
        );


        menu.appendChild(
            calendarLink
        );


        /* Toutes les séances existantes */

        getExistingSessionNumbers()
            .forEach(

                sessionNumber => {

                    const link =
                        document.createElement(
                            'a'
                        );


                    link.href =
                        `#session${sessionNumber}`;


                    link.textContent =
                        getSessionTitle(
                            sessionNumber
                        );


                    link.dataset.target =
                        `session${sessionNumber}`;


                    link.addEventListener(

                        'click',

                        event => {

                            event.preventDefault();


                            showSession(
                                `session${sessionNumber}`
                            );
                        }
                    );


                    menu.appendChild(
                        link
                    );
                }
            );
    }



    /* =========================================================
       MENU HAMBURGER
       ========================================================= */

    function closeMenu() {

        document
            .getElementById(
                'session-nav'
            )
            ?.classList
            .remove(
                'open'
            );
    }



    function toggleMenu() {

        document
            .getElementById(
                'session-nav'
            )
            ?.classList
            .toggle(
                'open'
            );
    }



    /* =========================================================
       AFFICHAGE D'UNE SÉANCE
       ========================================================= */

    function showSession(
        sessionId,
        options = {}
    ) {

        const sections =
            document.querySelectorAll(
                '.content-section'
            );


        const target =
            document.getElementById(
                sessionId
            );


        if (!target) {

            console.warn(
                `Section introuvable : ${sessionId}`
            );

            return;
        }


        /* Cache toutes les sections */

        sections.forEach(

            section =>

                section
                    .classList
                    .remove(
                        'active'
                    )
        );


        /* Affiche la bonne */

        target.classList.add(
            'active'
        );


        /* Menu */

        document
            .querySelectorAll(
                '#session-nav a'
            )
            .forEach(

                link => {

                    link.classList.toggle(

                        'active',

                        link.dataset.target ===
                            sessionId
                    );
                }
            );


        closeMenu();


        /* URL */

        if (
            !options.noHistory
        ) {

            history.replaceState(

                null,

                '',

                `#${sessionId}`
            );
        }


        /* Mémoire locale */

        const match =
            sessionId.match(
                /^session(\d+)$/
            );


        if (match) {

            saveLastOpenedSession(
                Number(
                    match[1]
                )
            );
        }


        if (
            !options.noScroll
        ) {

            window.scrollTo({

                top: 0,

                behavior:
                    'smooth'
            });
        }
    }



    /* =========================================================
       MÉMOIRE LOCALE DU POSTE
       ========================================================= */

    let currentContext =
        null;



    function getStorageKey() {

        if (!currentContext) {

            return '';
        }


        return [

            'techno',

            currentContext
                .establishmentId,

            currentContext
                .level,

            currentContext
                .group ||
                'classe',

            'last-session'

        ].join(':');
    }



    function saveLastOpenedSession(
        sessionNumber
    ) {

        const key =
            getStorageKey();


        if (!key) {

            return;
        }


        try {

            localStorage.setItem(

                key,

                String(
                    sessionNumber
                )
            );

        }

        catch (error) {

            console.warn(
                'Impossible d\'enregistrer la progression locale.',
                error
            );
        }
    }



    function getLastOpenedSession() {

        const key =
            getStorageKey();


        if (!key) {

            return null;
        }


        try {

            const value =
                Number(
                    localStorage
                        .getItem(key)
                );


            return (

                Number.isFinite(value)

                &&

                value > 0

                    ? value

                    : null
            );
        }

        catch {

            return null;
        }
    }



    /* =========================================================
       BOUTON REPRENDRE

       Facultatif :
       <button id="resume-session"></button>
       ========================================================= */

    function updateResumeButton() {

        const button =
            document.getElementById(
                'resume-session'
            );


        if (!button) {

            return;
        }


        const last =
            getLastOpenedSession();


        if (!last) {

            button.hidden =
                true;

            return;
        }


        const next =
            last + 1;


        const target =
            getSessionElement(
                next
            );


        if (!target) {

            button.hidden =
                true;

            return;
        }


        button.hidden =
            false;


        button.textContent =
            `Reprendre : ${getSessionTitle(next)}`;


        button.onclick =
            () =>
                showSession(
                    `session${next}`
                );
    }



    /* =========================================================
       AFFICHAGE DU NOM DE L'ÉTABLISSEMENT
       ========================================================= */

    function updatePageLabels(
        context
    ) {

        const establishmentName =
            document.getElementById(
                'establishment-name'
            );


        const className =
            document.getElementById(
                'class-name'
            );


        if (
            establishmentName
        ) {

            establishmentName.textContent =
                context
                    .establishment
                    .label;
        }


        if (className) {

            const groupText =

                context.groupLabel

                    ? ` — ${context.groupLabel}`

                    : '';


            className.textContent =
                `${context.level}${groupText}`;
        }
    }



    /* =========================================================
       DÉMARRAGE
       ========================================================= */

    function init() {

        currentContext =
            getPageContext();


        if (!currentContext) {

            return;
        }


        updatePageLabels(
            currentContext
        );


        buildSessionMenu();


        const events =
            buildCalendarEvents(
                currentContext
            );


        renderCalendar(

            currentContext,

            events
        );


        updateResumeButton();


        /*
         * Si l'URL contient déjà
         * #session5 par exemple,
         * on ouvre directement la séance.
         */

        const hashTarget =
            window
                .location
                .hash
                .replace(
                    '#',
                    ''
                );


        if (

            hashTarget

            &&

            document.getElementById(
                hashTarget
            )

        ) {

            showSession(

                hashTarget,

                {
                    noHistory: true,
                    noScroll: true
                }
            );

        }

        else if (

            document.getElementById(
                'calendar'
            )

        ) {

            showSession(

                'calendar',

                {
                    noHistory: true,
                    noScroll: true
                }
            );
        }
    }



    /* =========================================================
       FONCTIONS ACCESSIBLES DEPUIS LE HTML
       ========================================================= */

    window.showSession =
        showSession;


    window.toggleMenu =
        toggleMenu;


    window.closeMenu =
        closeMenu;



    document.addEventListener(

        'DOMContentLoaded',

        init
    );

})();