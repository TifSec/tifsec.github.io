import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createContext, SourceTextModule, SyntheticModule } from 'node:vm';
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };
async function harness() {
    const control = { reads:0, profiles:0, auth:null, user:{id:'a'}, role:'teacher', waiting:null, profileError:null };
    const db = { auth: { onAuthStateChange(fn) { control.auth=fn; }, async getUser() { control.reads++; if(control.waiting)await control.waiting; return {data:{user:control.user}}; } },
        from() { return { select(){return this;},eq(){return this;},async maybeSingle(){control.profiles++;return {data:{role:control.role},error:control.profileError};} }; } };
    const context=createContext({});
    const module=new SourceTextModule(readFileSync(new URL('../assets/js/auth/auth-session.js',import.meta.url),'utf8'),{context});
    await module.link(()=>new SyntheticModule(['db'],function(){this.setExport('db',db);},{context}));await module.evaluate();
    return {control,check:module.namespace.checkSession};
}
test('chargement simultané de plusieurs composants : une seule vérification Auth et profil',async()=>{
    const h=await harness(),waiting=deferred();h.control.waiting=waiting.promise;
    const pending=Array.from({length:4},()=>h.check());assert.equal(h.control.reads,1);waiting.resolve();
    const results=await Promise.all(pending);assert.ok(results.every(result=>result.status==='authenticated'));
    assert.equal(h.control.reads,1);assert.equal(h.control.profiles,1);
});
test('aucun cache après la réponse : le prochain contrôle relit le rôle actuel',async()=>{
    const h=await harness();assert.equal((await h.check()).profile.role,'teacher');h.control.role='student';
    assert.equal((await h.check()).profile.role,'student');assert.equal(h.control.reads,2);assert.equal(h.control.profiles,2);
});
test('déconnexion ou renouvellement invalide immédiatement une vérification en cours',async()=>{
    for(const event of ['SIGNED_OUT','SIGNED_IN','TOKEN_REFRESHED','USER_UPDATED']) {
        const h=await harness(),waiting=deferred();h.control.waiting=waiting.promise;
        const previous=h.check();h.control.auth(event);h.control.waiting=null;h.control.user={id:'b'};
        const next=await h.check();waiting.resolve();assert.equal((await previous).status,'session_error');assert.equal(next.user.id,'b');assert.equal(h.control.reads,2);
    }
});
test('panne partagée puis nouvelle tentative : aucune erreur conservée comme cache',async()=>{
    const h=await harness();h.control.profileError={message:'failure'};assert.equal((await h.check()).status,'profile_error');
    h.control.profileError=null;assert.equal((await h.check()).status,'authenticated');assert.equal(h.control.profiles,2);
});
