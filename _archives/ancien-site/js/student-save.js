// ======================================================
// CONFIGURATION
// ======================================================

const AUTH_URL = "/auth/";

const SAVE_DELAY = 1000;

const SESSION_TOUCH_DELAY = 30000;


// ======================================================
// ÉLÉMENTS DE L'INTERFACE
// ======================================================

const saveStatus =
    document.getElementById("save-status");

const notConnected =
    document.getElementById("not-connected");

const studentArea =
    document.getElementById("student-area");

const welcome =
    document.getElementById("welcome");

const logoutButton =
    document.getElementById("logout-button");


// ======================================================
// ÉTAT
// ======================================================

let currentUser = null;

let currentProfile = null;

let currentSession = null;

let saveTimers = {};

let sessionTouchTimer = null;


/*
    exercise_key → exercice Supabase

    Exemple :

    exercisesByKey.get("Q1")

    donne :

    {
        id: 42,
        exercise_key: "Q1",
        response_expected: true,
        max_hint_level: 3
    }
*/

const exercisesByKey =
    new Map();


/*
    exercise_id → exercise_key

    Utile lors du chargement des réponses.
*/

const exerciseKeysById =
    new Map();


/*
    Liste des indices déjà consultés.

    Exemple de clé :

    "42:1"
    "42:2"
*/

const openedHints =
    new Set();


/*
    Évite deux INSERT simultanés
    si un élève ouvre très rapidement
    plusieurs fois le même indice.
*/

const pendingHints =
    new Set();


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
// OUTILS
// ======================================================

function setSaveStatus(message) {

    if (!saveStatus) {
        return;
    }

    saveStatus.textContent =
        message;

}


// ======================================================
// VÉRIFICATION DE LA PAGE
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

        setSaveStatus(
            "❌ Erreur de configuration de la page"
        );

        return false;

    }


    return true;

}


// ======================================================
// INITIALISATION
// ======================================================

async function init() {

    if (!checkPageConfiguration()) {
        return;
    }


    setSaveStatus(
        "⏳ Initialisation..."
    );


    // ==================================================
    // UTILISATEUR CONNECTÉ
    // ==================================================

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
                "Erreur utilisateur :",
                userError
            );

        }


        if (notConnected) {
            notConnected.hidden = false;
        }


        if (studentArea) {
            studentArea.hidden = true;
        }


        return;

    }


    currentUser =
        user;


    // ==================================================
    // PROFIL
    // ==================================================

    const profileLoaded =
        await loadProfile();


    if (!profileLoaded) {
        return;
    }


    // ==================================================
    // SÉANCE
    // ==================================================

    const sessionLoaded =
        await loadCourseSession();


    if (!sessionLoaded) {
        return;
    }


    // ==================================================
    // EXERCICES
    // ==================================================

    const exercisesLoaded =
        await loadCourseExercises();


    if (!exercisesLoaded) {
        return;
    }


    // ==================================================
    // PROGRESSION DE LA SÉANCE
    // ==================================================

    await startStudentSession();


    // ==================================================
    // RÉPONSES
    // ==================================================

    await loadStudentWork();


    // ==================================================
    // INDICES
    // ==================================================

    await loadStudentHints();


    // ==================================================
    // ÉVÉNEMENTS
    // ==================================================

    initAutoSave();

    initHints();


    setSaveStatus(
        "✅ Travail chargé"
    );

}


// ======================================================
// PROFIL
// ======================================================

async function loadProfile() {

    const {
        data: profile,
        error
    } = await db
        .from("profiles")
        .select(
            "prenom, nom, classe"
        )
        .eq(
            "user_id",
            currentUser.id
        )
        .single();


    if (
        error ||
        !profile
    ) {

        console.error(
            "Erreur profil :",
            error
        );


        setSaveStatus(
            "❌ Erreur lors du chargement du profil."
        );


        return false;

    }


    currentProfile =
        profile;


    if (welcome) {

        welcome.textContent =
            `Bonjour ${profile.prenom} ${profile.nom} 👋`;

    }


    if (notConnected) {
        notConnected.hidden = true;
    }


    if (studentArea) {
        studentArea.hidden = false;
    }


    return true;

}


// ======================================================
// CHARGEMENT DE LA SÉANCE
// ======================================================

async function loadCourseSession() {

    const {
        data,
        error
    } = await db
        .from("course_sessions")
        .select(
            `
            id,
            matiere,
            classe,
            seance,
            titre,
            active
            `
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
        )
        .eq(
            "active",
            true
        )
        .maybeSingle();


    if (error) {

        console.error(
            "Erreur lors du chargement de la séance :",
            error
        );


        setSaveStatus(
            "❌ Impossible de charger cette séance."
        );


        return false;

    }


    if (!data) {

        console.error(
            "Séance absente de course_sessions :",
            {
                matiere,
                classe,
                seance
            }
        );


        setSaveStatus(
            "❌ Cette séance n'est pas encore enregistrée dans la base."
        );


        return false;

    }


    currentSession =
        data;


    return true;

}


// ======================================================
// CHARGEMENT DES EXERCICES
// ======================================================

async function loadCourseExercises() {

    const {
        data,
        error
    } = await db
        .from("course_exercises")
        .select(
            `
            id,
            exercise_key,
            titre,
            response_expected,
            max_hint_level,
            sort_order
            `
        )
        .eq(
            "session_id",
            currentSession.id
        )
        .order(
            "sort_order",
            {
                ascending: true
            }
        );


    if (error) {

        console.error(
            "Erreur lors du chargement des exercices :",
            error
        );


        setSaveStatus(
            "❌ Impossible de charger les exercices."
        );


        return false;

    }


    exercisesByKey.clear();

    exerciseKeysById.clear();


    (data ?? []).forEach(
        exercise => {

            exercisesByKey.set(
                exercise.exercise_key,
                exercise
            );


            exerciseKeysById.set(
                String(exercise.id),
                exercise.exercise_key
            );

        }
    );


    console.log(
        "Exercices chargés :",
        Array.from(
            exercisesByKey.keys()
        )
    );


    return true;

}


// ======================================================
// DÉBUT / REPRISE DE SÉANCE
// ======================================================

async function startStudentSession() {

    const {
        error
    } = await db
        .from("student_sessions")
        .upsert(
            {
                user_id:
                    currentUser.id,

                session_id:
                    currentSession.id,

                status:
                    "in_progress",

                last_seen_at:
                    new Date().toISOString()
            },
            {
                onConflict:
                    "user_id,session_id"
            }
        );


    if (error) {

        console.error(
            "Erreur progression séance :",
            error
        );

    }

}


// ======================================================
// ACTUALISATION DE L'ACTIVITÉ
// ======================================================

function scheduleSessionTouch() {

    if (sessionTouchTimer) {
        return;
    }


    sessionTouchTimer =
        setTimeout(
            async () => {

                sessionTouchTimer =
                    null;


                if (
                    !currentUser ||
                    !currentSession
                ) {

                    return;

                }


                const {
                    error
                } = await db
                    .from("student_sessions")
                    .update({
                        last_seen_at:
                            new Date().toISOString()
                    })
                    .eq(
                        "user_id",
                        currentUser.id
                    )
                    .eq(
                        "session_id",
                        currentSession.id
                    );


                if (error) {

                    console.error(
                        "Erreur mise à jour activité :",
                        error
                    );

                }

            },
            SESSION_TOUCH_DELAY
        );

}


// ======================================================
// CHARGEMENT DES RÉPONSES
// ======================================================

async function loadStudentWork() {

    const exerciseIds =
        Array.from(
            exercisesByKey.values()
        )
        .map(
            exercise =>
                exercise.id
        );


    if (
        exerciseIds.length === 0
    ) {

        return;

    }


    setSaveStatus(
        "⏳ Chargement des réponses..."
    );


    const {
        data,
        error
    } = await db
        .from("student_work")
        .select(
            `
            exercise_id,
            reponse,
            terminee
            `
        )
        .eq(
            "user_id",
            currentUser.id
        )
        .in(
            "exercise_id",
            exerciseIds
        );


    if (error) {

        console.error(
            "Erreur lors du chargement des réponses :",
            error
        );


        setSaveStatus(
            "❌ Erreur lors du chargement."
        );


        return;

    }


    (data ?? []).forEach(
        item => {

            const exerciseKey =
                exerciseKeysById.get(
                    String(
                        item.exercise_id
                    )
                );


            if (!exerciseKey) {
                return;
            }


            const field =
                document.querySelector(
                    `[data-save="${CSS.escape(exerciseKey)}"]`
                );


            if (!field) {

                /*
                    C'est normal pour les activités
                    qui ont des indices mais aucune
                    réponse à écrire sur le site.
                */

                return;

            }


            setFieldValue(
                field,
                item.reponse ?? ""
            );

        }
    );

}


// ======================================================
// LECTURE DE LA VALEUR D'UN CHAMP
// ======================================================

function getFieldValue(field) {

    if (
        field.type === "checkbox"
    ) {

        return field.checked
            ? (
                field.value ||
                "true"
            )
            : "";

    }


    return field.value ?? "";

}


// ======================================================
// RESTAURATION D'UN CHAMP
// ======================================================

function setFieldValue(
    field,
    value
) {

    if (
        field.type === "checkbox"
    ) {

        field.checked =
            value !== "";

        return;

    }


    field.value =
        value;

}


// ======================================================
// SAUVEGARDE D'UNE RÉPONSE
// ======================================================

async function saveField(field) {

    if (
        !currentUser ||
        !currentSession ||
        !field
    ) {

        return;

    }


    const exerciseKey =
        field.dataset.save;


    if (!exerciseKey) {
        return;
    }


    /*
        Compatibilité temporaire avec
        les anciens textarea cachés.

        Ils seront retirés du HTML.
    */

    if (
        exerciseKey.startsWith(
            "hints-"
        )
    ) {

        return;

    }


    const exercise =
        exercisesByKey.get(
            exerciseKey
        );


    if (!exercise) {

        console.warn(
            `Exercice "${exerciseKey}" absent de course_exercises.`
        );

        return;

    }


    const value =
        getFieldValue(field);


    setSaveStatus(
        "⏳ Sauvegarde..."
    );


    const {
        error
    } = await db
        .from("student_work")
        .upsert(
            {
                user_id:
                    currentUser.id,

                exercise_id:
                    exercise.id,

                reponse:
                    value,

                terminee:
                    value.trim().length > 0
            },
            {
                onConflict:
                    "user_id,exercise_id"
            }
        );


    if (error) {

        console.error(
            "Erreur de sauvegarde :",
            error
        );


        setSaveStatus(
            "❌ Erreur de sauvegarde"
        );


        return;

    }


    console.log(
        "Réponse sauvegardée :",
        {
            exercice:
                exerciseKey,

            exercise_id:
                exercise.id,

            reponse:
                value
        }
    );


    setSaveStatus(
        "☁ Sauvegardé"
    );


    scheduleSessionTouch();

}


// ======================================================
// AUTOSAUVEGARDE
// ======================================================

function initAutoSave() {

    const fields =
        document.querySelectorAll(
            "[data-save]"
        );


    fields.forEach(
        field => {

            const exerciseKey =
                field.dataset.save;


            /*
                Les anciens champs cachés
                hints-* ne sont plus utilisés.
            */

            if (
                !exerciseKey ||
                exerciseKey.startsWith(
                    "hints-"
                )
            ) {

                return;

            }


            if (
                !exercisesByKey.has(
                    exerciseKey
                )
            ) {

                console.warn(
                    `Le champ "${exerciseKey}" existe dans le HTML mais pas dans course_exercises.`
                );

                return;

            }


            field.addEventListener(
                "input",
                () => {

                    setSaveStatus(
                        "✏️ Modification en cours..."
                    );


                    clearTimeout(
                        saveTimers[
                            exerciseKey
                        ]
                    );


                    saveTimers[
                        exerciseKey
                    ] =
                        setTimeout(
                            () => {

                                saveField(
                                    field
                                );

                            },
                            SAVE_DELAY
                        );

                }
            );


            /*
                Pour certains éléments comme
                les <select>, change est utile
                en complément de input.
            */

            field.addEventListener(
                "change",
                () => {

                    clearTimeout(
                        saveTimers[
                            exerciseKey
                        ]
                    );


                    saveTimers[
                        exerciseKey
                    ] =
                        setTimeout(
                            () => {

                                saveField(
                                    field
                                );

                            },
                            SAVE_DELAY
                        );

                }
            );

        }
    );

}


// ======================================================
// CHARGEMENT DES INDICES DÉJÀ CONSULTÉS
// ======================================================

async function loadStudentHints() {

    const exerciseIds =
        Array.from(
            exercisesByKey.values()
        )
        .map(
            exercise =>
                exercise.id
        );


    if (
        exerciseIds.length === 0
    ) {

        return;

    }


    const {
        data,
        error
    } = await db
        .from("student_hints")
        .select(
            `
            exercise_id,
            hint_level
            `
        )
        .eq(
            "user_id",
            currentUser.id
        )
        .in(
            "exercise_id",
            exerciseIds
        );


    if (error) {

        console.error(
            "Erreur chargement indices :",
            error
        );

        return;

    }


    openedHints.clear();


    (data ?? []).forEach(
        item => {

            openedHints.add(
                getHintId(
                    item.exercise_id,
                    item.hint_level
                )
            );

        }
    );


    restoreHintDisplay();

}


// ======================================================
// IDENTIFIANT LOCAL D'UN INDICE
// ======================================================

function getHintId(
    exerciseId,
    level
) {

    return `${exerciseId}:${level}`;

}


// ======================================================
// INITIALISATION DES INDICES
// ======================================================

function initHints() {

    const hints =
        document.querySelectorAll(
            ".student-hint[data-exercise][data-hint-level]"
        );


    hints.forEach(
        hint => {

            const exerciseKey =
                hint.dataset.exercise;


            const level =
                Number(
                    hint.dataset.hintLevel
                );


            const exercise =
                exercisesByKey.get(
                    exerciseKey
                );


            if (!exercise) {

                console.warn(
                    `Indice associé à "${exerciseKey}", mais cet exercice n'existe pas dans course_exercises.`
                );

                return;

            }


            if (
                !Number.isInteger(level) ||
                level < 1
            ) {

                console.warn(
                    "Niveau d'indice invalide :",
                    hint
                );

                return;

            }


            if (
                exercise.max_hint_level > 0 &&
                level >
                    exercise.max_hint_level
            ) {

                console.warn(
                    `Indice ${level} supérieur au niveau maximal prévu pour ${exerciseKey}.`
                );

            }


            hint.addEventListener(
                "toggle",
                async () => {

                    if (!hint.open) {
                        return;
                    }


                    await saveHint(
                        exercise,
                        level
                    );

                }
            );

        }
    );

}


// ======================================================
// ENREGISTREMENT D'UN INDICE
// ======================================================

async function saveHint(
    exercise,
    level
) {

    if (!currentUser) {
        return;
    }


    const hintId =
        getHintId(
            exercise.id,
            level
        );


    /*
        Déjà enregistré :
        aucune requête supplémentaire.
    */

    if (
        openedHints.has(
            hintId
        ) ||
        pendingHints.has(
            hintId
        )
    ) {

        return;

    }


    pendingHints.add(
        hintId
    );


    /*
        Mise à jour immédiate de l'affichage.
    */

    openedHints.add(
        hintId
    );


    updateHintDisplay(
        exercise.exercise_key
    );


    const {
        error
    } = await db
        .from("student_hints")
        .insert({
            user_id:
                currentUser.id,

            exercise_id:
                exercise.id,

            hint_level:
                level
        });


    pendingHints.delete(
        hintId
    );


    if (error) {

        /*
            23505 = unique_violation.

            Normalement impossible grâce
            au Set local, mais ce n'est pas
            grave si cela arrive.
        */

        if (
            error.code === "23505"
        ) {

            console.warn(
                "Indice déjà enregistré :",
                exercise.exercise_key,
                level
            );


            openedHints.add(
                hintId
            );


            updateHintDisplay(
                exercise.exercise_key
            );


            return;

        }


        console.error(
            "Erreur sauvegarde indice :",
            error
        );


        /*
            L'INSERT a échoué :
            on retire l'état local.
        */

        openedHints.delete(
            hintId
        );


        updateHintDisplay(
            exercise.exercise_key
        );


        setSaveStatus(
            "❌ Erreur lors de l'enregistrement de l'indice"
        );


        return;

    }


    console.log(
        "Indice enregistré :",
        {
            exercice:
                exercise.exercise_key,

            exercise_id:
                exercise.id,

            niveau:
                level
        }
    );


    setSaveStatus(
        "☁ Indice enregistré"
    );


    scheduleSessionTouch();

}


// ======================================================
// RESTAURATION VISUELLE DES INDICES
// ======================================================

function restoreHintDisplay() {

    const exerciseKeys =
        new Set();


    document
        .querySelectorAll(
            ".student-hint[data-exercise]"
        )
        .forEach(
            hint => {

                exerciseKeys.add(
                    hint.dataset.exercise
                );

            }
        );


    exerciseKeys.forEach(
        exerciseKey => {

            updateHintDisplay(
                exerciseKey
            );

        }
    );

}


// ======================================================
// AFFICHAGE DES INDICES
// ======================================================

function updateHintDisplay(
    exerciseKey
) {

    const exercise =
        exercisesByKey.get(
            exerciseKey
        );


    if (!exercise) {
        return;
    }


    const hints =
        document.querySelectorAll(
            `.student-hint[data-exercise="${CSS.escape(exerciseKey)}"]`
        );


    let count =
        0;


    hints.forEach(
        hint => {

            const level =
                Number(
                    hint.dataset.hintLevel
                );


            const hintId =
                getHintId(
                    exercise.id,
                    level
                );


            const seen =
                openedHints.has(
                    hintId
                );


            if (seen) {
                count++;
            }


            /*
                On ne dépend plus de la présence
                préalable d'un span .hint-seen.

                Le JS le crée automatiquement.
            */

            let marker =
                hint.querySelector(
                    ".hint-seen"
                );


            if (!marker) {

                marker =
                    document.createElement(
                        "span"
                    );


                marker.className =
                    "hint-seen";


                const summary =
                    hint.querySelector(
                        "summary"
                    );


                if (summary) {

                    summary.appendChild(
                        marker
                    );

                }

            }


            if (marker) {

                marker.textContent =
                    seen
                        ? " ✓"
                        : "";

            }


            if (seen) {

                hint.dataset.seen =
                    "true";

            } else {

                delete hint.dataset.seen;

            }

        }
    );


    const status =
        document.querySelector(
            `[data-hint-status="${CSS.escape(exerciseKey)}"]`
        );


    if (status) {

        status.textContent =
            `Indices consultés : ${count} / ${hints.length}`;

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
// DÉMARRAGE
// ======================================================

init();