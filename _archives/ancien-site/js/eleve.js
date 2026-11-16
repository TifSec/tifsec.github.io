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

    if (profile.role === "teacher") {
        window.location.href = "/prof/";
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
    const fullName = [
        profile.prenom,
        profile.nom
    ]
        .filter(Boolean)
        .join(" ");

    document
        .getElementById("student-name")
        .textContent = fullName;

    document
        .getElementById("student-class")
        .textContent = `Classe : ${formatClass(profile.classe)}`;
}

// ======================================================
// NOM DE LA CLASSE
// ======================================================

function formatClass(classe) {
    const classNames = {
        "5e": "5e",
        "4e": "4e",
        "3e": "4e / 3e",
        cap1: "CAP 1",
        cap2: "CAP 2",
        "2de": "2de",
        "1re": "1re",
        term: "Terminale",
        bts1: "BTS 1",
        bts2: "BTS 2"
    };

    return classNames[classe] ?? classe;
}

// ======================================================
// LIENS DES MATIÈRES
// ======================================================

function setSubjectLinks(profile) {
    const mathsLink =
        document.getElementById("subject-maths-link");

    const technoLink =
        document.getElementById("subject-techno-link");

    const timLink =
        document.getElementById("subject-tim-link");

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

function configureSubjectLink(element, url) {
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
    const continueButton =
        document.getElementById("continue-button");

    const {
        data,
        error
    } = await db
        .from("student_sessions")
        .select(`
            status,
            started_at,
            last_seen_at,
            completed_at,
            course_sessions (
                id,
                matiere,
                classe,
                seance,
                titre,
                active
            )
        `)
        .eq("user_id", currentUser.id)
        .order("last_seen_at", {
            ascending: false
        })
        .limit(1)
        .maybeSingle();

    if (error) {
        console.error(
            "Erreur lors du chargement de la dernière séance :",
            error
        );

        continueButton.disabled = true;
        continueButton.textContent =
            "Impossible de charger la dernière séance";

        return;
    }

    // ==================================================
    // AUCUNE SÉANCE ENCORE COMMENCÉE
    // ==================================================

    if (!data || !data.course_sessions) {
        continueButton.disabled = true;
        continueButton.textContent =
            "Aucune séance commencée";

        return;
    }

    const session =
        data.course_sessions;

    if (!session.active) {
        continueButton.disabled = true;
        continueButton.textContent =
            "Dernière séance indisponible";

        return;
    }

    const url =
        getSessionUrl(session);

    if (!url) {
        console.warn(
            "Aucune route trouvée pour la séance :",
            session
        );

        continueButton.disabled = true;
        continueButton.textContent =
            "Séance introuvable";

        return;
    }

    continueButton.disabled = false;

    if (data.status === "completed") {
        continueButton.textContent =
            `Revoir ${formatSession(session)}`;
    } else {
        continueButton.textContent =
            `Continuer ${formatSession(session)}`;
    }

    continueButton.addEventListener(
        "click",
        () => {
            window.location.href = url;
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

    return `${subject} ${formatClass(data.classe)} — ${data.seance}`;
}

// ======================================================
// URL DE LA SÉANCE
// ======================================================

function getSessionUrl(data) {
    /*
        Pour l'instant, les routes pointent vers
        les pages principales de chaque classe.

        On pourra ensuite ajouter un système
        plus précis pour aller directement
        sur #session3, #session4, etc.
    */

    const subjectRoutes =
        ROUTES[data.matiere];

    if (!subjectRoutes) {
        return null;
    }

    const baseUrl =
        subjectRoutes[data.classe];

    if (!baseUrl) {
        return null;
    }

    /*
        Si tes séances sont dans une seule page
        avec des sections id="session3", etc.,
        on peut pointer directement dessus.

        S03 → #session3
        S04 → #session4
    */

    const match =
        String(data.seance)
            .match(/^S0*(\d+)$/i);

    if (match) {
        return `${baseUrl}#session${match[1]}`;
    }

    return baseUrl;
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