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
    'Séance 2 : Découverte du vélo électrique : à quoi sert-il ?',
    'Séance 3 : Les besoins auxquels répond le vélo électrique',
    'Séance 4 : Fonctions d’usage et fonctions techniques',
    'Séance 5 : Identifier les entrées/sorties du système vélo',
    'Séance 6 : QCM n°1 – Analyse externe et usages',
    'Séance 7 : Évolution du vélo à travers le temps',
    'Séance 8 : L’énergie et les matériaux du vélo',
    'Séance 9 : Les impacts environnementaux et sociétaux',
    'Séance 10 : Rappel du premier thème & introduction du second thème',
    'Séance 11 : Séance libre avant vacances',
    'Séance 12 : Structure interne d’un robot aspirateur',
    'Séance 13 : Les chaînes d’énergie du robot aspirateur',
    'Séance 14 : Les chaînes d’information : capteurs et actionneurs',
    'Séance 15 : QCM n°2 – Chaînes d’énergie et d’information',
    'Séance 16 : Identifier un dysfonctionnement',
    'Séance 17 : Comment se déplace le robot ?',
    'Séance 18 : L’énergie électrique du robot : stockage et recharge',
    'Séance 19 : Introduction à la programmation du robot',
    'Séance 20 : QCM n°3 – Structure et comportement',
    'Séance 21 : Séance libre avant vacances',
    'Séance 22 : Présentation du projet : mini-serre connectée',
    'Séance 23 : Identifier les besoins et contraintes de la serre',
    'Séance 24 : Croquis et idées de conception',
    'Séance 25 : QCM - Mini Serre',
    'Séance 26 : Découverte du logiciel de modélisation 3D',
    'Séance 27 : Modéliser les pièces de la mini-serre',
    'Séance 28 : Contraintes dimensionnelles et assemblage',
    'Séance 29 : Séance libre avant les vacances',
    'Séance 30 : Modélisation de la base de la serre',
    'Séance 31 : Modélisation des murs et des fenêtres de la serre',
    'Séance 32 : Modélisation des rainures d’assemblage de la serre',
    'Séance 33 : Premier assemblage (virtuel) des pièces et modifications',
    'Séance 34 : Ajout de la carte micro:bit - 1/2',
    'Séance 35 : Ajout de la carte micro:bit - 2/2',
    'Séance 36 : Modélisation du toit de la serre',
    'Séance 37 : Assemblage du toit de la serre',
    'Séance 38 : Séance libre avant les vacances',

    // 'Séance 31 : Modélisation du toit de la serre',
    // 'Séance 32 : Introduction à la programmation de la serre',

    // 'Séance 31 : Capteurs d’humidité et de température',
    // 'Séance 32 : Actionneurs : ventilation et arrosage',
    // 'Séance 33 : QCM n°5 – Capteurs et actionneurs',
    // 'Séance 34 : Variables, conditions et boucles',
    // 'Séance 35 : Tester le programme de la serre',
    // 'Séance 36 : QCM n°6 – Programmation de la serre',
    // 'Séance 37 : Assemblage complet de la mini-serre',
    // 'Séance 38 : Séance libre avant vacances',
    // 'Séance 39 : Validation et essais de la mini-serre',
    // 'Séance 40 : Analyse des résultats et ajustements',
    // 'Séance 41 : Présentation du projet final (oral)',
    // 'Séance 42 : QCM n°7 – Validation du projet',
    // 'Séance 43 : Découverte des métiers liés à la conception',
    // 'Séance 44 : Découverte d’un fablab et de ses outils',
    // 'Séance 45 : Améliorer la mini-serre : idées d’évolution',
    // 'Séance 46 : QCM n°8 – Synthèse du thème 3',
    // 'Séance 47 : Bilan des apprentissages & portfolio numérique',
    // 'Séance 48 : Préparation de l’exposition des projets',
    // 'Séance 49 : Exposition des travaux',
    // 'Séance 50 : QCM n°9 – Synthèse annuelle',
    // 'Séance 51 : Projets libres',
    // 'Séance 52 : Séance libre avant vacances'
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

        if (!firstLine) {
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
