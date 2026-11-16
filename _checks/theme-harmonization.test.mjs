import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../assets/css/eleve/theme-harmonization.css', import.meta.url), 'utf8');
const themes = ['ocean', 'forest', 'plum', 'terracotta', 'ruby', 'slate', 'midnight', 'rose', 'neon', 'cyberpunk', 'minecraft', 'farming'];

function declarations(block) {
    return Object.fromEntries([...block.matchAll(/(--[\w-]+)\s*:\s*(#[\da-f]{3,8})\s*;/gi)].map(([, key, value]) => [key, value]));
}

function palette(theme) {
    const base = css.match(/:root\[data-student-theme\]\s*\{([^}]+)\}/)?.[1] ?? '';
    const block = theme === 'ocean' ? '' : css.match(new RegExp(`:root\\[data-student-theme="${theme}"\\]\\s*\\{([^}]+)\\}`))?.[1] ?? '';
    return { ...declarations(base), ...declarations(block) };
}

function luminance(color) {
    const value = color.replace('#', '');
    const parts = value.length === 3 ? [...value].map(c => c + c) : [value.slice(0, 2), value.slice(2, 4), value.slice(4, 6)];
    const channels = parts.map(part => parseInt(part, 16) / 255).map(channel => channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4);
    return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
}

function contrast(a, b) {
    const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (light + .05) / (dark + .05);
}

test('les 12 thèmes définissent une palette complète et des combinaisons lisibles', () => {
    for (const theme of themes) {
        const values = palette(theme);
        for (const token of ['--student-bg', '--student-surface', '--student-soft', '--student-text', '--student-muted', '--student-border', '--student-hero', '--student-banner', '--student-heading', '--student-link', '--student-link-hover', '--student-accent', '--student-ink', '--student-button-hover', '--student-focus']) {
            assert.ok(values[token], `${theme}: variable ${token} absente`);
        }
        assert.ok(contrast(values['--student-text'], values['--student-surface']) >= 4.5, `${theme}: texte de surface insuffisant`);
        assert.ok(contrast(values['--student-muted'], values['--student-surface']) >= 4.5, `${theme}: texte secondaire de surface insuffisant`);
        assert.ok(contrast(values['--student-link'], values['--student-surface']) >= 4.5, `${theme}: lien de surface insuffisant`);
        assert.ok(contrast(values['--student-link-hover'], values['--student-surface']) >= 4.5, `${theme}: lien au survol insuffisant`);
        assert.ok(contrast('#ffffff', values['--student-hero']) >= 4.5, `${theme}: texte de bouton insuffisant`);
        assert.ok(contrast('#ffffff', values['--student-button-hover']) >= 4.5, `${theme}: texte de bouton au survol insuffisant`);
    }
});

test('la navigation du cours garde des liens blancs sur son panneau sombre', () => {
    assert.match(css, /body\.student-course-shell\s+#course-work\s+\.course-navigation[^\{]*\{\s*color:\s*#ffffff/i);
    assert.match(css, /course-step-list\s+a:focus-visible[^\{]*\{[^}]*color:\s*#ffffff/i);
});
