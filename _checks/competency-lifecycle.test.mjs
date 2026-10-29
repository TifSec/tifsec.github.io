import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
const read = file => readFileSync(new URL(file, import.meta.url), 'utf8');
const load = file => import('data:text/javascript;base64,' + Buffer.from(read(file)).toString('base64'));
const { dashboardModel } = await load('../assets/js/eleve/dashboard-model.js');
const { competencyOverview } = await load('../assets/js/eleve/student-competencies.js');
const html = read('../_site/eleve/index.html');
const json = id => JSON.parse(html.match(new RegExp('<script id="'+id+'"[^>]*>([\\s\\S]*?)</script>'))[1]);
const catalogue = json('seances-data'), references = json('referentiels-data'), mappings = json('competences-evaluees-data');
const A='00000000-0000-0000-0000-000000000001', B='00000000-0000-0000-0000-000000000002', T='00000000-0000-0000-0000-000000000003';
async function actor(db, id) { await db.exec('reset role; set role authenticated'); await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]); }
// Trois questions de la vraie séance 3e S02 reliées à la première compétence du référentiel (progression 2026).
const firstSkill = references.find(row => row.id === 'techno-cycle4-2024').themes[0].competences[0].id;
const s02 = mappings.find(row => row.matiere === 'techno' && row.classe === '3e' && row.seance === 'S02');
const KEYS = Object.entries(s02.questions).filter(([, skills]) => skills.includes(firstSkill)).map(([key]) => key).slice(0, 3);
const marks = points => points.map((score,i) => ({ cle: KEYS[i], points: score, maximum: [12,6,2][i], commentaire: '' }));
const grade = (db,id,points,revision) => db.query('select refonte_validate_grade($1,$2,$3,$4::jsonb,$5::jsonb,null,null)',[id,'v1','a'.repeat(64),JSON.stringify([{cle:KEYS[1],revision:String(revision)}]),JSON.stringify(marks(points))]);
async function overview(db,userId) {
    const data = {};
    for (const [key,table] of [['copies','work_sessions'],['answers','work_answers'],['feedback','work_feedback'],['evaluations','work_evaluations']]) data[key]=(await db.query('select * from '+table)).rows;
    const profile = {etablissement:'college',classe:'3e'};
    const model=dashboardModel({catalogue,profile,userId,...data});
    return competencyOverview(references,profile,model.lessons,mappings,userId)[0].themes[0].competences[0].results;
}
test('parcours complet notes → RLS → accueil → segments et réouverture, sur copies fictives',async t=>{
    const db=new PGlite();
    try {
        for(const file of ['./work-fixture.sql','../_supabase/01_copies_individuelles.sql','../_supabase/03_groupes_et_suivi.sql','../_supabase/05_copie_reference_et_historique.sql','../_supabase/07_validation_eleves.sql','../_supabase/09_notation.sql','../_supabase/11_remise.sql']) await db.exec(read(file));
        await actor(db,A);
        const copy=(await db.query("insert into work_sessions(etablissement,matiere,classe,seance,created_by) values('college','techno','3e','S02',$1) returning id",[A])).rows[0].id;
        await db.query("insert into work_answers(work_session_id,question_key,reponse) values($1,$2,'Réponse fictive')",[copy,KEYS[1]]);
        await t.test('pas de résultat avant validation professeur',async()=>{assert.equal((await overview(db,A)).individual.percent,null);});
        await actor(db,T);await grade(db,copy,[6,3,1],1);await actor(db,A);
        await t.test('note de 10/20 retrouvée à 50 % dans le référentiel réel S02',async()=>{
            const result=await overview(db,A);assert.equal(result.individual.percent,50);assert.equal(result.individual.entries.length,3);assert.equal(result.collective.percent,null);
        });
        await t.test('autre élève : aucune contribution de la copie étrangère',async()=>{
            await actor(db,B);assert.equal((await db.query('select * from work_evaluations')).rows.length,0);assert.equal((await overview(db,B)).individual.percent,null);
        });
        await t.test('réouverture : retrait du résultat et reprise des réponses',async()=>{
            await actor(db,T);await db.query('select refonte_finish_copy($1,false)',[copy]);await actor(db,A);
            assert.equal((await overview(db,A)).individual.percent,null);
            await db.query("update work_answers set reponse='Complément fictif' where work_session_id=$1",[copy]);
        });
        await t.test('nouvelle validation : nouveau résultat seul, historique non moyenné',async()=>{
            await actor(db,T);await grade(db,copy,[9,6,2],2);await actor(db,A);
            const result=await overview(db,A);assert.equal(result.individual.percent,85);assert.equal(result.individual.copies,1);
        });
        await actor(db,T);await db.query('select refonte_finish_copy($1,false)',[copy]);await actor(db,A);
        const group=(await db.query("select refonte_create_group('college','techno','3e','S02',$1::uuid[]) as id",[[B]])).rows[0].id;
        await actor(db,B);const invite=(await db.query('select id from work_session_members where work_session_id=$1 and user_id=$2',[group,B])).rows[0].id;
        await t.test('invité en attente : copie commune invisible',async()=>{
            assert.equal((await db.query('select * from work_sessions where id=$1',[group])).rows.length,0);
        });
        await db.query('select refonte_reply_invitation($1,true)',[invite]);await actor(db,T);await grade(db,group,[6,3,1],1);
        await t.test('consentement accepté : même résultat collectif pour les deux élèves',async()=>{
            for(const user of [A,B]){await actor(db,user);const result=await overview(db,user);assert.equal(result.collective.percent,50);assert.equal(result.collective.copies,1);assert.equal(result.individual.percent,null);}
        });
    } finally { await db.close(); }
});
