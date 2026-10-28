import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createContext, SourceTextModule, SyntheticModule } from 'node:vm';
import { Element } from './fake-dom.mjs';
const turn=()=>new Promise(done=>setTimeout(done,10));
const scope={etablissement:'college',matiere:'techno',classe:'3e'},lesson={...scope,seance:'S02',titre:'Exemple',url:'/cours/s02/'};
const teacher={status:'authenticated',user:{id:'teacher'},profile:{role:'teacher'}};
const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
class Select extends Element {replaceChildren(){super.replaceChildren();this.value='';}add(child){super.add(child);if(this.children.length===1)this.value=child.value;}}
const flatten=node=>node.textContent+node.children.map(flatten).join(' ');
async function harness({session=teacher,enabled=true}={}) {
    const ids=['teacher-gradebook',...['subject','class','lesson','filters','status','summary','table','detail','detail-title','detail-status','history','close','refresh'].map(id=>'notes-'+id)];
    const nodes=new Map(ids.map(id=>[id,['notes-subject','notes-class','notes-lesson'].includes(id)?new Select('select'):new Element()]));
    nodes.get('teacher-gradebook').dataset={enabled:String(enabled),trackingUrl:'/prof/suivi/'};
    const data={students:[{...scope,user_id:'pupil',prenom:'Élève',nom:'Fictif',enrollment_status:'approved'}],
        copies:[{...scope,id:12,seance:'S02',created_by:'pupil',max_members:1,terminee:true,current_evaluation_id:42}],members:[],
        evaluations:[{id:42,work_session_id:12,total:15,recipient_ids:['pupil'],validated_at:'2026-10-20T12:00:00Z'}]};
    const control={session,calls:[],auth:null,pending:null,historyPending:null};
    const db={auth:{onAuthStateChange(fn){control.auth=fn;}},async rpc(name,params){control.calls.push({name,params});if(control.pending)await control.pending;return {data:data.students};},from(table){let columns='';const filters=[];
        return {select(value){columns=value;return this;},eq(key,value){filters.push([key,value]);return this;},in(key,value){filters.push([key,value]);return this;},order(){return this;},
            async range(){control.calls.push({table,columns,filters});if(table==='work_sessions')return {data:data.copies};if(table==='work_session_members')return {data:[]};
                if(columns.includes('marks')){if(control.historyPending)await control.historyPending;return {data:[{...data.evaluations[0],marks:[{cle:'a01_q01',points:15,maximum:20,commentaire:'<script>texte fictif</script>',details:[{cle:'c1',points:15,maximum:20}]}] }]};}
                return {data:data.evaluations};},
            then(resolve,reject){control.calls.push({table,columns,filters});return Promise.resolve({data:[scope]}).then(resolve,reject);}
        };}};
    const context=createContext({document:{getElementById:id=>nodes.get(id),createElement:tag=>new Element(tag)},
        window:{location:{href:'http://local/prof/notes/'},addEventListener(){}},Option:class extends Element{constructor(label,value){super('option');this.textContent=label;this.value=value;}},setTimeout,clearTimeout,URL,URLSearchParams,Date});
    const module=new SourceTextModule(read('../assets/js/prof/gradebook.js'),{context});
    const synthetic=values=>new SyntheticModule(Object.keys(values),function(){for(const [key,value]of Object.entries(values))this.setExport(key,value);},{context});
    const dependencies={
        '../bdd/bdd-connect.js':synthetic({db}),
        '../auth/auth-session.js':synthetic({checkSession:async()=>control.session}),
        '../cours/collaboration.js':synthetic({lessonCatalogue:()=>[lesson]}),
        './course-selection.js':new SourceTextModule(read('../assets/js/prof/course-selection.js'),{context}),
        './gradebook-model.js':new SourceTextModule(read('../assets/js/prof/gradebook-model.js'),{context})
    };
    await module.link(spec=>dependencies[spec]);await module.evaluate();await turn();return {nodes,control};
}
test('tableau professeur : note, lien vers la bonne copie et chargement léger',async()=>{
    const h=await harness();assert.match(flatten(h.nodes.get('notes-table')),/15 \/ 20/);
    const link=h.nodes.get('notes-table').querySelector('a');assert.match(link.href,/copie=12/);assert.match(link.href,/seance=S02/);
    assert.equal(h.control.calls.some(call=>call.columns?.includes('marks')),false);
    assert.equal(h.control.calls.some(call=>call.table==='work_answers'),false);
});
test('historique chargé au clic et commentaires rendus comme texte',async()=>{
    const h=await harness();await h.nodes.get('notes-table').querySelector('button').fire('click');await turn();
    assert.equal(h.nodes.get('notes-detail').hidden,false);assert.match(flatten(h.nodes.get('notes-history')),/<script>texte fictif<\/script>/);
    assert.equal(h.nodes.get('notes-history').querySelectorAll('script').length,0);assert.match(flatten(h.nodes.get('notes-history')),/Note courante/);
});
test('visiteur, élève et fonction désactivée : aucune lecture',async()=>{
    for(const options of [{session:{status:'not_authenticated'}},{session:{...teacher,profile:{role:'student'}}},{enabled:false}]) {
        const h=await harness(options);assert.equal(h.control.calls.length,0);
    }
});
test('déconnexion : notes et anciens détails effacés',async()=>{
    const h=await harness();await h.nodes.get('notes-table').querySelector('button').fire('click');await turn();
    h.control.auth('SIGNED_OUT');assert.equal(h.nodes.get('notes-table').children.length,0);assert.equal(h.nodes.get('notes-history').children.length,0);assert.equal(h.nodes.get('notes-detail').hidden,true);
});
test('historique reçu après déconnexion : aucune appréciation tardive',async()=>{
    const h=await harness();let resolve;h.control.historyPending=new Promise(done=>{resolve=done;});
    const pending=h.nodes.get('notes-table').querySelector('button').fire('click');await turn();h.control.auth('SIGNED_OUT');resolve();await pending;await turn();
    assert.equal(h.nodes.get('notes-history').children.length,0);assert.equal(h.nodes.get('notes-detail').hidden,true);
});
