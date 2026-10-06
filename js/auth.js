const message = document.getElementById("message");

const ROUTES = {
    espaceEleve: "/eleve/",
    espaceProf: "/prof/",
    auth: "/auth/"
};

const registerRole =
    document.getElementById("register-role");

const registerClassWrapper =
    document.getElementById("register-class-wrapper");

const registerClasse =
    document.getElementById("register-classe");

function updateRoleFields() {
    const isTeacher =
        registerRole.value === "teacher";

    registerClassWrapper.hidden =
        isTeacher;

    if (isTeacher) {
        registerClasse.value = "";
    }
}

registerRole.addEventListener(
    "change",
    updateRoleFields
);

updateRoleFields();

// ======================================================
// AFFICHAGE DES MESSAGES
// ======================================================

function showMessage(text) {
    if (!message) {
        console.warn("Élément #message introuvable :", text);
        return;
    }

    message.textContent = text;
    message.hidden = false;
}

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

function generateUsername(prenom, nom = "") {
    const base = nom
        ? `${prenom}.${nom}`
        : prenom;

    return base
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9.-]/g, "");
}

const registerPrenom = document.getElementById("register-prenom");
const registerNom = document.getElementById("register-nom");
const registerUsername = document.getElementById("register-username");

function updateGeneratedUsername() {
    const prenom = registerPrenom.value.trim();
    const nom = registerNom.value.trim();

    if (!prenom) {
        registerUsername.value = "";
        return;
    }

    registerUsername.value = generateUsername(prenom, nom);
}

registerPrenom.addEventListener("input", updateGeneratedUsername);
registerNom.addEventListener("input", updateGeneratedUsername);

// ======================================================
// CRÉATION DU COMPTE
// ======================================================

document
    .getElementById("register-button")
    .addEventListener("click", async () => {
        const prenom = document
            .getElementById("register-prenom")
            .value
            .trim();

        const nom = document
            .getElementById("register-nom")
            .value
            .trim();

        const classe = document
            .getElementById("register-classe")
            .value;

        const role = document
            .getElementById("register-role")
            .value;

        const username = document
            .getElementById("register-username")
            .value
            .trim();

        const password = document
            .getElementById("register-password")
            .value;

        if (!prenom || !username || !password || !role) {
            showMessage("Merci de remplir les champs obligatoires.");
            return;
        }

        if (role === "student" && !classe) {
            showMessage("Merci de choisir ta classe.");
            return;
        }

        if (password.length < 8) {
            showMessage("Le mot de passe doit contenir au moins 8 caractères.");
            return;
        }

        const email = usernameToEmail(username);

        const {
            data,
            error
        } = await db.auth.signUp({
            email: email,
            password: password
        });

        if (error) {
            console.error(error);
            showMessage("Erreur lors de la création du compte : " + error.message);
            return;
        }

        const user = data.user;

        if (!user) {
            showMessage("Compte créé, mais aucune session n'a été ouverte.");
            return;
        }

        // ==================================================
        // CRÉATION DU PROFIL
        // ==================================================

        const {
            error: profileError
        } = await db
            .from("profiles")
            .insert({
                user_id: user.id,
                prenom: prenom,
                nom: nom || null,
                classe: role === "student" ? classe : null,
                role: role
            });

        if (profileError) {
            console.error(profileError);

            showMessage(
                "Compte créé, mais erreur lors de la création du profil : "
                + profileError.message
            );

            return;
        }

        // ==================================================
        // REDIRECTION
        // ==================================================

        if (role === "teacher") {
            window.location.href = ROUTES.espaceProf;
        } else {
            window.location.href = ROUTES.espaceEleve;
        }
    });

// ======================================================
// CONNEXION
// ======================================================

document
    .getElementById("login-button")
    .addEventListener("click", async () => {
        const username = document
            .getElementById("login-username")
            .value
            .trim();

        const password = document
            .getElementById("login-password")
            .value;

        if (!username || !password) {
            showMessage(
                "Merci de saisir ton identifiant et ton mot de passe."
            );
            return;
        }

        const email =
            usernameToEmail(username);

        const {
            data,
            error
        } = await db.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) {
            console.error(error);

            showMessage(
                "Identifiant ou mot de passe incorrect."
            );

            return;
        }

        const user =
            data.user;

        if (!user) {
            showMessage(
                "Connexion réussie, mais utilisateur introuvable."
            );
            return;
        }

        const {
            data: profile,
            error: profileError
        } = await db
            .from("profiles")
            .select("role")
            .eq("user_id", user.id)
            .single();

        if (profileError || !profile) {
            console.error(
                "Erreur lors du chargement du profil :",
                profileError
            );

            showMessage(
                "Impossible de charger ton profil."
            );

            return;
        }

        if (profile.role === "teacher") {
            window.location.href = "/prof/";
            return;
        }

        window.location.href =
            ROUTES.espaceEleve;
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

    if (!session) {
        return;
    }

    const user = session.user;

    const {
        data: profile,
        error: profileError
    } = await db
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .single();

    if (profileError || !profile) {
        console.error(
            "Erreur lors du chargement du profil :",
            profileError
        );
        return;
    }

    if (profile.role === "teacher") {
        window.location.href = "/prof/";
        return;
    }

    window.location.href = ROUTES.espaceEleve;
}

// ======================================================
// AU CHARGEMENT DE LA PAGE
// ======================================================

refreshUser();