import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createContext, SourceTextModule, SyntheticModule } from "node:vm";

const source = path => readFileSync(new URL(path, import.meta.url), "utf8");
const turn = () => new Promise(done => setTimeout(done, 10));
const deferred = () => {
    let resolve;
    const promise = new Promise(done => { resolve = done; });
    return { promise, resolve };
};
const pupil = {
    status: "authenticated", user: { id: "student-a" },
    profile: { role: "student", prenom: "Alex", nom: "Fictif", etablissement: "college", classe: "3e", enrollment_status: 'approved' }
};
function node() {
    const events = new Map();
    return { hidden: true, disabled: true, textContent: "", value: "", dataset: {},
        addEventListener(event, callback) { events.set(event, callback); },
        fire(event, payload = {}) { return events.get(event)?.(payload); }
    };
}
async function ui({ enabled = true, session = pupil, copy, collaborative = false, copyId = null, save, submission = false, confirm = false, submitCopy } = {}) {
    const elements = new Map(["course-work", "course-answers", "course-save-status", "course-identity", "course-retry", "course-reload", "course-submit", "course-submit-status"].map(id => [id, node()]));
    elements.get('course-submit').dataset.enabled = String(submission);
    const field = node();
    field.dataset.answerId = "q1";
    elements.get("course-answers").querySelectorAll = () => [field];
    elements.get("course-work").dataset = { savingEnabled: String(enabled), collaborationEnabled: String(collaborative), etablissement: "college", classe: "3e", matiere: "techno", seance: "S02" };
    const controls = { session, reads: 0, writes: 0, checks: 0, authCallback: null, submits: 0 };
    const events = new Map();
    const context = createContext({
        document: { visibilityState: 'visible', getElementById(id) { return elements.get(id); }, addEventListener() {} },
        window: { location: { href: 'http://local/cours/' + (copyId ? '?copie='+copyId : ''), assign(url) { controls.destination = url; } }, addEventListener(name, callback) { events.set(name, callback); }, confirm(message) { controls.confirmText = message; return confirm; } },
        setTimeout, clearTimeout, URL,
        setInterval(fn) { controls.poll = fn; return 1; }, clearInterval() { controls.poll = null; }
    });
    const dependencies = {
        "./collaboration.js": { async initCourseGroups(options) { controls.groupOptions = options; return null; } },
        "../bdd/bdd-connect.js": { db: { auth: { onAuthStateChange(callback) { controls.authCallback = callback; } } } },
        "../auth/auth-session.js": {
            async checkSession() { controls.checks++; return controls.session; },
            getSessionMessage(status) { return status; }
        },
        "./work-repository.js": { createWorkRepository() { return {
            async loadCopy(...args) {
                controls.reads++;
                controls.loadArgs = args;
                return copy ? copy() : { id: 1, locked: false, answers: [{ key: "q1", value: "réponse sauvegardée", revision: 3 }] };
            },
            async saveAnswer() { controls.writes++; return save ? save() : { revision: 4 }; },
            async submitCopy(id, snapshot) { controls.submits++; controls.submitted = { id, snapshot }; if (submitCopy) await submitCopy(); }
        }; } }
    };
    const bufferModule = new SourceTextModule(source("../assets/js/cours/answer-buffer.js"), { context });
    const evaluationModule = new SourceTextModule(source('../assets/js/cours/student-evaluation.js'), { context });
    await evaluationModule.link(() => { throw new Error('unexpected_import'); });
    const module = new SourceTextModule(source("../assets/js/cours/course-work.js"), { context });
    await module.link(specifier => {
        if (specifier === "./answer-buffer.js") return bufferModule;
        if (specifier === './student-evaluation.js') return evaluationModule;
        const values = dependencies[specifier];
        assert.ok(values, specifier);
        return new SyntheticModule(Object.keys(values), function () {
            for (const [name, value] of Object.entries(values)) this.setExport(name, value);
        }, { context });
    });
    await module.evaluate();
    await turn();
    return { controls, elements, field, events, dispose() { controls.authCallback?.("SIGNED_OUT", null); } };
}

test("activation non validée : aucun appel de compte ou de copie, saisie désactivée", async () => {
    const h = await ui({ enabled: false });
    assert.equal(h.controls.checks, 0);
    assert.equal(h.controls.reads, 0);
    assert.equal(h.elements.get("course-answers").disabled, true);
    assert.match(h.elements.get("course-save-status").textContent, /validation/);
});

test('fin de travail : enregistrer la dernière saisie, sans verrouillage ni note', async () => {
    const h=await ui({submission:true,confirm:true});
    h.field.value='Dernière réponse'; h.field.fire('input');
    await h.elements.get('course-submit').fire('click');
    assert.equal(h.controls.writes,1); assert.equal(h.controls.submits,1);
    assert.equal(h.controls.submitted.snapshot[0].revision,'4');
    assert.equal(h.elements.get('course-answers').disabled,false);
    assert.equal(h.elements.get('course-submit').hidden,true);
    assert.match(h.elements.get('course-submit-status').textContent,/note seront ajoutées/);
    h.field.value='Complément après la déclaration'; h.field.fire('input');
    await h.elements.get('course-retry').fire('click');
    assert.equal(h.controls.writes,2);
    h.dispose();
});
test('remise annulée ou sauvegarde en erreur : aucun verrouillage', async () => {
    const cancelled=await ui({submission:true}); await cancelled.elements.get('course-submit').fire('click');
    assert.equal(cancelled.controls.submits,0); assert.equal(cancelled.elements.get('course-answers').disabled,false); cancelled.dispose();
    const h=await ui({submission:true,confirm:true,save:async()=>{throw new Error('offline');}});
    h.field.value='Non enregistrée'; h.field.fire('input'); await h.elements.get('course-submit').fire('click');
    assert.equal(h.controls.submits,0); assert.equal(h.elements.get('course-answers').disabled,false);
    assert.equal(h.field.value,'Non enregistrée'); h.dispose();
});
test('remise collective : avertissement commun et déconnexion pendant la remise', async () => {
    const pending=deferred();
    const h=await ui({submission:true,confirm:true,copy:()=>({id:2,group:true,locked:false,answers:[{key:'q1',value:'Groupe',revision:1}]}),submitCopy:()=>pending.promise});
    const sending=h.elements.get('course-submit').fire('click'); await turn();
    assert.match(h.controls.confirmText,/tous les participants/);
    h.controls.authCallback('SIGNED_OUT',null); pending.resolve(); await sending;
    assert.equal(h.field.value,''); assert.equal(h.elements.get('course-submit-status').textContent,'');
});
test('remise désactivée ou copie clôturée : bouton masqué', async () => {
    for(const options of [{},{submission:true,copy:()=>({id:1,locked:true,answers:[]})}]) {
        const h=await ui(options); assert.equal(h.elements.get('course-submit').hidden,true); h.dispose();
    }
});

test('reconnexion sur un travail déclaré terminé : réponses restaurées et éditables', async () => {
    const h=await ui({submission:true,copy:()=>({id:1,locked:false,submitted:true,answers:[{key:'q1',value:'Travail terminé',revision:1}]})});
    assert.equal(h.field.value,'Travail terminé');assert.equal(h.elements.get('course-answers').disabled,false);
    assert.equal(h.elements.get('course-submit').hidden,true);assert.match(h.elements.get('course-submit-status').textContent,/compléter/);h.dispose();
});

test('remise sur copie modifiée ailleurs : demander une relecture, conserver la saisie', async () => {
    const h=await ui({submission:true,confirm:true,submitCopy:async()=>{throw Object.assign(new Error('conflict'),{code:'conflict'});}});
    await h.elements.get('course-submit').fire('click');
    assert.equal(h.elements.get('course-answers').disabled,false);
    assert.equal(h.field.value,'réponse sauvegardée');
    assert.match(h.elements.get('course-submit-status').textContent,/Actualise et relis/); h.dispose();
});

test("anonyme, professeur et mauvaise classe : aucun chargement de copie", async () => {
    for (const session of [{ status: "not_authenticated" }, { ...pupil, profile: { ...pupil.profile, role: "teacher" } }, { ...pupil, profile: { ...pupil.profile, classe: "4e" } }]) {
        const h = await ui({ session });
        assert.equal(h.controls.reads, 0);
        assert.equal(h.elements.get("course-answers").disabled, true);
        h.dispose();
    }
});

test('inscription en attente : connexion conservée, aucune copie chargée', async () => {
    const h=await ui({session:{...pupil,profile:{...pupil.profile,enrollment_status:'pending'}}});
    assert.equal(h.controls.reads,0);assert.equal(h.elements.get('course-answers').disabled,true);
    assert.match(h.elements.get('course-save-status').textContent,/validation/);h.dispose();
});

test("les champs ne s’ouvrent qu’après restauration confirmée", async () => {
    const pending = deferred();
    const h = await ui({ copy: () => pending.promise });
    assert.equal(h.elements.get("course-answers").disabled, true);
    pending.resolve({ id: 1, locked: false, answers: [{ key: "q1", value: "restaurée", revision: 2 }] });
    await turn();
    assert.equal(h.field.value, "restaurée");
    assert.equal(h.elements.get("course-answers").disabled, false);
    assert.equal(h.controls.writes, 0);
    h.dispose();
});

test("échec de restauration : aucun champ activé ni réponse vide enregistrée", async () => {
    const h = await ui({ copy: () => { throw new Error("lecture impossible"); } });
    assert.equal(h.elements.get("course-answers").disabled, true);
    assert.equal(h.elements.get("course-save-status").dataset.state, "load_error");
    h.field.value = "une saisie artificielle";
    h.field.fire("input");
    assert.equal(h.controls.writes, 0);
    h.dispose();
});

test("déconnexion pendant la lecture : la réponse tardive n’est pas affichée", async () => {
    const pending = deferred();
    const h = await ui({ copy: () => pending.promise });
    h.controls.authCallback("SIGNED_OUT", null);
    pending.resolve({ id: 1, locked: false, answers: [{ key: "q1", value: "privée", revision: 1 }] });
    await turn();
    assert.equal(h.field.value, "");
    assert.equal(h.elements.get("course-answers").disabled, true);
});

test("modification du compte pendant le chargement : aucune copie réutilisée", async () => {
    const pending = deferred();
    const h = await ui({ copy: () => pending.promise });
    h.controls.session = { ...pupil, user: { id: "student-b" } };
    pending.resolve({ id: 1, locked: false, answers: [{ key: "q1", value: "élève A", revision: 1 }] });
    await turn();
    assert.equal(h.field.value, "");
    assert.equal(h.elements.get("course-answers").disabled, true);
    h.dispose();
});

test("modifications non enregistrées : avertissement au départ et effacement après déconnexion", async () => {
    const h = await ui();
    h.field.value = "brouillon";
    h.field.fire("input");
    let prevented = false;
    const event = { preventDefault() { prevented = true; } };
    h.events.get("beforeunload")(event);
    assert.equal(prevented, true);
    h.dispose();
    assert.equal(h.field.value, "");
    assert.equal(h.elements.get("course-identity").textContent, "");
    assert.equal(h.controls.writes, 0);
});

test("copie terminée : restauration en lecture seule", async () => {
    const h = await ui({ copy: () => ({ id: 1, locked: true, answers: [{ key: "q1", value: "définitive", revision: 1 }] }) });
    assert.equal(h.field.value, "définitive");
    assert.equal(h.elements.get("course-answers").disabled, true);
    h.dispose();
});

test('ancien groupe : accès par copie même après changement de classe, puis mise à jour du binôme', async () => {
    let value = 'ensemble';
    const h = await ui({ collaborative: true, copyId: '42', session: { ...pupil, profile: { ...pupil.profile, classe:'4e' } },
        copy: () => ({ id:42, locked:false, answers:[{key:'q1',value,revision:2}] }) });
    assert.equal(h.controls.loadArgs[3], '42'); assert.equal(h.field.value,'ensemble');
    value = 'ajout du binôme'; await h.controls.poll();
    assert.equal(h.field.value,value); assert.equal(h.controls.writes,0);
    h.field.value='mon brouillon'; h.field.fire('input');
    value='autre ajout'; const reads=h.controls.reads; await h.controls.poll();
    assert.equal(h.field.value,'mon brouillon'); assert.equal(h.controls.reads,reads+1);
    h.dispose(); assert.equal(h.controls.poll,null);
});

test('changement de copie refusé si une réponse ne peut pas être enregistrée', async () => {
    const h=await ui({ collaborative:true, save:()=>{throw new Error('hors ligne');} });
    h.field.value='précieux'; h.field.fire('input');
    assert.equal(await h.controls.groupOptions.onChoose('42'),false);
    assert.equal(h.controls.destination,undefined); assert.equal(h.field.value,'précieux'); h.dispose();
});

test('déconnexion pendant l’actualisation collective : aucune réponse privée réaffichée', async () => {
    const pending=deferred(); let reads=0;
    const h=await ui({ collaborative:true, copyId:'42', copy:()=> ++reads===1 ?
        {id:42,locked:false,answers:[]} : pending.promise });
    const poll=h.controls.poll(); h.dispose();
    pending.resolve({id:42,locked:false,answers:[{key:'q1',value:'privée',revision:2}]});
    await poll; assert.equal(h.field.value,''); assert.equal(h.controls.poll,null);
});
