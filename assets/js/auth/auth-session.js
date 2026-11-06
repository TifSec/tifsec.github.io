/* ========== UTILISATEUR ET PROFIL ========== */

import { db } from "../bdd/bdd-connect.js";

const MESSAGES = {
    not_authenticated: "Connecte-toi pour accéder à ton espace.",
    service_unavailable: "Le service de connexion n’a pas pu se charger. Vérifie ta connexion puis réessaie.",
    session_error: "Impossible de vérifier ta connexion pour le moment. Réessaie dans un instant.",
    profile_error: "Impossible de charger ton profil pour le moment. Réessaie sans recréer ton compte.",
    profile_missing: "Ton compte est connecté, mais son profil est introuvable. Contacte ton professeur ou l’administrateur.",
    invalid_role: "Le rôle de ton compte n’est pas reconnu. Contacte l’administrateur.",
    unauthorized: "Ton compte n’est pas autorisé à accéder à cet espace."
};

export function getSessionMessage(status) {
    return MESSAGES[status] || MESSAGES.session_error;
}

export async function loadProfile(user) {
    if (!db) {
        return { status: "service_unavailable" };
    }
    try {
        const { data: profile, error } = await db.from("profiles")
            .select("prenom, nom, role, classe, etablissement, enrollment_status")
            .eq("user_id", user.id)
            .maybeSingle();
        if (error) {
            return { status: "profile_error", user };
        }
        if (!profile) {
            return { status: "profile_missing", user };
        }
        if (!["student", "teacher"].includes(profile.role)) {
            return { status: "invalid_role", user };
        }
        return { status: "authenticated", user, profile };
    } catch {
        return { status: "profile_error", user };
    }
}

async function readVerifiedSession() {
    if (!db) {
        return { status: "service_unavailable" };
    }
    try {
        const { data, error } = await db.auth.getUser();
        if (error) {
            return { status: error.name === "AuthSessionMissingError" ? "not_authenticated" : "session_error" };
        }
        if (!data?.user) {
            return { status: "not_authenticated" };
        }
        return loadProfile(data.user);
    } catch {
        return { status: "session_error" };
    }
}

// Partager uniquement la requête en cours : aucun profil conservé après sa réponse.
let pendingCheck = null;
let authGeneration = 0;
db?.auth?.onAuthStateChange?.(event => {
    if (!['SIGNED_OUT', 'SIGNED_IN', 'TOKEN_REFRESHED', 'USER_UPDATED'].includes(event)) return;
    ++authGeneration; pendingCheck = null;
});

export function checkSession() {
    if (pendingCheck) return pendingCheck.promise;
    const generation = authGeneration;
    const entry = { promise: null };
    entry.promise = readVerifiedSession().then(result => generation === authGeneration ? result : { status: 'session_error' })
        .finally(() => { if (pendingCheck === entry) pendingCheck = null; });
    pendingCheck = entry;
    return entry.promise;
}
