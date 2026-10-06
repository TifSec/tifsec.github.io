(() => {

    'use strict';

    let courseId = 'mfr-classe';
    let STORAGE_KEY = '';

    /* =========================================================
    IDENTIFICATION DU COURS
    ========================================================= */

    function getCourseId() {
        const body = document.body;

        if (!body) {
            return 'mfr-classe';
        }

        if (body.dataset.courseId) {
            return body.dataset.courseId.trim();
        }

        const path = window.location.pathname
            .toLowerCase()
            .replace(/\/index\.html$/, '')
            .replace(/^\/+|\/+$/g, '')
            .replace(/\//g, '-');

        return path || 'mfr-classe';
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
   BARRE DE PROGRESSION DE LA SÉANCE ACTIVE
========================================================= */

function updateCourseProgress() {
    const sidebar = document.querySelector('.course-progress');
    const layout = document.querySelector('.course-page-layout');
    if (!sidebar || !layout) return;

    const session = document.querySelector('.course-session.active');

    if (!session) {
        sidebar.hidden = true;
        layout.classList.add('progress-hidden');
        return;
    }

    sidebar.hidden = false;
    layout.classList.remove('progress-hidden');

    const titleElement = sidebar.querySelector('[data-progress-session-title]');

    if (titleElement) {
        const sessionCode = session.dataset.seance || '';
        const sessionTitle = session.dataset.sessionTitle || '';

        if (sessionCode && sessionTitle) {
            titleElement.textContent = `${sessionCode} — ${sessionTitle}`;
        } else if (sessionTitle) {
            titleElement.textContent = sessionTitle;
        } else {
            titleElement.textContent = 'Séance';
        }
    }

    const exercises = Array.from(session.querySelectorAll('[data-track-progress="true"]'));

    const total = exercises.length;
    let correct = 0;
    let incorrect = 0;
    let review = 0;
    let empty = 0;

    exercises.forEach(exercise => {
        const state = exercise.dataset.answerState || 'empty';

        switch (state) {
            case 'correct':
                correct++;
                break;
            case 'incorrect':
                incorrect++;
                break;
            case 'review':
                review++;
                break;
            default:
                empty++;
                break;
        }
    });

    const completed = correct + incorrect + review;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    const percentElement = sidebar.querySelector('[data-progress-percent]');
    const barElement = sidebar.querySelector('[data-progress-bar]');
    const progressBar = sidebar.querySelector('.progress-bar');
    const currentElement = sidebar.querySelector('[data-progress-current]');
    const totalElement = sidebar.querySelector('[data-progress-total]');
    const correctElement = sidebar.querySelector('[data-count-correct]');
    const incorrectElement = sidebar.querySelector('[data-count-incorrect]');
    const reviewElement = sidebar.querySelector('[data-count-review]');
    const emptyElement = sidebar.querySelector('[data-count-empty]');

    if (percentElement) percentElement.textContent = `${percent} %`;
    if (barElement) barElement.style.width = `${percent}%`;
    if (progressBar) progressBar.setAttribute('aria-valuenow', String(percent));
    if (currentElement) currentElement.textContent = String(completed);
    if (totalElement) totalElement.textContent = String(total);
    if (correctElement) correctElement.textContent = String(correct);
    if (incorrectElement) incorrectElement.textContent = String(incorrect);
    if (reviewElement) reviewElement.textContent = String(review);
    if (emptyElement) emptyElement.textContent = String(empty);
}

/* =========================================================
   SURVEILLANCE DES CHANGEMENTS D'ÉTAT DES RÉPONSES
========================================================= */

function initCourseProgressObserver() {

    const courseContent =
        document.querySelector(
            '.course-content'
        );

    if (!courseContent) {
        return;
    }


    const observer =
        new MutationObserver(
            mutations => {

                const answerStateChanged =
                    mutations.some(
                        mutation =>
                            mutation.type ===
                                'attributes'
                            &&
                            mutation.attributeName ===
                                'data-answer-state'
                    );


                if (answerStateChanged) {

                    updateCourseProgress();
                }

            }
        );


    observer.observe(
        courseContent,
        {
            subtree: true,
            attributes: true,
            attributeFilter: [
                'data-answer-state'
            ]
        }
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
        updateCourseProgress();
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

        courseId = getCourseId();

        STORAGE_KEY =
            `tim-${courseId}-last-session`;

        console.log(
            `TIM MFR : ${courseId}`
        );


        buildMenu();

        addCompletionButtons();

        buildProgression();

        initCourseProgressObserver();


        /*
         * IMPORTANT :
         * LE CALENDRIER EST TOUJOURS
         * AFFICHÉ EN PREMIER.
         */

        if (document.getElementById('calendar')) {
            showSession('calendar');
        } else {
            const firstSession = getSessionNumbers()[0];

            if (firstSession) {
                showSession(`session${firstSession}`);
            }
        }
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