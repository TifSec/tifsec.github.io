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
//     'Séance 1 : Comment travailler en technologie cette année ?',
//     'Séance 2 : Pourquoi les objets techniques évoluent-ils ?',
//     'Séance 3 : ',
//     'Séance 4 : ',
//     'Séance 5 : ',
//     'Séance 6 : ',
//     'Séance 7 : ',
//     'Séance 8 : ',
//     'Séance 9 : ',
//     'Séance 10 : ',
//     'Séance 11 : ',
//     'Séance 12 : ',
//     'Séance 13 : ',
//     'Séance 14 : ',
//     'Séance 15 : ',
//     'Séance 16 : ',
//     'Séance 17 : ',
//     'Séance 18 : ',
//     'Séance 19 : ',
//     'Séance 20 : ',
//     'Séance 21 : ',
//     'Séance 22 : ',
//     'Séance 23 : ',
//     'Séance 24 : ',
//     'Séance 25 : ',
//     'Séance 26 : ',
//     'Séance 27 : ',
//     'Séance 28 : ',
//     'Séance 29 : ',
//     'Séance 30 : ',
//     'Séance 31 : ',
//     'Séance 32 : ',
//     'Séance 33 : ',
//     'Séance 34 : ',
//     'Séance 35 : ',
//     'Séance 36 : ',
//     'Séance 37 : ',
//     'Séance 38 : ',
//     'Séance 39 : ',
//     'Séance 40 : ',
//     'Séance 41 : ',
//     'Séance 42 : ',
//     'Séance 43 : ',
//     'Séance 44 : ',
//     'Séance 45 : ',
//     'Séance 46 : ',
//     'Séance 47 : ',
//     'Séance 48 : ',
//     'Séance 49 : ',
//     'Séance 50 : ',
//     'Séance 51 : ',
//     'Séance 52 : '
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

//         if (firstLine) {
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

const specialClosures = {
    '2027-05-07': 'Pont de l\'Ascension - Pas de cours'
};

const vacations = [
    { start: '2026-10-17', end: '2026-11-01', name: 'Vacances de la Toussaint' },
    { start: '2026-12-19', end: '2027-01-03', name: 'Vacances de Noël' },
    { start: '2027-02-13', end: '2027-02-28', name: 'Vacances d\'hiver' },
    { start: '2027-04-10', end: '2027-04-25', name: 'Vacances de printemps' },
    { start: '2027-07-03', end: '2027-09-01', name: 'Vacances d\'été' }
];

const sessions = [
    'Séance 1 : Comment travailler en technologie cette année ?',
    'Séance 2 : Pourquoi les objets techniques évoluent-ils ?',
    'Séance 3 : ',
    'Séance 4 : ',
    'Séance 5 : ',
    'Séance 6 : ',
    'Séance 7 : ',
    'Séance 8 : ',
    'Séance 9 : ',
    'Séance 10 : ',
    'Séance 11 : ',
    'Séance 12 : ',
    'Séance 13 : ',
    'Séance 14 : ',
    'Séance 15 : ',
    'Séance 16 : ',
    'Séance 17 : ',
    'Séance 18 : ',
    'Séance 19 : ',
    'Séance 20 : ',
    'Séance 21 : ',
    'Séance 22 : ',
    'Séance 23 : ',
    'Séance 24 : ',
    'Séance 25 : ',
    'Séance 26 : ',
    'Séance 27 : ',
    'Séance 28 : ',
    'Séance 29 : ',
    'Séance 30 : ',
    'Séance 31 : ',
    'Séance 32 : ',
    'Séance 33 : ',
    'Séance 34 : ',
    'Séance 35 : ',
    'Séance 36 : ',
    'Séance 37 : ',
    'Séance 38 : ',
    'Séance 39 : ',
    'Séance 40 : ',
    'Séance 41 : ',
    'Séance 42 : ',
    'Séance 43 : ',
    'Séance 44 : ',
    'Séance 45 : ',
    'Séance 46 : ',
    'Séance 47 : ',
    'Séance 48 : ',
    'Séance 49 : ',
    'Séance 50 : ',
    'Séance 51 : ',
    'Séance 52 : '
];

function dateToString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function isHoliday(date) {
    return holidays[date] !== undefined;
}

function isSpecialClosure(date) {
    return specialClosures[date] !== undefined;
}

function isInVacation(date) {
    return vacations.some(vacation => date >= vacation.start && date <= vacation.end);
}

function getVacationName(date) {
    const vacation = vacations.find(vacation => date >= vacation.start && date <= vacation.end);
    return vacation ? vacation.name : '';
}

function formatFrenchDate(date) {
    const [year, month, day] = date.split('-');
    return `${day}/${month}/${year}`;
}

function isToday(date) {
    return dateToString(new Date()) === date;
}

function addCourseToCalendar(row, date, dateCell, descCell, time, sessionIndex) {
    dateCell.textContent = formatFrenchDate(date);

    if (isHoliday(date)) {
        descCell.textContent = holidays[date];
        dateCell.classList.add('holiday');
        descCell.classList.add('holiday');
    } else if (isSpecialClosure(date)) {
        descCell.textContent = specialClosures[date];
        dateCell.classList.add('holiday');
        descCell.classList.add('holiday');
    } else if (isInVacation(date)) {
        descCell.textContent = getVacationName(date);
        row.classList.add('vacation');
    } else {
        dateCell.innerHTML = `${formatFrenchDate(date)}<br><small>${time}</small>`;

        const sessionNumber = sessionIndex + 1;
        const sessionName = sessions[sessionIndex] || `Séance ${sessionNumber} : À définir`;
        const link = document.createElement('a');

        link.textContent = sessionName;
        link.href = '#';
        link.setAttribute('onclick', `showSession('session${sessionNumber}'); return false;`);
        descCell.appendChild(link);

        sessionIndex++;
    }

    if (isToday(date)) {
        dateCell.classList.add('today');
        descCell.classList.add('today');
    }

    return sessionIndex;
}

function generateCalendar() {
    const calendarBody = document.getElementById('calendar-body');
    const startDate = new Date(2026, 8, 3, 12);
    const endDate = new Date(2027, 6, 2, 12);

    let currentThursday = new Date(startDate);
    let sessionIndex = 0;
    let weekB = false; // La semaine du 31 août 2026 est une semaine A

    while (currentThursday <= endDate) {
        const row = document.createElement('tr');

        // Jeudi : cours chaque semaine de 8h25 à 9h20
        const thursdayDate = dateToString(currentThursday);
        const thursdayCell = document.createElement('td');
        const thursdayDescCell = document.createElement('td');

        sessionIndex = addCourseToCalendar(
            row,
            thursdayDate,
            thursdayCell,
            thursdayDescCell,
            '8h25 à 9h20',
            sessionIndex
        );

        row.appendChild(thursdayCell);
        row.appendChild(thursdayDescCell);

        // Vendredi : cours uniquement en semaine B de 14h40 à 15h35
        if (weekB) {
            const currentFriday = new Date(currentThursday);
            currentFriday.setDate(currentFriday.getDate() + 1);

            const fridayDate = dateToString(currentFriday);
            const fridayCell = document.createElement('td');
            const fridayDescCell = document.createElement('td');

            sessionIndex = addCourseToCalendar(
                row,
                fridayDate,
                fridayCell,
                fridayDescCell,
                '14h40 à 15h35',
                sessionIndex
            );

            row.appendChild(fridayCell);
            row.appendChild(fridayDescCell);
        } else {
            row.appendChild(document.createElement('td'));
            row.appendChild(document.createElement('td'));
        }

        calendarBody.appendChild(row);

        // Passage à la semaine suivante
        currentThursday.setDate(currentThursday.getDate() + 7);
        weekB = !weekB;
    }
}

generateCalendar();

function toggleMenu() {
    const menu = document.getElementById('session-nav');
    menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
}

function showSession(sessionId) {
    const sessions = document.querySelectorAll('.content-section');

    sessions.forEach(session => {
        session.classList.remove('active');

        if (session.id === sessionId) {
            session.classList.add('active');
        }
    });

    const menuLinks = document.querySelectorAll('#session-nav a');

    menuLinks.forEach(link => {
        link.classList.remove('active');

        if (link.getAttribute('onclick')?.includes(sessionId)) {
            link.classList.add('active');
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    showSession('calendar');
});