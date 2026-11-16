import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseDocument } from 'yaml';
import { siteCatalogue, validateCatalogue, privatePath, CATALOGUE_PATH } from '../_supabase/functions/_shared/site-catalogue.mjs';
import { createPrivateCourseHandler } from '../_supabase/functions/teacher-course/handler.mjs';
import { deploymentEnvironment } from '../_supabase/functions/teacher-course/deployment-config.mjs';

const published = JSON.parse(readFileSync(new URL('../assets/data/questions-seances.json', import.meta.url), 'utf8'));
const row = { etablissement: 'college', matiere: 'techno', classe: '3e', seance: 'S02', version: 'v1', questions: [] };

test('le fichier publié est valide : une seule version par séance, identifiants sûrs', () => {
    assert.equal(validateCatalogue(published), published);
    assert.ok(published.some(lesson => lesson.seance === 'S02V2' && lesson.version === 'v2'));
});

test('chemin privé déduit de la séance, aucun chemin détourné possible', () => {
    assert.equal(privatePath(row), 'techno/3e/S02.v1.yml');
    for (const seance of ['../x', 'S02/..', 'a b', '']) assert.throws(() => privatePath({ ...row, seance }), { status: 404 });
});

test('lecture sur le site configuré, mise en cache, adresse par défaut tifsec.github.io', async () => {
    assert.equal(deploymentEnvironment(() => undefined)('COURSES_SITE_URL'), 'https://tifsec.github.io');
    const urls = []; let clock = 0;
    const load = siteCatalogue({ env: () => 'https://tifsec.github.io/tifsec-test-eleves/', now: () => clock,
        async fetch(url, options) { urls.push(url); assert.equal(options.redirect, 'error'); return Response.json([row]); } });
    assert.deepEqual(await load(), [row]);
    clock = 1000; await load();
    assert.deepEqual(urls, ['https://tifsec.github.io/tifsec-test-eleves' + CATALOGUE_PATH]);
    clock = 400000; await load();
    assert.equal(urls.length, 2);
});

test('fichier absent, invalide, en double ou adresse non https : refus sans détail', async () => {
    const cases = [
        ['https://example.org/a', () => new Response('nope', { status: 404 })],
        ['https://example.org/b', () => new Response('{pas du json')],
        ['https://example.org/c', () => Response.json([row, row])],
        ['https://example.org/d', () => Response.json([{ ...row, matiere: '../x' }])],
        ['http://example.org', () => Response.json([row])]
    ];
    for (const [base, reply] of cases) await assert.rejects(siteCatalogue({ env: () => base, fetch: async () => reply() })(), { status: 503 });
});

test('séance sans fichier privé : réponse 404 « course_unavailable »', async () => {
    const id = '00000000-0000-0000-0000-000000000003';
    const envs = { SUPABASE_URL: 'https://example.supabase.co', SUPABASE_ANON_KEY: 'public-example', COURSES_ALLOWED_ORIGINS: 'http://127.0.0.1:4000',
        COURSES_GITHUB_TOKEN: 'private-example-token', COURSES_GITHUB_OWNER: 'Example', COURSES_GITHUB_REPO: 'private-courses', COURSES_GITHUB_REF: 'main',
        COURSES_SITE_URL: 'https://example.org/site' };
    const handler = createPrivateCourseHandler({ env: name => envs[name], parseDocument, async fetch(url) {
        url = String(url);
        if (url.endsWith(CATALOGUE_PATH)) return Response.json([row]);
        if (url.includes('/auth/v1/user')) return Response.json({ id, is_anonymous: false });
        if (url.includes('/rest/v1/profiles')) return Response.json([{ role: 'teacher' }]);
        if (url.includes('/rest/v1/teacher_class_assignments')) return Response.json([{ teacher_id: id }]);
        if (url.includes('/contents/')) return new Response('Not Found', { status: 404 });
        return Response.json({ private: true });
    } });
    const { questions, ...lesson } = row;
    const response = await handler(new Request('https://example.supabase.co/functions/v1/teacher-course', { method: 'POST',
        headers: { origin: 'http://127.0.0.1:4000', authorization: 'Bearer fake.jwt.example' }, body: JSON.stringify(lesson) }));
    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), { error: 'course_unavailable' });
});
