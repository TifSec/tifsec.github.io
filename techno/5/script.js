// const holidays = {
//     '2026-11-01': 'Toussaint',
//     '2026-11-11': 'Armistice 1918',
//     '2026-12-25': 'Noël',
//     '2027-01-01': 'Jour de l\'An',
//     '2027-04-06': 'Lundi de Pâques',
//     '2027-05-01': 'Fête du Travail',
//     '2027-05-08': 'Victoire 1945',
//     '2027-05-14': 'Ascension',
//     '2027-05-25': 'Lundi de Pentecôte'
// };

// const vacations = [
//     { start: '2026-10-17', end: '2026-11-01', name: 'Vacances de la Toussaint' },
//     { start: '2025-12-19', end: '2027-01-03', name: 'Vacances de Noël' },
//     { start: '2027-02-13', end: '2027-02-28', name: 'Vacances d\'hiver' },
//     { start: '2027-04-10', end: '2027-05-25', name: 'Vacances de printemps' },
//     { start: '2027-07-03', end: '2027-09-01', name: 'Vacances d\'été' }
// ];

// const sessions = [
//     'Séance 1 : Comment allons-nous travailler en Technologie cette année ?',
//     'Séance 2 : Pourquoi fabrique-t-on des objets techniques ?',
//     'Séance 3 : Comment un vélo peut-il remplir toutes ses fonctions ?',
//     'Séance 4 : Pourquoi les vélos ont-ils changé au cours du temps ?',
//     'Séance 5 : Existe-t-il un meilleur vélo ?',
//     'Séance 6 : Comment prouver qu\'un objet est plus performant ?',
//     'Séance 7 : Que devient un objet avant et après son utilisation ?',
//     'Séance 8 : Un objet qui ne fonctionne plus est-il forcément à jeter ?',
//     'Séance 9 : Comment résoudre un problème compliqué ?',
//     'Séance 10 : Construire, tester, se tromper, corriger',
//     'Séance 11 : Observer et démonter une lampe de bureau',
//     'Séance 12 : Lire un schéma fonctionnel : fonctionnement d’une lampe',
//     'Séance 13 : Chaîne d’énergie d’une lampe connectée',
//     'Séance 14 : Chaîne d’information : capteurs et commande',
//     'Séance 15 : Programmer une lampe automatique (détection de mouvement)',
//     'Séance 16 : Les objets connectés autour de nous',
//     'Séance 17 : Dépanner une lampe : diagnostic d’un dysfonctionnement',
//     'Séance 18 : Mini-projet : créer une mini-lampe de bureau commandée',
//     'Séance 19 : Mini-projet : créer un objet connecté avec micro:bit',
//     'Séance 20 : QCM 2 – Bilan Thème 2',
//     'Séance 21 : Séance libre avant vacances',
//     'Séance 22 : Introduction à la démarche de projet (porte-clé connecté)',
//     'Séance 23 : Cahier des charges : besoins et contraintes',
//     'Séance 24 : Prise en main de Tinkercad',
//     'Séance 25 : Créer la base du porte-clé en 3D',
//     'Séance 26 : Ajouter un logement pour composant électronique',
//     'Séance 27 : Cotation simple et contraintes de fabrication',
//     'Séance 28 : QCM 3 – Bilan conception / réalisation',
//     'Séance 29 : Modélisation du porte-clé en 3D : prise des mesures',
//     'Séance 30 : Modélisation du porte-clé en 3D : la base 1/2',
//     'Séance 31 : Modélisation du porte-clé en 3D : la base 2/2',
//     'Séance 32 : Modélisation du porte-clé en 3D : la base, derniers ajustements et détails',
//     'Séance 33 : Les différents types de liaisons mécaniques',
//     'Séance 34 : Modélisation des différents types de liaisons mécaniques',
//     'Séance 35 : Modélisation du porte-clé en 3D : créer un moyen de fermer le porte-clé',
//     'Séance 36 : Modélisation du porte-clé en 3D : dernières corrections et préparation à l’impression',
//     'Séance 37 : Séance libre avant les vacances',
//     'Séance 38 : Comparer et choisir un objet technique',
//     'Séance 39 : Interactions entre un objet technique, l’utilisateur et son environnement',
//     'Séance 40 : La chaîne d’information d’un objet technique',
//     'Séance 41 : Modifier un programme existant (micro:bit)',
//     'Séance 42 : Tester un objet technique avec un protocole',
//     'Séance 43 : Identifier un dysfonctionnement et corriger un programme',
//     'Séance 44 : Faire communiquer des objets techniques (micro:bit radio)',
//     'Séance 45 : Données et cybersécurité (usage responsable)',
//     'Séance 46 : Planifier un mini-projet technique',
//     'Séance 47 : Définir le besoin et le cahier des charges',
//     'Séance 48 : Concevoir la solution technique',
//     'Séance 49 : Réaliser et programmer la solution technique',
//     'Séance 50 : Tester et améliorer la solution technique',
//     'Séance 51 : Corriger et améliorer le programme',
//     'Séance 52 : Présenter et expliquer un projet technique',
//     'Séance 53 : Séance libre avant grandes vacances'
// ];

// function isHoliday(date) {
//     return holidays[date] !== undefined;
// }

// function isInVacation(date) {
//     const parsedDate = new Date(date);
//     return vacations.some(vacation => {
//         const startDate = new Date(vacation.start);
//         const endDate = new Date(vacation.end);
//         return parsedDate >= startDate && parsedDate <= endDate;
//     });
// }

// function getVacationName(date) {
//     const parsedDate = new Date(date);
//     const vacation = vacations.find(vacation => {
//         const startDate = new Date(vacation.start);
//         const endDate = new Date(vacation.end);
//         return parsedDate >= startDate && parsedDate <= endDate;
//     });
//     return vacation ? vacation.name : '';
// }

// function formatFrenchDate(date) {
//     const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
//     return new Date(date).toLocaleDateString('fr-FR', options);
// }

// function isCurrentWeek(date) {
//     const currentDate = new Date();
//     const firstDayOfWeek = new Date(date);
//     const lastDayOfWeek = new Date(firstDayOfWeek);
//     lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
//     return currentDate >= firstDayOfWeek && currentDate <= lastDayOfWeek;
// }

// function isToday(date) {
//     const today = new Date().toISOString().split('T')[0];
//     return today === date;
// }

// // function generateCalendar() {
// //     const calendarBody = document.getElementById('calendar-body');
// //     const startDate = new Date('2024-09-06');  // Commence le vendredi 6 septembre
// //     const endDate = new Date('2025-07-12');
    
// //     let currentDate = startDate;
// //     let sessionIndex = 0;
// //     let firstLine = true; // Pour gérer le premier vendredi seul
// //     let displayThursday = true; // Alterne l'affichage des jeudis

// //     while (currentDate <= endDate) {
// //         const row = document.createElement('tr');

// //         if (firstLine) {
// //             // Première ligne : uniquement le vendredi
// //             const fridayDateString = currentDate.toISOString().split('T')[0];
// //             const fridayCell = document.createElement('td');
// //             const fridayDescCell = document.createElement('td');
            
// //             fridayCell.textContent = formatFrenchDate(fridayDateString);

// //             if (isHoliday(fridayDateString)) {
// //                 fridayDescCell.textContent = holidays[fridayDateString];
// //                 fridayCell.classList.add('holiday');
// //                 fridayDescCell.classList.add('holiday');
// //             } else if (isInVacation(fridayDateString)) {
// //                 fridayDescCell.textContent = getVacationName(fridayDateString);
// //                 row.classList.add('vacation');
// //             } else {
// //                 fridayDescCell.textContent = sessions[sessionIndex] || 'Séance à définir';
// //                 sessionIndex++;
// //             }

// //             if (isToday(fridayDateString)) {
// //                 fridayCell.classList.add('today');
// //                 fridayDescCell.classList.add('today');
// //             }

// //             // Cellules vides pour jeudi
// //             row.appendChild(document.createElement('td')); // Cellule vide pour la date du jeudi
// //             row.appendChild(document.createElement('td')); // Cellule vide pour le cours du jeudi
// //             row.appendChild(fridayCell);
// //             row.appendChild(fridayDescCell);

// //             // Passer au jeudi suivant
// //             currentDate.setDate(currentDate.getDate() + 6);
// //             firstLine = false;
// //         } else {
// //             // Ligne suivante : jeudi et vendredi (alternance pour jeudi)
// //             if (displayThursday) {
// //                 // Affiche le jeudi
// //                 const thursdayDateString = currentDate.toISOString().split('T')[0];
// //                 const thursdayCell = document.createElement('td');
// //                 const thursdayDescCell = document.createElement('td');
                
// //                 thursdayCell.textContent = formatFrenchDate(thursdayDateString);

// //                 if (isHoliday(thursdayDateString)) {
// //                     thursdayDescCell.textContent = holidays[thursdayDateString];
// //                     thursdayCell.classList.add('holiday');
// //                     thursdayDescCell.classList.add('holiday');
// //                 } else if (isInVacation(thursdayDateString)) {
// //                     thursdayDescCell.textContent = getVacationName(thursdayDateString);
// //                     row.classList.add('vacation');
// //                 } else {
// //                     thursdayDescCell.textContent = sessions[sessionIndex] || 'Séance à définir';
// //                     sessionIndex++;
// //                 }

// //                 if (isToday(thursdayDateString)) {
// //                     thursdayCell.classList.add('today');
// //                     thursdayDescCell.classList.add('today');
// //                 }

// //                 row.appendChild(thursdayCell);
// //                 row.appendChild(thursdayDescCell);
// //             } else {
// //                 // Si jeudi est sauté, ajoute des cellules vides
// //                 row.appendChild(document.createElement('td')); // Cellule vide pour la date du jeudi
// //                 row.appendChild(document.createElement('td')); // Cellule vide pour le cours du jeudi
// //             }

// //             // Passe au vendredi
// //             currentDate.setDate(currentDate.getDate() + 1);
// //             const fridayDateString = currentDate.toISOString().split('T')[0];
// //             const fridayCell = document.createElement('td');
// //             const fridayDescCell = document.createElement('td');
            
// //             fridayCell.textContent = formatFrenchDate(fridayDateString);

// //             if (isHoliday(fridayDateString)) {
// //                 fridayDescCell.textContent = holidays[fridayDateString];
// //                 fridayCell.classList.add('holiday');
// //                 fridayDescCell.classList.add('holiday');
// //             } else if (isInVacation(fridayDateString)) {
// //                 fridayDescCell.textContent = getVacationName(fridayDateString);
// //                 row.classList.add('vacation');
// //             } else {
// //                 fridayDescCell.textContent = sessions[sessionIndex] || 'Séance à définir';
// //                 sessionIndex++;
// //             }

// //             if (isToday(fridayDateString)) {
// //                 fridayCell.classList.add('today');
// //                 fridayDescCell.classList.add('today');
// //             }

// //             row.appendChild(fridayCell);
// //             row.appendChild(fridayDescCell);

// //             // Passe au jeudi suivant (saute un jeudi sur deux)
// //             currentDate.setDate(currentDate.getDate() + 6);
// //             displayThursday = !displayThursday; // Alterne l'affichage des jeudis
// //         }

// //         calendarBody.appendChild(row);
// //     }
// // }

// function generateCalendar() {
//     const calendarBody = document.getElementById('calendar-body');
//     const startDate = new Date('2026-09-04');  // Commence le vendredi 4 septembre
//     const endDate = new Date('2027-07-04');
    
//     let currentDate = startDate;
//     let sessionIndex = 0;
//     let firstLine = false; // Pour gérer le premier jeudi seul
//     let displayThursday = false; // Alterne l'affichage des jeudis

//     while (currentDate <= endDate) {
//         const row = document.createElement('tr');

//         // if (firstLine) {
//         //     // Première ligne : uniquement le vendredi
//         //     const fridayDateString = currentDate.toISOString().split('T')[0];
//         //     const fridayCell = document.createElement('td');
//         //     const fridayDescCell = document.createElement('td');
            
//         //     fridayCell.textContent = formatFrenchDate(fridayDateString);

//         //     if (isHoliday(fridayDateString)) {
//         //         fridayDescCell.textContent = holidays[fridayDateString];
//         //         fridayCell.classList.add('holiday');
//         //         fridayDescCell.classList.add('holiday');
//         //     } else if (isInVacation(fridayDateString)) {
//         //         fridayDescCell.textContent = getVacationName(fridayDateString);
//         //         row.classList.add('vacation');
//         //     } else {
//         //         const sessionName = sessions[sessionIndex] || 'Séance à définir';
//         //         sessionIndex++;

//         //         // Création d'un lien cliquable pour les séances
//         //         const link = document.createElement('a');
//         //         link.textContent = sessionName;
//         //         link.href = `#`; // Génère un ID basé sur le nom de la séance
//         //         link.setAttribute("onclick","showSession('session"+sessionIndex+"')");

//         //         fridayDescCell.appendChild(link);
//         //     }

//         //     if (isToday(fridayDateString)) {
//         //         fridayCell.classList.add('today');
//         //         fridayDescCell.classList.add('today');
//         //     }

//         //     // Cellules vides pour jeudi
//         //     row.appendChild(document.createElement('td')); // Cellule vide pour la date du jeudi
//         //     row.appendChild(document.createElement('td')); // Cellule vide pour le cours du jeudi
//         //     row.appendChild(fridayCell);
//         //     row.appendChild(fridayDescCell);

//         //     // Passer au jeudi suivant
//         //     currentDate.setDate(currentDate.getDate() + 7);
//         //     firstLine = false;
//         // } else {
//             // Ligne suivante : jeudi séance 1 et jeudi séance 2 (alternance pour jeudi)
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
//                     const sessionName = sessions[sessionIndex] || 'Séance à définir';
//                     sessionIndex++;

//                     // Création d'un lien cliquable pour les séances
//                     const link = document.createElement('a');
//                     link.textContent = sessionName;
//                     link.href = `#`; // Génère un ID basé sur le nom de la séance
//                     link.setAttribute("onclick","showSession('session"+sessionIndex+"')");

//                     thursdayDescCell.appendChild(link);
//                 }

//                 if (isToday(thursdayDateString)) {
//                     thursdayCell.classList.add('today');
//                     thursdayDescCell.classList.add('today');
//                 }

//                 // Ajout des cellules à la ligne
//                 row.appendChild(thursdayCell);
//                 row.appendChild(thursdayDescCell);
//             // } else {
//             //     // Si jeudi est sauté, ajoute des cellules vides
//             //     row.appendChild(document.createElement('td')); // Cellule vide pour la date du jeudi
//             //     row.appendChild(document.createElement('td')); // Cellule vide pour le cours du jeudi
//             // }

//             // // Passe a la deuxième séance du jeudi
//             // currentDate.setDate(currentDate.getDate());
//             // const fridayDateString = currentDate.toISOString().split('T')[0];
//             // const fridayCell = document.createElement('td');
//             // const fridayDescCell = document.createElement('td');
            
//             // fridayCell.textContent = formatFrenchDate(fridayDateString);

//             // if (isHoliday(fridayDateString)) {
//             //     fridayDescCell.textContent = holidays[fridayDateString];
//             //     fridayCell.classList.add('holiday');
//             //     fridayDescCell.classList.add('holiday');
//             // } else if (isInVacation(fridayDateString)) {
//             //     fridayDescCell.textContent = getVacationName(fridayDateString);
//             //     row.classList.add('vacation');
//             // } else {
//             //     const sessionName = sessions[sessionIndex] || 'Séance à définir';
//             //     sessionIndex++;

//             //     // Création d'un lien cliquable pour les séances
//             //     const link = document.createElement('a');
//             //     link.textContent = sessionName;
//             //     link.href = `#`; // Génère un ID basé sur le nom de la séance
//             //     link.setAttribute("onclick","showSession('session"+sessionIndex+"')");

//             //     fridayDescCell.appendChild(link);
//             // }

//             // if (isToday(fridayDateString)) {
//             //     fridayCell.classList.add('today');
//             //     fridayDescCell.classList.add('today');
//             // }

//             // row.appendChild(fridayCell);
//             // row.appendChild(fridayDescCell);

//             // // Passe au jeudi suivant (saute un jeudi sur deux)
//             // currentDate.setDate(currentDate.getDate() + 7);
//             // displayThursday = !displayThursday; // Alterne l'affichage des jeudis
//         }

//         calendarBody.appendChild(row);
//     }
// }

// // Générer le calendrier au chargement de la page
// generateCalendar();

// // Toggle menu visibility
// function toggleMenu() {
//     const menu = document.getElementById("session-nav");
//     menu.style.display = menu.style.display === "block" ? "none" : "block";
// }

// // Show selected session content
// function showSession(sessionId) {
//     const sessions = document.querySelectorAll('.content-section');
//     sessions.forEach(session => {
//         session.classList.remove('active');
//         if (session.id === sessionId) {
//             session.classList.add('active');
//         }
//     });

//     // Mettre en évidence la séance active dans le menu
//     const menuLinks = document.querySelectorAll('#session-nav a');
//     menuLinks.forEach(link => {
//         link.classList.remove('active');
//         if (link.getAttribute('onclick').includes(sessionId)) {
//             link.classList.add('active');
//         }
//     });
// }

// // Display the first session by default when page loads
// document.addEventListener('DOMContentLoaded', () => {
//     showSession('calendar');
// });

const vacations = [
    { start: '2026-10-17', end: '2026-11-01', name: 'Vacances de la Toussaint' },
    { start: '2026-12-19', end: '2027-01-03', name: 'Vacances de Noël' },
    { start: '2027-02-13', end: '2027-02-28', name: 'Vacances d\'hiver' },
    { start: '2027-04-10', end: '2027-04-25', name: 'Vacances de printemps' }
];

const noClassDates = {
    '2027-05-07': 'Pont de l\'Ascension – pas de cours'
};

const sessions = [
    'Séance 1 : Comment allons-nous travailler en Technologie cette année ?',
    'Séance 2 : Pourquoi fabrique-t-on des objets techniques ?',
    'Séance 3 : Comment un vélo peut-il remplir toutes ses fonctions ?',
    'Séance 4 : Pourquoi les vélos ont-ils changé au cours du temps ?',
    'Séance 5 : Existe-t-il un meilleur vélo ?',
    'Séance 6 : Comment prouver qu\'un objet est plus performant ?',
    'Séance 7 : Que devient un objet avant et après son utilisation ?',
    'Séance 8 : Un objet qui ne fonctionne plus est-il forcément à jeter ?',
    'Séance 9 : Comment résoudre un problème compliqué ?',
    'Séance 10 : Comment assembler nos petites solutions pour créer un jeu ?',
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
    'Séance 38 : Comparer et choisir un objet technique',
    'Séance 39 : Interactions entre un objet technique, l’utilisateur et son environnement',
    'Séance 40 : La chaîne d’information d’un objet technique',
    'Séance 41 : Modifier un programme existant (micro:bit)',
    'Séance 42 : Tester un objet technique avec un protocole',
    'Séance 43 : Identifier un dysfonctionnement et corriger un programme',
    'Séance 44 : Faire communiquer des objets techniques (micro:bit radio)',
    'Séance 45 : Données et cybersécurité (usage responsable)',
    'Séance 46 : Planifier un mini-projet technique',
    'Séance 47 : Définir le besoin et le cahier des charges',
    'Séance 48 : Concevoir la solution technique',
    'Séance 49 : Réaliser et programmer la solution technique',
    'Séance 50 : Tester et améliorer la solution technique',
    'Séance 51 : Corriger et améliorer le programme',
    'Séance 52 : Présenter et expliquer un projet technique',
    'Séance 53 : Séance libre avant grandes vacances'
];

function parseDate(dateString) {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
}

function dateToString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatFrenchDate(date) {
    return date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function getVacation(dateString) {
    const date = parseDate(dateString);
    return vacations.find(vacation => {
        const start = parseDate(vacation.start);
        const end = parseDate(vacation.end);
        return date >= start && date <= end;
    });
}

function isToday(dateString) {
    return dateString === dateToString(new Date());
}

function addCalendarRow(calendarBody, date, time, content, className = '') {
    const dateString = dateToString(date);
    const row = document.createElement('tr');
    const dateCell = document.createElement('td');
    const timeCell = document.createElement('td');
    const courseCell = document.createElement('td');

    dateCell.textContent = formatFrenchDate(date);
    timeCell.textContent = time;

    if (typeof content === 'string') {
        courseCell.textContent = content;
    } else {
        courseCell.appendChild(content);
    }

    if (className) row.classList.add(className);

    if (isToday(dateString)) {
        dateCell.classList.add('today');
        timeCell.classList.add('today');
        courseCell.classList.add('today');
    }

    row.appendChild(dateCell);
    row.appendChild(timeCell);
    row.appendChild(courseCell);
    calendarBody.appendChild(row);
}

function createSessionLink(sessionIndex) {
    const sessionNumber = sessionIndex + 1;
    const sessionName = sessions[sessionIndex] || `Séance ${sessionNumber} : à définir`;
    const link = document.createElement('a');

    link.textContent = sessionName;
    link.href = `#session${sessionNumber}`;
    link.addEventListener('click', event => {
        event.preventDefault();
        showSession(`session${sessionNumber}`);
    });

    return link;
}

function generateCalendar() {
    const calendarBody = document.getElementById('calendar-body');
    if (!calendarBody) return;

    calendarBody.innerHTML = '';

    const startDate = new Date(2026, 8, 4);
    const endDate = new Date(2027, 6, 2);
    const currentDate = new Date(startDate);

    let sessionIndex = 0;
    let weekIndex = 0;

    while (currentDate <= endDate) {
        const dateString = dateToString(currentDate);
        const vacation = getVacation(dateString);
        const noClassReason = noClassDates[dateString];
        const doubleWeek = weekIndex % 2 === 0;

        if (vacation) {
            addCalendarRow(calendarBody, currentDate, '—', vacation.name, 'vacation');
        } else if (noClassReason) {
            addCalendarRow(calendarBody, currentDate, '—', noClassReason, 'holiday');
        } else {
            addCalendarRow(
                calendarBody,
                currentDate,
                '13h45 – 14h40',
                createSessionLink(sessionIndex)
            );
            sessionIndex++;

            if (doubleWeek) {
                addCalendarRow(
                    calendarBody,
                    currentDate,
                    '15h50 – 16h45',
                    createSessionLink(sessionIndex)
                );
                sessionIndex++;
            }
        }

        currentDate.setDate(currentDate.getDate() + 7);
        weekIndex++;
    }
}

function toggleMenu() {
    const menu = document.getElementById('session-nav');
    menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
}

function showSession(sessionId) {
    document.querySelectorAll('.content-section').forEach(session => {
        session.classList.toggle('active', session.id === sessionId);
    });

    document.querySelectorAll('#session-nav a').forEach(link => {
        const onclick = link.getAttribute('onclick') || '';
        const href = link.getAttribute('href') || '';

        link.classList.toggle(
            'active',
            onclick.includes(sessionId) || href === `#${sessionId}`
        );
    });
}

document.addEventListener('DOMContentLoaded', () => {
    generateCalendar();
    showSession('calendar');
});