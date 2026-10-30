/* ========== SÉLECTION ÉTABLISSEMENT / CLASSE ========== */

export function initSchoolSelection() {
    const schoolInput = document.getElementById("register-school");
    const classInput = document.getElementById("register-classe");

    if (!schoolInput || !classInput) {
        console.error("Sélecteur établissement ou classe introuvable");
        return;
    }

    const allOptions = [...classInput.querySelectorAll("option[data-school]")];

    function updateClasses() {
        const school = schoolInput.value;

        classInput.replaceChildren();
        classInput.add(new Option(
            school ? "Choisis ta classe" : "Choisis d'abord ton établissement",
            ""
        ));

        allOptions
            .filter(option => option.dataset.school === school)
            .forEach(option => {
                option.hidden = false;
                classInput.add(option);
            });

        classInput.value = "";
        classInput.disabled = !school;
    }

    schoolInput.addEventListener("change", updateClasses);
    updateClasses();
}
