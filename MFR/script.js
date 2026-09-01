function generateSessionList() {
    const sessionList = document.getElementById('session-list');
    const sessions = document.querySelectorAll('.content-section[id^="session"]');

    sessionList.innerHTML = '';

    sessions.forEach(session => {
        const title = session.querySelector('h2');

        if (title) {
            const link = document.createElement('a');

            link.href = '#';
            link.textContent = title.textContent;

            link.addEventListener('click', function(event) {
                event.preventDefault();
                showSession(session.id);

                // Ferme automatiquement le menu après sélection
                document.getElementById('session-menu').classList.remove('open');
            });

            sessionList.appendChild(link);
        }
    });
}

function showSession(sessionId) {
    const sections = document.querySelectorAll('.content-section');

    sections.forEach(section => {
        section.classList.remove('active');
    });

    const selectedSession = document.getElementById(sessionId);

    if (selectedSession) {
        selectedSession.classList.add('active');

        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
}

function toggleSessionMenu() {
    const menu = document.getElementById('session-menu');
    menu.classList.toggle('open');
}

document.addEventListener('DOMContentLoaded', () => {
    generateSessionList();
    showSession('home');
});