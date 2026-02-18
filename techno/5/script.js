const holidays = {
    '2025-11-01': 'Toussaint',
    '2025-11-11': 'Armistice 1918',
    '2025-12-25': 'Noël',
    '2026-01-01': 'Jour de l\'An',
    '2026-04-06': 'Lundi de Pâques',
    '2026-05-01': 'Fête du Travail',
    '2026-05-08': 'Victoire 1945',
    '2026-05-14': 'Ascension',
    '2026-05-25': 'Lundi de Pentecôte',
};

const vacations = [
    { start: '2025-10-18', end: '2025-11-02', name: 'Vacances de la Toussaint' },
    { start: '2025-12-20', end: '2026-01-04', name: 'Vacances de Noël' },
    { start: '2026-02-07', end: '2026-02-22', name: 'Vacances d\'hiver' },
    { start: '2026-04-04', end: '2026-04-19', name: 'Vacances de printemps' },
    { start: '2026-07-04', end: '2026-09-01', name: 'Vacances d\'été' }
];

const sessions = [
    'Séance 1 : 1er cours, présentations',
    'Séance 2 : Découvrir le vélo : objet technique ou naturel ?',
    'Séance 3 : Les besoins à l’origine du vélo',
    'Séance 4 : Fonctions d’usage et fonctions techniques',
    'Séance 5 : Évolution du vélo dans le temps',
    'Séance 6 : Étude des matériaux du vélo',
    'Séance 7 : La transmission de mouvement (chaîne, pédalier, roues)',
    'Séance 8 : Chaîne d’énergie du vélo : transformation et stockage',
    'Séance 9 : Chaîne d’information : vélo connecté / compteur',
    'Séance 10 : Séance libre avant vacances',
    'Séance 11 : Observer et démonter une lampe de bureau',
    'Séance 12 : Lire un schéma fonctionnel : fonctionnement d’une lampe',
    'Séance 13 : Chaîne d’énergie d’une lampe connectée',
    'Séance 14 : Chaîne d’information : capteurs et commande',
    'Séance 15 : Programmer une lampe automatique (détection de mouvement)',
    'Séance 16 : Les objets connectés autour de nous',
    'Séance 17 : Dépanner une lampe : diagnostic d’un dysfonctionnement',
    'Séance 18 : Mini-projet : créer une mini-lampe de bureau commandée',
    'Séance 19 : Mini-projet : créer un objet connecté avec micro:bit',
    'Séance 20 : QCM 2 – Bilan Thème 2',
    'Séance 21 : Séance libre avant vacances',
    'Séance 22 : Introduction à la démarche de projet (porte-clé connecté)',
    'Séance 23 : Cahier des charges : besoins et contraintes',
    'Séance 24 : Prise en main de Tinkercad',
    'Séance 25 : Créer la base du porte-clé en 3D',
    'Séance 26 : Ajouter un logement pour composant électronique',
    'Séance 27 : Cotation simple et contraintes de fabrication',
    'Séance 28 : QCM 3 – Bilan conception / réalisation',
    'Séance 29 : Modélisation du porte-clé en 3D : prise des mesures',
    'Séance 30 : Modélisation du porte-clé en 3D : la base 1/2',
    'Séance 31 : Modélisation du porte-clé en 3D : la base 2/2',
    'Séance 32 : Modélisation du porte-clé en 3D : la base, derniers ajustements et détails',
    'Séance 33 : Les différents types de liaisons mécaniques',
    'Séance 34 : Modélisation des différents types de liaisons mécaniques',
    'Séance 35 : Modélisation du porte-clé en 3D : créer un moyen de fermer le porte-clé',
    'Séance 36 : Modélisation du porte-clé en 3D : dernières corrections et préparation à l’impression',
    'Séance 37 : Séance libre avant les vacances',


    // 'Séance 29 : Séance libre avant vacances',
    // 'Séance 30 : Préparation à l’impression 3D',
    // 'Séance 31 : Fabrication du porte-clé (impression 3D)',
    // 'Séance 32 : Programmer le micro:bit du porte-clé connecté (affichage LED)',
    // 'Séance 33 : Ajouter un capteur : porte-clé qui réagit à la lumière',
    // 'Séance 34 : Assembler le micro:bit et la coque imprimée',
    // 'Séance 35 : Tester et corriger le prototype',
    // 'Séance 36 : Ajouter une fonction : porte-clé qui clignote à la détection de mouvement',
    // 'Séance 37 : QCM 4 – Bilan projets 1 et 2',
    // 'Séance 38 : Séance libre avant vacances',
    // 'Séance 39 : Projet : créer une boîte à messages lumineuse (micro:bit radio)',
    // 'Séance 40 : Projet : créer un capteur d’environnement portable',
    // 'Séance 41 : Projet : fabriquer un support imprimé pour le capteur',
    // 'Séance 42 : Test, évaluation et partage des projets',
    // 'Séance 43 : Mini-défi : fabriquer un objet utile avec un micro:bit',
    // 'Séance 44 : Mini-défi 2 : capteur, lumière, ou son',
    // 'Séance 45 : Réalisation du défi final (au choix des élèves)',
    // 'Séance 46 : Présentation orale du projet et explication du code',
    // 'Séance 47 : QCM 5 – Évaluation finale',
    // 'Séance 48 : Séances de découverte, défis facultatifs, rattrapage, présentation publique, exposition',
    // 'Séance 49 : Séances de découverte, défis facultatifs, rattrapage, présentation publique, exposition',
    // 'Séance 50 : Séances de découverte, défis facultatifs, rattrapage, présentation publique, exposition',
    // 'Séance 51 : Séances de découverte, défis facultatifs, rattrapage, présentation publique, exposition',
    // 'Séance 52 : Séances de découverte, défis facultatifs, rattrapage, présentation publique, exposition',
    // 'Séance 53 : Séance libre avant vacances',
];

function isHoliday(date) {
    return holidays[date] !== undefined;
}

function isInVacation(date) {
    const parsedDate = new Date(date);
    return vacations.some(vacation => {
        const startDate = new Date(vacation.start);
        const endDate = new Date(vacation.end);
        return parsedDate >= startDate && parsedDate <= endDate;
    });
}

function getVacationName(date) {
    const parsedDate = new Date(date);
    const vacation = vacations.find(vacation => {
        const startDate = new Date(vacation.start);
        const endDate = new Date(vacation.end);
        return parsedDate >= startDate && parsedDate <= endDate;
    });
    return vacation ? vacation.name : '';
}

function formatFrenchDate(date) {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return new Date(date).toLocaleDateString('fr-FR', options);
}

function isCurrentWeek(date) {
    const currentDate = new Date();
    const firstDayOfWeek = new Date(date);
    const lastDayOfWeek = new Date(firstDayOfWeek);
    lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
    return currentDate >= firstDayOfWeek && currentDate <= lastDayOfWeek;
}

function isToday(date) {
    const today = new Date().toISOString().split('T')[0];
    return today === date;
}

// function generateCalendar() {
//     const calendarBody = document.getElementById('calendar-body');
//     const startDate = new Date('2024-09-06');  // Commence le vendredi 6 septembre
//     const endDate = new Date('2025-07-12');
    
//     let currentDate = startDate;
//     let sessionIndex = 0;
//     let firstLine = true; // Pour gérer le premier vendredi seul
//     let displayThursday = true; // Alterne l'affichage des jeudis

//     while (currentDate <= endDate) {
//         const row = document.createElement('tr');

//         if (firstLine) {
//             // Première ligne : uniquement le vendredi
//             const fridayDateString = currentDate.toISOString().split('T')[0];
//             const fridayCell = document.createElement('td');
//             const fridayDescCell = document.createElement('td');
            
//             fridayCell.textContent = formatFrenchDate(fridayDateString);

//             if (isHoliday(fridayDateString)) {
//                 fridayDescCell.textContent = holidays[fridayDateString];
//                 fridayCell.classList.add('holiday');
//                 fridayDescCell.classList.add('holiday');
//             } else if (isInVacation(fridayDateString)) {
//                 fridayDescCell.textContent = getVacationName(fridayDateString);
//                 row.classList.add('vacation');
//             } else {
//                 fridayDescCell.textContent = sessions[sessionIndex] || 'Séance à définir';
//                 sessionIndex++;
//             }

//             if (isToday(fridayDateString)) {
//                 fridayCell.classList.add('today');
//                 fridayDescCell.classList.add('today');
//             }

//             // Cellules vides pour jeudi
//             row.appendChild(document.createElement('td')); // Cellule vide pour la date du jeudi
//             row.appendChild(document.createElement('td')); // Cellule vide pour le cours du jeudi
//             row.appendChild(fridayCell);
//             row.appendChild(fridayDescCell);

//             // Passer au jeudi suivant
//             currentDate.setDate(currentDate.getDate() + 6);
//             firstLine = false;
//         } else {
//             // Ligne suivante : jeudi et vendredi (alternance pour jeudi)
//             if (displayThursday) {
//                 // Affiche le jeudi
//                 const thursdayDateString = currentDate.toISOString().split('T')[0];
//                 const thursdayCell = document.createElement('td');
//                 const thursdayDescCell = document.createElement('td');
                
//                 thursdayCell.textContent = formatFrenchDate(thursdayDateString);

//                 if (isHoliday(thursdayDateString)) {
//                     thursdayDescCell.textContent = holidays[thursdayDateString];
//                     thursdayCell.classList.add('holiday');
//                     thursdayDescCell.classList.add('holiday');
//                 } else if (isInVacation(thursdayDateString)) {
//                     thursdayDescCell.textContent = getVacationName(thursdayDateString);
//                     row.classList.add('vacation');
//                 } else {
//                     thursdayDescCell.textContent = sessions[sessionIndex] || 'Séance à définir';
//                     sessionIndex++;
//                 }

//                 if (isToday(thursdayDateString)) {
//                     thursdayCell.classList.add('today');
//                     thursdayDescCell.classList.add('today');
//                 }

//                 row.appendChild(thursdayCell);
//                 row.appendChild(thursdayDescCell);
//             } else {
//                 // Si jeudi est sauté, ajoute des cellules vides
//                 row.appendChild(document.createElement('td')); // Cellule vide pour la date du jeudi
//                 row.appendChild(document.createElement('td')); // Cellule vide pour le cours du jeudi
//             }

//             // Passe au vendredi
//             currentDate.setDate(currentDate.getDate() + 1);
//             const fridayDateString = currentDate.toISOString().split('T')[0];
//             const fridayCell = document.createElement('td');
//             const fridayDescCell = document.createElement('td');
            
//             fridayCell.textContent = formatFrenchDate(fridayDateString);

//             if (isHoliday(fridayDateString)) {
//                 fridayDescCell.textContent = holidays[fridayDateString];
//                 fridayCell.classList.add('holiday');
//                 fridayDescCell.classList.add('holiday');
//             } else if (isInVacation(fridayDateString)) {
//                 fridayDescCell.textContent = getVacationName(fridayDateString);
//                 row.classList.add('vacation');
//             } else {
//                 fridayDescCell.textContent = sessions[sessionIndex] || 'Séance à définir';
//                 sessionIndex++;
//             }

//             if (isToday(fridayDateString)) {
//                 fridayCell.classList.add('today');
//                 fridayDescCell.classList.add('today');
//             }

//             row.appendChild(fridayCell);
//             row.appendChild(fridayDescCell);

//             // Passe au jeudi suivant (saute un jeudi sur deux)
//             currentDate.setDate(currentDate.getDate() + 6);
//             displayThursday = !displayThursday; // Alterne l'affichage des jeudis
//         }

//         calendarBody.appendChild(row);
//     }
// }

function generateCalendar() {
    const calendarBody = document.getElementById('calendar-body');
    const startDate = new Date('2025-09-04');  // Commence le jeudi 4 septembre
    const endDate = new Date('2026-07-09');
    
    let currentDate = startDate;
    let sessionIndex = 0;
    let firstLine = true; // Pour gérer le premier jeudi seul
    let displayThursday = true; // Alterne l'affichage des jeudis

    while (currentDate <= endDate) {
        const row = document.createElement('tr');

        if (firstLine) {
            // Première ligne : uniquement le jeudi
            const fridayDateString = currentDate.toISOString().split('T')[0];
            const fridayCell = document.createElement('td');
            const fridayDescCell = document.createElement('td');
            
            fridayCell.textContent = formatFrenchDate(fridayDateString);

            if (isHoliday(fridayDateString)) {
                fridayDescCell.textContent = holidays[fridayDateString];
                fridayCell.classList.add('holiday');
                fridayDescCell.classList.add('holiday');
            } else if (isInVacation(fridayDateString)) {
                fridayDescCell.textContent = getVacationName(fridayDateString);
                row.classList.add('vacation');
            } else {
                const sessionName = sessions[sessionIndex] || 'Séance à définir';
                sessionIndex++;

                // Création d'un lien cliquable pour les séances
                const link = document.createElement('a');
                link.textContent = sessionName;
                link.href = `#`; // Génère un ID basé sur le nom de la séance
                link.setAttribute("onclick","showSession('session"+sessionIndex+"')");

                fridayDescCell.appendChild(link);
            }

            if (isToday(fridayDateString)) {
                fridayCell.classList.add('today');
                fridayDescCell.classList.add('today');
            }

            // Cellules vides pour jeudi
            row.appendChild(document.createElement('td')); // Cellule vide pour la date du jeudi
            row.appendChild(document.createElement('td')); // Cellule vide pour le cours du jeudi
            row.appendChild(fridayCell);
            row.appendChild(fridayDescCell);

            // Passer au jeudi suivant
            currentDate.setDate(currentDate.getDate() + 7);
            firstLine = false;
        } else {
            // Ligne suivante : jeudi séance 1 et jeudi séance 2 (alternance pour jeudi)
            if (displayThursday) {
                // Affiche le jeudi
                const thursdayDateString = currentDate.toISOString().split('T')[0];
                const thursdayCell = document.createElement('td');
                const thursdayDescCell = document.createElement('td');
                
                thursdayCell.textContent = formatFrenchDate(thursdayDateString);                       

                if (isHoliday(thursdayDateString)) {
                    thursdayDescCell.textContent = holidays[thursdayDateString];
                    thursdayCell.classList.add('holiday');
                    thursdayDescCell.classList.add('holiday');
                } else if (isInVacation(thursdayDateString)) {
                    thursdayDescCell.textContent = getVacationName(thursdayDateString);
                    row.classList.add('vacation');
                } else {
                    const sessionName = sessions[sessionIndex] || 'Séance à définir';
                    sessionIndex++;

                    // Création d'un lien cliquable pour les séances
                    const link = document.createElement('a');
                    link.textContent = sessionName;
                    link.href = `#`; // Génère un ID basé sur le nom de la séance
                    link.setAttribute("onclick","showSession('session"+sessionIndex+"')");

                    thursdayDescCell.appendChild(link);
                }

                if (isToday(thursdayDateString)) {
                    thursdayCell.classList.add('today');
                    thursdayDescCell.classList.add('today');
                }

                // Ajout des cellules à la ligne
                row.appendChild(thursdayCell);
                row.appendChild(thursdayDescCell);
            } else {
                // Si jeudi est sauté, ajoute des cellules vides
                row.appendChild(document.createElement('td')); // Cellule vide pour la date du jeudi
                row.appendChild(document.createElement('td')); // Cellule vide pour le cours du jeudi
            }

            // Passe a la deuxième séance du jeudi
            currentDate.setDate(currentDate.getDate());
            const fridayDateString = currentDate.toISOString().split('T')[0];
            const fridayCell = document.createElement('td');
            const fridayDescCell = document.createElement('td');
            
            fridayCell.textContent = formatFrenchDate(fridayDateString);

            if (isHoliday(fridayDateString)) {
                fridayDescCell.textContent = holidays[fridayDateString];
                fridayCell.classList.add('holiday');
                fridayDescCell.classList.add('holiday');
            } else if (isInVacation(fridayDateString)) {
                fridayDescCell.textContent = getVacationName(fridayDateString);
                row.classList.add('vacation');
            } else {
                const sessionName = sessions[sessionIndex] || 'Séance à définir';
                sessionIndex++;

                // Création d'un lien cliquable pour les séances
                const link = document.createElement('a');
                link.textContent = sessionName;
                link.href = `#`; // Génère un ID basé sur le nom de la séance
                link.setAttribute("onclick","showSession('session"+sessionIndex+"')");

                fridayDescCell.appendChild(link);
            }

            if (isToday(fridayDateString)) {
                fridayCell.classList.add('today');
                fridayDescCell.classList.add('today');
            }

            row.appendChild(fridayCell);
            row.appendChild(fridayDescCell);

            // Passe au jeudi suivant (saute un jeudi sur deux)
            currentDate.setDate(currentDate.getDate() + 7);
            displayThursday = !displayThursday; // Alterne l'affichage des jeudis
        }

        calendarBody.appendChild(row);
    }
}

// Générer le calendrier au chargement de la page
generateCalendar();

// Toggle menu visibility
function toggleMenu() {
    const menu = document.getElementById("session-nav");
    menu.style.display = menu.style.display === "block" ? "none" : "block";
}

// Show selected session content
function showSession(sessionId) {
    const sessions = document.querySelectorAll('.content-section');
    sessions.forEach(session => {
        session.classList.remove('active');
        if (session.id === sessionId) {
            session.classList.add('active');
        }
    });

    // Mettre en évidence la séance active dans le menu
    const menuLinks = document.querySelectorAll('#session-nav a');
    menuLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('onclick').includes(sessionId)) {
            link.classList.add('active');
        }
    });
}

// Display the first session by default when page loads
document.addEventListener('DOMContentLoaded', () => {
    showSession('calendar');
});