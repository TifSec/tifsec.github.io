document.getElementById("contactForm").addEventListener("submit", function(event) {
    let nom = document.getElementById("nom");
    let email = document.getElementById("email");
    let message = document.getElementById("message");
    let feedback = document.getElementById("feedback");
    let isValid = true;

    // Réinitialisation des styles
    nom.classList.remove("error", "valid");
    email.classList.remove("error", "valid");
    message.classList.remove("error", "valid");

    // Vérification du champ Nom
    if (nom.value.trim() === "") {
        nom.classList.add("error");
        isValid = false;
    } else {
        nom.classList.add("valid");
    }

    // Vérification du champ Email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
        email.classList.add("error");
        isValid = false;
    } else {
        email.classList.add("valid");
    }

    // Vérification du champ Message
    if (message.value.trim().length < 10) {
        message.classList.add("error");
        isValid = false;
    } else {
        message.classList.add("valid");
    }

    // Empêche l'envoi si invalide
    if (!isValid) {
        event.preventDefault();
        feedback.textContent = "Veuillez remplir correctement tous les champs.";
        feedback.style.color = "red";
        return;
    }

    // Modification du bouton d'envoi
    let submitButton = document.querySelector("input[type='submit']");
    submitButton.value = "Envoi en cours...";

    // Ajout du message après soumission
    setTimeout(() => {
        feedback.textContent = `Merci pour votre message, ${nom.value} !`;
        feedback.style.color = "green";
    }, 1000);
});
