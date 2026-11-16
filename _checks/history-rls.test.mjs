import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
const read = name => readFileSync(new URL(name, import.meta.url), 'utf8');
const A='00000000-0000-0000-0000-000000000001', B='00000000-0000-0000-0000-000000000002', T='00000000-0000-0000-0000-000000000003';
async function actor(db,uid) { await db.exec('reset role; set role authenticated'); await db.query("select set_config('request.jwt.claim.sub',$1,false)",[uid]); }
const denied = promise => assert.rejects(promise,error=>error.code==='42501');
const individual = async (db,uid,lesson='S02') => (await db.query("insert into work_sessions(created_by,etablissement,matiere,classe,seance,max_members) values($1,'college','techno','3e',$2,1) returning id",[uid,lesson])).rows[0].id;
const answer = (db,id,value) => db.query("insert into work_answers(work_session_id,question_key,reponse) values($1,'q1',$2)",[id,value]);
test('copie de référence et historique individuel sur PostgreSQL',async t=>{
    const db = new PGlite();
    try {
        await db.exec(read('./work-fixture.sql')); await db.exec(read('../_supabase/01_copies_individuelles.sql')); await db.exec(read('../_supabase/03_groupes_et_suivi.sql'));
        await db.exec(read('../_supabase/05_copie_reference_et_historique.sql'));
        let a,b,g,inv;
        await t.test('le travail déjà commencé devient le point de départ collectif',async()=>{
            await actor(db,A);a=await individual(db,A);await answer(db,a,'début de A');
            await actor(db,B);b=await individual(db,B);await answer(db,b,'début de B');
            await actor(db,A);
            g=(await db.query("select refonte_create_group('college','techno','3e','S02',$1::uuid[]) as id",[[B]])).rows[0].id;
            assert.equal((await db.query('select reponse from work_answers where work_session_id=$1',[g])).rows[0].reponse,'début de A');
            assert.equal((await db.query('select reponse from work_answers where work_session_id=$1',[a])).rows[0].reponse,'début de A');
            inv=(await db.query('select id from work_session_members where work_session_id=$1 and user_id=$2',[g,B])).rows[0].id;
        });
        await t.test('créateur : historique immédiatement figé et plus de copie individuelle parallèle',async()=>{
            assert.equal((await db.query("update work_answers set reponse='interdit' where work_session_id=$1 returning id",[a])).rows.length,0);
            await denied(answer(db,a,'autre'));await denied(individual(db,A));
        });
        await t.test('avant consentement : individuel encore modifiable et collectif invisible',async()=>{
            await actor(db,B);
            assert.equal((await db.query('select * from work_answers where work_session_id=$1',[g])).rows.length,0);
            await db.query("update work_answers set reponse='B avant acceptation' where work_session_id=$1",[b]);
        });
        await t.test('acceptation : historique personnel conservé, sans fusion dans le collectif',async()=>{
            await db.query('select refonte_reply_invitation($1,true)',[inv]);
            assert.equal((await db.query('select reponse from work_answers where work_session_id=$1',[b])).rows[0].reponse,'B avant acceptation');
            assert.equal((await db.query('select reponse from work_answers where work_session_id=$1',[g])).rows[0].reponse,'début de A');
            assert.equal((await db.query("update work_answers set reponse='ancien onglet' where work_session_id=$1 returning id",[b])).rows.length,0);
            await denied(individual(db,B));
            assert.equal((await db.query("update work_answers set reponse='suite commune' where work_session_id=$1 returning id",[g])).rows.length,1);
        });
        await t.test('un autre participant ne lit jamais l’historique personnel de son camarade',async()=>{
            assert.equal((await db.query('select * from work_answers where work_session_id=$1',[a])).rows.length,0);
        });
        await t.test('professeur : collectif à corriger, deux individuels dans l’historique',async()=>{
            await actor(db,T);
            const active=(await db.query("select * from refonte_teacher_copies('college','techno','3e','S02')")).rows;
            const history=(await db.query("select * from refonte_teacher_copies('college','techno','3e','S02',true)")).rows;
            assert.deepEqual(active.map(r=>r.copy_id),[g]); assert.equal(active[0].is_history,false);
            assert.deepEqual(history.map(r=>r.copy_id).sort(),[a,b].sort()); assert.ok(history.every(r=>r.is_history));
        });
        await t.test('séance suivante individuelle indépendante et historique impossible à rouvrir pour écrire',async()=>{
            await db.query('select refonte_finish_copy($1,false)',[a]);await actor(db,A);
            assert.equal((await db.query("update work_answers set reponse='historique réouvert' where work_session_id=$1 returning id",[a])).rows.length,0);
            const next=await individual(db,A,'S03');await answer(db,next,'travail individuel S03');
        });
        await t.test('contrôle transactionnel complet sans conserver de copie de contrôle',async()=>{
            await db.exec('reset role');await db.exec(read('../_supabase/06_verification_historique_transactionnelle.sql'));
            assert.equal((await db.query("select count(*)::int as n from work_sessions where seance like '__verification_historique_%'")).rows[0].n,0);
        });
        await t.test('suspension conserve aussi les historiques et ferme les nouvelles fonctions',async()=>{
            await db.exec('reset role');await db.exec(read('../_supabase/91_suspendre_groupes_et_suivi.sql'));
            await actor(db,A);await denied(db.query('select * from work_answers'));await denied(db.query('select refonte_private.individual_is_history($1)',[a]));
        });
    } finally { await db.close(); }
});
