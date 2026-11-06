/* ========== CONNEXION UTILISATEUR ========== */

import { db } from "../bdd/bdd-connect.js";
import { getLoginEmail } from "./auth-username.js";
import { showMessage, hideMessage } from "./auth-message.js";
import { redirectUser } from "./auth-redirect.js";
import { loadProfile, getSessionMessage } from "./auth-session.js";
import { beginAuthAction, endAuthAction, isAuthActionRunning } from "./auth-action.js";

export function initLogin({ onProfileMissing } = {}) {
    const form = document.getElementById("login");
    const button = document.getElementById("login-button");
    const identifier = document.getElementById("login-username");
    const password = document.getElementById("login-password");
    const sessionLogout = document.getElementById("auth-session-logout");
    let busy = false;
    let attempted = false;

    if (!form || !button || !identifier || !password) {
        return () => false;
    }
    form.addEventListener("submit", async event => {
        event.preventDefault();
        if (busy || isAuthActionRunning()) {
            return;
        }
        attempted = true;
        hideMessage();
        const email = getLoginEmail(identifier.value);
        if (!email || !password.value) {
            showMessage("Saisis un identifiant ou une adresse e-mail valide et ton mot de passe.");
            return;
        }
        if (!db) {
            showMessage(getSessionMessage("service_unavailable"));
            return;
        }

        if (!beginAuthAction()) {
            return;
        }
        busy = true;
        form.setAttribute("aria-busy", "true");
        try {
            const { data, error } = await db.auth.signInWithPassword({ email, password: password.value });
            if (error) {
                const message = error.status === 429 ? "Trop de tentatives. Patiente avant de réessayer."
                    : error.status >= 500 || error.name === "AuthRetryableFetchError" ? "Le service de connexion est indisponible. Réessaie dans un instant."
                    : "Identifiant ou mot de passe incorrect.";
                showMessage(message);
                return;
            }
            if (!data?.user) {
                showMessage(getSessionMessage("session_error"));
                return;
            }
            if (sessionLogout) {
                sessionLogout.hidden = false;
            }
            const session = await loadProfile(data.user);
            if (session.status !== "authenticated") {
                if (session.status === "profile_missing" && onProfileMissing) {
                    onProfileMissing(session.user);
                    showMessage("Ton compte existe. Complète le formulaire de profil élève pour terminer ton inscription.");
                } else {
                    showMessage(getSessionMessage(session.status));
                }
                return;
            }
            showMessage("Connexion réussie. Ouverture de ton espace…", "success");
            redirectUser(session.profile.role);
        } catch {
            showMessage("Impossible de se connecter pour le moment. Vérifie ta connexion puis réessaie.");
        } finally {
            password.value = "";
            busy = false;
            endAuthAction();
            form.setAttribute("aria-busy", "false");
        }
    });
    return () => attempted;
}
