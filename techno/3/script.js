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
    'Séance 1 : Introduction : le téléphone, un objet technique du quotidien',
    'Séance 2 : Identifier les besoins et fonctions d’usage d’un téléphone',
    'Séance 3 : Les grandes étapes de l’évolution du téléphone',
    'Séance 4 : Du combiné au smartphone : transformations techniques',
    'Séance 5 : Comparer les solutions techniques d’hier et d’aujourd’hui',
    'Séance 6 : Étude de l’énergie et de l’information dans le smartphone',
    'Séance 7 : Impact sociétal et environnemental du smartphone',
    'Séance 8 : QCM n°1 – Les objets et systèmes techniques : évolution du téléphone',
    'Séance 9 : PIX 1',
    'Séance 10 : Séance libre avant vacances',
    // Vacances d'automne
    'Séance 11 : Classe absente',
    'Séance 12 : Classe absente',
    'Séance 13 : Classe absente',
    'Séance 14 : Identifier les fonctions principales d’un véhicule autonome',
    'Séance 15 : Repérer les sous-systèmes',
    'Séance 16 : Étudier l’alimentation et la propulsion',
    'Séance 17 : Comprendre la collecte et le traitement des données',
    'Séance 18 : Étudier le comportement du système',
    'Séance 19 : Tracer les trajectoires, interpréter les signaux',
    'Séance 20 : Identifier et justifier une panne simulée (à finir)',
    'Séance 21 : Ajuster les paramètres de fonctionnement',
    // Vacances de Noël
    'Séance 22 : Introduction : concevoir un support de smartphone',
    'Séance 23 : DNB Blanc',
    'Séance 24 : DNB Blanc',
    'Séance 25 : Identifier les besoins et contraintes du support',
    'Séance 26 : Sortie pédagogique',
    'Séance 27 : Sortie pédagogique',
    'Séance 28 : Correction DNB Blanc + Séance libre avant les vacances',
    // Vacances d'hiver
    'Séance 29 : PIX 2',
    'Séance 30 : Rédiger un cahier des charges simple',
    'Séance 31 : Découverte de la modélisation 3D (Tinkercad)',
    'Séance 32 : Créer les premières formes de son support',
    'Séance 33 : Modélisation support téléphone - suite',
    'Séance 34 : Finaliser la modélisation 3D du support',
    'Séance 35 : Classe absente - Lycée agricole de Saint-Chely',
    'Séance 36 : Classe absente - Lycée agricole de Saint-Chely',
    'Séance 37 : Séance libre avant vacances',
    // Vacances de printemps
    // 'Séance 38 : Aurillac Visite de l’IUT Lycée Monnet Mermoz et Cortat ',
    // 'Séance 39 : Aurillac Visite de l’IUT Lycée Monnet Mermoz et Cortat ',
    // 'Séance 40 : QCM n°3 – Conception et réalisation 3D',
    // 'Séance 41 : PIX 3',
    // 'Séance 42 : Préparer la fabrication : exporter, vérifier les contraintes',
    // 'Séance 43 : Lancer la fabrication (impression 3D, découpe laser)',
    // 'Séance 44 : Ajuster et tester le prototype',
    // 'Séance 45 : Améliorer son prototype : ergonomie, solidité, design',
    // 'Séance 46 : Présenter son support de smartphone (compte rendu oral)',
    // 'Séance 47 : PIX 4',
    // 'Séance 48 : Entrainement DNB',
    // 'Séance 49 : Correction entrainement DNB',
    // 'Séance 50 : Entrainement DNB',
    // 'Séance 51 : Correction entrainement DNB',
    // 'Séance 52 : Correction DNB',
    // 'Séance 53 : Séance libre avant grandes vacances'
    // Vacances d'été
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