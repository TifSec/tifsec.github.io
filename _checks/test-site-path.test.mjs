import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SourceTextModule } from 'node:vm';
import { auditPublication } from './check-publication.mjs';

test('adresse de test : liens de connexion conservés sous le bon préfixe', async () => {
    const source = readFileSync(new URL('../assets/js/auth/site-path.js', import.meta.url), 'utf8');
    for (const prefix of ['', '/tifsec-test-eleves']) {
        const module = new SourceTextModule(source, { initializeImportMeta(meta) { meta.url = `https://tifsec.github.io${prefix}/assets/js/auth/site-path.js`; } });
        await module.link(() => { throw new Error('unexpected_import'); }); await module.evaluate();
        assert.equal(module.namespace.sitePath('/eleve/'), prefix + '/eleve/');
        assert.equal(module.namespace.sitePath('/connexion/'), prefix + '/connexion/');
        assert.throws(() => module.namespace.sitePath('//example.com'));
    }
});

test('publication de test : détecter un lien qui renverrait vers l’ancien site', () => {
    const files = new Map([['index.html', '<a href="/tifsec-test-eleves/eleve/">Mon espace</a>'], ['eleve/index.html', '<a href="/connexion/">Connexion</a>']]);
    assert.deepEqual(auditPublication(files, { basePath: '/tifsec-test-eleves' }).map(issue => issue.rule), ['outside_base_path']);
    files.set('eleve/index.html', '<a href="/tifsec-test-eleves/">Accueil</a>');
    assert.equal(auditPublication(files, { basePath: '/tifsec-test-eleves' }).length, 0);
});
