import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createContext,SourceTextModule} from 'node:vm';

async function harness(){
    let notify;
    const auth={onAuthStateChange(callback){notify=callback;return {data:{subscription:{unsubscribe(){}}}};}};
    const context=createContext({window:{supabase:{createClient:()=>({auth})}}});
    const module=new SourceTextModule(readFileSync(new URL('../assets/js/bdd/bdd-connect.js',import.meta.url),'utf8'),{context});
    await module.link(()=>{});await module.evaluate();
    const events=[];module.namespace.db.auth.onAuthStateChange((event,session)=>events.push([event,session?.user?.id]));
    return {events,notify:(event,id)=>notify(event,id?{user:{id}}:null)};
}
test('retour onglet : SIGNED_IN du même compte ne reconstruit pas les espaces',async()=>{
    const h=await harness();h.notify('INITIAL_SESSION','a');h.notify('SIGNED_IN','a');h.notify('SIGNED_IN','a');
    assert.deepEqual(h.events,[['INITIAL_SESSION','a']]);
});
test('changement de compte, déconnexion et renouvellement restent transmis',async()=>{
    const h=await harness();h.notify('INITIAL_SESSION','a');h.notify('SIGNED_IN','b');h.notify('TOKEN_REFRESHED','b');h.notify('USER_UPDATED','b');h.notify('SIGNED_OUT');h.notify('SIGNED_IN','b');
    assert.deepEqual(h.events.map(e=>e[0]),['INITIAL_SESSION','SIGNED_IN','TOKEN_REFRESHED','USER_UPDATED','SIGNED_OUT','SIGNED_IN']);
});
