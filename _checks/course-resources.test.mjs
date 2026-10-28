import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('ressources : aides proches des trois activités, attendus officiels et volets fermés', () => {
    for (const id of ['S11', 'S12']) {
        const course = parse(read('_data/cours/techno/3e/' + id + '.yml'));
        const html = read('_site/cours/techno/3e/' + id.toLowerCase() + '/index.html');
        const panels = [...html.matchAll(/<details class="cours-ressources"([^>]*)>([\s\S]*?)<\/details>/g)];
        assert.equal(panels.length, 4);
        assert.ok(panels.every(panel => !/\bopen\b/.test(panel[1])));
        assert.match(panels[0][2], /Les attendus officiels/);
        assert.match(panels[0][2], /education\.gouv\.fr/);
        for (let i = 0; i < 3; i++) {
            const activity = course.activites[i];
            assert.ok(activity.ressources.some(block => block.type === 'paragraphe'));
            const links = activity.ressources.filter(block => block.type === 'lien');
            assert.ok(links.length >= 1 && links.length <= 2);
            assert.ok(links.every(link => link.url.startsWith('https://')));
            const start = html.indexOf('id="' + activity.id + '"');
            const end = html.indexOf('</article>', start);
            const section = html.slice(start, end);
            for (const link of links) assert.ok(section.includes(link.url));
            assert.ok(section.indexOf('cours-ressources') < section.indexOf('cours-question'));
        }
        const external = [...html.matchAll(/<a[^>]*href="https:[^"]*"[^>]*>/g)].map(row => row[0]);
        assert.ok(external.length >= 5);
        assert.ok(external.every(tag => tag.includes('target="_blank"') && tag.includes('rel="noopener noreferrer"')));
    }
});
