import test from 'node:test';
import assert from 'node:assert/strict';
import { parseDocument } from 'yaml';
import { createPrivateCourseHandler } from '../_supabase/functions/teacher-course/handler.mjs';
import { readPrivateYaml } from '../_supabase/functions/teacher-course/yaml-reader.mjs';
import { deploymentEnvironment } from '../_supabase/functions/teacher-course/deployment-config.mjs';

const id = '00000000-0000-0000-0000-000000000003';
const lesson = { etablissement: 'college', matiere: 'techno', classe: '3e', seance: 'S02', version: 'v1' };
const yaml = 'seance: S02\nversion_cours: v1\npreparation:\n    duree: Exemple fictif\ncorrection: []\n';
test('configuration du dépôt privé prête, aucun jeton par défaut et surcharge explicite possible', () => {
    const defaults = deploymentEnvironment(() => undefined);
    assert.equal(defaults('COURSES_GITHUB_OWNER'), 'TifSec');
    assert.equal(defaults('COURSES_GITHUB_REPO'), 'tifsec-corriges-prives');
    assert.equal(defaults('COURSES_GITHUB_TOKEN'), undefined);
    assert.equal(deploymentEnvironment(name => name === 'COURSES_GITHUB_REF' ? 'revision' : undefined)('COURSES_GITHUB_REF'), 'revision');
});
function harness({ role = 'teacher', assignments = [{ teacher_id: id }], privateRepo = true, authStatus = 200, body = yaml, overrides = {}, fail } = {}) {
    const envs = { SUPABASE_URL: 'https://example.supabase.co', SUPABASE_ANON_KEY: 'public-example', COURSES_ALLOWED_ORIGINS: 'http://127.0.0.1:4000,https://tifsec.github.io',
        COURSES_GITHUB_TOKEN: 'private-example-token', COURSES_GITHUB_OWNER: 'Example', COURSES_GITHUB_REPO: 'private-courses', COURSES_GITHUB_REF: 'main', ...overrides };
    const calls = [];
    const handler = createPrivateCourseHandler({ env: name => envs[name], parseDocument, catalogue: [lesson], async fetch(url, options) {
        calls.push({ url: String(url), options });
        assert.equal(options.redirect, 'error');
        assert.equal(options.cache, 'no-store');
        if (fail) throw new Error('secret remote details ' + envs.COURSES_GITHUB_TOKEN);
        if (url.includes('/auth/v1/user')) return Response.json({ id, is_anonymous: false }, { status: authStatus });
        if (url.includes('/rest/v1/profiles')) return Response.json([{ role }]);
        if (url.includes('/rest/v1/teacher_class_assignments')) return Response.json(assignments);
        if (url.includes('/contents/')) return new Response(body);
        return Response.json({ private: privateRepo });
    } });
    const request = (data = lesson, headers = {}, method = 'POST') => handler(new Request('https://example.supabase.co/functions/v1/teacher-course', {
        method, headers: { origin: 'http://127.0.0.1:4000', authorization: 'Bearer fake.jwt.example', 'content-type': 'application/json', ...headers },
        ...(method === 'POST' ? { body: JSON.stringify(data) } : {})
    }));
    return { calls, request };
}
test('professeur affecté : fichier autorisé seulement, clé GitHub jamais envoyée à Supabase', async () => {
    const h = harness();
    const response = await h.request();
    assert.equal(response.status, 200);
    assert.equal((await response.json()).content.seance, 'S02');
    assert.match(response.headers.get('cache-control'), /no-store/);
    assert.equal(response.headers.get('access-control-allow-origin'), 'http://127.0.0.1:4000');
    assert.equal(h.calls.length, 5);
    assert.match(h.calls[4].url, /contents\/techno\/3e\/S02.v1.yml\?ref=main$/);
    assert.ok(h.calls.slice(0, 3).every(call => call.options.headers.Authorization === 'Bearer fake.jwt.example'));
    assert.ok(h.calls.slice(3).every(call => call.options.headers.Authorization === 'Bearer private-example-token'));
});
test('visiteur ou jeton expiré : aucun accès au dépôt privé', async () => {
    const absent = harness();
    assert.equal((await absent.request(lesson, { authorization: '' })).status, 401);
    assert.equal(absent.calls.length, 0);
    const expired = harness({ authStatus: 401 });
    assert.equal((await expired.request()).status, 401);
    assert.equal(expired.calls.length, 1);
});
test('élève ou rôle inconnu : aucun appel GitHub, même avec un JWT authentifié', async () => {
    for (const role of ['student', 'admin', null]) {
        const h = harness({ role });
        assert.equal((await h.request()).status, 403);
        assert.equal(h.calls.length, 2);
    }
});
test('professeur sans affectation ou affectation incorrecte : aucun appel GitHub', async () => {
    for (const assignments of [[], [{ teacher_id: 'another-user' }]]) {
        const h = harness({ assignments });
        assert.equal((await h.request()).status, 403);
        assert.equal(h.calls.length, 3);
    }
});
test('chemin arbitraire, URL externe, version et séance inconnues refusés', async () => {
    for (const input of [{ ...lesson, path: '../private.yml' }, { ...lesson, url: 'https://evil.test' }, { ...lesson, version: 'v99' }, { ...lesson, seance: '../S02' }]) {
        const h = harness();
        assert.ok([400, 404].includes((await h.request(input)).status));
        assert.equal(h.calls.length, 0);
    }
});
test('origine non autorisée et méthodes interdites : refus sans requête distante', async () => {
    const h = harness();
    const denied = await h.request(lesson, { origin: 'https://evil.test' });
    assert.equal(denied.status, 403);
    assert.equal(denied.headers.get('access-control-allow-origin'), null);
    assert.equal((await h.request(lesson, {}, 'GET')).status, 405);
    assert.equal((await h.request(lesson, {}, 'OPTIONS')).status, 204);
    assert.equal(h.calls.length, 0);
});
test('secret absent ou dépôt devenu public : aucun téléchargement de fichier', async () => {
    const missing = harness({ overrides: { COURSES_GITHUB_TOKEN: '' } });
    assert.equal((await missing.request()).status, 503);
    assert.equal(missing.calls.length, 3);
    const publicRepo = harness({ privateRepo: false });
    assert.equal((await publicRepo.request()).status, 503);
    assert.equal(publicRepo.calls.length, 4);
});
test('panne distante : aucune donnée privée ni détail de secret dans la réponse', async () => {
    const h = harness({ fail: true });
    const response = await h.request();
    assert.equal(response.status, 503);
    assert.equal(await response.text(), '{"error":"unavailable"}');
});
test('YAML invalide, version discordante et fichier trop gros restent inaccessibles', async () => {
    for (const body of ['[invalid', yaml.replace('v1', 'v2'), 'x'.repeat(262145)]) {
        const response = await harness({ body }).request();
        assert.ok(response.status >= 400);
        assert.equal((await response.json()).content, undefined);
    }
});
test('YAML : doublons, tags exécutables, alias et clés dangereuses refusés', () => {
    for (const source of [yaml + 'seance: S02\n', yaml + 'x: !!js/function function() {}\n', yaml + 'x: &x [hello]\ny: *x\n', yaml + '__proto__: { polluted: true }\n']) {
        assert.throws(() => readPrivateYaml(source, parseDocument, lesson));
    }
});
test('YAML : profondeur limitée et contenu HTML conservé comme texte inerte', () => {
    assert.throws(() => readPrivateYaml(yaml + 'nested: ' + '['.repeat(20) + '0' + ']'.repeat(20), parseDocument, lesson));
    assert.equal(readPrivateYaml(yaml + 'texte: "<script>alert(1)</script>"', parseDocument, lesson).texte, '<script>alert(1)</script>');
});
