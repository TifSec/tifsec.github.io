/* ========== DÉCONNEXION UTILISATEUR ========== */

import { db } from "../bdd/bdd-connect.js";
import { showMessage } from "./auth-message.js";
import { getRedirectUrl } from "./auth-redirect.js";

export async function logout() {
    try {
        if (!db) {
            showMessage("Le service de déconnexion est indisponible. Recharge la page puis réessaie.");
            return false;
        }
        const { error } = await db.auth.signOut({ scope: "local" });

        if (error) {
            console.error("Erreur de déconnexion :", error);
            showMessage("Impossible de se déconnecter.");
            return false;
        }

        showMessage("Déconnexion réussie !", "success");
        return true;
    } catch (error) {
        console.error("Erreur de déconnexion :", error);
        showMessage("Une erreur technique est survenue.");
        return false;
    }
}

export function initLogout(buttonId) {
    const button = document.getElementById(buttonId);
    if (!button) {
        return;
    }
    button.addEventListener("click", async () => {
        if (button.disabled) {
            return;
        }
        button.disabled = true;
        if (await logout()) {
            window.location.replace(getRedirectUrl("auth"));
        } else {
            button.disabled = false;
        }
    });
}
