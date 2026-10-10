/* ========== CONNEXION UTILISATEUR ========== */

import { db } from "../bdd/bdd-connect.js";
import { usernameToEmail } from "./auth-username.js";
import { showMessage } from "./auth-message.js";
import { redirectUser } from "./auth-redirect.js";

export function initLogin() {
    const loginButton = document.getElementById("login-button");
    const usernameInput = document.getElementById("login-username");
    const passwordInput = document.getElementById("login-password");

    if (!loginButton || !usernameInput || !passwordInput) {
        console.error("Formulaire de connexion introuvable.");
        return;
    }

    loginButton.addEventListener("click", async () => {
        const username = usernameInput.value.trim();
        const password = passwordInput.value;

        if (!username || !password) {
            showMessage("Merci de saisir ton identifiant et ton mot de passe.");
            return;
        }

        loginButton.disabled = true;

        try {
            const { data, error } = await db.auth.signInWithPassword({
                email: usernameToEmail(username),
                password: password
            });

            if (error) {
                showMessage("Identifiant ou mot de passe incorrect.");
                return;
            }

            const user = data.user;

            if (!user) {
                showMessage("Impossible de récupérer le compte.");
                return;
            }

            const { data: profile, error: profileError } = await db
                .from("profiles")
                .select("role, classe")
                .eq("user_id", user.id)
                .single();

            if (profileError || !profile) {
                showMessage("Connexion réussie, mais profil introuvable.");
                return;
            }

            /* ========== REDIRECTION APRÈS CONNEXION ========== */

            showMessage("Connexion réussie ! Redirection en cours...", "success");

            const redirected = redirectUser(profile.role);

            if (!redirected) {
                showMessage("Ton compte possède un rôle non reconnu.");
            }
        } catch (error) {
            console.error("Erreur de connexion :", error);
            showMessage("Une erreur technique est survenue.");
        } finally {
            loginButton.disabled = false;
        }
    });
}
