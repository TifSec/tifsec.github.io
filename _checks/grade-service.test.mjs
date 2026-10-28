import test from 'node:test';
import assert from 'node:assert/strict';
import { createTeacherGradeHandler, validateMarks } from '../_supabase/functions/teacher-grade/handler.mjs';
const proposal = { cours:{version:'v1'}, empreinte_corrige:'a'.repeat(64),revisions_reponses:[{cle:'q1',revision:'1'}],
    bareme_complet:true,maximum_total:20,resultats:[{cle:'q1',maximum:12},{cle:'q2',maximum:8}] };
const input = { copy_id:'12',marks:[{cle:'q1',points:10,maximum:12,commentaire:'Exemple fictif'},{cle:'q2',points:5,maximum:8,commentaire:''}],
    course_version:'v1',correction_fingerprint:proposal.empreinte_corrige,answer_revisions:proposal.revisions_reponses };
function harness(options={}) {
    const calls=[]; let checks=0;
    const handler=createTeacherGradeHandler({env:key=>({SUPABASE_URL:'https://example.supabase.co',SUPABASE_ANON_KEY:'public-example',COURSES_ALLOWED_ORIGINS:'http://localhost:4000'})[key],
        correctionHandler:async()=>{checks++;return options.denied?Response.json({error:'forbidden'},{status:403}):Response.json({proposition:proposal});},
        async fetch(url,config){calls.push({url,config});assert.equal(config.headers.Authorization,'Bearer fake.jwt.example');
            assert.equal(config.redirect,'error');assert.equal(config.cache,'no-store');
            if(url.includes('/work_sessions?'))return Response.json([{id:12,course_version:options.version||'v1',current_evaluation_id:options.existing?1:null}]);
            if(options.changed)return Response.json({code:'40001'},{status:400});
            return Response.json(42);
        }});
    return {calls,checks:()=>checks,request:(body=input,headers={},method='POST')=>handler(new Request('https://example.supabase.co/functions/v1/teacher-grade',{
        method,headers:{authorization:'Bearer fake.jwt.example',origin:'http://localhost:4000',...headers},...(method==='POST'?{body:JSON.stringify(body)}:{})}))};
}
test('validation contrôlée : maximum privé, total serveur et RPC atomique avec révisions',async()=>{
    const h=harness(),response=await h.request();assert.equal(response.status,200);
    const value=await response.json();assert.equal(value.total,15);assert.equal(value.validated,true);
    const body=JSON.parse(h.calls[1].config.body);assert.equal(body.p_copy,'12');assert.deepEqual(body.p_revisions,proposal.revisions_reponses);
    assert.equal(body.p_expected,null);assert.equal(body.p_marks.length,2);assert.match(response.headers.get('cache-control'),/no-store/);
});
test('professeur non autorisé : aucune requête de validation',async()=>{
    const h=harness({denied:true});assert.equal((await h.request()).status,403);assert.equal(h.calls.length,0);
});
test('empreinte, version ou révisions changées : aucune écriture',async()=>{
    for(const change of [{course_version:'v2'},{correction_fingerprint:'b'.repeat(64)},{answer_revisions:[]}]){
        const h=harness();assert.equal((await h.request({...input,...change})).status,409);assert.equal(h.calls.length,0);
    }
});
test('points manquants, maximum falsifié, doublons, valeurs excessives refusés',()=>{
    for(const marks of [input.marks.slice(1),[{...input.marks[0],maximum:20},input.marks[1]],[input.marks[0],input.marks[0]],
        [{...input.marks[0],points:13},input.marks[1]],[{...input.marks[0],points:-1},input.marks[1]],[{...input.marks[0],points:0.1234567},input.marks[1]]]){
        assert.throws(()=>validateMarks({...input,marks},proposal));
    }
});
test('déjà validée, version inconnue, modification au dernier instant : pas de faux succès',async()=>{
    for(const options of [{existing:true},{version:'v2'},{changed:true}]){
        const response=await harness(options).request();assert.equal(response.status,409);assert.equal((await response.json()).validated,undefined);
    }
});
test('visiteur, origine et entrée imprévues refusés',async()=>{
    const h=harness();assert.equal((await h.request(input,{authorization:''})).status,401);
    assert.equal((await h.request(input,{origin:'https://evil.test'})).status,403);
    assert.equal((await h.request({...input,total:20})).status,400);assert.equal(h.checks(),0);
    assert.equal((await h.request({}, {}, 'OPTIONS')).status,204);
});

test('tableau : chaque case conservée, barème ou somme incohérents refusés',()=>{
    const tableProposal={...proposal,resultats:[{...proposal.resultats[0],resultats_cellules:[{champ:'c1',maximum:6},{champ:'c2',maximum:6}]},proposal.resultats[1]]};
    const tableMarks=[{...input.marks[0],details:[{cle:'c1',maximum:6,points:5},{cle:'c2',maximum:6,points:5}]},input.marks[1]];
    const valid=validateMarks({...input,marks:tableMarks},tableProposal);
    assert.deepEqual(valid.marks[0].details,tableMarks[0].details);assert.equal(valid.total,15);
    for(const details of [[],[tableMarks[0].details[0],tableMarks[0].details[0]],
        [{cle:'c1',maximum:7,points:5},tableMarks[0].details[1]],
        [{cle:'c1',maximum:6,points:4},tableMarks[0].details[1]]]) assert.throws(()=>validateMarks({...input,marks:[{...tableMarks[0],details},input.marks[1]]},tableProposal));
});
