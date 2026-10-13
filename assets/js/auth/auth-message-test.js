/* ========== INITIALISATION AUTHENTIFICATION ========== */

import { initUsernameGeneration } from "./auth-username.js";
import { initRoleFields } from "./auth-role.js";
import { initSchoolSelection } from "./auth-school.js";
import { initLogin } from "./auth-login.js";
import { checkSession } from "./auth-session.js";
import { redirectUser } from "./auth-redirect.js";
import { logout } from "./auth-logout.js";

initUsernameGeneration();
initRoleFields();
initSchoolSelection();
initLogin();

/* ========== SESSION EXISTANTE ========== */

async function initSession() {
    const session = await checkSession();

    if (session && session.profile) {
        redirectUser(session.profile.role);
    }
}

initSession();

/* ========== DÉCONNEXION TEMPORAIRE ========== */

const logoutButton = document.getElementById("logout-test-button");

if (logoutButton) {
    logoutButton.addEventListener("click", async () => {
        logoutButton.disabled = true;
        await logout();
        logoutButton.disabled = false;
    });
}
