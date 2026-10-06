let currentUser = null;


// ======================================================
// INITIALISATION
// ======================================================

async function initStudentDashboard() {

    const {
        data: {
            user
        },
        error
    } = await db.auth.getUser();


    if (error || !user) {

        window.location.href =
            "/auth/";

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


    if (profileError || !profile) {

        console.error(profileError);

        await db.auth.signOut();

        window.location.href =
            "/auth/";

        return;
    }


    showStudent(profile);

    await loadLastSession(profile);

}


// ======================================================
// AFFICHAGE DE L'ÉLÈVE
// ======================================================

function showStudent(profile) {

    document
        .getElementById("student-name")
        .textContent =
        `${profile.prenom} ${profile.nom}`;


    document
        .getElementById("student-class")
        .textContent =
        `Classe : ${profile.classe}`;

}


// ======================================================
// DERNIÈRE SÉANCE
// ======================================================

async function loadLastSession(profile) {

    const {
        data,
        error
    } = await db
        .from("student_work")
        .select(
            `
            matiere,
            classe,
            seance,
            updated_at
            `
        )
        .eq("user_id", currentUser.id)
        .order(
            "updated_at",
            {
                ascending: false
            }
        )
        .limit(1)
        .maybeSingle();


    if (error) {

        console.error(error);

        return;
    }


    if (!data) {

        return;
    }


    const continueButton =
        document.getElementById(
            "continue-button"
        );


    continueButton.disabled = false;


    continueButton.textContent =
        `Continuer ${formatSession(data)}`;


    continueButton.addEventListener(
        "click",
        () => {

            const url =
                getSessionUrl(data);

            if (!url) {
                return;
            }

            window.location.href =
                url;

        }
    );

}


// ======================================================
// NOM DE LA SÉANCE
// ======================================================

function formatSession(data) {

    const subjectNames = {

        maths: "Maths",

        techno: "Technologie",

        tim: "TIM"

    };


    const subject =
        subjectNames[data.matiere]
        ?? data.matiere;


    return `${subject} ${data.classe} — ${data.seance}`;

}


// ======================================================
// URL DE LA SÉANCE
// ======================================================

function getSessionUrl(data) {

    /*
        On modifiera cette fonction
        lorsque nous transformerons
        le premier vrai cours.

        Exemple futur :

        /maths/43/s04/
    */


    if (
        data.matiere === "maths" &&
        data.classe === "3e" &&
        data.seance === "TEST"
    ) {

        return "/test-save.html";

    }


    return null;

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

            window.location.href =
                "/auth/";

        }
    );


// ======================================================
// DÉMARRAGE
// ======================================================

initStudentDashboard();