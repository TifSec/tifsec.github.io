/* ========== INITIALISATION AUTHENTIFICATION ========== */

import { initUsernameGeneration } from "./auth-username.js";
import { initRoleFields } from "./auth-role.js";
import { initSchoolSelection } from "./auth-school.js";
import { initLogin } from "./auth-login.js";
import { initRegistration } from "./auth-register.js";
import { checkSession, getSessionMessage } from "./auth-session.js";
import { redirectUser } from "./auth-redirect.js";
import { showMessage } from "./auth-message.js";
import { initLogout } from "./auth-logout.js";

initUsernameGeneration();
initRoleFields();
initSchoolSelection();
const registration = initRegistration();
const hasAttemptedLogin = initLogin({ onProfileMissing: registration.resumeProfile });
initLogout("auth-session-logout");

async function initSession() {
    const session = await checkSession();
    // Ne pas remplacer une connexion soumise pendant la vérification initiale.
    if (hasAttemptedLogin() || registration.hasAttempted()) {
        return;
    }
    if (session.status === "authenticated") {
        redirectUser(session.profile.role);
    } else if (session.status !== "not_authenticated") {
        if (session.status === "profile_missing") {
            registration.resumeProfile(session.user);
            showMessage("Ton compte existe. Complète ton profil élève pour accéder à ton espace.");
        } else {
            showMessage(getSessionMessage(session.status));
        }
        const button = document.getElementById("auth-session-logout");
        if (button) {
            button.hidden = !session.user;
        }
    }
}

initSession();

