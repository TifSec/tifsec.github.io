import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createContext, SourceTextModule } from 'node:vm';
class Element {
    constructor(tag='div') { this.tagName=tag.toUpperCase();this.children=[];this.events={};this.dataset={};this.value='';this.textContent=''; }
    append(...children) { for(const child of children){child.remove();this.children.push(child);child.parentNode=this;} }
    insertBefore(child,ref) { child.remove();const index=this.children.indexOf(ref);this.children.splice(index<0?this.children.length:index,0,child);child.parentNode=this; }
    remove() { if(this.parentNode)this.parentNode.children=this.parentNode.children.filter(child=>child!==this);this.parentNode=null; }
    get nextSibling() { return this.parentNode?.children[this.parentNode.children.indexOf(this)+1]||null; }
    querySelectorAll(selector) { return this.children.flatMap(child=>[...(selector==='[data-answer-id]'?child.dataset.answerId:selector.startsWith('.')?child.className?.split(' ').includes(selector.slice(1)):child.tagName===selector.toUpperCase())?[child]:[],...child.querySelectorAll(selector)]); }
    setAttribute() {}
    addEventListener(name,fn) { this.events[name]=fn; }
}
const teacher={status:'authenticated',user:{id:'teacher'},profile:{role:'teacher'}};
const proposal={copy_id:'12',cours:{version:'v1'},empreinte_corrige:'a'.repeat(64),revisions_reponses:[],bareme_complet:true,maximum_total:20,
    resultats:[{cle:'q1',maximum:12,points_proposes:6,etat:'a_examiner'},{cle:'q2',maximum:8,points_proposes:8,etat:'correcte'}]};
async function harness(enabled=true) {
    const ids=['copy-grade','copy-grade-total','copy-grade-status','copy-grade-validate'];
    const nodes=new Map(ids.map(id=>[id,new Element()]));nodes.get('copy-grade').dataset.enabled=String(enabled);
    const control={session:teacher,calls:[],validated:[],response:{data:{validated:true,copy_id:'12',evaluation_id:'42',total:17,marks:[]},error:null}};
    const context=createContext({document:{getElementById:id=>nodes.get(id),createElement:tag=>new Element(tag)}});
    const module=new SourceTextModule(readFileSync(new URL('../assets/js/prof/grade-editor.js',import.meta.url),'utf8'),{context});await module.link(()=>{});await module.evaluate();
    const editor=module.namespace.initGradeEditor({db:{functions:{async invoke(name,config){control.calls.push({name,config});return await control.response;}}},
        checkSession:async()=>control.session,onValidated:value=>control.validated.push(value)});
    editor.begin(proposal,'teacher');const parents=proposal.resultats.map((row,index)=>{const parent=new Element();const answer=new Element(index?'select':'textarea');answer.dataset.answerId=row.cle;parent.append(answer);editor.attach(parent,row);return parent;});
    const inputs=parents.map(parent=>parent.querySelectorAll('input')[0]);const comments=parents.map(parent=>parent.querySelectorAll('.copy-grade-comment')[0].querySelectorAll('textarea')[0]);
    return {editor,module,control,nodes,parents,inputs,comments,button:nodes.get('copy-grade-validate')};
}
test('saisie : virgule autorisée, absence et hors barème refusés, partiel non imposé',async()=>{
    const h=await harness();const parse=h.module.namespace.parseGrade;
    assert.equal(parse('1,5',2),1.5);for(const value of ['', '-1','3','1e0','NaN','0.0000001'])assert.equal(parse(value,2),null);
    assert.equal(h.inputs[0].value,'');assert.equal(h.inputs[1].value,'8');assert.equal(h.button.disabled,true);
    h.inputs[0].value='9,5';h.inputs[0].events.input();assert.equal(h.editor.hasDraft(),true);assert.equal(h.button.disabled,false);
    assert.match(h.nodes.get('copy-grade-total').textContent,/17,5 \/ 20/);
});
test('activation non validée : brouillon possible, aucune écriture distante',async()=>{
    const h=await harness(false);h.inputs[0].value='9';h.inputs[0].events.input();
    assert.equal(h.button.disabled,true);await h.button.events.click();assert.equal(h.control.calls.length,0);
    assert.match(h.nodes.get('copy-grade-status').textContent,/attendent/);
});
test('validation : points, appréciation et révisions envoyés ; succès verrouillé',async()=>{
    const h=await harness();h.inputs[0].value='9';h.inputs[0].events.input();h.comments[0].value='À approfondir';
    await h.button.events.click();assert.equal(h.control.calls[0].name,'teacher-grade');
    assert.equal(h.control.calls[0].config.body.marks[0].points,9);assert.equal(h.control.calls[0].config.body.marks[0].commentaire,'À approfondir');
    assert.equal(h.control.validated.length,1);assert.equal(h.editor.hasDraft(),false);assert.equal(h.button.disabled,true);assert.equal(h.inputs[0].disabled,true);
    assert.match(h.nodes.get('copy-grade-status').textContent,/enregistrées/);
});
test('erreur de validation : brouillon conservé et nouvelle tentative possible',async()=>{
    const h=await harness();h.control.response={error:new Error('private remote detail')};h.inputs[0].value='9';h.inputs[0].events.input();
    await h.button.events.click();assert.equal(h.editor.hasDraft(),true);assert.equal(h.inputs[0].value,'9');assert.equal(h.inputs[0].disabled,false);
    assert.equal(h.control.validated.length,0);assert.match(h.nodes.get('copy-grade-status').textContent,/non confirmée/);
});
test('changement de compte avant ou pendant validation : résultat tardif ignoré',async()=>{
    const h=await harness();h.inputs[0].value='9';h.inputs[0].events.input();
    let resolve;h.control.response=new Promise(done=>{resolve=done;});const pending=h.button.events.click();await new Promise(done=>setImmediate(done));
    h.editor.clear();resolve({data:{validated:true,copy_id:'12',total:17}});await pending;
    assert.equal(h.control.validated.length,0);assert.equal(h.nodes.get('copy-grade').hidden,true);
});
test('note déjà validée : points et appréciations restaurés en lecture seule',async()=>{
    const h=await harness();h.editor.begin(proposal,'teacher',{total:13,marks:[{cle:'q1',points:5,commentaire:'Ancienne appréciation'}]});
    const parent=new Element();const answer=new Element('textarea');answer.dataset.answerId='q1';parent.append(answer);h.editor.attach(parent,proposal.resultats[0]);
    assert.equal(parent.querySelectorAll('input')[0].value,'5');assert.equal(parent.querySelectorAll('input')[0].disabled,true);
    assert.equal(parent.querySelectorAll('.copy-grade-comment')[0].querySelectorAll('textarea')[0].value,'Ancienne appréciation');assert.equal(h.button.disabled,true);
    assert.match(h.nodes.get('copy-grade-total').textContent,/13 \/ 20/);
});

test('placement : note sous le texte, à côté du QCM, appréciations repliées',async()=>{
    const h=await harness();
    assert.equal(h.parents[0].children[0].tagName,'TEXTAREA');
    assert.match(h.parents[0].children[1].className,/copy-grade-points/);
    assert.equal(h.parents[1].children[0].className,'copy-answer-score');
    assert.equal(h.parents[1].children[0].children[0].tagName,'SELECT');
    for(const parent of h.parents)assert.equal(parent.querySelectorAll('.copy-grade-comment')[0].open,false);
    h.editor.clear();assert.deepEqual(h.parents[1].children.map(child=>child.tagName),['SELECT']);
});

test('tableau : notes par case, appréciation globale et détail conservé pour la validation',async()=>{
    const h=await harness();
    const tableRow={...proposal.resultats[0],resultats_cellules:[{champ:'cell1',maximum:6,points_proposes:6},{champ:'cell2',maximum:6,points_proposes:null}]};
    h.editor.begin({...proposal,resultats:[tableRow,proposal.resultats[1]]},'teacher');
    const table=new Element();for(const key of ['cell1','cell2']){const cell=new Element('td'),answer=new Element('input');answer.dataset.answerId=key;cell.append(answer);table.append(cell);}
    h.editor.attach(table,tableRow);
    const gradeInputs=table.querySelectorAll('.copy-grade-points').map(label=>label.querySelectorAll('input')[0]);
    assert.equal(gradeInputs.length,2);assert.equal(gradeInputs[0].value,'6');assert.equal(gradeInputs[1].value,'');
    assert.equal(table.querySelectorAll('.copy-grade-comment').length,1);assert.equal(table.querySelectorAll('.copy-grade-comment')[0].open,false);
    gradeInputs[1].value='3';gradeInputs[1].events.input();
    const scalar=new Element();const answer=new Element('select');answer.dataset.answerId='q2';scalar.append(answer);h.editor.attach(scalar,proposal.resultats[1]);
    await h.button.events.click();const marks=h.control.calls[0].config.body.marks;
    assert.equal(marks[0].points,9);assert.deepEqual(JSON.parse(JSON.stringify(marks[0].details)),[{cle:'cell1',maximum:6,points:6},{cle:'cell2',maximum:6,points:3}]);
    h.editor.clear();assert.equal(table.querySelectorAll('.copy-answer-score').length,0);assert.equal(table.querySelectorAll('[data-answer-id]').length,2);
});
