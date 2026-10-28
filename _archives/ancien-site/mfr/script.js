(() => {
    'use strict';

    let courseId = 'mfr-classe';
    let STORAGE_KEY = '';

    const saveTimers = new Map();
    const openedHints = new Set();

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

    function getCurrentSubject(session = null) {
        if (session?.dataset.matiere) {
            return session.dataset.matiere.trim();
        }

        if (document.body?.dataset.matiere) {
            return document.body.dataset.matiere.trim();
        }

        if (courseId.includes('math')) {
            return 'maths';
        }

        if (courseId.includes('techno')) {
            return 'techno';
        }

        if (courseId.includes('tim')) {
            return 'tim';
        }

        return '';
    }

    function getCurrentClass(session = null) {
        if (session?.dataset.classe) {
            return session.dataset.classe.trim();
        }

        if (document.body?.dataset.classe) {
            return document.body.dataset.classe.trim();
        }

        return '';
    }

    /* =========================================================
       SUPABASE
       ========================================================= */

    function getSupabaseClient() {
        if (
            window.supabaseClient &&
            typeof window.supabaseClient.from === 'function'
        ) {
            return window.supabaseClient;
        }

        if (
            window.sb &&
            typeof window.sb.from === 'function'
        ) {
            return window.sb;
        }

        if (
            window.supabase &&
            typeof window.supabase.from === 'function'
        ) {
            return window.supabase;
        }

        return null;
    }

    async function getCurrentUser() {
        const client = getSupabaseClient();

        if (!client?.auth?.getUser) {
            return null;
        }

        try {
            const {
                data,
                error
            } = await client.auth.getUser();

            if (error) {
                console.warn(
                    'Impossible de récupérer l’utilisateur Supabase :',
                    error
                );

                return null;
            }

            return data?.user || null;
        } catch (error) {
            console.warn(
                'Erreur pendant la récupération de l’utilisateur :',
                error
            );

            return null;
        }
    }

    /* =========================================================
       MÉMOIRE LOCALE DE PROGRESSION
       ========================================================= */

    function getLastCompletedSession() {
        const value = Number(
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
        const session = getSessionElement(number);

        if (!session) {
            return `Séance ${number}`;
        }

        if (session.dataset.sessionTitle) {
            return session.dataset.sessionTitle.trim();
        }

        if (session.dataset.title) {
            return session.dataset.title.trim();
        }

        const title = session.querySelector(
            'h1, h2, h3'
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
                const match = element.id.match(
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

    function getSessionNumber(session) {
        if (!session) {
            return null;
        }

        const idMatch = session.id?.match(
            /^session(\d+)$/
        );

        if (idMatch) {
            return Number(idMatch[1]);
        }

        const seance = session.dataset.seance || '';

        const seanceMatch = seance.match(
            /(\d+)/
        );

        if (seanceMatch) {
            return Number(seanceMatch[1]);
        }

        return null;
    }

    function getActiveSession() {
        return document.querySelector(
            '.course-session.active'
        );
    }

    /* =========================================================
       BARRE DE PROGRESSION DE LA SÉANCE ACTIVE
       ========================================================= */

    function updateCourseProgress() {
        const sidebar = document.querySelector(
            '.course-progress'
        );

        const layout = document.querySelector(
            '.course-page-layout'
        );

        if (!sidebar || !layout) {
            return;
        }

        const session = getActiveSession();

        if (!session) {
            sidebar.hidden = true;

            layout.classList.add(
                'progress-hidden'
            );

            return;
        }

        sidebar.hidden = false;

        layout.classList.remove(
            'progress-hidden'
        );

        const titleElement = sidebar.querySelector(
            '[data-progress-session-title]'
        );

        if (titleElement) {
            const sessionCode =
                session.dataset.seance || '';

            const sessionTitle =
                session.dataset.sessionTitle || '';

            if (sessionCode && sessionTitle) {
                titleElement.textContent =
                    `${sessionCode} — ${sessionTitle}`;
            } else if (sessionTitle) {
                titleElement.textContent =
                    sessionTitle;
            } else {
                titleElement.textContent =
                    'Séance';
            }
        }

        const exercises = Array.from(
            session.querySelectorAll(
                '[data-track-progress="true"]'
            )
        );

        const total = exercises.length;

        let correct = 0;
        let incorrect = 0;
        let review = 0;
        let empty = 0;

        exercises.forEach(exercise => {
            const state =
                exercise.dataset.answerState
                || 'empty';

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

        const completed =
            correct
            + incorrect
            + review;

        const percent =
            total > 0
                ? Math.round(
                    (completed / total) * 100
                )
                : 0;

        const percentElement =
            sidebar.querySelector(
                '[data-progress-percent]'
            );

        const barElement =
            sidebar.querySelector(
                '[data-progress-bar]'
            );

        const progressBar =
            sidebar.querySelector(
                '.progress-bar'
            );

        const currentElement =
            sidebar.querySelector(
                '[data-progress-current]'
            );

        const totalElement =
            sidebar.querySelector(
                '[data-progress-total]'
            );

        const correctElement =
            sidebar.querySelector(
                '[data-count-correct]'
            );

        const incorrectElement =
            sidebar.querySelector(
                '[data-count-incorrect]'
            );

        const reviewElement =
            sidebar.querySelector(
                '[data-count-review]'
            );

        const emptyElement =
            sidebar.querySelector(
                '[data-count-empty]'
            );

        if (percentElement) {
            percentElement.textContent =
                `${percent} %`;
        }

        if (barElement) {
            barElement.style.width =
                `${percent}%`;
        }

        if (progressBar) {
            progressBar.setAttribute(
                'aria-valuenow',
                String(percent)
            );
        }

        if (currentElement) {
            currentElement.textContent =
                String(completed);
        }

        if (totalElement) {
            totalElement.textContent =
                String(total);
        }

        if (correctElement) {
            correctElement.textContent =
                String(correct);
        }

        if (incorrectElement) {
            incorrectElement.textContent =
                String(incorrect);
        }

        if (reviewElement) {
            reviewElement.textContent =
                String(review);
        }

        if (emptyElement) {
            emptyElement.textContent =
                String(empty);
        }
    }

    /* =========================================================
       SURVEILLANCE DES CHANGEMENTS D'ÉTAT
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
       NORMALISATION DES RÉPONSES
       ========================================================= */

    function normalizeText(value) {
        return String(value ?? '')
            .trim()
            .toLowerCase()
            .normalize('NFD')
            .replace(
                /[\u0300-\u036f]/g,
                ''
            )
            .replace(
                /\s+/g,
                ' '
            );
    }

    function normalizeNumber(value) {
        const cleaned = String(value ?? '')
            .trim()
            .replace(/\s/g, '')
            .replace(',', '.');

        if (cleaned === '') {
            return null;
        }

        const number = Number(cleaned);

        return Number.isFinite(number)
            ? number
            : null;
    }

    function normalizeChoice(value) {
        return normalizeText(value);
    }

    function normalizeNumberList(value) {
        const raw = String(value ?? '')
            .trim();

        if (!raw) {
            return [];
        }

        return raw
            .replace(/\n/g, ';')
            .split(';')
            .map(item =>
                normalizeNumber(item)
            );
    }

    function parseFraction(value) {
        const cleaned = String(value ?? '')
            .trim()
            .replace(/\s/g, '')
            .replace(',', '.');

        const match = cleaned.match(
            /^(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)$/
        );

        if (!match) {
            return null;
        }

        const numerator =
            Number(match[1]);

        const denominator =
            Number(match[2]);

        if (
            !Number.isFinite(numerator)
            ||
            !Number.isFinite(denominator)
            ||
            denominator === 0
        ) {
            return null;
        }

        return {
            numerator,
            denominator,
            value:
                numerator / denominator
        };
    }

    function normalizeMultiplicationExpression(
        value
    ) {
        return String(value ?? '')
            .trim()
            .toLowerCase()
            .replace(/\s/g, '')
            .replace(/[×·x]/g, '*')
            .replace(/\^2/g, '²')
            .replace(/\^3/g, '³');
    }

    function expandSuperscriptFactor(
        token
    ) {
        const squared = token.match(
            /^(-?\d+)²$/
        );

        if (squared) {
            return [
                Number(squared[1]),
                Number(squared[1])
            ];
        }

        const cubed = token.match(
            /^(-?\d+)³$/
        );

        if (cubed) {
            return [
                Number(cubed[1]),
                Number(cubed[1]),
                Number(cubed[1])
            ];
        }

        const power = token.match(
            /^(-?\d+)\^(\d+)$/
        );

        if (power) {
            const base =
                Number(power[1]);

            const exponent =
                Number(power[2]);

            if (
                Number.isFinite(base)
                &&
                Number.isInteger(exponent)
                &&
                exponent >= 0
                &&
                exponent <= 20
            ) {
                return Array(
                    exponent
                ).fill(base);
            }
        }

        const number =
            normalizeNumber(token);

        if (number === null) {
            return null;
        }

        return [number];
    }

    function parseFactorization(value) {
        const normalized =
            normalizeMultiplicationExpression(
                value
            );

        if (!normalized) {
            return null;
        }

        const tokens =
            normalized.split('*');

        const factors = [];

        for (const token of tokens) {
            if (!token) {
                return null;
            }

            const expanded =
                expandSuperscriptFactor(
                    token
                );

            if (!expanded) {
                return null;
            }

            factors.push(
                ...expanded
            );
        }

        return factors.sort(
            (a, b) => a - b
        );
    }

    function compareNumberLists(
        actual,
        expected,
        strictOrder = true
    ) {
        if (
            actual.length !==
            expected.length
        ) {
            return false;
        }

        if (!strictOrder) {
            actual = [...actual].sort(
                (a, b) => a - b
            );

            expected = [...expected].sort(
                (a, b) => a - b
            );
        }

        return actual.every(
            (value, index) =>
                value === expected[index]
        );
    }

    function compareFactorizations(
        actualValue,
        expectedValue
    ) {
        const actual =
            parseFactorization(
                actualValue
            );

        const expected =
            parseFactorization(
                expectedValue
            );

        if (!actual || !expected) {
            return false;
        }

        return compareNumberLists(
            actual,
            expected,
            false
        );
    }

    function evaluateMathExpression(
        value
    ) {
        let expression =
            normalizeMultiplicationExpression(
                value
            );

        if (!expression) {
            return null;
        }

        expression = expression
            .replace(
                /(-?\d+(?:\.\d+)?)²/g,
                '($1*$1)'
            )
            .replace(
                /(-?\d+(?:\.\d+)?)³/g,
                '($1*$1*$1)'
            );

        if (
            !/^[0-9+\-*/().]+$/.test(
                expression
            )
        ) {
            return null;
        }

        try {
            const result =
                Function(
                    `"use strict"; return (${expression});`
                )();

            return Number.isFinite(result)
                ? result
                : null;
        } catch {
            return null;
        }
    }

    /* =========================================================
       LECTURE DES CHAMPS
       ========================================================= */

    function getFieldValue(field) {
        if (!field) {
            return '';
        }

        if (
            field.type === 'checkbox'
        ) {
            return field.checked
                ? field.value || 'true'
                : '';
        }

        if (
            field.type === 'radio'
        ) {
            const name =
                field.name;

            if (!name) {
                return field.checked
                    ? field.value
                    : '';
            }

            const checked =
                document.querySelector(
                    `input[type="radio"][name="${CSS.escape(name)}"]:checked`
                );

            return checked
                ? checked.value
                : '';
        }

        return field.value ?? '';
    }

    function isFieldEmpty(field) {
        return normalizeText(
            getFieldValue(field)
        ) === '';
    }

    /* =========================================================
       CORRECTION DÉTERMINISTE
       ========================================================= */

    function checkField(field) {
        const checkType =
            field.dataset.check;

        const expected =
            field.dataset.answer ?? '';

        const actual =
            getFieldValue(field);

        if (
            normalizeText(actual) === ''
        ) {
            return {
                state: 'empty',
                correct: null
            };
        }

        if (!checkType) {
            return {
                state: 'review',
                correct: null
            };
        }

        let correct = false;

        switch (checkType) {
            case 'number': {
                const actualNumber =
                    normalizeNumber(
                        actual
                    );

                const expectedNumber =
                    normalizeNumber(
                        expected
                    );

                correct =
                    actualNumber !== null
                    &&
                    expectedNumber !== null
                    &&
                    actualNumber ===
                        expectedNumber;

                break;
            }

            case 'choice': {
                correct =
                    normalizeChoice(
                        actual
                    )
                    ===
                    normalizeChoice(
                        expected
                    );

                break;
            }

            case 'number-list': {
                const actualList =
                    normalizeNumberList(
                        actual
                    );

                const expectedList =
                    normalizeNumberList(
                        expected
                    );

                const strictOrder =
                    field.dataset.order !==
                    'any';

                correct =
                    !actualList.includes(null)
                    &&
                    !expectedList.includes(null)
                    &&
                    compareNumberLists(
                        actualList,
                        expectedList,
                        strictOrder
                    );

                break;
            }

            case 'fraction':
            case 'fraction-value': {
                const actualFraction =
                    parseFraction(
                        actual
                    );

                const expectedFraction =
                    parseFraction(
                        expected
                    );

                correct =
                    actualFraction !== null
                    &&
                    expectedFraction !== null
                    &&
                    Math.abs(
                        actualFraction.value
                        -
                        expectedFraction.value
                    ) < 1e-10;

                break;
            }

            case 'fraction-simplified': {
                const actualFraction =
                    parseFraction(
                        actual
                    );

                const expectedFraction =
                    parseFraction(
                        expected
                    );

                correct =
                    actualFraction !== null
                    &&
                    expectedFraction !== null
                    &&
                    actualFraction.numerator ===
                        expectedFraction.numerator
                    &&
                    actualFraction.denominator ===
                        expectedFraction.denominator;

                break;
            }

            case 'factorization': {
                correct =
                    compareFactorizations(
                        actual,
                        expected
                    );

                break;
            }

            case 'math-expression': {
                const actualResult =
                    evaluateMathExpression(
                        actual
                    );

                const expectedResult =
                    evaluateMathExpression(
                        expected
                    );

                correct =
                    actualResult !== null
                    &&
                    expectedResult !== null
                    &&
                    Math.abs(
                        actualResult
                        -
                        expectedResult
                    ) < 1e-10;

                break;
            }

            case 'percentage': {
                const actualNumber =
                    normalizeNumber(
                        String(actual)
                            .replace(
                                '%',
                                ''
                            )
                    );

                const expectedNumber =
                    normalizeNumber(
                        String(expected)
                            .replace(
                                '%',
                                ''
                            )
                    );

                correct =
                    actualNumber !== null
                    &&
                    expectedNumber !== null
                    &&
                    actualNumber ===
                        expectedNumber;

                break;
            }

            case 'number-unit': {
                const unit =
                    normalizeText(
                        field.dataset.unit || ''
                    );

                const cleaned =
                    normalizeText(actual)
                        .replace(
                            unit,
                            ''
                        )
                        .trim();

                const actualNumber =
                    normalizeNumber(
                        cleaned
                    );

                const expectedNumber =
                    normalizeNumber(
                        expected
                    );

                correct =
                    actualNumber !== null
                    &&
                    expectedNumber !== null
                    &&
                    actualNumber ===
                        expectedNumber;

                break;
            }

            default: {
                console.warn(
                    `Type de correction inconnu : ${checkType}`
                );

                return {
                    state: 'review',
                    correct: null
                };
            }
        }

        return {
            state:
                correct
                    ? 'correct'
                    : 'incorrect',
            correct
        };
    }

    /* =========================================================
       ÉTAT D'UN BLOC DE RÉPONSE
       ========================================================= */

    function getTrackedBlock(field) {
        return field.closest(
            '[data-track-progress="true"]'
        );
    }

    function updateFeedback(
        field,
        state
    ) {
        const block =
            getTrackedBlock(field)
            ||
            field.parentElement;

        if (!block) {
            return;
        }

        let feedback =
            block.querySelector(
                '.answer-feedback'
            );

        if (!feedback) {
            return;
        }

        if (state === 'correct') {
            feedback.textContent =
                '✓ Réponse correcte.';
        } else if (
            state === 'incorrect'
        ) {
            feedback.textContent =
                '✕ Réponse à corriger.';
        } else if (
            state === 'review'
        ) {
            feedback.textContent =
                '● Réponse enregistrée — à vérifier.';
        } else {
            feedback.textContent = '';
        }
    }

    function updateTrackedBlock(
        block
    ) {
        if (!block) {
            return;
        }

        const fields = Array.from(
            block.querySelectorAll(
                '[data-save]'
            )
        );

        if (fields.length === 0) {
            block.dataset.answerState =
                'empty';

            return;
        }

        const results =
            fields.map(field => {
                if (
                    field.dataset.check
                ) {
                    return checkField(
                        field
                    );
                }

                if (
                    isFieldEmpty(field)
                ) {
                    return {
                        state: 'empty',
                        correct: null
                    };
                }

                return {
                    state: 'review',
                    correct: null
                };
            });

        const allEmpty =
            results.every(
                result =>
                    result.state ===
                    'empty'
            );

        if (allEmpty) {
            block.dataset.answerState =
                'empty';

            return;
        }

        const deterministic =
            results.filter(
                result =>
                    result.correct !==
                    null
            );

        const hasIncorrect =
            deterministic.some(
                result =>
                    result.correct ===
                    false
            );

        const hasEmptyDeterministic =
            fields.some(
                field =>
                    field.dataset.check
                    &&
                    isFieldEmpty(field)
            );

        const hasOpenResponse =
            fields.some(
                field =>
                    !field.dataset.check
                    &&
                    !isFieldEmpty(field)
            );

        /*
         * Une réponse déterministe fausse
         * reste "incorrect".
         */
        if (hasIncorrect) {
            block.dataset.answerState =
                'incorrect';

            return;
        }

        /*
         * S'il reste une partie objective
         * sans réponse, le bloc reste à faire.
         */
        if (hasEmptyDeterministic) {
            block.dataset.answerState =
                'empty';

            return;
        }

        /*
         * Si toutes les parties objectives
         * sont correctes, la réponse est correcte.
         *
         * Une éventuelle justification ouverte
         * n'annule pas une réponse exacte.
         */
        if (
            deterministic.length > 0
            &&
            deterministic.every(
                result =>
                    result.correct ===
                    true
            )
        ) {
            block.dataset.answerState =
                'correct';

            return;
        }

        /*
         * Réponse ouverte uniquement :
         * vérification humaine nécessaire.
         */
        if (hasOpenResponse) {
            block.dataset.answerState =
                'review';

            return;
        }

        block.dataset.answerState =
            'empty';
    }

    function refreshAllAnswerStates(
        session = null
    ) {
        const root =
            session || document;

        root
            .querySelectorAll(
                '[data-track-progress="true"]'
            )
            .forEach(block => {
                updateTrackedBlock(
                    block
                );
            });

        updateCourseProgress();
    }

    /* =========================================================
       SAUVEGARDE LOCALE DES RÉPONSES
       ========================================================= */

    function getLocalAnswerKey(
        field
    ) {
        return (
            `course-answer-`
            + `${courseId}-`
            + `${field.dataset.save}`
        );
    }

    function saveFieldLocally(
        field
    ) {
        if (!field.dataset.save) {
            return;
        }

        localStorage.setItem(
            getLocalAnswerKey(field),
            getFieldValue(field)
        );
    }

    function restoreFieldLocally(
        field
    ) {
        if (!field.dataset.save) {
            return;
        }

        const value =
            localStorage.getItem(
                getLocalAnswerKey(field)
            );

        if (value === null) {
            return;
        }

        if (
            field.type === 'radio'
        ) {
            field.checked =
                field.value === value;

            return;
        }

        if (
            field.type === 'checkbox'
        ) {
            field.checked =
                value ===
                (field.value || 'true');

            return;
        }

        field.value = value;
    }

    /* =========================================================
       SAUVEGARDE SUPABASE DES RÉPONSES
       ========================================================= */

    async function saveFieldToSupabase(
        field,
        options = {}
    ) {
        const client =
            getSupabaseClient();

        if (!client) {
            return false;
        }

        const user =
            await getCurrentUser();

        if (!user) {
            return false;
        }

        const session =
            field.closest(
                '.course-session'
            );

        if (!session) {
            return false;
        }

        const question =
            field.dataset.save;

        if (!question) {
            return false;
        }

        const matiere =
            getCurrentSubject(
                session
            );

        const classe =
            getCurrentClass(
                session
            );

        const seance =
            session.dataset.seance
            ||
            `S${String(
                getSessionNumber(session) || ''
            ).padStart(2, '0')}`;

        const reponse =
            getFieldValue(field);

        const terminee =
            options.terminee === true;

        try {
            const {
                error
            } = await client
                .from('student_work')
                .upsert(
                    {
                        user_id:
                            user.id,
                        matiere,
                        classe,
                        seance,
                        question,
                        reponse,
                        terminee,
                        updated_at:
                            new Date()
                                .toISOString()
                    },
                    {
                        onConflict:
                            'user_id,matiere,classe,seance,question'
                    }
                );

            if (error) {
                console.warn(
                    'Erreur student_work :',
                    error
                );

                return false;
            }

            return true;
        } catch (error) {
            console.warn(
                'Erreur de sauvegarde Supabase :',
                error
            );

            return false;
        }
    }

    function scheduleSupabaseSave(
        field
    ) {
        const key =
            field.dataset.save;

        if (!key) {
            return;
        }

        if (
            saveTimers.has(key)
        ) {
            clearTimeout(
                saveTimers.get(key)
            );
        }

        const timer =
            setTimeout(
                async () => {
                    saveTimers.delete(
                        key
                    );

                    await saveFieldToSupabase(
                        field
                    );
                },
                700
            );

        saveTimers.set(
            key,
            timer
        );
    }

    /* =========================================================
       TRAITEMENT D'UNE RÉPONSE
       ========================================================= */

    function handleAnswerChange(
        field
    ) {
        saveFieldLocally(
            field
        );

        const result =
            checkField(
                field
            );

        updateFeedback(
            field,
            result.state
        );

        const block =
            getTrackedBlock(
                field
            );

        updateTrackedBlock(
            block
        );

        scheduleSupabaseSave(
            field
        );
    }

    function initStudentAnswers() {
        const fields =
            document.querySelectorAll(
                '[data-save]'
            );

        fields.forEach(field => {
            restoreFieldLocally(
                field
            );

            const eventName =
                field.tagName ===
                    'SELECT'
                ||
                field.type ===
                    'radio'
                ||
                field.type ===
                    'checkbox'
                    ? 'change'
                    : 'input';

            field.addEventListener(
                eventName,
                () => {
                    handleAnswerChange(
                        field
                    );
                }
            );

            /*
             * Pour les champs texte,
             * on lance aussi la correction
             * au changement de focus.
             */
            if (
                eventName === 'input'
            ) {
                field.addEventListener(
                    'change',
                    () => {
                        handleAnswerChange(
                            field
                        );
                    }
                );
            }
        });

        document
            .querySelectorAll(
                '.course-session'
            )
            .forEach(session => {
                refreshAllAnswerStates(
                    session
                );
            });
    }

    /* =========================================================
       INDICES
       ========================================================= */

    function getLocalHintKey(
        hint
    ) {
        return (
            `course-hint-`
            + `${courseId}-`
            + `${hint.dataset.hintId}`
        );
    }

    async function saveHintToSupabase(
        hint
    ) {
        const client =
            getSupabaseClient();

        if (!client) {
            return false;
        }

        const user =
            await getCurrentUser();

        if (!user) {
            return false;
        }

        const session =
            hint.closest(
                '.course-session'
            );

        if (!session) {
            return false;
        }

        const hintId =
            hint.dataset.hintId;

        if (!hintId) {
            return false;
        }

        const matiere =
            getCurrentSubject(
                session
            );

        const classe =
            getCurrentClass(
                session
            );

        const seance =
            session.dataset.seance
            ||
            `S${String(
                getSessionNumber(session) || ''
            ).padStart(2, '0')}`;

        const level =
            Number(
                hint.dataset.hintLevel
                || 1
            );

        /*
         * La structure exacte de student_hints
         * peut évoluer.
         *
         * On tente d'abord une structure détaillée.
         */
        const detailedPayload = {
            user_id:
                user.id,
            matiere,
            classe,
            seance,
            question:
                hintId,
            hint_level:
                level,
            consulted_at:
                new Date()
                    .toISOString()
        };

        try {
            const {
                error
            } = await client
                .from('student_hints')
                .upsert(
                    detailedPayload,
                    {
                        onConflict:
                            'user_id,matiere,classe,seance,question,hint_level'
                    }
                );

            if (!error) {
                return true;
            }

            console.warn(
                'student_hints : structure détaillée non acceptée.',
                error
            );

            return false;
        } catch (error) {
            console.warn(
                'Erreur student_hints :',
                error
            );

            return false;
        }
    }

    function initStudentHints() {
        document
            .querySelectorAll(
                'details[data-hint-id]'
            )
            .forEach(hint => {
                const hintId =
                    hint.dataset.hintId;

                if (!hintId) {
                    return;
                }

                const localKey =
                    getLocalHintKey(
                        hint
                    );

                if (
                    localStorage.getItem(
                        localKey
                    ) === '1'
                ) {
                    openedHints.add(
                        hintId
                    );
                }

                hint.addEventListener(
                    'toggle',
                    async () => {
                        if (!hint.open) {
                            return;
                        }

                        if (
                            openedHints.has(
                                hintId
                            )
                        ) {
                            return;
                        }

                        openedHints.add(
                            hintId
                        );

                        localStorage.setItem(
                            localKey,
                            '1'
                        );

                        await saveHintToSupabase(
                            hint
                        );
                    }
                );
            });
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
            .remove(
                'open'
            );

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

        if (
            target.classList.contains(
                'course-session'
            )
        ) {
            refreshAllAnswerStates(
                target
            );
        }

        updateCourseProgress();
    }

    /* =========================================================
       FINALISATION D'UNE SÉANCE
       ========================================================= */

    async function saveAllSessionAnswers(
        session,
        terminee = false
    ) {
        const fields =
            Array.from(
                session.querySelectorAll(
                    '[data-save]'
                )
            );

        fields.forEach(field => {
            saveFieldLocally(
                field
            );
        });

        const promises =
            fields.map(field =>
                saveFieldToSupabase(
                    field,
                    {
                        terminee
                    }
                )
            );

        await Promise.allSettled(
            promises
        );
    }

    function buildSessionExportHtml(
        session
    ) {
        const title =
            session.dataset.sessionTitle
            ||
            session.querySelector(
                'h1, h2, h3'
            )?.textContent
            ||
            'Séance';

        const seance =
            session.dataset.seance
            || '';

        const fields =
            Array.from(
                session.querySelectorAll(
                    '[data-save]'
                )
            );

        const hints =
            Array.from(
                session.querySelectorAll(
                    'details[data-hint-id]'
                )
            );

        const responses =
            fields.map(field => {
                const question =
                    field.dataset.save
                    || '';

                const value =
                    getFieldValue(
                        field
                    );

                const check =
                    field.dataset.check
                    || '';

                const result =
                    checkField(
                        field
                    );

                return {
                    question,
                    value,
                    check,
                    state:
                        result.state
                };
            });

        const consultedHints =
            hints
                .filter(hint =>
                    openedHints.has(
                        hint.dataset.hintId
                    )
                )
                .map(hint => ({
                    id:
                        hint.dataset.hintId,
                    level:
                        hint.dataset.hintLevel
                        || ''
                }));

        const escapeHtml =
            value =>
                String(value ?? '')
                    .replace(
                        /&/g,
                        '&amp;'
                    )
                    .replace(
                        /</g,
                        '&lt;'
                    )
                    .replace(
                        />/g,
                        '&gt;'
                    )
                    .replace(
                        /"/g,
                        '&quot;'
                    )
                    .replace(
                        /'/g,
                        '&#039;'
                    );

        const rows =
            responses
                .map(response => `
                    <tr>
                        <td>${escapeHtml(response.question)}</td>
                        <td>${escapeHtml(response.value)}</td>
                        <td>${escapeHtml(response.state)}</td>
                    </tr>
                `)
                .join('');

        const hintRows =
            consultedHints.length > 0
                ? consultedHints
                    .map(hint => `
                        <li>
                            ${escapeHtml(hint.id)}
                            — niveau
                            ${escapeHtml(hint.level)}
                        </li>
                    `)
                    .join('')
                : '<li>Aucun indice consulté.</li>';

        return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(seance)} - ${escapeHtml(title)}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 900px;
            margin: 40px auto;
            padding: 0 20px;
            line-height: 1.5;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }

        th,
        td {
            border: 1px solid #bbb;
            padding: 8px;
            text-align: left;
            vertical-align: top;
        }

        th {
            background: #eee;
        }
    </style>
</head>
<body>
    <h1>${escapeHtml(seance)} — ${escapeHtml(title)}</h1>

    <p>
        Copie générée le
        ${escapeHtml(
            new Date().toLocaleString('fr-FR')
        )}.
    </p>

    <h2>Réponses</h2>

    <table>
        <thead>
            <tr>
                <th>Question</th>
                <th>Réponse</th>
                <th>État</th>
            </tr>
        </thead>
        <tbody>
            ${rows}
        </tbody>
    </table>

    <h2>Indices consultés</h2>

    <ul>
        ${hintRows}
    </ul>
</body>
</html>`;
    }

    function downloadSessionCopy(
        session
    ) {
        const html =
            buildSessionExportHtml(
                session
            );

        const blob =
            new Blob(
                [html],
                {
                    type:
                        'text/html;charset=utf-8'
                }
            );

        const url =
            URL.createObjectURL(
                blob
            );

        const link =
            document.createElement(
                'a'
            );

        const seance =
            (
                session.dataset.seance
                ||
                'seance'
            )
                .replace(
                    /[^a-zA-Z0-9_-]/g,
                    '-'
                );

        link.href = url;

        link.download =
            `${courseId}-${seance}-reponses.html`;

        document.body.appendChild(
            link
        );

        link.click();

        link.remove();

        setTimeout(
            () => {
                URL.revokeObjectURL(
                    url
                );
            },
            1000
        );
    }

    function getFinishStatusElement(
        button
    ) {
        const container =
            button.closest(
                '.finish-session-box'
            );

        return (
            container?.querySelector(
                '[data-finish-session-status]'
            )
            ||
            null
        );
    }

    async function finishSession(
        button
    ) {
        const session =
            button.closest(
                '.course-session'
            );

        if (!session) {
            console.warn(
                'Impossible de trouver la séance à terminer.'
            );

            return;
        }

        const status =
            getFinishStatusElement(
                button
            );

        button.disabled = true;

        if (status) {
            status.textContent =
                'Enregistrement de la séance...';
        }

        refreshAllAnswerStates(
            session
        );

        try {
            await saveAllSessionAnswers(
                session,
                true
            );

            const number =
                getSessionNumber(
                    session
                );

            if (number !== null) {
                const current =
                    getLastCompletedSession();

                if (number > current) {
                    saveLastCompletedSession(
                        number
                    );
                }
            }

            downloadSessionCopy(
                session
            );

            buildProgression();

            if (status) {
                status.textContent =
                    '✓ Séance enregistrée. Une copie de vos réponses a été téléchargée.';
            }

            button.textContent =
                '✓ Séance terminée';

            button.classList.add(
                'is-finished'
            );
        } catch (error) {
            console.error(
                'Erreur pendant la finalisation :',
                error
            );

            if (status) {
                status.textContent =
                    'Une erreur est survenue. Vos réponses restent enregistrées localement.';
            }
        } finally {
            button.disabled = false;
        }
    }

    function initFinishSessionButtons() {
        document
            .querySelectorAll(
                '[data-finish-session]'
            )
            .forEach(button => {
                button.addEventListener(
                    'click',
                    () => {
                        finishSession(
                            button
                        );
                    }
                );
            });
    }

    /* =========================================================
       CALENDRIER / PROGRESSION GÉNÉRALE
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
                    document.createElement(
                        'tr'
                    );

                const statusCell =
                    document.createElement(
                        'td'
                    );

                const sessionCell =
                    document.createElement(
                        'td'
                    );

                if (
                    number <=
                    lastCompleted
                ) {
                    row.classList.add(
                        'completed-session'
                    );

                    statusCell.textContent =
                        '✓';
                } else if (
                    number ===
                    currentSession
                ) {
                    row.classList.add(
                        'current-session'
                    );

                    statusCell.textContent =
                        '▶';
                } else {
                    row.classList.add(
                        'future-session'
                    );

                    statusCell.textContent =
                        '○';
                }

                const link =
                    document.createElement(
                        'a'
                    );

                link.href =
                    `#session${number}`;

                link.textContent =
                    getSessionTitle(
                        number
                    );

                link.addEventListener(
                    'click',
                    event => {
                        event.preventDefault();

                        showSession(
                            `session${number}`
                        );
                    }
                );

                sessionCell.appendChild(
                    link
                );

                row.appendChild(
                    statusCell
                );

                row.appendChild(
                    sessionCell
                );

                calendarBody.appendChild(
                    row
                );
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
            getLastCompletedSession()
            + 1;

        const session =
            getSessionElement(
                next
            );

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
            document.createElement(
                'a'
            );

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

                showSession(
                    'calendar'
                );
            }
        );

        menu.appendChild(
            calendarLink
        );

        getSessionNumbers()
            .forEach(number => {
                const link =
                    document.createElement(
                        'a'
                    );

                link.href =
                    `#session${number}`;

                link.dataset.target =
                    `session${number}`;

                link.textContent =
                    getSessionTitle(
                        number
                    );

                link.addEventListener(
                    'click',
                    event => {
                        event.preventDefault();

                        showSession(
                            `session${number}`
                        );
                    }
                );

                menu.appendChild(
                    link
                );
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
            .toggle(
                'open'
            );
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

        showSession(
            'calendar'
        );
    }

    /* =========================================================
       INITIALISATION
       ========================================================= */

    function init() {
        courseId =
            getCourseId();

        /*
         * Nouvelle clé générique.
         * On conserve aussi l'ancienne clé TIM
         * si elle existe déjà afin de ne pas perdre
         * la progression actuelle.
         */
        const oldStorageKey =
            `tim-${courseId}-last-session`;

        const newStorageKey =
            `course-${courseId}-last-session`;

        if (
            localStorage.getItem(
                newStorageKey
            ) === null
            &&
            localStorage.getItem(
                oldStorageKey
            ) !== null
        ) {
            localStorage.setItem(
                newStorageKey,
                localStorage.getItem(
                    oldStorageKey
                )
            );
        }

        STORAGE_KEY =
            newStorageKey;

        console.log(
            `Cours : ${courseId}`
        );

        buildMenu();

        buildProgression();

        initCourseProgressObserver();

        initStudentAnswers();

        initStudentHints();

        initFinishSessionButtons();

        /*
         * Le calendrier est toujours
         * affiché en premier.
         */
        if (
            document.getElementById(
                'calendar'
            )
        ) {
            showSession(
                'calendar'
            );
        } else {
            const firstSession =
                getSessionNumbers()[0];

            if (firstSession) {
                showSession(
                    `session${firstSession}`
                );
            }
        }
    }

    /* =========================================================
       FONCTIONS ACCESSIBLES DEPUIS LE HTML
       ========================================================= */

    window.showSession =
        showSession;

    window.toggleMenu =
        toggleMenu;

    window.resetProgress =
        resetProgress;

    window.updateCourseProgress =
        updateCourseProgress;

    window.finishSession =
        finishSession;

    /* =========================================================
       DÉMARRAGE
       ========================================================= */

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