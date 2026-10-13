/* ========== PROTECTION DE L'ESPACE PROFESSEUR ========== */

import { checkAccess } from "./auth-guard.js";
import { logout } from "./auth-logout.js";

export async function initProfGuard() {
    const loading = document.getElementById("prof-loading");
    const denied = document.getElementById("prof-access-denied");
    const content = document.getElementById("prof-content");

    if (!loading || !denied || !content) {
        console.error("Éléments du layout professeur introuvables.");
        return;
    }

    try {
        const access = await checkAccess(["teacher"]);

        if (access.allowed) {
            const identity = document.getElementById("prof-identity");

            if (identity) {
                const prenom = access.profile.prenom || "";
                const nom = access.profile.nom || "";
                identity.textContent = `${prenom} ${nom}`.trim() || "Professeur";
            }

            content.hidden = false;
        } else {
            denied.hidden = false;
        }
    } catch (error) {
        console.error("Erreur de vérification des droits :", error);
        denied.hidden = false;
    } finally {
        loading.hidden = true;
    }
}

initProfGuard();

/* ========== DÉCONNEXION PROFESSEUR ========== */

const logoutButton = document.getElementById("prof-logout");

if (logoutButton) {
    logoutButton.addEventListener("click", async () => {
        logoutButton.disabled = true;

        const success = await logout();

        if (success) {
            window.location.replace("/auth-test/");
        } else {
            logoutButton.disabled = false;
        }
    });
}
