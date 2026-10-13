/* ========== CONTRÔLE D'ACCÈS AUX ESPACES ========== */

import { checkSession } from "./auth-session.js";

export async function checkAccess(allowedRoles) {
    const session = await checkSession();

    if (!session) {
        return { allowed: false, reason: "not_authenticated" };
    }

    if (!allowedRoles.includes(session.profile.role)) {
        return { allowed: false, reason: "unauthorized" };
    }

    return {
        allowed: true,
        user: session.user,
        profile: session.profile
    };
}
