/* ========== MESSAGES D'AUTHENTIFICATION ========== */

const messageElement = document.getElementById("message");

export function showMessage(text, type = "error") {
    if (!messageElement) {
        console.warn("Élément #message introuvable :", text);
        return;
    }

    messageElement.textContent = text;
    messageElement.dataset.type = type;
    messageElement.hidden = false;
}

export function hideMessage() {
    if (!messageElement) {
        return;
    }

    messageElement.textContent = "";
    messageElement.hidden = true;
    delete messageElement.dataset.type;
}
