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

        window.location.href = ROUTES.auth;

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

        window.location.href = ROUTES.auth;

        return;
    }


    showStudent(profile);

    await loadLastSession(profile);

    function setSubjectLinks(profile) {

        const timLink =
            document.getElementById("subject-tim-link");

        if (!timLink) {
            return;
        }

        const timRoutes = {
            cap1: "/tim/cap1/",
            cap2: "/tim/cap2/",
            "2de": "/tim/2de/",
            "1re": "/tim/1re/",
            term: "/tim/term/",
            bts1: "/tim/bts1/",
            bts2: "/tim/bts2/test.html"
        };

        const url =
            timRoutes[profile.classe];

        if (url) {
            timLink.href = url;
        } else {
            timLink.hidden = true;
        }
    }

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

    const continueButton =
        document.getElementById(
            "continue-button"
        );


    if (profile.classe === "bts2") {

        continueButton.disabled = false;

        continueButton.textContent =
            "Commencer le test TIM BTS 2";


        continueButton.addEventListener(
            "click",
            () => {

                window.location.href =
                    "/tim/bts2/test.html";

            }
        );

    }


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

    const routes = {

        maths: {

            "3e": {
                TEST: "/test-save.html"
            }

        },

        tim: {

            bts2: {
                TEST: "/tim/bts2/test.html"
            }

        }

    };


    return (
        routes[data.matiere]?.[data.classe]?.[data.seance]
        ?? null
    );

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
// DÉMARRAGE
// ======================================================

initStudentDashboard();

setSubjectLinks(profile);