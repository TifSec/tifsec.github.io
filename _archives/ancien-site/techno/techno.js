(() => {

    'use strict';

    let level = 'classe';
    let group = 'classe';
    let STORAGE_KEY = '';


    /* =========================================================
       IDENTIFICATION
       ========================================================= */

    function getLevel() {

        const body = document.body;

        if (!body) {
            return 'classe';
        }

        if (body.dataset.niveau) {
            return body.dataset.niveau;
        }

        const match =
            body.className.match(
                /niveau-(5e|4e|3e)/
            );

        return match ? match[1] : 'classe';
    }


    function getGroup() {

        const params =
            new URLSearchParams(
                window.location.search
            );

        return (
            params.get('groupe')
            ||
            document.body?.dataset.groupe
            ||
            'classe'
        );
    }


    /* =========================================================
       MÉMOIRE
       ========================================================= */

    function getLastCompletedSession() {

        const value =
            Number(
                localStorage.getItem(
                    STORAGE_KEY
                )
            );

        return Number.isFinite(value)
            ? value
            : 0;
    }


    function saveLastCompletedSession(number) {

        localStorage.setItem(
            STORAGE_KEY,
            String(number)
        );
    }


    /* =========================================================
       SÉANCES
       ========================================================= */

    function getSessionElement(number) {

        return (
            document.getElementById(
                `session${number}`
            )
            ||
            document.querySelector(
                `[data-session="${number}"]`
            )
        );
    }


    function getSessionTitle(number) {

        const session =
            getSessionElement(number);

        if (!session) {
            return `Séance ${number}`;
        }

        if (session.dataset.title) {
            return session.dataset.title.trim();
        }

        const title =
            session.querySelector(
                'h2, h1, h3'
            );

        return (
            title?.textContent.trim()
            ||
            `Séance ${number}`
        );
    }


    function getSessionNumbers() {

        const numbers = [];

        document
            .querySelectorAll(
                '[id^="session"]'
            )
            .forEach(element => {

                const match =
                    element.id.match(
                        /^session(\d+)$/
                    );

                if (match) {
                    numbers.push(
                        Number(match[1])
                    );
                }

            });

        return numbers.sort(
            (a, b) => a - b
        );
    }


    /* =========================================================
       AFFICHAGE D'UNE SECTION
       ========================================================= */

    function showSession(sessionId) {

        document
            .querySelectorAll(
                '.content-section'
            )
            .forEach(section => {

                section.classList.remove(
                    'active'
                );

            });


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


        target.classList.add(
            'active'
        );


        document
            .getElementById(
                'session-nav'
            )
            ?.classList
            .remove('open');


        document
            .querySelectorAll(
                '#session-nav a'
            )
            .forEach(link => {

                link.classList.toggle(
                    'active',
                    link.dataset.target ===
                        sessionId
                );

            });
    }


    /* =========================================================
       VALIDATION
       ========================================================= */

    function completeSession(number) {

        const current =
            getLastCompletedSession();

        if (number > current) {

            saveLastCompletedSession(
                number
            );
        }

        buildProgression();

        showSession('calendar');
    }


    /* =========================================================
       BOUTONS "SÉANCE TERMINÉE"
       ========================================================= */

    function addCompletionButtons() {

        getSessionNumbers()
            .forEach(number => {

                const session =
                    getSessionElement(number);

                if (!session) {
                    return;
                }

                if (
                    session.querySelector(
                        '.complete-session-button'
                    )
                ) {
                    return;
                }


                const button =
                    document.createElement(
                        'button'
                    );

                button.className =
                    'complete-session-button';

                button.textContent =
                    '✓ Séance terminée';

                button.addEventListener(
                    'click',
                    () => {
                        completeSession(number);
                    }
                );

                session.appendChild(button);

            });
    }


    /* =========================================================
       CALENDRIER / PROGRESSION
       ========================================================= */

    function buildProgression() {

        const calendarBody =
            document.getElementById(
                'calendar-body'
            );

        if (!calendarBody) {

            console.warn(
                'calendar-body introuvable'
            );

            return;
        }


        calendarBody.innerHTML = '';


        const lastCompleted =
            getLastCompletedSession();

        const currentSession =
            lastCompleted + 1;


        getSessionNumbers()
            .forEach(number => {

                const row =
                    document.createElement('tr');

                const statusCell =
                    document.createElement('td');

                const sessionCell =
                    document.createElement('td');


                /* TERMINÉE */

                if (
                    number <= lastCompleted
                ) {

                    row.classList.add(
                        'completed-session'
                    );

                    statusCell.textContent =
                        '✓';

                }


                /* SÉANCE ACTUELLE */

                else if (
                    number === currentSession
                ) {

                    row.classList.add(
                        'current-session'
                    );

                    statusCell.textContent =
                        '▶';

                }


                /* À VENIR */

                else {

                    row.classList.add(
                        'future-session'
                    );

                    statusCell.textContent =
                        '○';

                }


                const link =
                    document.createElement('a');

                link.href =
                    `#session${number}`;

                link.textContent =
                    getSessionTitle(number);


                link.addEventListener(
                    'click',
                    event => {

                        event.preventDefault();

                        showSession(
                            `session${number}`
                        );

                    }
                );


                sessionCell.appendChild(link);

                row.appendChild(statusCell);
                row.appendChild(sessionCell);

                calendarBody.appendChild(row);

            });


        updateCourseStatus();
    }


    /* =========================================================
       SÉANCE À FAIRE
       ========================================================= */

    function updateCourseStatus() {

        const status =
            document.getElementById(
                'course-status'
            );

        if (!status) {
            return;
        }


        const next =
            getLastCompletedSession() + 1;

        const session =
            getSessionElement(next);


        if (!session) {

            status.textContent =
                'Programme terminé';

            return;
        }


        status.textContent =
            `À faire : ${getSessionTitle(next)}`;
    }


    /* =========================================================
       MENU
       ========================================================= */

    function buildMenu() {

        const menu =
            document.getElementById(
                'session-nav'
            );

        if (!menu) {
            return;
        }


        menu.innerHTML = '';


        const calendarLink =
            document.createElement('a');

        calendarLink.href =
            '#calendar';

        calendarLink.dataset.target =
            'calendar';

        calendarLink.textContent =
            '📅 Progression';

        calendarLink.addEventListener(
            'click',
            event => {

                event.preventDefault();

                showSession('calendar');

            }
        );

        menu.appendChild(calendarLink);


        getSessionNumbers()
            .forEach(number => {

                const link =
                    document.createElement('a');

                link.href =
                    `#session${number}`;

                link.dataset.target =
                    `session${number}`;

                link.textContent =
                    getSessionTitle(number);


                link.addEventListener(
                    'click',
                    event => {

                        event.preventDefault();

                        showSession(
                            `session${number}`
                        );

                    }
                );


                menu.appendChild(link);

            });
    }


    /* =========================================================
       HAMBURGER
       ========================================================= */

    function toggleMenu() {

        document
            .getElementById(
                'session-nav'
            )
            ?.classList
            .toggle('open');
    }


    /* =========================================================
       RESET
       ========================================================= */

    function resetProgress() {

        if (
            !confirm(
                'Remettre la progression à zéro ?'
            )
        ) {
            return;
        }


        localStorage.removeItem(
            STORAGE_KEY
        );

        buildProgression();

        showSession('calendar');
    }


    /* =========================================================
       INITIALISATION
       ========================================================= */

    function init() {

        /*
         * On attend que le HTML entier existe
         * avant de récupérer le body.
         */

        level = getLevel();
        group = getGroup();

        STORAGE_KEY =
            `techno-${level}-${group}-last-session`;


        console.log(
            `Technologie : ${level} / ${group}`
        );


        buildMenu();

        addCompletionButtons();

        buildProgression();


        /*
         * IMPORTANT :
         * LE CALENDRIER EST TOUJOURS
         * AFFICHÉ EN PREMIER.
         */

        showSession('calendar');
    }


    /* Fonctions accessibles depuis le HTML */

    window.showSession =
        showSession;

    window.toggleMenu =
        toggleMenu;

    window.completeSession =
        completeSession;

    window.resetProgress =
        resetProgress;


    if (
        document.readyState ===
        'loading'
    ) {

        document.addEventListener(
            'DOMContentLoaded',
            init
        );

    } else {

        init();

    }

})();