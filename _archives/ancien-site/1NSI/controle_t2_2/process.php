<?php
if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $nom = htmlspecialchars(trim($_POST["nom"]));
    $email = filter_var(trim($_POST["email"]), FILTER_SANITIZE_EMAIL);
    $message = htmlspecialchars(trim($_POST["message"]));

    if (empty($nom) || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($message) < 10) {
        echo "Erreur : Veuillez remplir correctement le formulaire.";
    } else {
        echo "Merci, $nom. Votre message a bien été envoyé.";
    }
} else {
    echo "Accès non autorisé.";
}
?>
