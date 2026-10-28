import test from 'node:test';
import assert from 'node:assert/strict';
import { checkShortAnswer, checkManualTable } from '../_supabase/functions/_shared/answer-dictionary.mjs';
import { prepareCopyProposal } from '../_supabase/functions/teacher-correction/proposal.mjs';
const short={activite:'a',id:'q1',cle:'a_q1',type:'texte',champs:['a_q1']};
const shortRule={activite:'a',question:'q1',mode:'professeur',points:1,reponses_acceptees:['échantillon B']};
const table={activite:'a',id:'q2',cle:'a_q2',type:'tableau',champs:['x','y']};
const tableRule={activite:'a',question:'q2',mode:'professeur',points:0.3,repartition:[{champ:'x',points:0.1},{champ:'y',points:0.2}]};
test('réponse courte : reconnaissance entière seulement, inconnue laissée au professeur',()=>{
    assert.equal(checkShortAnswer(short,shortRule,' ÉCHANTILLON B ').points_proposes,1);
    for(const value of ['pas échantillon B','échantillon B ou autre','échantillon','échantillon B.']) {
        const result=checkShortAnswer(short,shortRule,value);assert.equal(result.etat,'a_examiner');assert.equal(result.points_proposes,null);
    }
    assert.equal(checkShortAnswer(short,shortRule,'').etat,'sans_reponse');
});
test('réponse courte : variantes invalides ou plusieurs champs refusés',()=>{
    for(const reponses_acceptees of [[],[' '],[42]]) assert.throws(()=>checkShortAnswer(short,{...shortRule,reponses_acceptees},'exemple'));
    assert.throws(()=>checkShortAnswer({...short,champs:['x','y']},shortRule,'exemple'));
});
test('tableau manuel : points par case sans proposition ni zéro automatique',()=>{
    const result=checkManualTable(table,tableRule,new Map([['x','Justification fictive']]));
    assert.equal(result.maximum,0.3);assert.equal(result.points_proposes,null);
    assert.deepEqual(result.resultats_cellules.map(cell=>cell.maximum),[0.1,0.2]);
    assert.equal(result.resultats_cellules[0].etat,'a_examiner');assert.equal(result.resultats_cellules[1].etat,'sans_reponse');
});
test('tableau manuel : doublons, case étrangère et somme inexacte refusés',()=>{
    for(const repartition of [[],[tableRule.repartition[0],tableRule.repartition[0]],[{champ:'z',points:0.1},tableRule.repartition[1]],
        [{champ:'x',points:0.2},tableRule.repartition[1]]]) assert.throws(()=>checkManualTable(table,{...tableRule,repartition},new Map()));
});
test('proposition mixte : barème complet mais décision manuelle et appréciation réservées au professeur',()=>{
    const schema={seance:'DEMO',version:'v1',questions:[short,table]};
    const content={seance:'DEMO',version_cours:'v1',correction:[shortRule,{...tableRule,points:19,repartition:[{champ:'x',points:9},{champ:'y',points:10}]}]};
    const result=prepareCopyProposal(schema,content,[{question_key:'a_q1',reponse:'échantillon B',revision:1},{question_key:'x',reponse:'Exemple fictif',revision:1}]);
    assert.equal(result.maximum_total,20);assert.equal(result.points_automatiques,1);assert.equal(result.note_finale,null);
    assert.match(result.resultats[1].aide_professeur.attribution,/Aucun point automatique/);
});
