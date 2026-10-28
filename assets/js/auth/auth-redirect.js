/* ========== REDIRECTIONS APRÈS CONNEXION ========== */
import { sitePath } from './site-path.js';

const ROUTES = {
    student: "/eleve/",
    teacher: "/prof/",
    auth: "/connexion/"
};

export function getRedirectUrl(role) {
    return ROUTES[role] ? sitePath(ROUTES[role]) : null;
}

export function redirectUser(role) {
    const url = getRedirectUrl(role);

    if (!url) {
        console.error("Rôle inconnu : redirection annulée.");
        return false;
    }

    window.location.assign(url);
    return true;
}
