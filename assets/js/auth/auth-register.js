/* ========== INSCRIPTION ET REPRISE DU PROFIL ÉLÈVE ========== */

import { db } from "../bdd/bdd-connect.js";
import { usernameToEmail } from "./auth-username.js";
import { checkSession, loadProfile, getSessionMessage } from "./auth-session.js";
import { showMessage, hideMessage } from "./auth-message.js";
import { redirectUser } from "./auth-redirect.js";
import { beginAuthAction, endAuthAction, isAuthActionRunning } from "./auth-action.js";

export function validateRegistration(values, schools, requireCredentials = true) {
    if (!values.prenom || !values.nom || values.prenom.length > 100 || values.nom.length > 100) {
        return "Saisis ton prénom et ton nom (100 caractères maximum chacun).";
    }
    const school = Object.hasOwn(schools, values.etablissement) ? schools[values.etablissement] : null;
    if (!school?.classes?.some(item => item.id === values.classe)) {
        return "Choisis ton établissement et une classe de cet établissement.";
    }
    if (!requireCredentials) {
        return null;
    }
    if (values.username.length < 3 || values.username.length > 64 ||
        !/^[a-z0-9][a-z0-9._-]*[a-z0-9_-]$/.test(values.username) || values.username.includes("..")) {
        return "Choisis un identifiant de 3 à 64 caractères, avec des lettres sans accent, des chiffres, des points, des tirets ou des traits de soulignement.";
    }
    if (values.password.length < 8) {
        return "Choisis un mot de passe d’au moins 8 caractères.";
    }
    if (values.password !== values.confirmation) {
        return "Les deux mots de passe ne correspondent pas.";
    }
    return null;
}

function registrationError(error) {
    if (["user_already_exists", "email_exists"].includes(error.code)) {
        return "Cet identifiant est déjà utilisé. Connecte-toi avec ton compte existant ou choisis un autre identifiant.";
    }
    if (error.status === 429) {
        return "Trop de tentatives. Patiente avant de réessayer.";
    }
    if (error.code === "signup_disabled") {
        return "La création de compte est désactivée pour le moment. Contacte ton professeur.";
    }
    if (error.code === "weak_password") {
        return "Ce mot de passe ne respecte pas les règles du service. Choisis-en un plus robuste.";
    }
    return "Impossible de terminer l’inscription pour le moment. Vérifie ta connexion puis réessaie. Si ton compte a déjà été créé, connecte-toi pour reprendre ton profil.";
}

export function initRegistration() {
    const form = document.getElementById("create-account");
    const button = document.getElementById("register-button");
    const classesElement = document.getElementById("classes-data");
    let attempted = false;
    let completing = false;
    let schools = {};

    try {
        schools = JSON.parse(classesElement?.textContent || "{}");
    } catch {
        // La validation refusera une classe qui ne peut pas être vérifiée.
    }
    if (!form || !button) {
        return { hasAttempted: () => false, resumeProfile() {} };
    }

    function resumeProfile(user) {
        completing = true;
        document.getElementById("register-heading").textContent = "Compléter mon profil élève";
        document.getElementById("register-description").textContent = "Ton compte est déjà créé. Complète ton profil pour accéder à ton espace, sans recommencer l’inscription.";
        document.getElementById("register-credentials").hidden = true;
        for (const id of ["register-username", "register-password", "register-password-confirm"]) {
            document.getElementById(id).disabled = true;
        }
        button.textContent = "Enregistrer mon profil élève";
        document.getElementById("auth-session-logout").hidden = false;

        const metadata = user.user_metadata || {};
        for (const name of ["prenom", "nom"]) {
            const input = document.getElementById("register-" + name);
            if (!input.value && typeof metadata[name] === "string") {
                input.value = metadata[name];
            }
        }
        const schoolInput = document.getElementById("register-school");
        if (!schoolInput.value && typeof metadata.etablissement === "string" && Object.hasOwn(schools, metadata.etablissement)) {
            schoolInput.value = metadata.etablissement;
            schoolInput.dispatchEvent(new Event("change"));
        }
        const classInput = document.getElementById("register-classe");
        if (!classInput.value && schools[schoolInput.value]?.classes?.some(item => item.id === metadata.classe)) {
            classInput.value = metadata.classe;
        }
    }

    form.addEventListener("submit", async event => {
        event.preventDefault();
        if (isAuthActionRunning()) {
            return;
        }
        attempted = true;
        hideMessage();

        const values = {
            prenom: document.getElementById("register-prenom").value.trim(),
            nom: document.getElementById("register-nom").value.trim(),
            etablissement: document.getElementById("register-school").value,
            classe: document.getElementById("register-classe").value,
            username: document.getElementById("register-username").value.trim().toLowerCase(),
            password: document.getElementById("register-password").value,
            confirmation: document.getElementById("register-password-confirm").value
        };
        const validationError = validateRegistration(values, schools, !completing);
        if (validationError) {
            showMessage(validationError);
            return;
        }
        if (!db) {
            showMessage(getSessionMessage("service_unavailable"));
            return;
        }
        if (!beginAuthAction()) {
            return;
        }
        form.setAttribute("aria-busy", "true");

        try {
            let session = await checkSession();
            if (session.status === "authenticated") {
                if (completing) {
                    showMessage("Ton profil est prêt. Ouverture de ton espace…", "success");
                    redirectUser(session.profile.role);
                    return;
                }
                document.getElementById("auth-session-logout").hidden = false;
                showMessage("Un compte est déjà connecté. Déconnecte-toi avant de créer un autre compte.");
                return;
            }
            if (session.status === "not_authenticated") {
                if (completing) {
                    showMessage("Ta session a expiré. Reconnecte-toi avec ton identifiant pour terminer ton profil.");
                    return;
                }
                const { data, error } = await db.auth.signUp({
                    email: usernameToEmail(values.username),
                    password: values.password,
                    options: { data: {
                        prenom: values.prenom, nom: values.nom,
                        etablissement: values.etablissement, classe: values.classe,
                        role: "student"
                    } }
                });
                if (error) {
                    showMessage(registrationError(error));
                    return;
                }
                if (!data?.session || !data?.user) {
                    showMessage("L’inscription n’a pas ouvert de session. Demande à ton professeur de vérifier l’activation du compte avant de poursuivre. Ne recommence pas la création du compte.");
                    return;
                }
                resumeProfile(data.user);
                // Vérifier l’utilisateur et le profil réels, y compris si un trigger crée déjà le profil.
                session = await checkSession();
            }
            if (session.status === "authenticated") {
                showMessage("Ton compte est prêt. Ouverture de ton espace…", "success");
                redirectUser(session.profile.role);
                return;
            }
            if (session.status !== "profile_missing") {
                showMessage(getSessionMessage(session.status));
                if (session.user) {
                    document.getElementById("auth-session-logout").hidden = false;
                }
                return;
            }

            resumeProfile(session.user);
            // INSERT uniquement : ne jamais écraser un profil existant ni accepter un rôle du formulaire.
            const { error: insertError } = await db.from("profiles").insert({
                user_id: session.user.id, prenom: values.prenom, nom: values.nom,
                etablissement: values.etablissement, classe: values.classe, role: "student"
            });
            // Une erreur réseau peut masquer un INSERT réussi ; relire avant d’annoncer le résultat.
            const saved = await loadProfile(session.user);
            if (saved.status === "authenticated") {
                showMessage("Ton profil est enregistré. Ouverture de ton espace…", "success");
                redirectUser(saved.profile.role);
            } else if (insertError?.code === "42501") {
                showMessage("Ton compte existe, mais l’enregistrement du profil a été refusé. Contacte ton professeur. Il n’est pas nécessaire de recréer ton compte.");
            } else {
                showMessage("Ton compte existe, mais le profil n’a pas pu être confirmé. Clique sur « Enregistrer mon profil élève » pour réessayer, sans recréer ton compte.");
            }
        } catch {
            showMessage("La connexion a été interrompue. Si ton compte a été créé, reconnecte-toi pour compléter ton profil. Ne crée pas un deuxième compte.");
        } finally {
            values.password = "";
            values.confirmation = "";
            document.getElementById("register-password").value = "";
            document.getElementById("register-password-confirm").value = "";
            form.setAttribute("aria-busy", "false");
            endAuthAction();
        }
    });

    return { hasAttempted: () => attempted, resumeProfile };
}
