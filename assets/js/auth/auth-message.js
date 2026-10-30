/* ========== MESSAGES D'AUTHENTIFICATION ========== */

export function showMessage(text, type = "error") {
    const messageElement = document.getElementById("message");
    if (!messageElement) {
        console.warn("Élément #message introuvable :", text);
        return;
    }

    messageElement.textContent = text;
    messageElement.dataset.type = type;
    messageElement.hidden = false;
}

export function hideMessage() {
    const messageElement = document.getElementById("message");
    if (!messageElement) {
        return;
    }

    messageElement.textContent = "";
    messageElement.hidden = true;
    delete messageElement.dataset.type;
}
