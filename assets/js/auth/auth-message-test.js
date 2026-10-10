
/* ========== TEST DES MODULES AUTHENTIFICATION ========== */

import { showMessage, hideMessage } from "./auth-message.js";
import { initUsernameGeneration } from "./auth-username.js";
import { initRoleFields } from "./auth-role.js";
import { initSchoolSelection } from "./auth-school.js";
import { initLogin } from "./auth-login.js";
import { checkSession } from "./auth-session.js";
import { logout } from "./auth-logout.js";
import { getRedirectUrl } from "./auth-redirect.js";

initUsernameGeneration();
initRoleFields();
initSchoolSelection();
initLogin();
checkSession();

/* ========== TEST DÉCONNEXION ========== */

const logoutButton = document.getElementById("logout-test-button");

if (logoutButton) {
    logoutButton.addEventListener("click", async () => {
        logoutButton.disabled = true;
        await logout();
        logoutButton.disabled = false;
    });
}

// showMessage("Modules d'authentification initialisés.", "success");

// setTimeout(() => {
//     hideMessage();
// }, 2000);

/* ========== TEST DES REDIRECTIONS ========== */

console.log("Destination élève :", getRedirectUrl("student"));
console.log("Destination professeur :", getRedirectUrl("teacher"));
console.log("Rôle inconnu :", getRedirectUrl("unknown"));
