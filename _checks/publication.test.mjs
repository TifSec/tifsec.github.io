import test from 'node:test';
import assert from 'node:assert/strict';
import { auditPublication, readPublication } from './check-publication.mjs';
import { fileURLToPath } from 'node:url';

test('liens relatifs, pages, fragments et imports dans un site valide', () => {
    const files = new Map([
        ['index.html', '<a href="/cours/#a01">Cours</a><link href="assets/site.css"><script src="assets/site.js"></script>'],
        ['cours/index.html', '<h1 id="a01">Cours</h1><a href="../">Accueil</a>'],
        ['assets/site.css', 'body { background-image:url(../logo.png); }'],
        ['assets/site.js', "import { init } from './init.js';"], ['assets/init.js', 'export const init = 1;'], ['logo.png', Buffer.from([0])]
    ]);
    assert.deepEqual(auditPublication(files), []);
    files.set('assets/init.js', "import './missing.js';");
    assert.ok(auditPublication(files).some(row => row.rule === 'missing_resource'));
});

test('les fichiers de travail, préparations et sauvegardes serveur restent exclus', () => {
    for (const file of ['refonte.code-workspace', '_archives/ancien.html', '_supabase/config.sql', 'preparation-privee/cours.yml', '.env', 'private.pem']) {
        assert.ok(auditPublication(new Map([[file, '']])).some(row => row.rule === 'non_public_file'), file);
    }
});

test('secrets détectés sans recopier leur valeur dans le rapport', () => {
    const secret = 'sb_secret_' + 'a'.repeat(32);
    const jwt = role => Buffer.from('{"alg":"HS256"}').toString('base64url') + '.' + Buffer.from(JSON.stringify({ role })).toString('base64url') + '.signature';
    const source = secret + '\n' + jwt('service_role');
    const issues = auditPublication(new Map([['assets/config.js', source]]));
    assert.ok(issues.some(row => row.rule === 'secret_pattern'));
    assert.ok(issues.some(row => row.rule === 'privileged_jwt'));
    assert.ok(!JSON.stringify(issues).includes(secret));
    assert.deepEqual(auditPublication(new Map([['assets/config.js', 'sb_publishable_example ' + jwt('anon')]])), []);
});

test('les erreurs de publication sont distinguées', () => {
    const issues = auditPublication(new Map([['index.html', '<p id="x"></p><p id="x"></p><a href="#absent">A</a><a href="http://127.0.0.1:4000/">B</a>{{ liquid }}']]));
    for (const rule of ['duplicate_id', 'missing_fragment', 'local_url', 'unresolved_liquid']) assert.ok(issues.some(row => row.rule === rule), rule);
});

test('le site effectivement généré passe les contrôles de publication', () => {
    assert.deepEqual(auditPublication(readPublication(fileURLToPath(new URL('../_site/', import.meta.url)))), []);
});
