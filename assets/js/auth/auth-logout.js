/* ========== DÉCONNEXION UTILISATEUR ========== */

import { db } from "../bdd/bdd-connect.js";
import { showMessage } from "./auth-message.js";

export async function logout() {
    try {
        const { error } = await db.auth.signOut();

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
