import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const activities = read('_includes/cours/cours-activites.html');
const progress = read('assets/js/cours/course-progress.js');
const styles = read('assets/css/cours/course-quest-ui.css');
const harmony = read('assets/css/eleve/theme-harmonization.css');

test('les séances deviennent un parcours avec navigation entre les missions', () => {
    assert.match(activities, /course-mission-controls/);
    assert.match(activities, /next_activite\.id/);
    assert.match(activities, /href="#course-summary"/);
    assert.match(progress, /aria-current', 'step'/);
    assert.match(progress, /IntersectionObserver/);
    assert.match(harmony, /course-navigation[^\{]*\{\s*color:\s*#ffffff/i);
    assert.match(harmony, /body\.student-course-shell #course-work \.course-mission-controls \.course-mission-next[^\{]*\{\s*color:\s*#ffffff/i);
    assert.match(harmony, /course-mission-next:hover[^\{]*\{[^}]*color:\s*#ffffff/i);
});

test('la fin d’une mission donne un retour visuel avec respect du mouvement réduit', () => {
    assert.match(styles, /data-mission-state="complete"/);
    assert.match(styles, /course-mission-complete/);
    assert.match(styles, /prefers-reduced-motion: reduce/);
});
