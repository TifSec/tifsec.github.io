const message = document.getElementById("message");

const ROUTES = {
    espaceEleve: "/eleve/",
    auth: "/auth/",
}

const role =
    document
        .getElementById("register-role")
        .value;


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
            !username ||
            !password
        ) {

            message.textContent =
                "Merci de remplir les champs obligatoires.";

            return;
        }


        /*
            La classe est obligatoire uniquement
            pour un compte élève.
        */

        if (
            role === "student" &&
            !classe
        ) {

            message.textContent =
                "Merci de choisir ta classe.";

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


        // Création du profil

        const {
            error: profileError
        } = await db
            .from("profiles")
            .insert({

                user_id:
                    user.id,

                prenom:
                    prenom,

                nom:
                    nom || null,

                classe:
                    role === "student"
                        ? classe
                        : null,

                role:
                    role

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
            session
        },
        error
    } = await db.auth.getSession();


    if (error) {

        console.error(
            "Erreur lors de la vérification de la session :",
            error
        );

        return;
    }


    /*
        Aucun utilisateur connecté :
        on reste simplement sur la page d'authentification.
    */

    if (!session) {
        return;
    }


    /*
        Un utilisateur est déjà connecté.
    */

    window.location.href =
        ROUTES.espaceEleve;

}


// ======================================================
// AU CHARGEMENT DE LA PAGE
// ======================================================

refreshUser();