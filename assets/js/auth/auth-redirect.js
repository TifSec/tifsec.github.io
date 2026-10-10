/* ========== REDIRECTIONS APRÈS CONNEXION ========== */

const ROUTES = {
    student: "/eleve/",
    teacher: "/prof/",
    auth: "/auth/"
};

export function getRedirectUrl(role) {
    return ROUTES[role] || null;
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
