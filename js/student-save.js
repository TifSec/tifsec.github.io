const answer = document.getElementById("answer");
const saveStatus = document.getElementById("save-status");

let currentUser = null;
let saveTimer = null;


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


    await loadAnswer();

}


// ======================================================
// CHARGEMENT DE LA RÉPONSE
// ======================================================

async function loadAnswer() {

    saveStatus.textContent =
        "Chargement de ta réponse...";


    const {
        data,
        error
    } = await db
        .from("student_work")
        .select("reponse")
        .eq("user_id", currentUser.id)
        .eq("matiere", "maths")
        .eq("classe", "3e")
        .eq("seance", "TEST")
        .eq("question", "Q1")
        .maybeSingle();


    if (error) {

        console.error(error);

        saveStatus.textContent =
            "Erreur lors du chargement.";

        return;
    }


    if (data) {

        answer.value =
            data.reponse ?? "";

    }


    saveStatus.textContent =
        "✅ Travail chargé";

}


// ======================================================
// SAUVEGARDE
// ======================================================

async function saveAnswer() {

    if (!currentUser) {
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

                matiere: "maths",

                classe: "3e",

                seance: "TEST",

                question: "Q1",

                reponse: answer.value,

                terminee: answer.value.trim().length > 0,

                updated_at: new Date().toISOString()

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

answer.addEventListener("input", () => {

    saveStatus.textContent =
        "✏️ Modification en cours...";


    clearTimeout(saveTimer);


    saveTimer = setTimeout(() => {

        saveAnswer();

    }, 1000);

});


// ======================================================
// DÉCONNEXION
// ======================================================

document
    .getElementById("logout-button")
    .addEventListener("click", async () => {

        await db.auth.signOut();

        window.location.href =
            "/auth/";

    });


// ======================================================
// INITIALISATION
// ======================================================

init();