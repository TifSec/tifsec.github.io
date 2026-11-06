import { openCoursePaperTab } from './course-paper-tab.js?v=20261022-paper-tab-1';

const toggle = document.getElementById('course-paper-toggle');
const paper = document.getElementById('course-paper-version');

if (toggle && paper) toggle.addEventListener('click', () => {
    if (!openCoursePaperTab(paper)) {
        document.getElementById('course-save-status').textContent = 'Le nouvel onglet a été bloqué. Autorise les fenêtres surgissantes pour ouvrir la fiche.';
    }
});
