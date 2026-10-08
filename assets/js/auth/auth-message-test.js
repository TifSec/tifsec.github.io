
/* ========== TEST DES MODULES AUTHENTIFICATION ========== */

import { showMessage, hideMessage } from "./auth-message.js";
import { initUsernameGeneration } from "./auth-username.js";
import { initRoleFields } from "./auth-role.js";
import { initSchoolSelection } from "./auth-school.js";

initUsernameGeneration();
initRoleFields();
initSchoolSelection();

showMessage("Modules d'authentification initialisés.", "success");

setTimeout(() => {
    hideMessage();
}, 2000);
