import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createContext, SourceTextModule } from "node:vm";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const teacher = { prenom: "Camille", nom: "Prof", role: "teacher", classe: null, etablissement: null };
const student = { prenom: "Alex", nom: "Élève", role: "student", classe: "3e", etablissement: "mfr" };
const deferred = () => {
    let resolve;
    const promise = new Promise(done => { resolve = done; });
    return { promise, resolve };
};
const settle = () => new Promise(done => setTimeout(done, 10));

function element() {
    const listeners = new Map();
    return {
        hidden: true, disabled: false, textContent: "", value: "", dataset: {}, attributes: {}, children: [],
        addEventListener(event, callback) { listeners.set(event, callback); },
        setAttribute(name, value) { this.attributes[name] = value; },
        fire(event, value = {}) { return listeners.get(event)?.({ preventDefault() {}, ...value }); },
        dispatchEvent(event) { return this.fire(event.type); },
        querySelectorAll() { return this.children.filter(item => item.dataset?.school); },
        replaceChildren() { this.children = []; },
        add(option) { this.children.push(option); }
    };
}

function harness({ sdk = true, registration = false } = {}) {
    const controls = {
        user: { id: "user-a" }, profile: teacher, profileError: null, userError: null,
        signInError: null, signOutError: null, signInCalls: [], profileQueries: [],
        userCalls: 0, redirects: [], replaced: [], inCallback: false, signUpCalls: [], inserts: [], insertError: null
    };
    const elements = new Map();
    for (const name of ["message", "login", "login-button", "login-username", "login-password", "auth-session-logout", "classes-data"]) {
        elements.set(name, element());
    }
    if (registration) {
        for (const name of ["create-account", "register-button", "register-heading", "register-description", "register-credentials", "register-prenom", "register-nom", "register-school", "register-classe", "register-role", "register-class-wrapper", "register-username", "register-password", "register-password-confirm"]) {
            elements.set(name, element());
        }
        elements.get("register-role").value = "student";
        elements.get("register-classe").children = ["college", "mfr"].map(school => ({ dataset: { school }, value: "3e", hidden: true }));
    }
    for (const prefix of ["prof", "eleve"]) {
        for (const suffix of ["loading", "access-denied", "content", "access-message", "identity", "retry", "logout", "denied-logout"]) {
            elements.set(prefix + "-" + suffix, element());
        }
    }
    elements.get("classes-data").textContent = JSON.stringify({
        college: { nom: "Collège", classes: [{ id: "3e", nom: "3e collège" }] },
        mfr: { nom: "MFR", classes: [{ id: "3e", nom: "3e MFR" }] }
    });
    const fields = ["etablissement", "classe"].map(name => ({ ...element(), dataset: { profileField: name } }));
    // Balises générées depuis _config.yml : adresse et clé publique de la base.
    const meta = { 'supabase-url': 'https://exemple.supabase.co', 'supabase-publishable-key': 'sb_publishable_exemple' };
    const document = {
        getElementById(id) { return elements.get(id) || null; },
        querySelector(selector) { const name = selector.match(/meta\[name="([^"]+)"\]/)?.[1]; return name in meta ? { content: meta[name] } : null; },
        querySelectorAll() { return fields; }
    };
    const events = new Map();
    const client = {
        auth: {
            async getUser() {
                assert.equal(controls.inCallback, false, "Appel Supabase dans son propre callback");
                controls.userCalls++;
                return controls.getUser ? controls.getUser() : { data: { user: controls.user }, error: controls.userError };
            },
            async signInWithPassword(credentials) {
                controls.signInCalls.push(credentials);
                if (controls.signIn) return controls.signIn(credentials);
                return { data: { user: controls.user }, error: controls.signInError };
            },
            async signUp(credentials) {
                controls.signUpCalls.push(credentials);
                if (controls.signUp) return controls.signUp(credentials);
                controls.user = { id: "created-user", email: credentials.email, user_metadata: credentials.options.data };
                controls.profile = null;
                return { data: { user: controls.user, session: { user: controls.user } }, error: null };
            },
            async signOut(options) {
                controls.signOutOptions = options;
                return { error: controls.signOutError };
            },
            onAuthStateChange(callback) {
                controls.authCallback = callback;
                return { data: { subscription: { unsubscribe() {} } } };
            }
        },
        from(table) {
            const query = { table };
            controls.profileQueries.push(query);
            return {
                select(columns) { query.columns = columns; return this; },
                eq(column, value) { query.filter = [column, value]; return this; },
                async maybeSingle() {
                    return controls.queryProfile ? controls.queryProfile() : { data: controls.profile, error: controls.profileError };
                },
                async insert(payload) {
                    controls.inserts.push(payload);
                    if (controls.insert) return controls.insert(payload);
                    if (!controls.insertError) controls.profile = { ...payload };
                    return { error: controls.insertError };
                }
            };
        }
    };
    const window = {
        supabase: sdk ? { createClient() { return client; } } : undefined,
        location: {
            assign(url) { controls.redirects.push(url); },
            replace(url) { controls.replaced.push(url); }
        },
        addEventListener(event, callback) { events.set(event, callback); }
    };
    const context = createContext({ window, document, setTimeout, clearTimeout,
        Event: class { constructor(type) { this.type = type; } },
        Option: class { constructor(text, value) { this.text = text; this.value = value; } },
        console: { log() {}, warn() {}, error() {} }
    });
    const modules = new Map();
    function moduleAt(path) {
        if (!modules.has(path)) {
            modules.set(path, new SourceTextModule(readFileSync(path, "utf8"), { context, identifier: path }));
        }
        return modules.get(path);
    }
    async function load(name) {
        const module = moduleAt(resolve(root, "assets/js/auth", name));
        if (module.status === "unlinked") {
            await module.link((specifier, parent) => moduleAt(resolve(dirname(parent.identifier), specifier)));
        }
        if (module.status !== "evaluated") await module.evaluate();
        return module.namespace;
    }
    function authEvent(event) {
        controls.inCallback = true;
        try { controls.authCallback(event); } finally { controls.inCallback = false; }
    }
    return { controls, elements, fields, load, authEvent, events };
}

test("profil vérifié et filtré par l’utilisateur authentifié", async () => {
    const h = harness();
    const session = await (await h.load("auth-session.js")).checkSession();
    assert.equal(session.status, "authenticated");
    assert.equal(session.profile.nom, "Prof");
    assert.deepEqual(h.controls.profileQueries[0].filter, ["user_id", "user-a"]);
    assert.match(h.controls.profileQueries[0].columns, /etablissement/);
});

test("absence de session, panne réseau, profil absent et rôle invalide restent distincts", async () => {
    for (const [values, expected] of [
        [{ user: null }, "not_authenticated"],
        [{ userError: { name: "AuthSessionMissingError" } }, "not_authenticated"],
        [{ userError: { name: "AuthRetryableFetchError" } }, "session_error"],
        [{ profile: null }, "profile_missing"],
        [{ profileError: { code: "42501" } }, "profile_error"],
        [{ profile: { ...teacher, role: "admin" } }, "invalid_role"]
    ]) {
        const h = harness();
        Object.assign(h.controls, values);
        assert.equal((await (await h.load("auth-session.js")).checkSession()).status, expected);
    }
});

test("SDK absent : message exploitable sans exception au chargement", async () => {
    const h = harness({ sdk: false });
    assert.equal((await (await h.load("auth-session.js")).checkSession()).status, "service_unavailable");
    await (await h.load("auth-space.js")).initAccountSpace({ prefix: "prof", role: "teacher" });
    assert.equal(h.elements.get("prof-content").hidden, true);
    assert.match(h.elements.get("prof-access-message").textContent, /service/);
});

test("un élève n’obtient pas l’affichage professeur", async () => {
    const h = harness();
    h.controls.profile = student;
    const access = await (await h.load("auth-guard.js")).checkAccess(["teacher"]);
    assert.equal(access.allowed, false);
    assert.equal(access.reason, "unauthorized");
});

test("identifiant et adresse e-mail pris en charge, caractères invalides refusés", async () => {
    const { getLoginEmail } = await harness().load("auth-username.js");
    assert.equal(getLoginEmail(" Jean.Dupont "), "jean.dupont@eleve.example.com");
    assert.equal(getLoginEmail(" Prof@Exemple.fr "), "prof@exemple.fr");
    for (const input of ["", "jean dupont", "élève", "prof@", "x@y z.fr"]) {
        assert.equal(getLoginEmail(input), null);
    }
});

test("soumission de connexion professeur, mot de passe effacé et route correcte", async () => {
    const h = harness();
    (await h.load("auth-login.js")).initLogin();
    h.elements.get("login-username").value = "prof@exemple.fr";
    h.elements.get("login-password").value = "mot-de-passe-fictif";
    await h.elements.get("login").fire("submit");
    assert.equal(h.controls.signInCalls[0].email, "prof@exemple.fr");
    assert.deepEqual(h.controls.redirects, ["/prof/"]);
    assert.equal(h.elements.get("login-password").value, "");
    assert.equal(h.elements.get("login-button").disabled, false);
});

test("connexion élève vers son espace", async () => {
    const h = harness();
    h.controls.profile = student;
    (await h.load("auth-login.js")).initLogin();
    h.elements.get("login-username").value = "alex.eleve";
    h.elements.get("login-password").value = "fictif";
    await h.elements.get("login").fire("submit");
    assert.deepEqual(h.controls.redirects, ["/eleve/"]);
});

test("mauvais mot de passe et panne du service n’ouvrent aucun espace", async () => {
    for (const [error, message] of [[{ status: 400 }, /incorrect/], [{ status: 429 }, /tentatives/], [{ status: 503 }, /indisponible/]]) {
        const h = harness();
        h.controls.signInError = error;
        (await h.load("auth-login.js")).initLogin();
        h.elements.get("login-username").value = "prof";
        h.elements.get("login-password").value = "fictif";
        await h.elements.get("login").fire("submit");
        assert.equal(h.controls.redirects.length, 0);
        assert.match(h.elements.get("message").textContent, message);
        assert.equal(h.elements.get("login-button").disabled, false);
    }
});

test("compte sans profil : erreur visible et possibilité de se déconnecter", async () => {
    const h = harness();
    h.controls.profile = null;
    (await h.load("auth-login.js")).initLogin();
    h.elements.get("login-username").value = "prof";
    h.elements.get("login-password").value = "fictif";
    await h.elements.get("login").fire("submit");
    assert.equal(h.controls.redirects.length, 0);
    assert.match(h.elements.get("message").textContent, /profil est introuvable/);
    assert.equal(h.elements.get("auth-session-logout").hidden, false);
});

test("double soumission : un seul appel de connexion", async () => {
    const h = harness();
    const pending = deferred();
    h.controls.signIn = () => pending.promise;
    (await h.load("auth-login.js")).initLogin();
    h.elements.get("login-username").value = "prof";
    h.elements.get("login-password").value = "fictif";
    const first = h.elements.get("login").fire("submit");
    await h.elements.get("login").fire("submit");
    assert.equal(h.controls.signInCalls.length, 1);
    pending.resolve({ data: { user: h.controls.user }, error: null });
    await first;
});

test("une vérification initiale tardive ne remplace pas une connexion soumise", async () => {
    const h = harness();
    const pending = deferred();
    h.controls.getUser = () => pending.promise;
    await h.load("auth-init.js");
    h.elements.get("login-username").value = "prof";
    h.elements.get("login-password").value = "fictif";
    await h.elements.get("login").fire("submit");
    h.controls.profile = student;
    pending.resolve({ data: { user: { id: "previous-user" } }, error: null });
    await settle();
    assert.deepEqual(h.controls.redirects, ["/prof/"]);
});

test("le profil élève distingue établissement et classe MFR", async () => {
    const h = harness();
    h.controls.profile = student;
    await (await h.load("auth-space.js")).initAccountSpace({ prefix: "eleve", role: "student" });
    assert.equal(h.elements.get("eleve-content").hidden, false);
    assert.equal(h.elements.get("eleve-identity").textContent, "Alex Élève");
    assert.deepEqual(h.fields.map(field => field.textContent), ["MFR", "3e MFR"]);
    h.authEvent("SIGNED_OUT");
    assert.equal(h.elements.get("eleve-content").hidden, true);
    assert.equal(h.elements.get("eleve-identity").textContent, "");
    assert.ok(h.fields.every(field => field.textContent === ""));
});

test("un résultat reçu après déconnexion ne réaffiche pas l’identité", async () => {
    const h = harness();
    const pending = deferred();
    h.controls.queryProfile = () => pending.promise;
    const loading = (await h.load("auth-space.js")).initAccountSpace({ prefix: "prof", role: "teacher" });
    await settle();
    h.authEvent("SIGNED_OUT");
    pending.resolve({ data: teacher, error: null });
    await loading;
    assert.equal(h.elements.get("prof-content").hidden, true);
    assert.equal(h.elements.get("prof-identity").textContent, "");
});

test("changement de compte : ancien profil masqué et nouveau rôle vérifié hors callback", async () => {
    const h = harness();
    await (await h.load("auth-space.js")).initAccountSpace({ prefix: "prof", role: "teacher" });
    h.controls.user = { id: "student-b" };
    h.controls.profile = student;
    h.authEvent("SIGNED_IN");
    assert.equal(h.elements.get("prof-content").hidden, true);
    await settle();
    assert.equal(h.elements.get("prof-content").hidden, true);
    assert.equal(h.elements.get("prof-access-denied").hidden, false);
    assert.match(h.elements.get("prof-access-message").textContent, /pas autorisé/);
});

test("retour arrière depuis le cache : revalidation avant affichage", async () => {
    const h = harness();
    await (await h.load("auth-space.js")).initAccountSpace({ prefix: "prof", role: "teacher" });
    h.controls.user = null;
    h.events.get("pageshow")({ persisted: true });
    assert.equal(h.elements.get("prof-content").hidden, true);
    await settle();
    assert.equal(h.elements.get("prof-access-denied").hidden, false);
});

test("erreur temporaire de profil : réessayer recharge le même compte", async () => {
    const h = harness();
    h.controls.profileError = { code: "network" };
    await (await h.load("auth-space.js")).initAccountSpace({ prefix: "prof", role: "teacher" });
    assert.equal(h.elements.get("prof-content").hidden, true);
    h.controls.profileError = null;
    h.elements.get("prof-retry").fire("click");
    await settle();
    assert.equal(h.elements.get("prof-content").hidden, false);
});

test("échec de déconnexion : message visible, bouton réactivé et aucune redirection", async () => {
    const h = harness();
    h.controls.signOutError = { message: "Erreur simulée" };
    (await h.load("auth-logout.js")).initLogout("prof-logout");
    await h.elements.get("prof-logout").fire("click");
    assert.equal(h.elements.get("prof-logout").disabled, false);
    assert.equal(h.controls.replaced.length, 0);
    assert.match(h.elements.get("message").textContent, /Impossible/);
});

test("déconnexion du navigateur réussie : retour à la connexion", async () => {
    const h = harness();
    (await h.load("auth-logout.js")).initLogout("prof-logout");
    await h.elements.get("prof-logout").fire("click");
    assert.equal(h.controls.signOutOptions.scope, "local");
    assert.deepEqual(h.controls.replaced, ["/connexion/"]);
});

function fillRegistration(h) {
    const values = {
        prenom: "Alex", nom: "Élève", school: "mfr", classe: "3e", username: "alex.eleve",
        password: "Mot-de-passe-fictif-2026", "password-confirm": "Mot-de-passe-fictif-2026"
    };
    for (const [name, value] of Object.entries(values)) h.elements.get("register-" + name).value = value;
}

test("inscription élève : compte, profil complet et ouverture de l’espace", async () => {
    const h = harness({ registration: true });
    h.controls.user = null;
    fillRegistration(h);
    (await h.load("auth-register.js")).initRegistration();
    h.elements.get("register-role").value = "teacher";
    await h.elements.get("create-account").fire("submit");
    assert.equal(h.controls.signUpCalls.length, 1);
    assert.equal(h.controls.signUpCalls[0].email, "alex.eleve@eleve.example.com");
    assert.equal(h.controls.signUpCalls[0].options.data.role, "student");
    assert.equal(h.controls.signUpCalls[0].options.data.password, undefined);
    assert.equal(h.controls.inserts.length, 1);
    const profile = h.controls.inserts[0];
    assert.equal(profile.user_id, "created-user");
    assert.equal(profile.role, "student");
    assert.equal(profile.etablissement, "mfr");
    assert.equal(profile.classe, "3e");
    assert.equal(profile.nom, "Élève");
    assert.deepEqual(h.controls.redirects, ["/eleve/"]);
    assert.equal(h.elements.get("register-password").value, "");
    assert.equal(h.elements.get("register-password-confirm").value, "");
    assert.equal(h.elements.get("register-button").disabled, false);
    assert.equal(h.elements.get("login-button").disabled, false);
});

test("formulaire invalide : aucune création de compte ni écriture de profil", async () => {
    for (const [name, value] of [["nom", "   "], ["prenom", ""], ["school", "inconnu"], ["classe", "term"], ["username", "a..b"], ["username", "élève"], ["username", "ab"], ["username", "a".repeat(65)], ["password", "court"], ["password-confirm", "différent"]]) {
        const h = harness({ registration: true });
        h.controls.user = null;
        fillRegistration(h);
        h.elements.get("register-" + name).value = value;
        (await h.load("auth-register.js")).initRegistration();
        await h.elements.get("create-account").fire("submit");
        assert.equal(h.controls.signUpCalls.length, 0, name);
        assert.equal(h.controls.inserts.length, 0, name);
        assert.equal(h.elements.get("message").hidden, false, name);
    }
});

test("un identifiant choisi manuellement n’est pas écrasé quand le nom change", async () => {
    const h = harness({ registration: true });
    (await h.load("auth-username.js")).initUsernameGeneration();
    h.elements.get("register-prenom").value = "Alex";
    h.elements.get("register-prenom").fire("input");
    assert.equal(h.elements.get("register-username").value, "alex");
    h.elements.get("register-username").value = "alex.mfr2026";
    h.elements.get("register-username").fire("input");
    h.elements.get("register-nom").value = "Élève";
    h.elements.get("register-nom").fire("input");
    assert.equal(h.elements.get("register-username").value, "alex.mfr2026");
});

test("identifiant existant, inscription fermée, mot de passe refusé et limite de tentatives", async () => {
    for (const [error, pattern] of [[{ code: "user_already_exists" }, /déjà utilisé/], [{ code: "signup_disabled" }, /désactivée/], [{ code: "weak_password" }, /robuste/], [{ status: 429 }, /tentatives/]]) {
        const h = harness({ registration: true });
        h.controls.user = null;
        h.controls.signUp = () => ({ data: null, error });
        fillRegistration(h);
        (await h.load("auth-register.js")).initRegistration();
        await h.elements.get("create-account").fire("submit");
        assert.equal(h.controls.inserts.length, 0);
        assert.equal(h.controls.redirects.length, 0);
        assert.match(h.elements.get("message").textContent, pattern);
        assert.equal(h.elements.get("register-button").disabled, false);
    }
});

test("absence de session après signUp : pas d’écriture ni de faux succès", async () => {
    const h = harness({ registration: true });
    h.controls.user = null;
    h.controls.signUp = () => ({ data: { user: { id: "unconfirmed" }, session: null }, error: null });
    fillRegistration(h);
    (await h.load("auth-register.js")).initRegistration();
    await h.elements.get("create-account").fire("submit");
    assert.equal(h.controls.inserts.length, 0);
    assert.equal(h.controls.redirects.length, 0);
    assert.match(h.elements.get("message").textContent, /n’a pas ouvert de session/);
});

test("compte professeur connecté : aucune inscription et aucun profil écrasé", async () => {
    const h = harness({ registration: true });
    fillRegistration(h);
    (await h.load("auth-register.js")).initRegistration();
    await h.elements.get("create-account").fire("submit");
    assert.equal(h.controls.signUpCalls.length, 0);
    assert.equal(h.controls.inserts.length, 0);
    assert.equal(h.controls.profile.role, "teacher");
    assert.match(h.elements.get("message").textContent, /déjà connecté/);
});

test("profil non enregistré : réessayer sans recréer le compte ni ressaisir le mot de passe", async () => {
    const h = harness({ registration: true });
    h.controls.user = null;
    h.controls.insertError = { code: "network_error" };
    fillRegistration(h);
    (await h.load("auth-register.js")).initRegistration();
    await h.elements.get("create-account").fire("submit");
    assert.equal(h.controls.redirects.length, 0);
    assert.match(h.elements.get("message").textContent, /profil n’a pas pu être confirmé/);
    assert.equal(h.elements.get("register-credentials").hidden, true);
    assert.equal(h.elements.get("register-password").disabled, true);
    h.controls.insertError = null;
    await h.elements.get("create-account").fire("submit");
    assert.equal(h.controls.signUpCalls.length, 1);
    assert.equal(h.controls.inserts.length, 2);
    assert.deepEqual(h.controls.redirects, ["/eleve/"]);
});

test("reprise après rechargement : métadonnées restaurées et rôle forcé à élève", async () => {
    const h = harness({ registration: true });
    h.controls.profile = null;
    h.controls.user = { id: "incomplete", user_metadata: { ...student, role: "teacher" } };
    await h.load("auth-init.js");
    await settle();
    assert.equal(h.elements.get("register-prenom").value, "Alex");
    assert.equal(h.elements.get("register-school").value, "mfr");
    assert.equal(h.elements.get("register-classe").value, "3e");
    assert.equal(h.elements.get("register-credentials").hidden, true);
    await h.elements.get("create-account").fire("submit");
    assert.equal(h.controls.signUpCalls.length, 0);
    assert.equal(h.controls.inserts[0].user_id, "incomplete");
    assert.equal(h.controls.inserts[0].role, "student");
    assert.deepEqual(h.controls.redirects, ["/eleve/"]);
});

test("profil déjà créé par le serveur : aucune insertion supplémentaire", async () => {
    const h = harness({ registration: true });
    h.controls.user = null;
    h.controls.signUp = () => {
        h.controls.user = { id: "new-user" };
        h.controls.profile = student;
        return { data: { user: h.controls.user, session: { user: h.controls.user } }, error: null };
    };
    fillRegistration(h);
    (await h.load("auth-register.js")).initRegistration();
    await h.elements.get("create-account").fire("submit");
    assert.equal(h.controls.inserts.length, 0);
    assert.deepEqual(h.controls.redirects, ["/eleve/"]);
});

test("doublon concurrent de profil : relire la ligne existante sans l’écraser", async () => {
    const h = harness({ registration: true });
    h.controls.user = null;
    h.controls.insert = () => {
        h.controls.profile = { ...student, nom: "Déjà enregistré" };
        return { error: { code: "23505" } };
    };
    fillRegistration(h);
    (await h.load("auth-register.js")).initRegistration();
    await h.elements.get("create-account").fire("submit");
    assert.equal(h.controls.profile.nom, "Déjà enregistré");
    assert.deepEqual(h.controls.redirects, ["/eleve/"]);
});

test("inscription en cours : double envoi et connexion simultanée bloqués", async () => {
    const h = harness({ registration: true });
    const pending = deferred();
    h.controls.user = null;
    h.controls.signUp = () => pending.promise;
    fillRegistration(h);
    (await h.load("auth-register.js")).initRegistration();
    (await h.load("auth-login.js")).initLogin();
    const first = h.elements.get("create-account").fire("submit");
    await settle();
    await h.elements.get("create-account").fire("submit");
    h.elements.get("login-username").value = "prof";
    h.elements.get("login-password").value = "fictif";
    await h.elements.get("login").fire("submit");
    assert.equal(h.controls.signUpCalls.length, 1);
    assert.equal(h.controls.signInCalls.length, 0);
    pending.resolve({ data: null, error: { status: 503 } });
    await first;
    assert.equal(h.elements.get("register-button").disabled, false);
    assert.equal(h.elements.get("login-button").disabled, false);
});

test("session perdue pendant une reprise : demander une connexion, sans signUp", async () => {
    const h = harness({ registration: true });
    fillRegistration(h);
    const registration = (await h.load("auth-register.js")).initRegistration();
    registration.resumeProfile(h.controls.user);
    h.controls.user = null;
    await h.elements.get("create-account").fire("submit");
    assert.equal(h.controls.signUpCalls.length, 0);
    assert.equal(h.controls.inserts.length, 0);
    assert.match(h.elements.get("message").textContent, /session a expiré/);
});

test("insertion de profil refusée : pas de redirection ni de création d’un second compte", async () => {
    const h = harness({ registration: true });
    h.controls.user = null;
    h.controls.insertError = { code: "42501" };
    fillRegistration(h);
    (await h.load("auth-register.js")).initRegistration();
    await h.elements.get("create-account").fire("submit");
    assert.match(h.elements.get("message").textContent, /refusé/);
    assert.equal(h.controls.redirects.length, 0);
    assert.equal(h.controls.signUpCalls.length, 1);
});

test("profil déjà enregistré lors d’une reprise : accès sans nouvel INSERT", async () => {
    const h = harness({ registration: true });
    fillRegistration(h);
    const registration = (await h.load("auth-register.js")).initRegistration();
    registration.resumeProfile(h.controls.user);
    await h.elements.get("create-account").fire("submit");
    assert.equal(h.controls.signUpCalls.length, 0);
    assert.equal(h.controls.inserts.length, 0);
    assert.deepEqual(h.controls.redirects, ["/prof/"]);
});

test('bandeau élève : matières de sa classe seulement, effacées à la déconnexion', async () => {
    for (const [school, subjects, expected] of [['college', ['techno'], 'Technologie'], ['mfr', ['tim', 'maths'], 'TIM · Mathématiques'], ['mfr', ['tim'], 'TIM']]) {
        const h = harness(); h.controls.profile = { ...student, etablissement: school };
        h.elements.get('classes-data').textContent = JSON.stringify({ [school]: { nom: school, classes: [{ id: '3e', matieres: subjects }] } });
        const field = { ...element(), dataset: { profileField: 'matieres' } }; h.fields.push(field);
        await (await h.load('auth-space.js')).initAccountSpace({ prefix: 'eleve', role: 'student' });
        assert.equal(field.textContent, expected);
        h.authEvent('SIGNED_OUT'); assert.equal(field.textContent, '');
    }
});
