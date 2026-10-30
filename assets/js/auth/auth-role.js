/* ========== GESTION DU TYPE DE COMPTE ========== */

export function initRoleFields() {
    const roleInput = document.getElementById("register-role");
    const classWrapper = document.getElementById("register-class-wrapper");
    const classInput = document.getElementById("register-classe");

    if (!roleInput || !classWrapper || !classInput) {
        return;
    }

    function updateRoleFields() {
        const isStudent = roleInput.value === "student";

        classWrapper.hidden = !isStudent;

        if (!isStudent) {
            classInput.value = "";
        }
    }

    roleInput.addEventListener("change", updateRoleFields);
    updateRoleFields();
}
