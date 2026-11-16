// Configuration publique du raccordement, sans jeton ni corrigé.
const defaults = Object.freeze({
    COURSES_GITHUB_OWNER: 'TifSec',
    COURSES_GITHUB_REPO: 'tifsec-corriges-prives',
    COURSES_GITHUB_REF: 'main',
    COURSES_SITE_URL: 'https://tifsec.github.io',
    COURSES_ALLOWED_ORIGINS: 'http://127.0.0.1:4000,http://localhost:4000,https://tifsec.github.io'
});

export function deploymentEnvironment(get) {
    return name => get(name) || defaults[name];
}
