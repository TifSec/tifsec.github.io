/* ========== GESTION DES SESSIONS ========== */

import { db } from "../bdd/bdd-connect.js";

export async function checkSession() {
    try {
        const { data, error } = await db.auth.getUser();

        if (error || !data.user) {
            console.log("Aucune session utilisateur active.");
            return null;
        }

        const { data: profile, error: profileError } = await db
            .from("profiles")
            .select("role, classe")
            .eq("user_id", data.user.id)
            .single();

        if (profileError || !profile) {
            console.error("Impossible de charger le profil.");
            return null;
        }

        console.log("Session utilisateur active.");
        console.log("Rôle :", profile.role);
        console.log("Classe :", profile.classe);

        return {
            user: data.user,
            profile: profile
        };
    } catch (error) {
        console.error("Erreur lors de la vérification de session :", error);
        return null;
    }
}
