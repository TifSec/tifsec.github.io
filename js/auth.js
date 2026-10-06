const message = document.getElementById("message");


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
        bts2: "/mfr/bts2/test.html"
    },

    maths: {
        "3e": "/maths/3e/",
        "2de": "/maths/2de/",
        "1re": "/maths/1re/",
        term: "/maths/term/"
    },

    techno: {
        "5e": "/techno/5/",
        "4e": "/techno/4/",
        "3e": "/techno/3/"
    }

};


// ======================================================
// IDENTIFIANT → EMAIL TECHNIQUE
// ======================================================

function usernameToEmail(username) {

    const cleanUsername = username
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "")
        .replace(/[^a-z0-9._-]/g, "");

    return `${cleanUsername}@eleve.example.com`;
}


// ======================================================
// GÉNÉRATION AUTOMATIQUE DE L'IDENTIFIANT
// ======================================================

function generateUsername(prenom, nom) {

    return `${prenom}.${nom}`
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9.-]/g, "");

}


const registerPrenom =
    document.getElementById("register-prenom");

const registerNom =
    document.getElementById("register-nom");

const registerUsername =
    document.getElementById("register-username");


function updateGeneratedUsername() {

    const prenom =
        registerPrenom.value.trim();

    const nom =
        registerNom.value.trim();


    if (!prenom || !nom) {

        registerUsername.value = "";

        return;
    }


    registerUsername.value =
        generateUsername(prenom, nom);

}


registerPrenom.addEventListener(
    "input",
    updateGeneratedUsername
);

registerNom.addEventListener(
    "input",
    updateGeneratedUsername
);


// ======================================================
// CRÉATION DU COMPTE
// ======================================================

document
    .getElementById("register-button")
    .addEventListener("click", async () => {

        const prenom =
            document.getElementById("register-prenom")
                .value
                .trim();

        const nom =
            document.getElementById("register-nom")
                .value
                .trim();

        const classe =
            document.getElementById("register-classe")
                .value;

        const username =
            document.getElementById("register-username")
                .value
                .trim();

        const password =
            document.getElementById("register-password")
                .value;


        if (
            !prenom ||
            !nom ||
            !classe ||
            !username ||
            !password
        ) {

            message.textContent =
                "Merci de remplir tous les champs.";

            return;

        }


        if (password.length < 8) {

            message.textContent =
                "Le mot de passe doit contenir au moins 8 caractères.";

            return;

        }


        const email =
            usernameToEmail(username);


        const {
            data,
            error
        } = await db.auth.signUp({

            email: email,

            password: password

        });


        if (error) {

            console.error(error);

            message.textContent =
                "Erreur : " + error.message;

            return;

        }


        const user =
            data.user;


        if (!user) {

            message.textContent =
                "Compte créé, mais aucune session n'a été ouverte.";

            return;

        }


        // Création du profil élève

        const {
            error: profileError
        } = await db
            .from("profiles")
            .insert({

                user_id: user.id,

                prenom: prenom,

                nom: nom,

                classe: classe

            });


        if (profileError) {

            console.error(profileError);

            message.textContent =
                "Compte créé, mais erreur lors de la création du profil : "
                + profileError.message;

            return;

        }


        // Redirection directe vers l'espace élève

        window.location.href = ROUTES.espaceEleve;

    });


// ======================================================
// CONNEXION
// ======================================================

document
    .getElementById("login-button")
    .addEventListener("click", async () => {

        const username =
            document.getElementById("login-username")
                .value
                .trim();

        const password =
            document.getElementById("login-password")
                .value;


        if (!username || !password) {

            message.textContent =
                "Merci de saisir ton identifiant et ton mot de passe.";

            return;

        }


        const email =
            usernameToEmail(username);


        const {
            error
        } = await db.auth.signInWithPassword({

            email: email,

            password: password

        });


        if (error) {

            console.error(error);

            message.textContent =
                "Identifiant ou mot de passe incorrect.";

            return;

        }


        // Redirection directe vers l'espace élève

        window.location.href = ROUTES.espaceEleve;

    });


// ======================================================
// VÉRIFICATION AU CHARGEMENT
// ======================================================

async function refreshUser() {

    const {
        data: {
            user
        },
        error
    } = await db.auth.getUser();


    if (error) {

        console.error(error);

        return;

    }


    /*
        Si l'élève est déjà connecté et revient sur /auth/,
        inutile de lui montrer à nouveau la connexion.
    */

    if (user) {

        window.location.href = ROUTES.espaceEleve;

    }

}


// ======================================================
// AU CHARGEMENT DE LA PAGE
// ======================================================

refreshUser();