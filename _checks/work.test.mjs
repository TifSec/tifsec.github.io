import test from "node:test";
import assert from "node:assert/strict";
import { createAnswerBuffer } from "../assets/js/cours/answer-buffer.js";
import { createWorkRepository, WorkError } from "../assets/js/cours/work-repository.js";

const course = { etablissement: "college", matiere: "techno", classe: "3e", seance: "S02" };
const deferred = () => {
    let resolve;
    const promise = new Promise(done => { resolve = done; });
    return { promise, resolve };
};
const turn = () => new Promise(done => setImmediate(done));

test('remise : transmettre les révisions sauvegardées et reconnaître le conflit serveur', async () => {
    const snapshot = [{cle:'q1',revision:'3'}]; let called;
    await createWorkRepository({async rpc(name,args){called={name,args};return {data:true,error:null};}}).submitCopy(12,snapshot);
    assert.equal(called.name,'refonte_submit_copy'); assert.deepEqual(called.args,{p_copy:12,p_revisions:snapshot});
    await assert.rejects(createWorkRepository({async rpc(){return {error:{code:'40001'}};}}).submitCopy(12,snapshot),error=>error.code==='conflict');
});

test('instantané de remise : tri stable, cases jamais enregistrées exclues', () => {
    const buffer=createAnswerBuffer({keys:['z','a','empty'],answers:[{key:'z',value:'Z',revision:2},{key:'a',value:'',revision:1}],save:async()=>{},onStatus() {}});
    assert.deepEqual(buffer.revisions(),[{cle:'a',revision:'1'},{cle:'z',revision:'2'}]);buffer.dispose();
});

function client(responses) {
    const calls = [];
    return {
        calls,
        from(table) {
            const query = { table, filters: [], action: "select" };
            const execute = async () => {
                calls.push(query);
                const next = responses.shift();
                if (!next) throw new Error("Requête inattendue");
                return typeof next === "function" ? next(query) : next;
            };
            return {
                select(columns) { query.columns = columns; return this; },
                eq(key, value) { query.filters.push([key, value]); return this; },
                gt(key, value) { query.filters.push([key, '>', value]); return this; },
                in(key, value) { query.filters.push([key, value]); return this; },
                insert(payload) { query.action = "insert"; query.payload = payload; return this; },
                update(payload) { query.action = "update"; query.payload = payload; return this; },
                single: execute, maybeSingle: execute,
                then(resolve, reject) { return execute().then(resolve, reject); }
            };
        }
    };
}

function buffer(t, overrides = {}) {
    const statuses = [];
    const writes = [];
    const instance = createAnswerBuffer({
        keys: ["q1", "q2"], answers: [], delay: 100000,
        onStatus: state => statuses.push(state),
        save: async (key, value, revision) => {
            writes.push({ key, value, revision });
            return { key, value, revision: (revision || 0) + 1 };
        },
        ...overrides
    });
    t.after(() => instance.dispose());
    return { instance, statuses, writes };
}

test("restauration des réponses sans écriture de remplacement", async t => {
    const { instance, writes } = buffer(t, { answers: [{ key: "q1", value: "restaurée", revision: 4 }] });
    assert.equal(instance.value("q1"), "restaurée");
    assert.equal(instance.hasUnsaved(), false);
    await instance.flush();
    assert.equal(writes.length, 0);
});

test("frappes rapprochées : seule la dernière valeur est envoyée", async t => {
    const { instance, writes } = buffer(t);
    instance.edit("q1", "a");
    instance.edit("q1", "ab");
    instance.edit("q1", "abc");
    await instance.flush();
    assert.deepEqual(writes, [{ key: "q1", value: "abc", revision: null }]);
    assert.equal(instance.hasUnsaved(), false);
});

test("saisie pendant une requête : écritures ordonnées et nouvelle révision utilisée", async t => {
    const pending = deferred();
    const writes = [];
    const { instance, statuses } = buffer(t, { save: async (key, value, revision) => {
        writes.push({ key, value, revision });
        if (writes.length === 1) return pending.promise;
        return { revision: 2 };
    } });
    instance.edit("q1", "première");
    const saving = instance.flush();
    await turn();
    instance.edit("q1", "dernière");
    assert.equal(statuses.includes("saved"), false);
    pending.resolve({ revision: 1 });
    await saving;
    assert.deepEqual(writes, [
        { key: "q1", value: "première", revision: null },
        { key: "q1", value: "dernière", revision: 1 }
    ]);
    assert.equal(statuses.at(-1), "saved");
});

test("effacer une réponse restaurée enregistre bien une chaîne vide", async t => {
    const { instance, writes } = buffer(t, { answers: [{ key: "q1", value: "ancienne", revision: 3 }] });
    instance.edit("q1", "");
    await instance.flush();
    assert.deepEqual(writes, [{ key: "q1", value: "", revision: 3 }]);
});

test("une autre sauvegarde réussie ne masque pas une réponse en erreur", async t => {
    const { instance, statuses } = buffer(t, { save: async key => {
        if (key === "q1") throw new Error("réseau");
        return { revision: 1 };
    } });
    instance.edit("q1", "à garder");
    instance.edit("q2", "enregistrable");
    await instance.flush();
    assert.equal(instance.value("q1"), "à garder");
    assert.equal(instance.hasUnsaved(), true);
    assert.equal(statuses.at(-1), "error");
    assert.equal(statuses.includes("saved"), false);
});

test("reprise réseau : même réponse réessayée, sans perte de saisie", async t => {
    let failing = true;
    const { instance, statuses } = buffer(t, { save: async () => {
        if (failing) throw new Error("hors ligne");
        return { revision: 1 };
    } });
    instance.edit("q1", "mon texte");
    await instance.flush();
    failing = false;
    await instance.retry();
    assert.equal(instance.value("q1"), "mon texte");
    assert.equal(instance.hasUnsaved(), false);
    assert.equal(statuses.at(-1), "saved");
});

test("conflit : aucune nouvelle tentative automatique écrasant l’autre onglet", async t => {
    let calls = 0;
    const { instance, statuses } = buffer(t, { save: async () => {
        calls++;
        throw new WorkError("conflict");
    } });
    instance.edit("q1", "ma saisie");
    await instance.flush();
    instance.edit("q1", "ma saisie corrigée");
    await instance.retry();
    assert.equal(calls, 1);
    assert.equal(instance.value("q1"), "ma saisie corrigée");
    assert.equal(statuses.at(-1), "conflict");
});

test("déconnexion pendant la sauvegarde : les écritures suivantes sont abandonnées", async t => {
    const pending = deferred();
    let calls = 0;
    const { instance, statuses } = buffer(t, { save: async () => { calls++; return pending.promise; } });
    instance.edit("q1", "première");
    instance.edit("q2", "seconde");
    const saving = instance.flush();
    await turn();
    instance.dispose();
    const notifications = statuses.length;
    pending.resolve({ revision: 1 });
    await saving;
    assert.equal(calls, 1);
    assert.equal(statuses.length, notifications);
});

test("lecture de copie : clés d’identité et de séance toujours filtrées", async () => {
    const db = client([
        { data: { id: 12, terminee: false }, error: null },
        { data: [{ question_key: "q1", reponse: "réponse", revision: 2 }], error: null }
    ]);
    const copy = await createWorkRepository(db).loadCopy("student-a", course, ["q1"]);
    assert.equal(copy.answers[0].value, "réponse");
    assert.deepEqual(db.calls[0].filters, [
        ["created_by", "student-a"], ["etablissement", "college"], ["matiere", "techno"],
        ["classe", "3e"], ["seance", "S02"], ["max_members", 1]
    ]);
});

test("échec de lecture initiale : aucune création d’une copie de remplacement", async () => {
    const db = client([{ error: { code: "réseau" }, data: null }]);
    await assert.rejects(createWorkRepository(db).loadCopy("a", course, ["q1"]), /load_failed/);
    assert.equal(db.calls.length, 1);
});

test("création concurrente de copie : relire la copie unique après le doublon", async () => {
    const db = client([
        { data: null, error: null }, { data: null, error: { code: "23505" } },
        { data: { id: 42, terminee: false }, error: null }, { data: [], error: null }
    ]);
    assert.equal((await createWorkRepository(db).loadCopy("a", course, ["q1"])).id, 42);
    assert.equal(db.calls[1].payload.created_by, "a");
    assert.equal(db.calls[1].payload.max_members, 1);
});

test("réponses illisibles ou migration absente : restauration en erreur", async () => {
    for (const answers of [{ error: { code: "42501" } }, { error: null, data: [{ question_key: "q1", reponse: "valeur" }] }]) {
        const db = client([{ data: { id: 1, terminee: false }, error: null }, answers]);
        await assert.rejects(createWorkRepository(db).loadCopy("a", course, ["q1"]));
    }
});

test("mise à jour : filtre de révision et aucun auteur ou numéro fourni par le client", async () => {
    const db = client([{ data: { question_key: "q1", reponse: "nouvelle", revision: 3 }, error: null }]);
    await createWorkRepository(db).saveAnswer(1, "q1", "nouvelle", 2);
    assert.deepEqual(db.calls[0].payload, { reponse: "nouvelle" });
    assert.deepEqual(db.calls[0].filters, [["work_session_id", 1], ["question_key", "q1"], ["revision", 2]]);
});

test("révision périmée ou insertion concurrente : conflit explicite", async () => {
    for (const [revision, result] of [[1, { error: null, data: null }], [null, { error: { code: "23505" }, data: null }]]) {
        const db = client([result]);
        await assert.rejects(createWorkRepository(db).saveAnswer(1, "q1", "texte", revision), error => error.code === "conflict");
    }
});

test('copie collective : identifiant et séance exacts, sans création de remplacement', async () => {
    const db = client([{ data: { id: 99, terminee: false }, error: null }, { data: [], error: null }]);
    assert.equal((await createWorkRepository(db).loadCopy('b', course, ['q1'], '99')).id, 99);
    assert.deepEqual(db.calls[0].filters, [['id','99'], ['etablissement','college'], ['matiere','techno'],
        ['classe','3e'], ['seance','S02'], ['max_members','>',1]]);
    const denied = client([{ data: null, error: null }]);
    await assert.rejects(createWorkRepository(denied).loadCopy('b', course, ['q1'], '100'), /load_failed/);
    assert.equal(denied.calls.length, 1);
    assert.equal(denied.calls[0].action, 'select');
});

test('actualisation collective : adopter une réponse distante sans la réenregistrer', async t => {
    const { instance, writes } = buffer(t);
    assert.equal(instance.adopt([{ key: 'q1', value: 'texte du binôme', revision: 8 }]), true);
    assert.equal(instance.value('q1'), 'texte du binôme');
    await instance.flush(); assert.equal(writes.length, 0);
    instance.edit('q1', 'ma suite'); await instance.flush();
    assert.equal(writes[0].revision, 8);
});

test('actualisation distante : aucun remplacement de brouillon, écriture en cours ou conflit', async t => {
    const pending = deferred();
    const { instance } = buffer(t, { save: () => pending.promise });
    instance.edit('q1','brouillon');
    assert.equal(instance.adopt([{ key:'q1', value:'distant', revision:4 }]), false);
    const writing = instance.flush(); await turn();
    assert.equal(instance.adopt([]), false);
    pending.resolve({revision:1}); await writing;
    const conflicted = buffer(t, { save: async () => { throw new WorkError('conflict'); } }).instance;
    conflicted.edit('q1','à conserver'); await conflicted.flush();
    assert.equal(conflicted.adopt([]), false); assert.equal(conflicted.value('q1'), 'à conserver');
});

test('ouverture normale : retrouver le groupe de référence au lieu de créer un individuel', async () => {
    const db=client([{data:{id:42,terminee:false},error:null},{data:[],error:null}]);
    db.rpc=async name=>{ assert.equal(name,'refonte_my_groups'); return {data:[{copy_id:42}],error:null}; };
    const copy=await createWorkRepository(db).loadCopy('a',course,['q1'],null,{collaborative:true});
    assert.equal(copy.id,42);assert.equal(copy.group,true);
    assert.equal(db.calls.some(call=>call.action==='insert'),false);
});

test('historique individuel : lecture seule, aucune copie créée en son absence', async () => {
    const db=client([{data:{id:12,terminee:false},error:null},{data:[],error:null}]);
    const copy=await createWorkRepository(db).loadCopy('a',course,['q1'],null,{collaborative:true,history:true});
    assert.equal(copy.locked,true);assert.equal(copy.history,true);assert.equal(copy.group,false);
    const empty=client([{data:null,error:null}]);
    await assert.rejects(createWorkRepository(empty).loadCopy('a',course,['q1'],null,{history:true}),/history_missing/);
    assert.equal(empty.calls.length,1);
});

test('échec de résolution du groupe : aucune création individuelle de secours', async () => {
    const db=client([]);db.rpc=async()=>({data:null,error:{code:'réseau'}});
    await assert.rejects(createWorkRepository(db).loadCopy('a',course,['q1'],null,{collaborative:true}),/load_failed/);
    assert.equal(db.calls.length,0);
});
