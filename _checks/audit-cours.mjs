// Lecture seule des archives : inventaire structurel, sans exporter de corrigé.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const root = resolve(import.meta.dirname, '../_archives/ancien-site');
const pages = ['mfr/maths/bacpro2/index.html', 'mfr/maths/4e-3e/index.html', 'techno/5/index.html', 'techno/4/index.html', 'techno/3/index.html'];
const clean = text => text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const report = pages.map(path => {
    const source = readFileSync(resolve(root, path), 'utf8');
    const html = source.replace(/<!--[\s\S]*?-->/g, '');
    const starts = [...html.matchAll(/<section\b[^>]*\bid=["']session(\d+)["'][^>]*>/gi)];
    return {
        source: path, sessions: starts.length,
        professor_comment_blocks: [...source.matchAll(/<!--\s*PROF\b[\s\S]*?-->/gi)].length,
        exposed_expected_answer_attributes: [...html.matchAll(/\bdata-answer\s*=/gi)].length,
        sample: starts.slice(0, 5).map((match, index) => {
            const end = starts[index + 1]?.index || html.length;
            const section = html.slice(match.index, end);
            return {
                id: 'session' + match[1],
                title: clean(section.match(/<h[12]\b[^>]*>([\s\S]*?)<\/h[12]>/i)?.[1] || ''),
                answer_fields: [...section.matchAll(/<(?:input|textarea|select)\b/gi)].length,
                second_level_headings: [...section.matchAll(/<h2\b[^>]*>/gi)].length
            };
        })
    };
});
console.log(JSON.stringify(report, null, 2));
if (process.argv.includes('--write')) writeFileSync(resolve(import.meta.dirname, '../_documentation/inventaire-contenus.json'), JSON.stringify(report, null, 4) + '\n');
