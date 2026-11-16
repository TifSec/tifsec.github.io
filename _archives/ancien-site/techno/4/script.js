// const holidays = {
//     '2025-11-01': 'Toussaint',
//     '2025-11-11': 'Armistice 1918',
//     '2025-12-25': 'Noël',
//     '2026-01-01': 'Jour de l\'An',
//     '2026-04-06': 'Lundi de Pâques',
//     '2026-05-01': 'Fête du Travail',
//     '2026-05-08': 'Victoire 1945',
//     '2026-05-14': 'Ascension',
//     '2026-05-25': 'Lundi de Pentecôte',
// };

// const vacations = [
//     { start: '2025-10-18', end: '2025-11-02', name: 'Vacances de la Toussaint' },
//     { start: '2025-12-20', end: '2026-01-04', name: 'Vacances de Noël' },
//     { start: '2026-02-07', end: '2026-02-22', name: 'Vacances d\'hiver' },
//     { start: '2026-04-04', end: '2026-04-19', name: 'Vacances de printemps' },
//     { start: '2026-07-04', end: '2026-09-01', name: 'Vacances d\'été' }
// ];

// const sessions = [
//     'Séance 1 : 1er cours, présentations',
//     'Séance 2 : Pourquoi avons-nous inventé le robot aspirateur ?',
//     'Séance 3 : Un robot aspirateur convient-il à tout le monde ?',
//     'Séance 4 : Pourquoi les aspirateurs ont-ils autant évolué ?',
//     'Séance 5 : Quel robot aspirateur choisir ?',
//     'Séance 6 : Peut-on vérifier les performances d’un robot ?',
//     'Séance 7 : Un robot aspirateur est-il vraiment écologique ?',
//     'Séance 8 : Faut-il réparer ou remplacer ?',
//     'Séance 9 : Qu’est-ce qui rend une pièce plus rigide ?',
//     'Séance 10 : Le robot aspirateur parfait existe-t-il ?',
//     'Séance 11 : Comment un robot aspirateur peut-il travailler tout seul ?',
//     'Séance 12 : Structure interne d’un robot aspirateur',
//     'Séance 13 : Les chaînes d’énergie du robot aspirateur',
//     'Séance 14 : Les chaînes d’information : capteurs et actionneurs',
//     'Séance 15 : Comment l’information commande-t-elle l’énergie ?',
//     'Séance 16 : Identifier un dysfonctionnement',
//     'Séance 17 : Comment se déplace le robot ?',
//     'Séance 18 : L’énergie électrique du robot : stockage et recharge',
//     'Séance 19 : Introduction à la programmation du robot',
//     'Séance 20 : ',
//     'Séance 21 : ',
//     'Séance 22 : Présentation du projet : mini-serre connectée',
//     'Séance 23 : Identifier les besoins et contraintes de la serre',
//     'Séance 24 : Croquis et idées de conception',
//     'Séance 25 : ',
//     'Séance 26 : Découverte du logiciel de modélisation 3D',
//     'Séance 27 : Modéliser les pièces de la mini-serre',
//     'Séance 28 : Contraintes dimensionnelles et assemblage',
//     'Séance 29 : ',
//     'Séance 30 : Modélisation de la base de la serre',
//     'Séance 31 : Modélisation des murs et des fenêtres de la serre',
//     'Séance 32 : Modélisation des rainures d’assemblage de la serre',
//     'Séance 33 : Premier assemblage (virtuel) des pièces et modifications',
//     'Séance 34 : ',
//     'Séance 35 : ',
//     'Séance 36 : ',
//     'Séance 37 : ',
//     'Séance 38 : ',
//     'Séance 39 : Données de la serre : organiser, nommer et retrouver ses fichiers',
//     'Séance 40 : Mesurer pour de vrai : protocole + collecte',
//     'Séance 41 : Créer une table de données exploitable (structurer)',
//     'Séance 42 : CSV + tableur : importer, trier, filtrer',
//     'Séance 43 : Calculs utiles dans le tableur : min / max / moyenne + choix d’un seuil',
//     'Séance 44 : Créer et mettre en forme un tableau dans Calc',
//     'Séance 45 : ',
//     'Séance 46 : Graphique + interprétation : comprendre le comportement à partir des données',
//     'Séance 47 : Du tableur au programme : régler un comportement (seuil d’alerte)',
//     'Séance 48 : Chaîne d’information de la serre (capteurs → traitement → action)',
//     'Séance 49 : Chaîne d’énergie de la serre (source → conversion → action)',
//     'Séance 50 : Réseau local : qui fait quoi ? + comprendre une adresse IP (niveau collège)',
//     'Séance 51 : Simulation réseau + cybersécurité (usage raisonné)',
//     'Séance 52 : Séance libre avant les grandes vacances'
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
//     const startDate = new Date('2025-09-04');  // Commence le jeudi 4 septembre
//     const endDate = new Date('2026-07-09');
    
//     let currentDate = startDate;
//     let sessionIndex = 0;
//     let firstLine = true; // Pour gérer le premier jeudi seul
//     let displayThursday = true; // Alterne l'affichage des jeudis

//     while (currentDate <= endDate) {
//         const row = document.createElement('tr');

//         if (!firstLine) {
//             // Première ligne : uniquement le jeudi
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
//                 const sessionName = sessions[sessionIndex] || 'Séance à définir';
//                 sessionIndex++;

//                 // Création d'un lien cliquable pour les séances
//                 const link = document.createElement('a');
//                 link.textContent = sessionName;
//                 link.href = `#`; // Génère un ID basé sur le nom de la séance
//                 link.setAttribute("onclick","showSession('session"+sessionIndex+"')");

//                 fridayDescCell.appendChild(link);
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
//             currentDate.setDate(currentDate.getDate() + 7);
//             firstLine = false;
//         } else {
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
//             } else {
//                 // Si jeudi est sauté, ajoute des cellules vides
//                 row.appendChild(document.createElement('td')); // Cellule vide pour la date du jeudi
//                 row.appendChild(document.createElement('td')); // Cellule vide pour le cours du jeudi
//             }

//             // Passe a la deuxième séance du jeudi
//             currentDate.setDate(currentDate.getDate());
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
//                 const sessionName = sessions[sessionIndex] || 'Séance à définir';
//                 sessionIndex++;

//                 // Création d'un lien cliquable pour les séances
//                 const link = document.createElement('a');
//                 link.textContent = sessionName;
//                 link.href = `#`; // Génère un ID basé sur le nom de la séance
//                 link.setAttribute("onclick","showSession('session"+sessionIndex+"')");

//                 fridayDescCell.appendChild(link);
//             }

//             if (isToday(fridayDateString)) {
//                 fridayCell.classList.add('today');
//                 fridayDescCell.classList.add('today');
//             }

//             row.appendChild(fridayCell);
//             row.appendChild(fridayDescCell);

//             // Passe au jeudi suivant (saute un jeudi sur deux)
//             currentDate.setDate(currentDate.getDate() + 7);
//             displayThursday = !displayThursday; // Alterne l'affichage des jeudis
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

const holidays = {
    '2026-11-01': 'Toussaint',
    '2026-11-11': 'Armistice 1918',
    '2026-12-25': 'Noël',
    '2027-01-01': 'Jour de l\'An',
    '2027-03-29': 'Lundi de Pâques',
    '2027-05-01': 'Fête du Travail',
    '2027-05-06': 'Ascension',
    '2027-05-08': 'Victoire 1945',
    '2027-05-17': 'Lundi de Pentecôte'
};

const schoolClosures = {
    '2027-05-07': 'Pont de l\'Ascension - pas de cours'
};

const vacations = [
    { start: '2026-10-17', end: '2026-11-01', name: 'Vacances de la Toussaint' },
    { start: '2026-12-19', end: '2027-01-03', name: 'Vacances de Noël' },
    { start: '2027-02-13', end: '2027-02-28', name: 'Vacances d\'hiver' },
    { start: '2027-04-10', end: '2027-04-25', name: 'Vacances de printemps' },
    { start: '2027-07-03', end: '2027-09-01', name: 'Vacances d\'été' }
];

const sessions = [
    'Séance 1 : 1er cours, présentations',
    'Séance 2 : Pourquoi avons-nous inventé le robot aspirateur ?',
    'Séance 3 : Un robot aspirateur convient-il à tout le monde ?',
    'Séance 4 : Pourquoi les aspirateurs ont-ils autant évolué ?',
    'Séance 5 : Quel robot aspirateur choisir ?',
    'Séance 6 : Peut-on vérifier les performances d’un robot ?',
    'Séance 7 : Un robot aspirateur est-il vraiment écologique ?',
    'Séance 8 : Faut-il réparer ou remplacer ?',
    'Séance 9 : Qu’est-ce qui rend une pièce plus rigide ?',
    'Séance 10 : Le robot aspirateur parfait existe-t-il ?',
    'Séance 11 : Comment un robot aspirateur peut-il travailler tout seul ?',
    'Séance 12 : Structure interne d’un robot aspirateur',
    'Séance 13 : Les chaînes d’énergie du robot aspirateur',
    'Séance 14 : Les chaînes d’information : capteurs et actionneurs',
    'Séance 15 : Comment l’information commande-t-elle l’énergie ?',
    'Séance 16 : Identifier un dysfonctionnement',
    'Séance 17 : Comment se déplace le robot ?',
    'Séance 18 : L’énergie électrique du robot : stockage et recharge',
    'Séance 19 : Introduction à la programmation du robot',
    'Séance 20 : ',
    'Séance 21 : ',
    'Séance 22 : Présentation du projet : mini-serre connectée',
    'Séance 23 : Identifier les besoins et contraintes de la serre',
    'Séance 24 : Croquis et idées de conception',
    'Séance 25 : ',
    'Séance 26 : Découverte du logiciel de modélisation 3D',
    'Séance 27 : Modéliser les pièces de la mini-serre',
    'Séance 28 : Contraintes dimensionnelles et assemblage',
    'Séance 29 : ',
    'Séance 30 : Modélisation de la base de la serre',
    'Séance 31 : Modélisation des murs et des fenêtres de la serre',
    'Séance 32 : Modélisation des rainures d’assemblage de la serre',
    'Séance 33 : Premier assemblage (virtuel) des pièces et modifications',
    'Séance 34 : ',
    'Séance 35 : ',
    'Séance 36 : ',
    'Séance 37 : ',
    'Séance 38 : ',
    'Séance 39 : Données de la serre : organiser, nommer et retrouver ses fichiers',
    'Séance 40 : Mesurer pour de vrai : protocole + collecte',
    'Séance 41 : Créer une table de données exploitable (structurer)',
    'Séance 42 : CSV + tableur : importer, trier, filtrer',
    'Séance 43 : Calculs utiles dans le tableur : min / max / moyenne + choix d’un seuil',
    'Séance 44 : Créer et mettre en forme un tableau dans Calc',
    'Séance 45 : ',
    'Séance 46 : Graphique + interprétation : comprendre le comportement à partir des données',
    'Séance 47 : Du tableur au programme : régler un comportement (seuil d’alerte)',
    'Séance 48 : Chaîne d’information de la serre (capteurs → traitement → action)',
    'Séance 49 : Chaîne d’énergie de la serre (source → conversion → action)',
    'Séance 50 : Réseau local : qui fait quoi ? + comprendre une adresse IP (niveau collège)',
    'Séance 51 : Simulation réseau + cybersécurité (usage raisonné)',
    'Séance 52 : Séance libre avant les grandes vacances'
];

const referenceWeek = '2026-08-31';
const firstWeekType = 'A';

function parseDate(date) {
    const [year, month, day] = date.split('-').map(Number);
    return new Date(year, month - 1, day, 12);
}

function dateToString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatFrenchDate(date) {
    return parseDate(date).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

function isHoliday(date) {
    return holidays[date] !== undefined;
}

function isSchoolClosure(date) {
    return schoolClosures[date] !== undefined;
}

function isInVacation(date) {
    const parsedDate = parseDate(date);
    return vacations.some(vacation => {
        return parsedDate >= parseDate(vacation.start) && parsedDate <= parseDate(vacation.end);
    });
}

function getVacationName(date) {
    const parsedDate = parseDate(date);
    const vacation = vacations.find(vacation => {
        return parsedDate >= parseDate(vacation.start) && parsedDate <= parseDate(vacation.end);
    });
    return vacation ? vacation.name : '';
}

function isToday(date) {
    return dateToString(new Date()) === date;
}

function getWeekType(date) {
    const current = parseDate(date);
    const reference = parseDate(referenceWeek);
    const currentUTC = Date.UTC(current.getFullYear(), current.getMonth(), current.getDate());
    const referenceUTC = Date.UTC(reference.getFullYear(), reference.getMonth(), reference.getDate());
    const weekDifference = Math.floor((currentUTC - referenceUTC) / (7 * 24 * 60 * 60 * 1000));
    if (weekDifference % 2 === 0) {
        return firstWeekType;
    }
    return firstWeekType === 'A' ? 'B' : 'A';
}

function appendEmptySlot(row) {
    row.appendChild(document.createElement('td'));
    row.appendChild(document.createElement('td'));
}

function appendCourseSlot(row, date, group, time, weekType, sessionIndexes) {
    const dateString = dateToString(date);
    const dateCell = document.createElement('td');
    const descCell = document.createElement('td');

    dateCell.innerHTML = `<strong>Groupe ${group}</strong><br>${formatFrenchDate(dateString)}<br>${time}<br>Semaine ${weekType}`;

    if (isInVacation(dateString)) {
        descCell.textContent = getVacationName(dateString);
        dateCell.classList.add('vacation');
        descCell.classList.add('vacation');
    } else if (isHoliday(dateString)) {
        descCell.textContent = holidays[dateString];
        dateCell.classList.add('holiday');
        descCell.classList.add('holiday');
    } else if (isSchoolClosure(dateString)) {
        descCell.textContent = schoolClosures[dateString];
        dateCell.classList.add('holiday');
        descCell.classList.add('holiday');
    } else {
        const sessionIndex = sessionIndexes[group];
        const sessionNumber = sessionIndex + 1;
        const sessionName = sessions[sessionIndex] || 'Séance à définir';
        const link = document.createElement('a');

        link.textContent = sessionName;
        link.href = '#';
        link.setAttribute('onclick', `showSession('session${sessionNumber}'); return false;`);

        descCell.appendChild(link);
        sessionIndexes[group]++;
    }

    if (isToday(dateString)) {
        dateCell.classList.add('today');
        descCell.classList.add('today');
    }

    row.appendChild(dateCell);
    row.appendChild(descCell);
}

function appendVacationRows(calendarBody, vacation) {
    const nameRow = document.createElement('tr');
    const nameCell = document.createElement('td');
    nameCell.colSpan = 4;
    nameCell.textContent = vacation.name;
    nameCell.classList.add('vacation');
    nameRow.appendChild(nameCell);
    calendarBody.appendChild(nameRow);

    const dateRow = document.createElement('tr');
    const dateCell = document.createElement('td');
    dateCell.colSpan = 4;
    dateCell.textContent = `Du ${formatFrenchDate(vacation.start)} au ${formatFrenchDate(vacation.end)}`;
    dateCell.classList.add('vacation');
    dateRow.appendChild(dateCell);
    calendarBody.appendChild(dateRow);
}

function generateCalendar() {
    const calendarBody = document.getElementById('calendar-body');
    calendarBody.innerHTML = '';

    const startDate = parseDate('2026-09-03');
    const endDate = parseDate('2027-07-02');
    const sessionIndexes = {
        1: 0,
        2: 0
    };

    let currentThursday = new Date(startDate);
    let lastDisplayedVacation = null;

    while (currentThursday <= endDate) {
        const thursdayDateString = dateToString(currentThursday);

        const currentVacation = vacations.find(vacation => {
            const date = parseDate(thursdayDateString);
            return date >= parseDate(vacation.start) && date <= parseDate(vacation.end);
        });

        if (currentVacation) {
            if (lastDisplayedVacation !== currentVacation.name) {
                appendVacationRows(calendarBody, currentVacation);
                lastDisplayedVacation = currentVacation.name;
            }

            currentThursday.setDate(currentThursday.getDate() + 7);
            continue;
        }

        lastDisplayedVacation = null;

        const weekType = getWeekType(thursdayDateString);
        const thursdayRow = document.createElement('tr');

        appendCourseSlot(
            thursdayRow,
            currentThursday,
            1,
            '9h20 à 10h15',
            weekType,
            sessionIndexes
        );

        appendCourseSlot(
            thursdayRow,
            currentThursday,
            2,
            '10h30 à 11h25',
            weekType,
            sessionIndexes
        );

        calendarBody.appendChild(thursdayRow);

        const friday = new Date(currentThursday);
        friday.setDate(friday.getDate() + 1);

        if (friday <= endDate) {
            const fridayDateString = dateToString(friday);

            if (!isInVacation(fridayDateString)) {
                const fridayRow = document.createElement('tr');

                if (weekType === 'A') {
                    appendCourseSlot(
                        fridayRow,
                        friday,
                        1,
                        '14h40 à 15h35',
                        weekType,
                        sessionIndexes
                    );
                    appendEmptySlot(fridayRow);
                } else {
                    appendEmptySlot(fridayRow);
                    appendCourseSlot(
                        fridayRow,
                        friday,
                        2,
                        '15h50 à 16h45',
                        weekType,
                        sessionIndexes
                    );
                }

                calendarBody.appendChild(fridayRow);
            }
        }

        currentThursday.setDate(currentThursday.getDate() + 7);
    }
}

generateCalendar();

function toggleMenu() {
    const menu = document.getElementById('session-nav');
    menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
}

function showSession(sessionId) {
    const sessionSections = document.querySelectorAll('.content-section');

    sessionSections.forEach(session => {
        session.classList.remove('active');
        if (session.id === sessionId) {
            session.classList.add('active');
        }
    });

    const menuLinks = document.querySelectorAll('#session-nav a');

    menuLinks.forEach(link => {
        link.classList.remove('active');
        const onclick = link.getAttribute('onclick');

        if (onclick && onclick.includes(sessionId)) {
            link.classList.add('active');
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    showSession('calendar');
});