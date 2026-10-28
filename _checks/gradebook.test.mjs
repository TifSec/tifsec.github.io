import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../assets/js/prof/gradebook-model.js',import.meta.url),'utf8');
const {gradebookModel,readGradebook,copyTrackingUrl}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const scope={etablissement:'college',matiere:'techno',classe:'3e'};
const lesson={...scope,seance:'S02',titre:'Exemple',url:'/cours/exemple/'};
const students=['a','b','c'].map(user_id=>({...scope,user_id,prenom:user_id,nom:'Fictif',enrollment_status:'approved'}));
const copy={...scope,id:1,seance:'S02',created_by:'a',max_members:1,terminee:true,current_evaluation_id:10};
const grade={id:10,work_session_id:1,total:0,recipient_ids:['a'],validated_at:'2026-10-20T12:00:00Z'};
const model=(change={})=>gradebookModel({scope,catalogue:[lesson],students,copies:[copy],members:[],evaluations:[grade],...change});
test('notes : zéro validé conservé, absence distincte, classe et matière isolées',()=>{
    const result=model();assert.equal(result.rows[0].cells[0].current.total,0);assert.equal(result.rows[1].cells[0].state,'missing');assert.equal(result.validated,1);
    const other={...copy,id:2,matiere:'maths'};assert.equal(model({copies:[other]}).rows[0].cells[0].state,'missing');
});
test('réouverture : ancienne correction présente dans l’historique, jamais dans la note courante',()=>{
    const cell=model({copies:[{...copy,terminee:false,current_evaluation_id:null}]}).rows[0].cells[0];
    assert.equal(cell.state,'reopened');assert.equal(cell.current,null);assert.equal(cell.history.length,1);
});
test('groupe : une note commune pour les seuls membres acceptés, individuel remplacé',()=>{
    const group={...copy,id:2,max_members:3,current_evaluation_id:11};const groupGrade={...grade,id:11,work_session_id:2,total:15,recipient_ids:['a','b']};
    const result=model({copies:[copy,group],members:[{work_session_id:2,user_id:'a',status:'accepted'},{work_session_id:2,user_id:'b',status:'accepted'},{work_session_id:2,user_id:'c',status:'pending'}],evaluations:[grade,groupGrade]});
    assert.equal(result.rows[0].cells[0].current.total,15);assert.equal(result.rows[0].cells[0].history.length,2);
    assert.equal(result.rows[1].cells[0].current.total,15);assert.equal(result.rows[1].cells[0].collective,true);assert.equal(result.rows[2].cells[0].current,null);
});
test('versions précédentes : seul le pointeur courant donne la note définitive',()=>{
    const old={...grade,id:9,total:4,validated_at:'2026-10-19T12:00:00Z'};const cell=model({evaluations:[old,grade]}).rows[0].cells[0];
    assert.equal(cell.current.id,10);assert.deepEqual(cell.history.map(item=>item.id),[10,9]);
});
test('copie sans note et plusieurs groupes ne donnent pas de résultat inventé',()=>{
    assert.equal(model({evaluations:[],copies:[{...copy,current_evaluation_id:null}]}).rows[0].cells[0].state,'to_grade');
    const g1={...copy,id:2,max_members:2},g2={...copy,id:3,max_members:2};
    const cell=model({copies:[g1,g2],members:[{work_session_id:2,user_id:'a'},{work_session_id:3,user_id:'a'}]}).rows[0].cells[0];assert.equal(cell.state,'ambiguous');assert.equal(cell.current,null);
});
test('ancien élève et séance absente du catalogue : données conservées, note invalide refusée',()=>{
    assert.equal(model({students:[]}).rows[0].pupil.former,true);
    assert.equal(model({catalogue:[]}).lessons[0].seance,'S02');
    assert.throws(()=>model({evaluations:[{...grade,total:21}]}));
});
test('lien copie : périmètre, séance et historique explicites, URL externe refusée',()=>{
    const url=copyTrackingUrl('/prof/suivi/',scope,lesson,1,true);assert.match(url,/seance=S02/);assert.match(url,/copie=1/);assert.match(url,/historique=1/);
    assert.throws(()=>copyTrackingUrl('//evil.test',scope,lesson,1));
});
test('lectures groupées et paginées : aucun contenu de réponse ou corrigé, aucune écriture',async()=>{
    const calls=[];let pages=0;
    const db={rpc:async(name,params)=>{calls.push({name,params});return {data:students};},from(table){const filters=[];let columns;
        return {select(value){columns=value;return this;},eq(k,v){filters.push([k,v]);return this;},in(k,v){filters.push([k,v]);return this;},order(){return this;},async range(start){
            calls.push({table,columns,filters,start});
            if(table==='work_sessions'){pages++;return {data:start===0?Array.from({length:500},(_,i)=>({...copy,id:i+1})):[]};}
            return {data:[]};
        }};}};
    const result=await readGradebook(db,scope);assert.equal(result.copies.length,500);assert.equal(pages,2);
    assert.equal(calls.filter(call=>call.table==='work_evaluations').length,5);assert.equal(calls.filter(call=>call.table==='work_session_members').length,0);
    assert.ok(calls.filter(call=>call.columns).every(call=>!/(reponse|attendu|marks)/.test(call.columns)));
});
