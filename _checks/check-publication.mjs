import { readdirSync, readFileSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const textExtensions = /\.(html|css|js|mjs|json|txt|xml|svg|ya?ml)$/i;
const reserved = /(?:^|\/)(?:_archives|_documentation|_checks|_supabase|node_modules|preparation-privee|\.git|\.env(?:\.[^/]*)?)(?:\/|$)|\.code-workspace$|\.(?:sql|pem|key)$/i;
const origin = 'https://publication.invalid';

// Rapporter les noms de fichiers et catégories seulement, jamais la valeur d'un secret.
export function auditPublication(files, { basePath = '' } = {}) {
    if (basePath && !/^\/[a-zA-Z0-9_-]+$/.test(basePath)) throw new Error('invalid_base_path');
    const issues = [];
    const add = (file, rule, target) => issues.push({ file, rule, ...(target ? { target } : {}) });
    const getText = file => {
        const value = files.get(file);
        return typeof value === 'string' ? value : value?.toString('utf8');
    };
    const resolveTarget = (file, value, fragment = false) => {
        if (!value || /^(?:data:|mailto:|tel:)/i.test(value)) return;
        let url;
        try { url = new URL(value.replaceAll('&amp;', '&'), origin + basePath + '/' + file); }
        catch { add(file, 'invalid_url'); return; }
        if (['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) { add(file, 'local_url'); return; }
        if (url.origin !== origin) return;
        let path;
        try {
            const pathname = decodeURIComponent(url.pathname);
            if (basePath && !pathname.startsWith(basePath + '/')) { add(file, 'outside_base_path', pathname); return; }
            path = pathname.slice(basePath.length).replace(/^\//, '');
        }
        catch { add(file, 'invalid_url'); return; }
        const target = [path, !path ? 'index.html' : path.endsWith('/') ? path + 'index.html' : path + '/index.html'].find(path => files.has(path));
        if (!target) { add(file, 'missing_resource', path); return; }
        if (fragment && url.hash && target.endsWith('.html')) {
            let id;
            try { id = decodeURIComponent(url.hash.slice(1)); } catch { add(file, 'invalid_fragment'); return; }
            if (!getText(target).includes('id="' + id + '"') && !getText(target).includes("id='" + id + "'")) add(file, 'missing_fragment', target + '#' + id);
        }
    };
    for (const [file] of files) {
        if (reserved.test(file) || file.startsWith('vendor/')) add(file, 'non_public_file');
        if (!textExtensions.test(file)) continue;
        const source = getText(file);
        if (/\bsb_secret_[A-Za-z0-9_-]{12,}|\bgh[pousr]_[A-Za-z0-9]{20,}|\bgithub_pat_[A-Za-z0-9_]{30,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(source)) add(file, 'secret_pattern');
        for (const match of source.matchAll(/\beyJ[A-Za-z0-9_-]+\.([A-Za-z0-9_-]+)\.[A-Za-z0-9_-]+/g)) {
            try { if (JSON.parse(Buffer.from(match[1], 'base64url')).role === 'service_role') add(file, 'privileged_jwt'); } catch { /* Pas un JWT décodable. */ }
        }
        if (file.endsWith('.html')) {
            if (source.includes('{%') || source.includes('{{')) add(file, 'unresolved_liquid');
            const ids = new Set();
            for (const match of source.matchAll(/\bid=["']([^"']+)["']/g)) {
                if (ids.has(match[1])) add(file, 'duplicate_id', match[1]);
                ids.add(match[1]);
            }
            for (const match of source.matchAll(/\b(?:src|href)=["']([^"']+)["']/g)) resolveTarget(file, match[1], true);
        }
        if (file.endsWith('.css')) for (const match of source.matchAll(/url\(\s*["']?([^\s'"()]+)["']?\s*\)/g)) resolveTarget(file, match[1]);
        if (/\.(?:js|mjs)$/.test(file)) for (const match of source.matchAll(/\b(?:from\s*|import\s*)["'](\.[^"']+)["']/g)) resolveTarget(file, match[1]);
    }
    return issues;
}

export function readPublication(directory) {
    const files = new Map();
    function walk(folder) {
        for (const entry of readdirSync(folder, { withFileTypes: true })) {
            const path = resolve(folder, entry.name);
            if (entry.isDirectory()) walk(path);
            else files.set(relative(directory, path).replaceAll('\\', '/'), readFileSync(path));
        }
    }
    walk(directory);
    return files;
}

if (resolve(process.argv[1] || '') === fileURLToPath(import.meta.url)) {
    const directory = process.argv[2] ? resolve(process.argv[2]) : fileURLToPath(new URL('../_site/', import.meta.url));
    const files = readPublication(directory), issues = auditPublication(files, { basePath: process.argv[3] || '' });
    if (issues.length) {
        for (const issue of issues) console.error(issue.file + ' : ' + issue.rule + (issue.target ? ' → ' + issue.target : ''));
        process.exitCode = 1;
    } else console.log('OK : ' + files.size + ' fichiers générés contrôlés ; liens locaux, fragments, imports et exclusions cohérents, aucun motif de secret détecté.');
}
