/* ========== TEST ACCÈS PROFESSEUR ========== */

import { checkAccess } from "./auth-guard.js";

async function testAccess() {
    const message = document.getElementById("access-message");
    const content = document.getElementById("prof-test");

    const access = await checkAccess(["teacher"]);

    if (access.allowed) {
        content.hidden = false;
        message.textContent = "Accès autorisé.";
        return;
    }

    if (access.reason === "not_authenticated") {
        message.textContent = "Accès refusé : utilisateur non connecté.";
        return;
    }

    message.textContent = "Accès refusé : rôle professeur requis.";
}

testAccess();
