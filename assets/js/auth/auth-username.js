/* ========== GESTION DES IDENTIFIANTS ========== */

export function generateUsername(prenom, nom = "") {
    const base = nom ? `${prenom}.${nom}` : prenom;

    return base
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "")
        .replace(/[^a-z0-9._-]/g, "");
}

export function usernameToEmail(username) {
    const cleanUsername = username
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "")
        .replace(/[^a-z0-9._-]/g, "");

    return `${cleanUsername}@eleve.example.com`;
}

/* ========== GÉNÉRATION DANS LE FORMULAIRE ========== */

export function initUsernameGeneration() {
    const prenomInput = document.getElementById("register-prenom");
    const nomInput = document.getElementById("register-nom");
    const usernameInput = document.getElementById("register-username");

    if (!prenomInput || !nomInput || !usernameInput) {
        return;
    }

    function updateUsername() {
        usernameInput.value = generateUsername(
            prenomInput.value.trim(),
            nomInput.value.trim()
        );
    }

    prenomInput.addEventListener("input", updateUsername);
    nomInput.addEventListener("input", updateUsername);
}
