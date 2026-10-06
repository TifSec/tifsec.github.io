const message = document.getElementById("message");


// ======================================================
// IDENTIFIANT → EMAIL TECHNIQUE
// ======================================================

function usernameToEmail(username) {

    const cleanUsername = username
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "")
        .replace(/[^a-z0-9._-]/g, "");

    return `${cleanUsername}@eleve.local`;
}


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
            !username ||
            !password
        ) {
            message.textContent =
                "Merci de remplir tous les champs.";

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


        message.textContent =
            "Compte créé avec succès.";

        await refreshUser();

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


        message.textContent =
            "Connexion réussie.";

        await refreshUser();

    });


// ======================================================
// DÉCONNEXION
// ======================================================

document
    .getElementById("logout-button")
    .addEventListener("click", async () => {

        await db.auth.signOut();

        message.textContent =
            "Vous êtes déconnecté.";

        await refreshUser();

    });


// ======================================================
// AFFICHAGE DE L'ÉLÈVE CONNECTÉ
// ======================================================

async function refreshUser() {

    const {
        data: {
            user
        }
    } = await db.auth.getUser();


    const createAccount =
        document.getElementById("create-account");

    const login =
        document.getElementById("login");

    const connected =
        document.getElementById("connected");


    if (!user) {

        createAccount.hidden = false;
        login.hidden = false;
        connected.hidden = true;

        return;
    }


    const {
        data: profile,
        error
    } = await db
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();


    if (error) {

        console.error(error);

        message.textContent =
            "Impossible de récupérer le profil.";

        return;
    }


    createAccount.hidden = true;
    login.hidden = true;
    connected.hidden = false;


    document.getElementById("welcome")
        .textContent =
        `Bonjour ${profile.prenom} ${profile.nom} 👋`;

}


// ======================================================
// AU CHARGEMENT DE LA PAGE
// ======================================================

refreshUser();