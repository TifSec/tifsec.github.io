// ======================================================
// CONFIGURATION
// ======================================================

const AUTH_URL =
    "/auth/";


const saveStatus =
    document.getElementById(
        "save-status"
    );


const notConnected =
    document.getElementById(
        "not-connected"
    );


const studentArea =
    document.getElementById(
        "student-area"
    );


const welcome =
    document.getElementById(
        "welcome"
    );


const logoutButton =
    document.getElementById(
        "logout-button"
    );


let currentUser = null;

let saveTimers = {};


// ======================================================
// INFORMATIONS DE LA PAGE
// ======================================================

const pageData =
    document.body.dataset;


const matiere =
    pageData.matiere;


const classe =
    pageData.classe;


const seance =
    pageData.seance;


// ======================================================
// VÉRIFICATION DE LA CONFIGURATION
// ======================================================

function checkPageConfiguration() {

    if (
        !matiere ||
        !classe ||
        !seance
    ) {

        console.error(
            "Configuration de sauvegarde incomplète.",
            {
                matiere,
                classe,
                seance
            }
        );


        if (saveStatus) {

            saveStatus.textContent =
                "❌ Erreur de configuration de la page";

        }


        return false;

    }


    return true;

}


// ======================================================
// IDENTIFICATION DE L'ÉLÈVE
// ======================================================

async function init() {

    if (!checkPageConfiguration()) {
        return;
    }


    const {
        data: {
            user
        },
        error: userError
    } = await db.auth.getUser();


    if (
        userError ||
        !user
    ) {

        if (userError) {

            console.error(
                "Erreur lors de la récupération de l'utilisateur :",
                userError
            );

        }


        if (notConnected) {

            notConnected.hidden =
                false;

        }


        if (studentArea) {

            studentArea.hidden =
                true;

        }


        return;
    }


    currentUser =
        user;


    // ==================================================
    // CHARGEMENT DU PROFIL
    // ==================================================

    const {
        data: profile,
        error: profileError
    } = await db
        .from("profiles")
        .select(
            "prenom, nom, classe"
        )
        .eq(
            "user_id",
            user.id
        )
        .single();


    if (
        profileError ||
        !profile
    ) {

        console.error(
            "Erreur profil :",
            profileError
        );


        if (saveStatus) {

            saveStatus.textContent =
                "❌ Erreur lors du chargement du profil.";

        }


        return;
    }


    // ==================================================
    // AFFICHAGE DE L'ÉLÈVE
    // ==================================================

    if (welcome) {

        welcome.textContent =
            `Bonjour ${profile.prenom} ${profile.nom} 👋`;

    }


    if (notConnected) {

        notConnected.hidden =
            true;

    }


    if (studentArea) {

        studentArea.hidden =
            false;

    }


    // ==================================================
    // CHARGEMENT DU TRAVAIL
    // ==================================================

    await loadAnswers();


    // ==================================================
    // ACTIVATION DES ÉVÉNEMENTS
    // ==================================================

    initAutoSave();

    initHints();

}


// ======================================================
// CHARGEMENT DES RÉPONSES
// ======================================================

async function loadAnswers() {

    if (!currentUser) {
        return;
    }


    if (saveStatus) {

        saveStatus.textContent =
            "⏳ Chargement de ton travail...";

    }


    const {
        data,
        error
    } = await db
        .from("student_work")
        .select(
            "question,reponse"
        )
        .eq(
            "user_id",
            currentUser.id
        )
        .eq(
            "matiere",
            matiere
        )
        .eq(
            "classe",
            classe
        )
        .eq(
            "seance",
            seance
        );


    if (error) {

        console.error(
            "Erreur lors du chargement :",
            error
        );


        if (saveStatus) {

            saveStatus.textContent =
                "❌ Erreur lors du chargement.";

        }


        return;
    }


    // ==================================================
    // RESTAURATION DES CHAMPS
    // ==================================================

    if (data) {

        data.forEach(item => {

            const field =
                document.querySelector(
                    `[data-save="${CSS.escape(item.question)}"]`
                );


            if (!field) {

                console.warn(
                    "Champ introuvable pour :",
                    item.question
                );

                return;
            }


            field.value =
                item.reponse ?? "";

        });

    }


    // ==================================================
    // RESTAURATION VISUELLE DES INDICES
    // ==================================================

    restoreHintDisplay();


    if (saveStatus) {

        saveStatus.textContent =
            "✅ Travail chargé";

    }

}


// ======================================================
// SAUVEGARDE D'UN CHAMP
// ======================================================

async function saveField(field) {

    if (
        !currentUser ||
        !field
    ) {

        return;

    }


    const question =
        field.dataset.save;


    if (!question) {

        console.warn(
            "Champ sans attribut data-save.",
            field
        );

        return;

    }


    const value =
        field.value ?? "";


    if (saveStatus) {

        saveStatus.textContent =
            "⏳ Sauvegarde...";

    }


    const {
        error
    } = await db
        .from("student_work")
        .upsert(
            {

                user_id:
                    currentUser.id,

                matiere:
                    matiere,

                classe:
                    classe,

                seance:
                    seance,

                question:
                    question,

                reponse:
                    value,

                terminee:
                    value.trim().length > 0,

                updated_at:
                    new Date().toISOString()

            },
            {

                onConflict:
                    "user_id,matiere,classe,seance,question"

            }
        );


    if (error) {

        console.error(
            "Erreur de sauvegarde :",
            error
        );


        if (saveStatus) {

            saveStatus.textContent =
                "❌ Erreur de sauvegarde";

        }


        return;

    }


    console.log(
        "Sauvegarde réussie :",
        {
            matiere,
            classe,
            seance,
            question,
            value
        }
    );


    if (saveStatus) {

        saveStatus.textContent =
            "☁ Sauvegardé";

    }

}


// ======================================================
// AUTOSAUVEGARDE DES RÉPONSES
// ======================================================

function initAutoSave() {

    const fields =
        document.querySelectorAll(
            "[data-save]"
        );


    fields.forEach(field => {

        /*
            Les champs techniques des indices
            sont enregistrés directement par initHints().
        */

        if (
            field.dataset.save.startsWith(
                "hints-"
            )
        ) {

            return;

        }


        field.addEventListener(
            "input",
            () => {

                if (saveStatus) {

                    saveStatus.textContent =
                        "✏️ Modification en cours...";

                }


                const key =
                    field.dataset.save;


                clearTimeout(
                    saveTimers[key]
                );


                saveTimers[key] =
                    setTimeout(
                        () => {

                            saveField(
                                field
                            );

                        },
                        1000
                    );

            }
        );

    });

}


// ======================================================
// INDICES
// ======================================================

function initHints() {

    const hints =
        document.querySelectorAll(
            ".student-hint[data-exercise][data-hint-level]"
        );


    hints.forEach(hint => {

        hint.addEventListener(
            "toggle",
            async () => {

                /*
                    On enregistre uniquement
                    lorsqu'un indice est ouvert.
                */

                if (!hint.open) {
                    return;
                }


                const exercise =
                    hint.dataset.exercise;


                const level =
                    hint.dataset.hintLevel;


                if (
                    !exercise ||
                    !level
                ) {

                    return;

                }


                const saveFieldHints =
                    document.querySelector(
                        `[data-save="hints-${CSS.escape(exercise)}"]`
                    );


                if (!saveFieldHints) {

                    console.warn(
                        `Aucun champ de sauvegarde trouvé pour les indices de ${exercise}.`
                    );

                    return;

                }


                // ==========================================
                // LECTURE DES INDICES DÉJÀ CONSULTÉS
                // ==========================================

                let openedHints = [];


                if (
                    saveFieldHints
                        .value
                        .trim() !== ""
                ) {

                    openedHints =
                        saveFieldHints
                            .value
                            .split(",")
                            .map(
                                value =>
                                    value.trim()
                            )
                            .filter(Boolean);

                }


                // ==========================================
                // NE PAS COMPTER DEUX FOIS LE MÊME INDICE
                // ==========================================

                if (
                    !openedHints.includes(
                        level
                    )
                ) {

                    openedHints.push(
                        level
                    );


                    openedHints.sort(
                        (a, b) =>
                            Number(a) -
                            Number(b)
                    );


                    saveFieldHints.value =
                        openedHints.join(",");


                    /*
                        Contrairement aux réponses normales,
                        on sauvegarde immédiatement l'ouverture
                        d'un indice.
                    */

                    await saveField(
                        saveFieldHints
                    );

                }


                updateHintDisplay(
                    exercise,
                    openedHints
                );

            }
        );

    });

}


// ======================================================
// RESTAURATION VISUELLE DES INDICES
// ======================================================

function restoreHintDisplay() {

    const savedHintFields =
        document.querySelectorAll(
            '[data-save^="hints-"]'
        );


    savedHintFields.forEach(
        field => {

            const exercise =
                field
                    .dataset
                    .save
                    .replace(
                        "hints-",
                        ""
                    );


            const openedHints =
                field
                    .value
                    .split(",")
                    .map(
                        value =>
                            value.trim()
                    )
                    .filter(Boolean);


            updateHintDisplay(
                exercise,
                openedHints
            );

        }
    );

}


// ======================================================
// AFFICHAGE DES INDICES CONSULTÉS
// ======================================================

function updateHintDisplay(
    exercise,
    openedHints
) {

    const hints =
        document.querySelectorAll(
            `.student-hint[data-exercise="${CSS.escape(exercise)}"]`
        );


    hints.forEach(
        hint => {

            const level =
                hint.dataset.hintLevel;


            const marker =
                hint.querySelector(
                    ".hint-seen"
                );


            if (!marker) {
                return;
            }


            if (
                openedHints.includes(
                    level
                )
            ) {

                marker.textContent =
                    " ✓";


                hint.dataset.seen =
                    "true";

            } else {

                marker.textContent =
                    "";


                delete hint.dataset.seen;

            }

        }
    );


    const status =
        document.querySelector(
            `[data-hint-status="${CSS.escape(exercise)}"]`
        );


    if (status) {

        status.textContent =
            `${openedHints.length} / ${hints.length}`;

    }

}


// ======================================================
// DÉCONNEXION
// ======================================================

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async () => {

            await db.auth.signOut();


            window.location.href =
                AUTH_URL;

        }
    );

}


// ======================================================
// INITIALISATION
// ======================================================

init();