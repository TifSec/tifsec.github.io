import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createContext, SourceTextModule, SyntheticModule } from 'node:vm';

const turn = () => new Promise(done => setTimeout(done, 10));
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };
const lesson = { etablissement:'college', matiere:'techno', classe:'3e', seance:'S02', titre:'Objets techniques', url:'/cours/s02/' };
const teacher = { status:'authenticated', user:{id:'prof'}, profile:{role:'teacher'} };
const pupil = { status:'authenticated', user:{id:'a'}, profile:{role:'student', etablissement:'college',classe:'3e'} };

class Node {
    constructor(tag = '') { this.tagName = tag; this.children=[]; this.dataset={}; this.events=new Map(); this.hidden=false; this.disabled=false; this.value=''; this.textContent=''; this.attributes={}; }
    append(...children) { this.children.push(...children); }
    replaceChildren(...children) { this.children = children; if(this.tagName==='select')this.value=children[0]?.value || ''; }
    add(child) { this.append(child); if(this.children.length===1)this.value=child.value; }
    addEventListener(type, fn) { this.events.set(type,fn); }
    removeEventListener(type, fn) { if(this.events.get(type)===fn)this.events.delete(type); }
    fire(type) { return this.events.get(type)?.({}); }
    setAttribute(key,value) { this.attributes[key]=value; }
    querySelectorAll(selector) {
        const all=this.children.flatMap(child=>child instanceof Node ? [child,...child.querySelectorAll('*')] : []);
        return all.filter(child=> selector==='*' || (selector==='button'&&child.tagName==='button') ||
            (selector==='fieldset'&&child.tagName==='fieldset') || (selector==='[data-answer-id]'&&child.dataset.answerId) || (selector==='input:checked'&&child.tagName==='input'&&child.checked));
    }
}

async function harness({ mode='teacher', enabled=true, session=teacher, rpc={}, queries={}, catalogue=[lesson], query='' }={}) {
    const ids= mode==='teacher' ? ['teacher-tracking', ...['status','subject','class','lesson','copies','preview','detail','feedback','correction','filters','identity','copy-status','finish','save','refresh','history'].map(x=>'tracking-'+x)] :
        mode==='group' ? ['course-collaboration','group-controls','group-status','group-copy','group-classmates','group-create','course-feedback','group-create-panel','group-refresh'] :
        mode==='roster' ? ['teacher-students','students-status','students-controls','students-class','students-refresh','students-list'] : ['student-invitations'];
    const nodes=new Map(ids.map(id=>[id,new Node(['tracking-subject','tracking-class','tracking-lesson','group-copy','students-class'].includes(id)?'select':'div')]));
    nodes.get(ids[0]).dataset.enabled=String(enabled);
    const catalogNode=new Node(); catalogNode.textContent=JSON.stringify(catalogue); nodes.set('seances-data',catalogNode);
    const classesNode=new Node();classesNode.textContent=JSON.stringify({college:{nom:'Collège',classes:[{id:'3e',nom:'3e'}]}});nodes.set('classes-data',classesNode);
    const controls={session,checks:0,calls:[],auth:null,interval:null};
    const db={
        auth:{onAuthStateChange(fn){controls.auth=fn;}},
        async rpc(name, params){ controls.calls.push({name,params}); return {data:await (rpc[name]?.(params) ?? []), error:null}; },
        from(table){ const filters=[]; const run=async()=>{controls.calls.push({table,filters}); const result=queries[table];
            if(typeof result==='function')return result(filters);
            return {data:result ?? (table==='teacher_class_assignments'?[lesson]:[]),error:null}; };
            return {select(){return this;},eq(k,v){filters.push([k,v]);return this;},maybeSingle:run,then(resolve,reject){return run().then(resolve,reject);} };
        }
    };
    const context=createContext({
        document:{visibilityState:'visible',getElementById:id=>nodes.get(id),createElement:tag=>new Node(tag),
            createTextNode:value=>value,importNode:node=>node},
        window:{location:{href:'http://local/prof/suivi/'+query},confirm:()=>false,addEventListener(){}},
        Option:class extends Node {constructor(label,value){super('option');this.textContent=label;this.value=value;}},
        URL, Date, setTimeout, clearTimeout, setInterval(fn){controls.interval=fn;return 1;},
        fetch:async()=>({ok:true,text:async()=>'<cours>'}),
        DOMParser:class {parseFromString(){return {querySelectorAll(){const wrapper=new Node('section');const field=new Node('textarea');field.dataset.answerId='q1';wrapper.append(field);return [wrapper];}};}}
    });
    const sessionModule=new SyntheticModule(['checkSession'],function(){this.setExport('checkSession',async()=>{controls.checks++;return controls.session;});},{context});
    const dbModule=new SyntheticModule(['db'],function(){this.setExport('db',db);},{context});
    const collaboration=new SourceTextModule(readFileSync(new URL('../assets/js/cours/collaboration.js',import.meta.url),'utf8'),{context});
    await collaboration.link(spec=>spec.includes('bdd-connect')?dbModule:sessionModule);
    await collaboration.evaluate();
    let module=collaboration;
    if(mode==='teacher'||mode==='roster') {
        module=new SourceTextModule(readFileSync(new URL(mode==='teacher'?'../assets/js/prof/prof-tracking.js':'../assets/js/prof/prof-students.js',import.meta.url),'utf8'),{context});
        const assisted = new SourceTextModule(readFileSync(new URL('../assets/js/prof/copy-correction.js',import.meta.url),'utf8'),{context});
        const grading = new SourceTextModule(readFileSync(new URL('../assets/js/prof/grade-editor.js',import.meta.url),'utf8'),{context});
        await grading.link(() => { throw new Error('unexpected_import'); });
        await assisted.link(spec => { if (spec === './grade-editor.js') return grading; throw new Error('unexpected_import'); });
        await module.link(spec=>spec.includes('bdd-connect')?dbModule:spec.includes('auth-session')?sessionModule:spec.includes('copy-correction')?assisted:collaboration);
        await module.evaluate();
    } else if(mode==='student') collaboration.namespace.initInvitations();
    await turn();
    return {nodes,controls,module,collaboration};
}

test('fonction désactivée : aucune lecture de profil, invitation ou copie',async()=>{
    for(const mode of ['teacher','student']) {
        const h=await harness({mode,enabled:false}); assert.equal(h.controls.checks,0);assert.equal(h.controls.calls.length,0);
    }
});

test('professeur : seules les séances de ses affectations sont proposées',async()=>{
    const h=await harness({catalogue:[lesson,{...lesson,classe:'4e',url:'/cours/4e/'}]});
    assert.equal(h.nodes.get('tracking-lesson').children.length,1);
    assert.equal(h.nodes.get('tracking-filters').disabled,false);
    const call=h.controls.calls.find(row=>row.name==='refonte_teacher_copies');
    assert.equal(call.params.p_class,'3e');
    const unauthorized=await harness({session:pupil});assert.equal(unauthorized.controls.calls.length,0);
});

test('copie professeur : réponses en lecture seule, commentaire réservé à cette copie et clôture',async()=>{
    const copy={copy_id:42,max_members:2,participants:'Alex, Billie',answer_count:1,terminee:false};
    const h=await harness({rpc:{refonte_teacher_copies:()=>[copy]},queries:{
        work_answers:[{question_key:'q1',reponse:'texte du groupe'}],work_feedback:{commentaire:'ancien retour'}
    }});
    await h.nodes.get('tracking-copies').children[0].fire('click');await turn();
    const field=h.nodes.get('tracking-preview').querySelectorAll('[data-answer-id]')[0];
    assert.equal(field.value,'texte du groupe');assert.equal(field.disabled,true);
    assert.equal(h.nodes.get('tracking-feedback').value,'ancien retour');
    h.nodes.get('tracking-feedback').value='À préciser';await h.nodes.get('tracking-save').fire('click');await turn();
    const saved=h.controls.calls.find(call=>call.name==='refonte_save_feedback');assert.equal(saved.params.p_copy,42);assert.equal(saved.params.p_comment,'À préciser');
    await h.nodes.get('tracking-finish').fire('click');await turn();
    assert.equal(h.nodes.get('tracking-finish').textContent,'Rouvrir la copie');
    assert.equal(h.controls.calls.find(call=>call.name==='refonte_finish_copy').params.p_finished,true);
    assert.equal(h.controls.calls.some(call=>call.table==='work_answers'&&call.action==='update'),false);
});

test('tableau des notes : lien direct vers une copie historique',async()=>{
    const h=await harness({query:'?matiere=techno&etablissement=college&classe=3e&seance=S02&copie=42&historique=1',
        rpc:{refonte_teacher_copies:()=>[{copy_id:42,max_members:1,participants:'Alex',terminee:true}]},
        queries:{work_answers:[{question_key:'q1',reponse:'Réponse conservée'}]}});
    await turn();
    assert.equal(h.nodes.get('tracking-history').checked,true);
    assert.equal(h.controls.calls.find(call=>call.name==='refonte_teacher_copies').params.p_history,true);
    assert.equal(h.nodes.get('tracking-preview').querySelectorAll('[data-answer-id]')[0].value,'Réponse conservée');
});

test('professeur : réponse reçue après déconnexion non affichée',async()=>{
    const pending=deferred();
    const h=await harness({rpc:{refonte_teacher_copies:()=>[{copy_id:42}]},queries:{work_answers:()=>pending.promise}});
    const reading=h.nodes.get('tracking-copies').children[0].fire('click');
    h.controls.session={status:'not_authenticated'};h.controls.auth('SIGNED_OUT',null);
    pending.resolve({data:[{question_key:'q1',reponse:'privé'}],error:null});await reading;await turn();
    assert.equal(h.nodes.get('tracking-preview').children.length,0);assert.equal(h.nodes.get('tracking-feedback').value,'');
    assert.equal(h.nodes.get('tracking-detail').hidden,true);
});

test('professeur : échec d’enregistrement ne fait pas perdre le commentaire',async()=>{
    const h=await harness({rpc:{refonte_teacher_copies:()=>[{copy_id:42}],refonte_save_feedback:()=>{throw new Error('réseau');}},
        queries:{work_answers:[],work_feedback:{commentaire:''}}});
    await h.nodes.get('tracking-copies').children[0].fire('click');await turn();
    h.nodes.get('tracking-feedback').value='mon commentaire';await h.nodes.get('tracking-save').fire('click');await turn();
    assert.equal(h.nodes.get('tracking-feedback').value,'mon commentaire');assert.equal(h.nodes.get('tracking-correction').disabled,false);
    assert.match(h.nodes.get('tracking-status').textContent,/non confirmée/);
});

test('élève : consentement explicite, refus indépendant, accès aux anciens groupes',async()=>{
    const invitation={...lesson,invitation_id:7,invited_by:'Alex'};
    const h=await harness({mode:'student',session:pupil,rpc:{refonte_invitations:()=>[invitation],
        refonte_my_groups:()=>[{...lesson,copy_id:42,participants:'Alex, Billie'}],refonte_reply_invitation:()=>42}});
    assert.equal(h.controls.calls.some(call=>call.name==='refonte_reply_invitation'),false);
    const root=h.nodes.get('student-invitations');const buttons=root.querySelectorAll('button');
    assert.equal(buttons.length,2);await buttons[0].fire('click');
    const reply=h.controls.calls.find(call=>call.name==='refonte_reply_invitation');assert.equal(reply.params.p_accept,true);
    assert.ok(root.querySelectorAll('*').some(node=>node.href==='/cours/s02/?copie=42'));
    h.controls.auth('SIGNED_OUT',null);assert.equal(root.hidden,true);assert.equal(root.children.length,0);
});

test('élève : une invitation tardive ne réapparaît pas après déconnexion',async()=>{
    const pending=deferred();const h=await harness({mode:'student',session:pupil,rpc:{refonte_invitations:()=>pending.promise}});
    h.controls.auth('SIGNED_OUT',null);pending.resolve([{...lesson,invitation_id:7,invited_by:'Alex'}]);await turn();
    assert.equal(h.nodes.get('student-invitations').children.length,0);
});

test('création du groupe : une ou deux personnes, invitations puis ouverture explicite de la copie',async()=>{
    const h=await harness({mode:'group',session:pupil,rpc:{refonte_my_groups:()=>[],
        refonte_classmates:()=>[{user_id:'b',prenom:'Billie',nom:'Fictif'},{user_id:'c',prenom:'Charlie',nom:'Fictif'}],
        refonte_create_group:()=>42}});
    let chosen=null;
    const controller=await h.collaboration.namespace.initCourseGroups({course:lesson,selectedCopy:null,onChoose:async id=>{chosen=id;return true;}});
    await h.nodes.get('group-create').fire('click');
    assert.equal(h.controls.calls.some(call=>call.name==='refonte_create_group'),false);
    h.nodes.get('group-classmates').children[0].children[0].checked=true;
    await h.nodes.get('group-create').fire('click');
    assert.deepEqual([...h.controls.calls.find(call=>call.name==='refonte_create_group').params.p_invitees],['b']);
    assert.equal(chosen,'42');controller.dispose();assert.equal(h.nodes.get('group-create').events.size,0);
});

test('liste des camarades reçue après changement de compte : aucun nom affiché ni ancien gestionnaire conservé',async()=>{
    const pending=deferred();let active=true;
    const h=await harness({mode:'group',session:pupil,rpc:{refonte_classmates:()=>pending.promise}});
    const loading=h.collaboration.namespace.initCourseGroups({course:lesson,isCurrent:()=>active,onChoose:async()=>true});
    await turn();active=false;pending.resolve([{user_id:'b',prenom:'privé',nom:'privé'}]);await loading;
    assert.equal(h.nodes.get('group-classmates').children.length,0);assert.equal(h.nodes.get('group-create').events.size,0);
});

test('historique professeur distinct, consultable sans boutons de correction actifs',async()=>{
    const h=await harness({rpc:{refonte_teacher_copies:params=>params.p_history ?
        [{copy_id:12,participants:'Alex',is_history:true,answer_count:1}] : [{copy_id:42,participants:'Alex, Billie'}]},
        queries:{work_answers:[{question_key:'q1',reponse:'mon ancien travail'}],work_feedback:{commentaire:''}}});
    h.nodes.get('tracking-history').checked=true;h.nodes.get('tracking-history').fire('change');await turn();
    assert.match(h.nodes.get('tracking-copies').children[0].textContent,/Historique individuel/);
    await h.nodes.get('tracking-copies').children[0].fire('click');await turn();
    assert.equal(h.nodes.get('tracking-correction').disabled,true);assert.equal(h.nodes.get('tracking-correction').hidden,true);
    await h.nodes.get('tracking-save').fire('click');assert.equal(h.controls.calls.some(c=>c.name==='refonte_save_feedback'),false);
});

test('groupe de référence et historique individuel présentés séparément au participant',async()=>{
    const h=await harness({mode:'group',session:pupil,rpc:{refonte_my_groups:()=>[{copy_id:42,participants:'Alex, Billie'}]},queries:{work_sessions:{id:12}}});
    const controller=await h.collaboration.namespace.initCourseGroups({course:lesson,selectedCopy:'42',onChoose:async()=>true});
    const options=h.nodes.get('group-copy').children;
    assert.deepEqual(options.map(o=>o.value),['__history__','42']);
    assert.equal(h.nodes.get('group-create-panel').hidden,true);controller.dispose();
});

test('invitations non envoyées si les dernières réponses ne sont pas enregistrées',async()=>{
    const h=await harness({mode:'group',session:pupil,rpc:{refonte_classmates:()=>[{user_id:'b',prenom:'Billie',nom:'Fictif'}]}});
    const controller=await h.collaboration.namespace.initCourseGroups({course:lesson,onChoose:async()=>true,beforeCreate:async()=>false});
    h.nodes.get('group-classmates').children[0].children[0].checked=true;
    await h.nodes.get('group-create').fire('click');assert.equal(h.controls.calls.some(c=>c.name==='refonte_create_group'),false);controller.dispose();
});

test('gestion élèves : validation explicite, état attendu envoyé et liste actualisée',async()=>{
    let approved=false;
    const row={user_id:'a',prenom:'Alex',nom:'Fictif',etablissement:'college',classe:'3e',enrollment_status:'pending'};
    const h=await harness({mode:'roster',rpc:{refonte_students:()=>[{...row,enrollment_status:approved?'approved':'pending'}],refonte_update_student:()=>{approved=true;}}});
    const buttons=h.nodes.get('students-list').querySelectorAll('button');assert.equal(buttons.length,2);
    assert.equal(h.controls.calls.some(c=>c.name==='refonte_update_student'),false);
    await buttons[1].fire('click');
    const call=h.controls.calls.find(c=>c.name==='refonte_update_student');
    assert.equal(call.params.p_approve,true);assert.equal(call.params.p_expected_status,'pending');assert.equal(call.params.p_student,'a');
    assert.match(h.nodes.get('students-status').textContent,/validée/);
});

test('gestion élèves : réponse reçue après déconnexion ne révèle aucun nom',async()=>{
    const pending=deferred();const h=await harness({mode:'roster',rpc:{refonte_students:()=>pending.promise}});
    h.controls.auth('SIGNED_OUT',null);pending.resolve([{prenom:'Privé',nom:'Privé'}]);await turn();
    assert.equal(h.nodes.get('students-list').children.length,0);assert.equal(h.nodes.get('students-controls').disabled,true);
});

test('élève en attente : aucune invitation chargée avant validation',async()=>{
    const h=await harness({mode:'student',session:{...pupil,profile:{...pupil.profile,enrollment_status:'pending'}}});
    assert.equal(h.controls.calls.length,0);assert.match(h.nodes.get('student-invitations').children[0].textContent,/validation/);
});
