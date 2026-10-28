(() => {
    'use strict';

    /* =========================================================
       COURSE RENDERER
       Génération commune des séances à partir de données JS
       ========================================================= */

    const registeredSessions = [];
    const pendingSessions = [];

    /* =========================================================
       OUTILS
       ========================================================= */

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function escapeAttribute(value) {
        return escapeHtml(value);
    }

    function normalizeSessionNumber(value) {
        const number = Number(value);

        return Number.isFinite(number)
            ? number
            : null;
    }

    function getSessionContainer() {
        return document.getElementById(
            'course-sessions'
        );
    }

    function getQuestionMode(question) {
        if (question.mode) {
            return question.mode;
        }

        return question.type === 'text'
            ? 'review'
            : 'auto';
    }

    function getQuestionRows(question) {
        const rows = Number(
            question.rows
        );

        if (
            Number.isInteger(rows)
            &&
            rows > 0
        ) {
            return rows;
        }

        return 3;
    }

    function getQuestionPlaceholder(question) {
        if (question.placeholder) {
            return question.placeholder;
        }

        switch (question.type) {
            case 'text':
                return 'Votre réponse...';

            case 'number':
                return 'Votre réponse';

            case 'number-unit':
                return question.unit
                    ? `... ${question.unit}`
                    : 'Votre réponse';

            case 'fraction':
            case 'fraction-value':
            case 'fraction-simplified':
                return 'Exemple : 3/4';

            case 'number-list':
                return 'Séparez les valeurs par des points-virgules';

            case 'factorization':
                return 'Exemple : 2 × 2 × 3';

            case 'math-expression':
                return 'Votre expression';

            default:
                return 'Votre réponse';
        }
    }

    /* =========================================================
       COMMENTAIRES PROF
       ========================================================= */

    function renderProfComment(prof) {
        if (!prof) {
            return '';
        }

        const lines = [];

        lines.push('PROF');

        if (prof.expected) {
            lines.push('');
            lines.push('ATTENDU :');
            lines.push(
                String(prof.expected)
            );
        }

        if (prof.method) {
            lines.push('');
            lines.push('DÉMARCHE :');

            if (
                Array.isArray(
                    prof.method
                )
            ) {
                prof.method.forEach(
                    item => {
                        lines.push(
                            String(item)
                        );
                    }
                );
            } else {
                lines.push(
                    String(prof.method)
                );
            }
        }

        if (prof.vocabulary) {
            lines.push('');
            lines.push('VOCABULAIRE :');
            lines.push(
                String(
                    prof.vocabulary
                )
            );
        }

        if (prof.help) {
            lines.push('');
            lines.push('AIDE SI BESOIN :');
            lines.push(
                String(prof.help)
            );
        }

        if (prof.vigilance) {
            lines.push('');
            lines.push('VIGILANCE :');
            lines.push(
                String(
                    prof.vigilance
                )
            );
        }

        if (prof.note) {
            lines.push('');
            lines.push('NOTE :');
            lines.push(
                String(
                    prof.note
                )
            );
        }

        return `
            <!--
            ${lines.join('\n')}
            -->
        `;
    }

    /* =========================================================
       INDICES
       ========================================================= */

    function renderHints(question) {
        if (
            !Array.isArray(
                question.hints
            )
            ||
            question.hints.length === 0
        ) {
            return '';
        }

        const hintHtml = question.hints
            .slice(0, 3)
            .map(
                (hint, index) => {
                    const level =
                        index + 1;

                    const hintId =
                        `${question.id}-h${level}`;

                    return `
                        <details
                            class="student-hint"
                            data-exercise="${escapeAttribute(question.id)}"
                            data-hint-id="${escapeAttribute(hintId)}"
                            data-hint-level="${level}">

                            <summary>
                                <strong>
                                    Indice ${level}
                                </strong>
                            </summary>

                            <p>
                                ${hint}
                            </p>

                        </details>
                    `;
                }
            )
            .join('');

        return `
            <div class="student-hints">

                ${hintHtml}

                <p
                    data-hint-status="${escapeAttribute(question.id)}">
                </p>

            </div>
        `;
    }

    /* =========================================================
       INPUT TEXTE / NOMBRE
       ========================================================= */

    function renderInputQuestion(
        question,
        checkType
    ) {
        const id =
            escapeAttribute(
                question.id
            );

        const answer =
            question.answer !==
                undefined
                ? `data-answer="${escapeAttribute(question.answer)}"`
                : '';

        const unit =
            question.unit
                ? `data-unit="${escapeAttribute(question.unit)}"`
                : '';

        const order =
            question.order
                ? `data-order="${escapeAttribute(question.order)}"`
                : '';

        const inputMode =
            question.inputmode
            ||
            (
                checkType === 'number'
                ||
                checkType === 'number-unit'
                ||
                checkType === 'percentage'
                    ? 'decimal'
                    : 'text'
            );

        const questionHtml =
            question.questionHtml
            ||
            escapeHtml(
                question.question
                || ''
            );

        return `
            <label for="${id}">
                ${questionHtml}
            </label>

            <input
                id="${id}"
                type="text"
                class="student-result${question.className ? ` ${escapeAttribute(question.className)}` : ''}"
                inputmode="${escapeAttribute(inputMode)}"
                data-save="${id}"
                data-check="${escapeAttribute(checkType)}"
                ${answer}
                ${unit}
                ${order}
                placeholder="${escapeAttribute(getQuestionPlaceholder(question))}"
                autocomplete="off"
                ${question.spellcheck === false ? 'spellcheck="false"' : ''}>
        `;
    }

    /* =========================================================
       TEXTAREA
       ========================================================= */

    function renderTextareaQuestion(
        question
    ) {
        const id =
            escapeAttribute(
                question.id
            );

        const questionHtml =
            question.questionHtml
            ||
            escapeHtml(
                question.question
                || ''
            );

        return `
            <p
                class="question-text"
                data-question-text>
                ${questionHtml}
            </p>

            <textarea
                id="${id}"
                class="student-answer"
                data-save="${id}"
                rows="${getQuestionRows(question)}"
                placeholder="${escapeAttribute(getQuestionPlaceholder(question))}"></textarea>
        `;
    }

    /* =========================================================
       CHOIX RADIO
       ========================================================= */

    function renderChoiceQuestion(
        question
    ) {
        const name =
            escapeAttribute(
                question.id
            );

        const questionHtml =
            question.questionHtml
            ||
            escapeHtml(
                question.question
                || ''
            );

        const options =
            Array.isArray(
                question.options
            )
                ? question.options
                : [];

        const radios =
            options
                .map(option => {
                    const value =
                        typeof option ===
                            'object'
                            ? option.value
                            : option;

                    const label =
                        typeof option ===
                            'object'
                            ? option.label
                            : option;

                    return `
                        <label>
                            <input
                                type="radio"
                                name="${name}"
                                value="${escapeAttribute(value)}"
                                data-save="${name}"
                                data-check="choice"
                                data-answer="${escapeAttribute(question.answer)}">
                            ${label}
                        </label>
                    `;
                })
                .join('');

        return `
            <p class="question-text">
                ${questionHtml}
            </p>

            <fieldset>

                ${
                    question.legend
                        ? `
                            <legend>
                                ${question.legend}
                            </legend>
                        `
                        : ''
                }

                ${radios}

            </fieldset>
        `;
    }

    /* =========================================================
       QUESTION OBJECTIVE + DÉMARCHE OPTIONNELLE
       ========================================================= */

    function renderQuestionWork(
        question
    ) {
        if (!question.work) {
            return '';
        }

        const workId =
            `${question.id}-work`;

        const rows =
            question.work.rows
            || 2;

        return `
            <label for="${escapeAttribute(workId)}">
                ${
                    question.work.label
                    ||
                    'Si vous souhaitez détailler votre démarche :'
                }
            </label>

            <textarea
                id="${escapeAttribute(workId)}"
                class="student-answer"
                data-save="${escapeAttribute(workId)}"
                rows="${rows}"
                placeholder="${escapeAttribute(
                    question.work.placeholder
                    || 'Votre démarche...'
                )}"></textarea>
        `;
    }

    /* =========================================================
       CHAMP DE QUESTION
       ========================================================= */

    function renderQuestionField(
        question
    ) {
        switch (
            question.type
        ) {
            case 'text':
                return renderTextareaQuestion(
                    question
                );

            case 'number':
                return renderInputQuestion(
                    question,
                    'number'
                );

            case 'number-unit':
                return renderInputQuestion(
                    question,
                    'number-unit'
                );

            case 'percentage':
                return renderInputQuestion(
                    question,
                    'percentage'
                );

            case 'fraction':
                return renderInputQuestion(
                    question,
                    'fraction'
                );

            case 'fraction-value':
                return renderInputQuestion(
                    question,
                    'fraction-value'
                );

            case 'fraction-simplified':
                return renderInputQuestion(
                    question,
                    'fraction-simplified'
                );

            case 'number-list':
                return renderInputQuestion(
                    question,
                    'number-list'
                );

            case 'factorization':
                return renderInputQuestion(
                    question,
                    'factorization'
                );

            case 'math-expression':
                return renderInputQuestion(
                    question,
                    'math-expression'
                );

            case 'choice':
                return renderChoiceQuestion(
                    question
                );

            default:
                console.warn(
                    `course-renderer : type de question inconnu "${question.type}"`
                );

                return '';
        }
    }

    /* =========================================================
       QUESTION COMPLÈTE
       ========================================================= */

    function renderQuestion(
        question
    ) {
        if (
            !question
            ||
            !question.id
            ||
            !question.type
        ) {
            console.warn(
                'course-renderer : question invalide',
                question
            );

            return '';
        }

        const mode =
            getQuestionMode(
                question
            );

        return `
            <div
                class="answer-block"
                data-exercise-key="${escapeAttribute(question.id)}"
                data-answer-mode="${escapeAttribute(mode)}"
                data-answer-type="${escapeAttribute(question.type)}"
                data-track-progress="true"
                data-answer-state="empty"
                ${
                    mode === 'review'
                        ? `data-export-question="${escapeAttribute(question.id)}"`
                        : ''
                }>

                ${renderQuestionField(question)}

                <p
                    class="answer-feedback"
                    data-answer-status="${escapeAttribute(question.id)}"
                    aria-live="polite">
                    À faire
                </p>

                ${renderQuestionWork(question)}

                ${renderHints(question)}

            </div>

            ${renderProfComment(question.prof)}
        `;
    }

    /* =========================================================
       TABLEAU
       ========================================================= */

    function renderTable(block) {
        if (
            !Array.isArray(
                block.headers
            )
            ||
            !Array.isArray(
                block.rows
            )
        ) {
            return '';
        }

        const headerHtml =
            block.headers
                .map(
                    header =>
                        `<th>${header}</th>`
                )
                .join('');

        const rowsHtml =
            block.rows
                .map(
                    row => `
                        <tr>
                            ${row
                                .map(
                                    cell =>
                                        `<td>${cell}</td>`
                                )
                                .join('')}
                        </tr>
                    `
                )
                .join('');

        return `
            <table>

                <thead>
                    <tr>
                        ${headerHtml}
                    </tr>
                </thead>

                <tbody>
                    ${rowsHtml}
                </tbody>

            </table>
        `;
    }

    /* =========================================================
       BLOCS PÉDAGOGIQUES
       ========================================================= */

    function renderInfoBlock(
        className,
        block
    ) {
        if (!block) {
            return '';
        }

        if (
            typeof block ===
            'string'
        ) {
            return `
                <div class="${className}">
                    ${block}
                </div>
            `;
        }

        const title =
            block.title
                ? `<strong>${block.title}</strong>`
                : '';

        const content =
            block.content || '';

        return `
            <div class="${className}">
                ${title}
                ${content}
            </div>
        `;
    }

    /* =========================================================
       BLOC LIBRE
       ========================================================= */

    function renderCustomBlock(
        block
    ) {
        if (!block) {
            return '';
        }

        switch (
            block.type
        ) {
            case 'html':
                return block.content || '';

            case 'table':
                return renderTable(
                    block
                );

            case 'question':
                return renderQuestion(
                    block.question
                    || block
                );

            case 'info':
                return renderInfoBlock(
                    'info',
                    block
                );

            case 'rappel':
            case 'reminder':
                return renderInfoBlock(
                    'rappel',
                    block
                );

            case 'dnb':
                return renderInfoBlock(
                    'dnb',
                    block
                );

            case 'resource':
            case 'ressource':
                return renderInfoBlock(
                    'ressource',
                    block
                );

            default:
                return '';
        }
    }

    /* =========================================================
       ACTIVITÉ
       ========================================================= */

    function renderActivity(
        activity,
        index
    ) {
        if (!activity) {
            return '';
        }

        const activityId =
            activity.id
            ||
            `activity${index + 1}`;

        const calculatorText =
            activity.calculator === true
                ? 'Calculatrice autorisée.'
                : activity.calculator === false
                    ? 'Calculatrice interdite.'
                    : activity.calculatorText
                        || '';

        let body = '';

        /*
         * Si "items" existe, il permet
         * de contrôler exactement l'ordre :
         * texte, tableau, question, rappel, etc.
         */
        if (
            Array.isArray(
                activity.items
            )
        ) {
            body =
                activity.items
                    .map(item => {
                        if (
                            item.type ===
                            'question'
                        ) {
                            return renderQuestion(
                                item
                            );
                        }

                        return renderCustomBlock(
                            item
                        );
                    })
                    .join('');
        } else {
            /*
             * Format simplifié :
             * intro + table + questions + blocs.
             */

            if (activity.intro) {
                body += `
                    <div class="activity-intro">
                        ${activity.intro}
                    </div>
                `;
            }

            if (activity.table) {
                body += renderTable(
                    activity.table
                );
            }

            if (
                Array.isArray(
                    activity.questions
                )
            ) {
                body +=
                    activity.questions
                        .map(
                            renderQuestion
                        )
                        .join('');
            }

            if (
                Array.isArray(
                    activity.blocks
                )
            ) {
                body +=
                    activity.blocks
                        .map(
                            renderCustomBlock
                        )
                        .join('');
            }

            if (activity.reminder) {
                body +=
                    renderInfoBlock(
                        'rappel',
                        activity.reminder
                    );
            }

            if (activity.dnb) {
                body +=
                    renderInfoBlock(
                        'dnb',
                        activity.dnb
                    );
            }

            if (activity.resource) {
                body +=
                    renderInfoBlock(
                        'ressource',
                        activity.resource
                    );
            }
        }

        return `
            <section
                class="activity"
                id="${escapeAttribute(activityId)}"
                data-activity="${index + 1}">

                <h2>
                    ${activity.title || `Activité ${index + 1}`}
                </h2>

                ${
                    calculatorText
                        ? `
                            <p>
                                <strong>
                                    ${calculatorText}
                                </strong>
                            </p>
                        `
                        : ''
                }

                ${body}

                ${renderProfComment(activity.prof)}

            </section>
        `;
    }

    /* =========================================================
       INTRODUCTION
       ========================================================= */

    function renderIntro(
        intro
    ) {
        if (!intro) {
            return '';
        }

        const learn =
            Array.isArray(
                intro.learn
            )
                ? intro.learn
                    .map(
                        item =>
                            `<li>${item}</li>`
                    )
                    .join('')
                : '';

        const skills =
            Array.isArray(
                intro.skills
            )
                ? intro.skills
                    .map(
                        item =>
                            `<li>${item}</li>`
                    )
                    .join('')
                : '';

        return `
            <section class="lesson-intro">

                ${
                    learn
                        ? `
                            <h2>
                                Ce que vous allez apprendre
                            </h2>

                            <ul>
                                ${learn}
                            </ul>
                        `
                        : ''
                }

                ${
                    skills
                        ? `
                            <h2>
                                Ce que vous allez apprendre à faire
                            </h2>

                            <ul>
                                ${skills}
                            </ul>
                        `
                        : ''
                }

                ${
                    intro.info
                        ? `
                            <div class="info">
                                ${intro.info}
                            </div>
                        `
                        : ''
                }

            </section>
        `;
    }

    /* =========================================================
       À RETENIR
       ========================================================= */

    function renderRemember(
        items
    ) {
        if (
            !Array.isArray(
                items
            )
            ||
            items.length === 0
        ) {
            return '';
        }

        return `
            <section class="retenir">

                <h2>
                    À retenir
                </h2>

                <ul>
                    ${items
                        .map(
                            item =>
                                `<li>${item}</li>`
                        )
                        .join('')}
                </ul>

            </section>
        `;
    }

    /* =========================================================
       FIN DE SÉANCE
       ========================================================= */

    function renderFinishSession(
        session
    ) {
        if (
            session.finish ===
            false
        ) {
            return '';
        }

        const customText =
            session.finish?.text
            ||
            `
                <p>
                    Vérifiez que vous avez répondu
                    à toutes les questions
                    que vous pouviez faire.
                </p>

                <p>
                    Lorsque vous cliquez sur le bouton,
                    vos réponses sont enregistrées
                    et une copie HTML de votre travail
                    est téléchargée sur votre ordinateur.
                </p>
            `;

        return `
            <section class="finish-session-box">

                <h3>
                    Finir la séance
                </h3>

                ${customText}

                <button
                    type="button"
                    class="finish-session-button"
                    data-finish-session
                    data-session="${escapeAttribute(session.seance)}">
                    ✓ Finir la séance
                </button>

                <p
                    class="finish-session-status"
                    data-finish-status
                    data-finish-session-status
                    aria-live="polite">
                </p>

            </section>
        `;
    }

    /* =========================================================
       SOURCES
       ========================================================= */

    function renderSources(
        sources
    ) {
        if (
            !Array.isArray(
                sources
            )
            ||
            sources.length === 0
        ) {
            return '';
        }

        const list =
            sources
                .map(source => {
                    if (
                        typeof source ===
                        'string'
                    ) {
                        return `
                            <li>
                                ${source}
                            </li>
                        `;
                    }

                    if (
                        source.url
                        &&
                        source.label
                    ) {
                        return `
                            <li>
                                <a
                                    href="${escapeAttribute(source.url)}"
                                    target="_blank"
                                    rel="noopener noreferrer">
                                    ${source.label}
                                </a>
                            </li>
                        `;
                    }

                    return '';
                })
                .join('');

        return `
            <section class="sources">

                <h2>
                    Sources et ressources
                </h2>

                <ul>
                    ${list}
                </ul>

            </section>
        `;
    }

    /* =========================================================
       SÉANCE COMPLÈTE
       ========================================================= */

    function renderCourseSession(
        session
    ) {
        const container =
            getSessionContainer();

        if (!container) {
            return false;
        }

        const number =
            normalizeSessionNumber(
                session.id
            );

        if (number === null) {
            console.warn(
                'course-renderer : id de séance invalide',
                session
            );

            return false;
        }

        /*
         * Empêche la duplication si un fichier
         * de séance est chargé deux fois.
         */
        if (
            document.getElementById(
                `session${number}`
            )
        ) {
            console.warn(
                `course-renderer : session${number} existe déjà`
            );

            return true;
        }

        const section =
            document.createElement(
                'section'
            );

        section.id =
            `session${number}`;

        section.className =
            'content-section course-session';

        section.dataset.matiere =
            session.matiere || '';

        section.dataset.classe =
            session.classe || '';

        section.dataset.seance =
            session.seance
            ||
            `S${String(number).padStart(2, '0')}`;

        section.dataset.sessionTitle =
            session.title || '';

        const activities =
            Array.isArray(
                session.activities
            )
                ? session.activities
                    .map(
                        renderActivity
                    )
                    .join('')
                : '';

        section.innerHTML = `
            <h1>
                ${
                    session.heading
                    ||
                    `Séance ${number} : ${session.title || ''}`
                }
            </h1>

            ${
                session.subtitle
                    ? `
                        <h2>
                            ${session.subtitle}
                        </h2>
                    `
                    : ''
            }

            ${renderIntro(session.intro)}

            ${activities}

            ${
                session.afterActivities
                    ? session.afterActivities
                    : ''
            }

            ${renderRemember(session.remember)}

            ${renderFinishSession(session)}

            ${renderSources(session.sources)}

            ${renderProfComment(session.prof)}
        `;

        container.appendChild(
            section
        );

        return true;
    }

    /* =========================================================
       ENREGISTREMENT D'UNE SÉANCE
       ========================================================= */

    function registerCourseSession(
        session
    ) {
        if (
            !session
            ||
            !session.id
        ) {
            console.warn(
                'course-renderer : séance invalide',
                session
            );

            return;
        }

        const existing =
            registeredSessions.find(
                item =>
                    Number(item.id) ===
                    Number(session.id)
            );

        if (existing) {
            console.warn(
                `course-renderer : séance ${session.id} déjà enregistrée`
            );

            return;
        }

        registeredSessions.push(
            session
        );

        registeredSessions.sort(
            (a, b) =>
                Number(a.id)
                -
                Number(b.id)
        );

        if (
            !renderCourseSession(
                session
            )
        ) {
            pendingSessions.push(
                session
            );
        }
    }

    /* =========================================================
       RENDU DES SÉANCES EN ATTENTE
       ========================================================= */

    function renderPendingSessions() {
        if (
            pendingSessions.length ===
            0
        ) {
            return;
        }

        const copy =
            [...pendingSessions];

        pendingSessions.length = 0;

        copy
            .sort(
                (a, b) =>
                    Number(a.id)
                    -
                    Number(b.id)
            )
            .forEach(
                renderCourseSession
            );
    }

    /* =========================================================
       API PUBLIQUE
       ========================================================= */

    window.registerCourseSession =
        registerCourseSession;

    window.renderCourseSession =
        renderCourseSession;

    window.courseSessions =
        registeredSessions;

    /* =========================================================
       INITIALISATION
       ========================================================= */

    if (
        document.readyState ===
        'loading'
    ) {
        document.addEventListener(
            'DOMContentLoaded',
            renderPendingSessions
        );
    } else {
        renderPendingSessions();
    }

})();