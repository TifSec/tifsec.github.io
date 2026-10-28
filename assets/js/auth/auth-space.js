/* ========== PROFIL ET ACCÈS AUX ESPACES ========== */

import { db } from "../bdd/bdd-connect.js";
import { checkAccess } from "./auth-guard.js";
import { getSessionMessage } from "./auth-session.js";
import { hideMessage } from "./auth-message.js";
import { initLogout } from "./auth-logout.js";
import { renderProfile } from "./profile-presentation.js";

export async function initAccountSpace({ role, prefix }) {
    const loading = document.getElementById(prefix + "-loading");
    const denied = document.getElementById(prefix + "-access-denied");
    const content = document.getElementById(prefix + "-content");
    const reason = document.getElementById(prefix + "-access-message");
    const identity = document.getElementById(prefix + "-identity");
    const retry = document.getElementById(prefix + "-retry");
    let revision = 0;
    let timer;

    if (!loading || !denied || !content || !reason) {
        return;
    }

    function clearProfile() {
        content.hidden = true;
        if (identity) {
            identity.textContent = "";
        }
        document.querySelectorAll("[data-profile-field]").forEach(field => { field.textContent = ""; });
    }

    function deny(status) {
        clearProfile();
        loading.hidden = true;
        reason.textContent = getSessionMessage(status);
        denied.hidden = false;
    }

    async function refresh() {
        const current = ++revision;
        clearProfile();
        hideMessage();
        denied.hidden = true;
        loading.hidden = false;
        try {
            const access = await checkAccess([role]);
            if (current !== revision) {
                return;
            }
            if (!access.allowed) {
                deny(access.reason);
                return;
            }
            const profile = access.profile;
            const classesElement = document.getElementById("classes-data");
            const schools = classesElement ? JSON.parse(classesElement.textContent) : {};
            renderProfile(profile, { identity, root: document, schools });
            loading.hidden = true;
            content.hidden = false;
        } catch {
            if (current === revision) {
                deny("profile_error");
            }
        }
    }

    initLogout(prefix + "-logout");
    initLogout(prefix + "-denied-logout");
    retry?.addEventListener("click", () => { refresh(); });

    // Le callback reste synchrone : différer les nouveaux appels à Supabase.
    db?.auth.onAuthStateChange(event => {
        if (!["SIGNED_OUT", "SIGNED_IN", "TOKEN_REFRESHED", "USER_UPDATED"].includes(event)) {
            return;
        }
        ++revision;
        clearTimeout(timer);
        clearProfile();
        if (event === "SIGNED_OUT") {
            deny("not_authenticated");
        } else {
            denied.hidden = true;
            loading.hidden = false;
            timer = setTimeout(() => { refresh(); }, 0);
        }
    });

    window.addEventListener("pageshow", event => {
        if (event.persisted) {
            refresh();
        }
    });
    await refresh();
}
