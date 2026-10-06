// ======================================================
// ROUTES DE L'APPLICATION
// ======================================================

const ROUTES = {

    espaceEleve: "/eleve/",
    auth: "/auth/",

    tim: {
        cap1: "/mfr/cap1/",
        cap2: "/mfr/cap2/",
        "2de": "/mfr/2de/",
        "1re": "/mfr/1re/",
        term: "/mfr/term/",
        bts1: "/mfr/bts1/",
        bts2: "/mfr/bts2/"
    },

    maths: {
        "3e": "/mfr/maths/4e-3e/",
        "2de": "/mfr/maths/2de/",
        "1re": "/mfr/maths/bacpro1/",
        term: "/mfr/maths/bacpro2/"
    },

    techno: {
        "5e": "/techno/5/",
        "4e": "/techno/4/",
        "3e": "/techno/3/"
    }

};


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
            ROUTES.auth;

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
            ROUTES.auth;

        return;
    }


    showStudent(profile);

    setSubjectLinks(profile);

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
// LIENS DES MATIÈRES
// ======================================================

function setSubjectLinks(profile) {

    const mathsLink =
        document.getElementById(
            "subject-maths-link"
        );

    const technoLink =
        document.getElementById(
            "subject-techno-link"
        );

    const timLink =
        document.getElementById(
            "subject-tim-link"
        );


    configureSubjectLink(
        mathsLink,
        ROUTES.maths[profile.classe]
    );

    configureSubjectLink(
        technoLink,
        ROUTES.techno[profile.classe]
    );

    configureSubjectLink(
        timLink,
        ROUTES.tim[profile.classe]
    );

}


function configureSubjectLink(
    element,
    url
) {

    if (!element) {
        return;
    }


    if (url) {

        element.href = url;
        element.hidden = false;

    } else {

        element.hidden = true;

    }

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
        .select(`
            matiere,
            classe,
            seance,
            updated_at
        `)
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


    const continueButton =
        document.getElementById(
            "continue-button"
        );


    // Aucun travail précédent

    if (!data) {

        if (profile.classe === "bts2") {

            continueButton.disabled =
                false;

            continueButton.textContent =
                "Commencer le test TIM BTS 2";


            continueButton.addEventListener(
                "click",
                () => {

                    window.location.href =
                        ROUTES.tim.bts2;

                }
            );

        }


        return;
    }


    continueButton.disabled =
        false;


    continueButton.textContent =
        `Continuer ${formatSession(data)}`;


    continueButton.addEventListener(
        "click",
        () => {

            const url =
                getSessionUrl(data);


            if (!url) {

                console.warn(
                    "Aucune route trouvée pour :",
                    data
                );

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

    // Cas particulier du test actuel

    if (
        data.matiere === "tim" &&
        data.classe === "bts2" &&
        data.seance === "TEST"
    ) {

        return ROUTES.tim.bts2;

    }


    // Ancien test maths

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
                ROUTES.auth;

        }
    );


// ======================================================
// DÉMARRAGE
// ======================================================

initStudentDashboard();