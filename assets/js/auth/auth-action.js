/* ========== UNE SEULE OPÉRATION DE COMPTE À LA FOIS ========== */

let busy = false;

export function isAuthActionRunning() {
    return busy;
}

export function beginAuthAction() {
    if (busy) {
        return false;
    }
    busy = true;
    setButtonsDisabled(true);
    return true;
}

export function endAuthAction() {
    busy = false;
    setButtonsDisabled(false);
}

function setButtonsDisabled(value) {
    for (const id of ["login-button", "register-button", "auth-session-logout"]) {
        const button = document.getElementById(id);
        if (button) {
            button.disabled = value;
        }
    }
}
