const saveStatus = document.getElementById("save-status");

let currentUser = null;
let saveTimers = {};


// ======================================================
// INFORMATIONS DE LA PAGE
// ======================================================

const pageData = document.body.dataset;

const matiere = pageData.matiere;
const classe = pageData.classe;
const seance = pageData.seance;


// ======================================================
// IDENTIFICATION DE L'ÉLÈVE
// ======================================================

async function init() {

    const {
        data: {
            user
        }
    } = await db.auth.getUser();


    if (!user) {

        document.getElementById("not-connected").hidden = false;
        document.getElementById("student-area").hidden = true;

        return;
    }


    currentUser = user;


    const {
        data: profile,
        error: profileError
    } = await db
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();


    if (profileError) {

        console.error(profileError);

        saveStatus.textContent =
            "Erreur lors du chargement du profil.";

        return;
    }


    document.getElementById("welcome").textContent =
        `Bonjour ${profile.prenom} ${profile.nom} 👋`;


    document.getElementById("student-area").hidden = false;


    await loadAnswers();

    initAutoSave();
    initHints();

}


// ======================================================
// CHARGEMENT DES RÉPONSES
// ======================================================

async function loadAnswers() {

    saveStatus.textContent =
        "Chargement de ton travail...";


    const {
        data,
        error
    } = await db
        .from("student_work")
        .select("question,reponse")
        .eq("user_id", currentUser.id)
        .eq("matiere", matiere)
        .eq("classe", classe)
        .eq("seance", seance);


    if (error) {

        console.error(error);

        saveStatus.textContent =
            "Erreur lors du chargement.";

        return;
    }


    if (data) {

        data.forEach(item => {

            const field = document.querySelector(
                `[data-save="${item.question}"]`
            );

            if (field) {
                field.value = item.reponse ?? "";
            }

        });

    }


    restoreHintDisplay();

    saveStatus.textContent =
        "✅ Travail chargé";

}


// ======================================================
// SAUVEGARDE D'UN CHAMP
// ======================================================

async function saveField(field) {

    if (!currentUser) {
        return;
    }


    const question = field.dataset.save;

    if (!question) {
        return;
    }


    saveStatus.textContent =
        "⏳ Sauvegarde...";


    const {
        error
    } = await db
        .from("student_work")
        .upsert(
            {

                user_id: currentUser.id,

                matiere: matiere,

                classe: classe,

                seance: seance,

                question: question,

                reponse: field.value,

                terminee:
                    field.value.trim().length > 0,

                updated_at:
                    new Date().toISOString()

            },
            {

                onConflict:
                    "user_id,matiere,classe,seance,question"

            }
        );


    if (error) {

        console.error(error);

        saveStatus.textContent =
            "❌ Erreur de sauvegarde";

        return;
    }


    saveStatus.textContent =
        "☁ Sauvegardé";

}


// ======================================================
// AUTOSAUVEGARDE
// ======================================================

function initAutoSave() {

    const fields =
        document.querySelectorAll("[data-save]");


    fields.forEach(field => {

        field.addEventListener("input", () => {

            saveStatus.textContent =
                "✏️ Modification en cours...";


            const key = field.dataset.save;


            clearTimeout(saveTimers[key]);


            saveTimers[key] = setTimeout(() => {

                saveField(field);

            }, 1000);

        });

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

        hint.addEventListener("toggle", () => {

            if (!hint.open) {
                return;
            }


            const exercise =
                hint.dataset.exercise;

            const level =
                hint.dataset.hintLevel;


            const saveFieldHints =
                document.querySelector(
                    `[data-save="hints-${exercise}"]`
                );


            if (!saveFieldHints) {

                console.warn(
                    `Aucun champ de sauvegarde pour ${exercise}`
                );

                return;
            }


            let openedHints = [];


            if (saveFieldHints.value.trim() !== "") {

                openedHints =
                    saveFieldHints.value
                        .split(",")
                        .map(value => value.trim());

            }


            if (!openedHints.includes(level)) {

                openedHints.push(level);

                openedHints.sort(
                    (a, b) =>
                        Number(a) - Number(b)
                );


                saveFieldHints.value =
                    openedHints.join(",");


                saveField(saveFieldHints);

            }


            updateHintDisplay(
                exercise,
                openedHints
            );

        });

    });

}


// ======================================================
// AFFICHAGE DES INDICES DÉJÀ CONSULTÉS
// ======================================================

function restoreHintDisplay() {

    const savedHintFields =
        document.querySelectorAll(
            '[data-save^="hints-"]'
        );


    savedHintFields.forEach(field => {

        const exercise =
            field.dataset.save.replace(
                "hints-",
                ""
            );


        const openedHints =
            field.value
                .split(",")
                .map(value => value.trim())
                .filter(Boolean);


        updateHintDisplay(
            exercise,
            openedHints
        );

    });

}


function updateHintDisplay(
    exercise,
    openedHints
) {

    const hints =
        document.querySelectorAll(
            `.student-hint[data-exercise="${exercise}"]`
        );


    hints.forEach(hint => {

        const level =
            hint.dataset.hintLevel;


        const marker =
            hint.querySelector(".hint-seen");


        if (
            marker &&
            openedHints.includes(level)
        ) {

            marker.textContent =
                " ✓";

        }

    });


    const status =
        document.querySelector(
            `[data-hint-status="${exercise}"]`
        );


    if (status) {

        status.textContent =
            `${openedHints.length} / ${hints.length}`;

    }

}


// ======================================================
// DÉCONNEXION
// ======================================================

document
    .getElementById("logout-button")
    .addEventListener(
        "click",
        async () => {

            await db.auth.signOut();

            window.location.href = ROUTES.auth;

        }
    );


// ======================================================
// INITIALISATION
// ======================================================

init();