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


/* =========================================================
   RÉCUPÉRATION AUTOMATIQUE DU TITRE DES SÉANCES
   ========================================================= */

function getSessionTitle(sessionNumber) {

    const session = document.getElementById(`session${sessionNumber}`);

    if (!session) {
        return `Séance ${sessionNumber} : À définir`;
    }

    /*
       Cherche en priorité un H2.
       Si aucun H2 n'existe, cherche H1 puis H3.
    */
    const title = session.querySelector('h2, h1, h3');

    if (!title) {
        return `Séance ${sessionNumber} : À définir`;
    }

    return title.textContent.trim();
}


/* =========================================================
   OUTILS DATES
   ========================================================= */

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
    return vacations.some(
        vacation =>
            date >= vacation.start &&
            date <= vacation.end
    );
}

function getVacationName(date) {
    const vacation = vacations.find(
        vacation =>
            date >= vacation.start &&
            date <= vacation.end
    );

    return vacation ? vacation.name : '';
}

function formatFrenchDate(date) {
    const [year, month, day] = date.split('-');

    return `${day}/${month}/${year}`;
}

function isToday(date) {
    return dateToString(new Date()) === date;
}


/* =========================================================
   AJOUT D'UN COURS DANS LE CALENDRIER
   ========================================================= */

function addCourseToCalendar(
    row,
    date,
    dateCell,
    descCell,
    time,
    sessionIndex
) {

    dateCell.textContent = formatFrenchDate(date);

    if (isHoliday(date)) {

        descCell.textContent = holidays[date];

        dateCell.classList.add('holiday');
        descCell.classList.add('holiday');

    }

    else if (isSpecialClosure(date)) {

        descCell.textContent = specialClosures[date];

        dateCell.classList.add('holiday');
        descCell.classList.add('holiday');

    }

    else if (isInVacation(date)) {

        descCell.textContent = getVacationName(date);

        row.classList.add('vacation');

    }

    else {

        dateCell.innerHTML =
            `${formatFrenchDate(date)}
             <br>
             <small>${time}</small>`;

        const sessionNumber = sessionIndex + 1;

        /*
           Le titre est maintenant récupéré
           directement depuis le HTML.
        */
        const sessionName =
            getSessionTitle(sessionNumber);

        const link =
            document.createElement('a');

        link.textContent =
            sessionName;

        link.href =
            `#session${sessionNumber}`;

        link.addEventListener(
            'click',
            event => {

                event.preventDefault();

                showSession(
                    `session${sessionNumber}`
                );

            }
        );

        descCell.appendChild(link);

        sessionIndex++;
    }

    if (isToday(date)) {

        dateCell.classList.add('today');
        descCell.classList.add('today');

    }

    return sessionIndex;
}


/* =========================================================
   GÉNÉRATION DU CALENDRIER
   ========================================================= */

function generateCalendar() {

    const calendarBody =
        document.getElementById(
            'calendar-body'
        );

    if (!calendarBody) {
        return;
    }

    /*
       Évite les doublons si le calendrier
       devait être généré plusieurs fois.
    */
    calendarBody.innerHTML = '';

    const startDate =
        new Date(
            2026,
            8,
            3,
            12
        );

    const endDate =
        new Date(
            2027,
            6,
            2,
            12
        );

    let currentThursday =
        new Date(startDate);

    let sessionIndex = 0;

    /*
       La semaine du 31 août 2026
       est une semaine A.
    */
    let weekB = false;


    while (
        currentThursday <= endDate
    ) {

        const row =
            document.createElement('tr');


        /* -------------------------
           JEUDI
           ------------------------- */

        const thursdayDate =
            dateToString(
                currentThursday
            );

        const thursdayCell =
            document.createElement('td');

        const thursdayDescCell =
            document.createElement('td');

        sessionIndex =
            addCourseToCalendar(
                row,
                thursdayDate,
                thursdayCell,
                thursdayDescCell,
                '8h25 à 9h20',
                sessionIndex
            );

        row.appendChild(
            thursdayCell
        );

        row.appendChild(
            thursdayDescCell
        );


        /* -------------------------
           VENDREDI - SEMAINE B
           ------------------------- */

        if (weekB) {

            const currentFriday =
                new Date(
                    currentThursday
                );

            currentFriday.setDate(
                currentFriday.getDate() + 1
            );

            const fridayDate =
                dateToString(
                    currentFriday
                );

            const fridayCell =
                document.createElement('td');

            const fridayDescCell =
                document.createElement('td');

            sessionIndex =
                addCourseToCalendar(
                    row,
                    fridayDate,
                    fridayCell,
                    fridayDescCell,
                    '14h40 à 15h35',
                    sessionIndex
                );

            row.appendChild(
                fridayCell
            );

            row.appendChild(
                fridayDescCell
            );

        }

        else {

            row.appendChild(
                document.createElement('td')
            );

            row.appendChild(
                document.createElement('td')
            );

        }


        calendarBody.appendChild(
            row
        );


        /* semaine suivante */

        currentThursday.setDate(
            currentThursday.getDate() + 7
        );

        weekB = !weekB;
    }
}


/* =========================================================
   NAVIGATION
   ========================================================= */

function toggleMenu() {

    const menu =
        document.getElementById('session-nav');

    if (!menu) return;

    menu.classList.toggle('open');
}


function showSession(sessionId) {

    const sections =
        document.querySelectorAll(
            '.content-section'
        );

    sections.forEach(section => {
        section.classList.remove('active');
    });


    const target =
        document.getElementById(sessionId);

    if (target) {

        target.classList.add('active');

        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });

    }


    /* fermeture automatique du menu */

    const menu =
        document.getElementById(
            'session-nav'
        );

    if (menu) {
        menu.classList.remove('open');
    }


    /* mise à jour éventuelle des liens du menu */

    document
        .querySelectorAll(
            '#session-nav a'
        )
        .forEach(link => {

            link.classList.remove(
                'active'
            );

        });
}


/* =========================================================
   DÉMARRAGE
   ========================================================= */

document.addEventListener(
    'DOMContentLoaded',
    () => {

        /*
           On génère le calendrier seulement
           lorsque toutes les séances HTML
           sont disponibles.
        */
        generateCalendar();

        showSession('calendar');

    }
);