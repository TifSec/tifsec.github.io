import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

// Progression 2026 : ressources près des activités, volets fermés, liens externes sûrs, sources officielles.
test('ressources : aides proches des activités, sources officielles et volets fermés', () => {
    for (const [classe, id] of [['3e', 'S05'], ['4e', 'S15'], ['5e', 'S08']]) {
        const course = parse(read('_data/cours/techno/' + classe + '/' + id + '.yml'));
        const html = read('_site/cours/techno/' + classe + '/' + id.toLowerCase() + '/index.html');
        const panels = [...html.matchAll(/<details class="cours-ressources"([^>]*)>([\s\S]*?)<\/details>/g)];
        assert.ok(panels.length >= 1);
        assert.ok(panels.every(panel => !/\bopen\b/.test(panel[1])));
        const sources = html.slice(html.indexOf('class="cours-sources'));
        assert.match(sources, /Sources et ressources officielles/);
        assert.match(sources, /education\.gouv\.fr/);
        for (const activity of course.activites.filter(row => row.ressources)) {
            const start = html.indexOf('id="' + activity.id + '"');
            const section = html.slice(start, html.indexOf('</article>', start));
            for (const link of activity.ressources.filter(block => block.type === 'lien')) assert.ok(section.includes(link.url));
            if (section.includes('cours-question')) assert.ok(section.indexOf('cours-ressources') < section.indexOf('cours-question'));
        }
        const external = [...html.matchAll(/<a[^>]*href="https:[^"]*"[^>]*>/g)].map(row => row[0]);
        assert.ok(external.length >= 2);
        assert.ok(external.every(tag => tag.includes('target="_blank"') && tag.includes('rel="noopener noreferrer"')));
    }
});
