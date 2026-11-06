/* ========== CONTRÔLE D'ACCÈS AUX ESPACES ========== */

import { checkSession } from "./auth-session.js";

export async function checkAccess(allowedRoles) {
    const session = await checkSession();

    if (session.status !== "authenticated") {
        return { allowed: false, reason: session.status };
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
