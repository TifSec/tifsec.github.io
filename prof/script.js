document.addEventListener("DOMContentLoaded", () => {
    const classesContainer = document.getElementById("classes");
    const sessionsContainer = document.getElementById("sessions");
    const courseContainer = document.getElementById("course");

    /*
     * À adapter dans chaque page PROF.
     *
     * Exemple dans prof/techno/index.html :
     *
     * <body data-subject="techno">
     *
     * Exemple dans prof/tim/index.html :
     *
     * <body data-subject="tim">
     */

    const subject = document.body.dataset.subject;

    /*
     * Chemins vers les index.html ÉLÈVES.
     * À adapter aux vrais chemins de ton site.
     */

    const subjects = {
        techno: {
            "5e": "tifsec.github.io/techno/5/index.html",
            "4e": "../techno/4/index.html",
            "3e": "../techno/3/index.html"
        },

        tim: {
            "4e / 3e": "/mfr/43/index.html",
            "CAPa 1": "/mfr/capa1/index.html",
            "CAPa 2": "/mfr/capa2/index.html",
            "Seconde": "/mfr/seconde/index.html",
            "Bac Pro 1": "/mfr/bacpro1/index.html",
            "BTS 1": "/mfr/bts1/index.html",
            "BTS 2": "/mfr/bts2/index.html"
        },

        maths: {
            "4e / 3e": "/maths/43/index.html",
            "Seconde": "/maths/seconde/index.html",
            "Bac Pro 1": "/maths/bacpro1/index.html",
            "Bac Pro 2": "/maths/bacpro2/index.html"
        }
    };

    if (!subject || !subjects[subject]) {
        console.error("Matière inconnue :", subject);
        return;
    }

    const classes = subjects[subject];

    /*
     * Création automatique des boutons de classes.
     */
    Object.entries(classes).forEach(([className, url]) => {
        const button = document.createElement("button");

        button.textContent = className;
        button.classList.add("class-button");

        button.addEventListener("click", () => {
            document
                .querySelectorAll(".class-button")
                .forEach(btn => btn.classList.remove("active"));

            button.classList.add("active");

            loadClass(className, url);
        });

        classesContainer.appendChild(button);
    });

    /*
     * Charge le index.html de la classe choisie
     * et récupère toutes les sections sessionX.
     */
    async function loadClass(className, url) {
        sessionsContainer.innerHTML =
            `<p>Chargement des séances de ${className}...</p>`;

        courseContainer.innerHTML = "";

        try {
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(
                    `Impossible de charger ${url} (${response.status})`
                );
            }

            const html = await response.text();

            /*
             * On conserve le HTML source complet,
             * notamment les commentaires PROF.
             */
            const parser = new DOMParser();
            const documentEleve = parser.parseFromString(
                html,
                "text/html"
            );

            /*
             * On cherche toutes les sections dont l'id commence
             * par "session".
             *
             * Exemple :
             * <section id="session1" class="content-section">
             */
            const sessions = [
                ...documentEleve.querySelectorAll(
                    'section[id^="session"]'
                )
            ];

            sessionsContainer.innerHTML = "";

            if (sessions.length === 0) {
                sessionsContainer.innerHTML =
                    "<p>Aucune séance trouvée.</p>";
                return;
            }

            /*
             * Tri numérique :
             * session2 avant session10.
             */
            sessions.sort((a, b) => {
                return getSessionNumber(a.id) - getSessionNumber(b.id);
            });

            sessions.forEach(session => {
                const button = document.createElement("button");

                const number = getSessionNumber(session.id);
                const title = getSessionTitle(session);

                if (title) {
                    button.textContent = `Séance ${number} — ${title}`;
                } else {
                    button.textContent = `Séance ${number}`;
                }

                button.classList.add("session-button");

                button.addEventListener("click", () => {
                    document
                        .querySelectorAll(".session-button")
                        .forEach(btn => btn.classList.remove("active"));

                    button.classList.add("active");

                    displaySession(session);
                });

                sessionsContainer.appendChild(button);
            });

        } catch (error) {
            console.error(error);

            sessionsContainer.innerHTML = `
                <div class="error">
                    <strong>Erreur :</strong>
                    impossible de charger les séances.
                </div>
            `;
        }
    }

    /*
     * Récupère le numéro depuis :
     * session1
     * session03
     * session12
     */
    function getSessionNumber(id) {
        const match = id.match(/\d+/);

        return match ? parseInt(match[0], 10) : 0;
    }

    /*
     * Essaie de récupérer le titre de la séance.
     *
     * On cherche d'abord un h1,
     * puis h2,
     * puis h3.
     */
    function getSessionTitle(session) {
        const title =
            session.querySelector("h1") ||
            session.querySelector("h2") ||
            session.querySelector("h3");

        if (!title) {
            return "";
        }

        let text = title.textContent.trim();

        /*
         * Évite d'avoir :
         *
         * Séance 3 — Séance 3 : Réseaux
         *
         * et garde simplement :
         *
         * Séance 3 — Réseaux
         */
        text = text.replace(
            /^séance\s*\d+\s*[-–—:]?\s*/i,
            ""
        );

        return text;
    }

    /*
     * Affiche une séance dans la partie PROF.
     */
    function displaySession(originalSession) {
        courseContainer.innerHTML = "";

        /*
         * cloneNode(true) permet de travailler sur une copie
         * sans modifier le document récupéré.
         */
        const session = originalSession.cloneNode(true);

        /*
         * Transformation des commentaires PROF
         * en blocs visibles.
         */
        transformProfComments(session);

        /*
         * Certains cours utilisent content-section pour cacher
         * les séances élèves.
         *
         * Ici on force la séance à être visible.
         */
        session.classList.add("prof-session");
        session.style.display = "block";

        courseContainer.appendChild(session);

        /*
         * Retour en haut du cours lorsqu'on change de séance.
         */
        courseContainer.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }

    /*
     * Recherche récursivement les commentaires HTML.
     *
     * Exemple :
     *
     * <!-- PROF : réponse attendue... -->
     *
     * devient :
     *
     * <div class="prof-note">
     * ...
     * </div>
     */
    function transformProfComments(root) {
        const walker = document.createTreeWalker(
            root,
            NodeFilter.SHOW_COMMENT
        );

        const comments = [];

        while (walker.nextNode()) {
            comments.push(walker.currentNode);
        }

        comments.forEach(comment => {
            const content = comment.nodeValue.trim();

            /*
             * On ne touche qu'aux commentaires
             * commençant par PROF.
             */
            if (!/^PROF\b/i.test(content)) {
                return;
            }

            let profContent = content.replace(/^PROF\s*:?\s*/i, "");

            const box = document.createElement("div");
            box.classList.add("prof-note");

            const title = document.createElement("div");
            title.classList.add("prof-note-title");
            title.textContent = "👨‍🏫 PROF";

            const body = document.createElement("div");
            body.classList.add("prof-note-content");

            /*
             * On conserve les sauts de ligne des commentaires.
             */
            profContent
                .split(/\r?\n/)
                .map(line => line.trim())
                .filter(line => line !== "")
                .forEach(line => {
                    const paragraph = document.createElement("p");
                    paragraph.textContent = line;
                    body.appendChild(paragraph);
                });

            box.appendChild(title);
            box.appendChild(body);

            /*
             * Le bloc PROF prend exactement la place
             * du commentaire dans le cours.
             */
            comment.parentNode.replaceChild(box, comment);
        });
    }
});