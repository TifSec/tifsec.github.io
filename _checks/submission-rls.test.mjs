import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
const A='00000000-0000-0000-0000-000000000001',B='00000000-0000-0000-0000-000000000002',T='00000000-0000-0000-0000-000000000003';
const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
async function actor(db,id,role='authenticated') { await db.exec('reset role;set role '+role);await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]); }
const snapshot=[{cle:'q1',revision:'1'}];
const submit=(db,id,revision=snapshot)=>db.query('select refonte_submit_copy($1,$2::jsonb) as ok',[id,JSON.stringify(revision)]);

test('remise élève : sécurité et transitions sur PostgreSQL fictif',async t=>{
    const db=new PGlite();
    try {
        for(const path of ['./work-fixture.sql','../_supabase/01_copies_individuelles.sql','../_supabase/03_groupes_et_suivi.sql',
            '../_supabase/05_copie_reference_et_historique.sql','../_supabase/07_validation_eleves.sql','../_supabase/09_notation.sql','../_supabase/11_remise.sql']) await db.exec(read(path));
        await actor(db,A);
        const copy=(await db.query("insert into work_sessions(etablissement,matiere,classe,seance,created_by) values('college','techno','3e','S02',$1) returning id",[A])).rows[0].id;
        await db.query("insert into work_answers(work_session_id,question_key,reponse) values($1,'q1','Réponse fictive')",[copy]);
        await t.test('aucun droit direct de falsifier la remise ou de rouvrir',async()=>{
            await assert.rejects(db.query('update work_sessions set terminee=true,submitted_by=$1 where id=$2',[A,copy]),e=>e.code==='42501');
            await assert.rejects(db.query('select refonte_finish_copy($1,false)',[copy]),e=>e.code==='42501');
            await actor(db,B);await assert.rejects(submit(db,copy),e=>e.code==='42501');
            await actor(db,T);await assert.rejects(submit(db,copy),e=>e.code==='42501');
            await actor(db,'','anon');await assert.rejects(submit(db,copy),e=>e.code==='42501');await actor(db,A);
        });
        await t.test('révisions périmées : pas de remise ni de perte de saisie',async()=>{
            await assert.rejects(submit(db,copy,[]),e=>e.code==='40001');
            assert.equal((await db.query('select terminee from work_sessions where id=$1',[copy])).rows[0].terminee,false);
        });
        await t.test('déclaration atomique : auteur/date du serveur, réponses toujours modifiables',async()=>{
            assert.equal((await submit(db,copy)).rows[0].ok,true);
            const row=(await db.query('select * from work_sessions where id=$1',[copy])).rows[0];
            assert.equal(row.terminee,false);assert.equal(row.submitted_by,A);assert.ok(row.submitted_at);assert.equal(row.current_evaluation_id,null);
            assert.equal((await db.query('select count(*)::int as n from work_evaluations')).rows[0].n,0);
            assert.equal((await submit(db,copy)).rows[0].ok,true);
            assert.equal((await db.query("update work_answers set reponse='Après déclaration' where work_session_id=$1 returning id",[copy])).rows.length,1);
            assert.ok((await db.query('select submitted_at from work_sessions where id=$1',[copy])).rows[0].submitted_at);
        });
        await t.test('correction après remise : note indépendante ; une seconde remise ne la change pas',async()=>{
            await actor(db,T);
            const grade=(await db.query('select refonte_validate_grade($1,$2,$3,$4::jsonb,$5::jsonb,null,null) as id',
                [copy,'v1','a'.repeat(64),JSON.stringify([{cle:'q1',revision:'2'}]),JSON.stringify([{cle:'q1',points:12,maximum:20,commentaire:'Retour fictif'}])])).rows[0].id;
            await actor(db,A);await submit(db,copy,[{cle:'q1',revision:'2'}]);
            assert.equal((await db.query('select current_evaluation_id from work_sessions where id=$1',[copy])).rows[0].current_evaluation_id,grade);
            assert.equal((await db.query("update work_answers set reponse='Interdit après validation prof' where work_session_id=$1 returning id",[copy])).rows.length,0);
            await actor(db,T);await db.query('select refonte_finish_copy($1,false)',[copy]);
            const reopened=(await db.query('select * from work_sessions where id=$1',[copy])).rows[0];
            assert.equal(reopened.submitted_at,null);assert.equal(reopened.submitted_by,null);assert.equal(reopened.current_evaluation_id,null);
        });
        await t.test('groupe : invitation seule sans droit, acceptation requise, historique individuel protégé',async()=>{
            await actor(db,A);
            const group=(await db.query("select refonte_create_group('college','techno','3e','S02',$1::uuid[]) as id",[[B]])).rows[0].id;
            const invitation=(await db.query('select id from work_session_members where work_session_id=$1 and user_id=$2',[group,B])).rows[0].id;
            await actor(db,B);await assert.rejects(submit(db,group),e=>e.code==='42501');
            await db.query('select refonte_reply_invitation($1,true)',[invitation]);
            await actor(db,A);await assert.rejects(submit(db,copy),e=>e.code==='42501');
            await actor(db,B);await submit(db,group);
            await actor(db,A);assert.equal((await db.query('select terminee from work_sessions where id=$1',[group])).rows[0].terminee,false);
            assert.equal((await db.query("update work_answers set reponse='Complément du groupe' where work_session_id=$1 returning id",[group])).rows.length,1);
            await actor(db,T);await db.query('select refonte_finish_copy($1,true)',[group]);
            await actor(db,A);assert.equal((await db.query("update work_answers set reponse='Interdit après clôture prof' where work_session_id=$1 returning id",[group])).rows.length,0);
        });
        await t.test('recette transactionnelle et version des nouveaux cours',async()=>{
            await db.exec('reset role');
            const before=(await db.query('select count(*)::int as n from work_sessions')).rows[0].n;
            await db.exec(read('../_supabase/12_verification_remise_transactionnelle.sql'));
            assert.equal((await db.query('select count(*)::int as n from work_sessions')).rows[0].n,before);
            await actor(db,A);
            const row=(await db.query("insert into work_sessions(etablissement,matiere,classe,seance,created_by) values('college','techno','3e','S10R',$1) returning course_version",[A])).rows[0];
            assert.equal(row.course_version,'v1');
        });
        await t.test('copie vide et inscription en attente : remise refusée',async()=>{
            await actor(db,A);
            const empty=(await db.query("insert into work_sessions(etablissement,matiere,classe,seance,created_by) values('college','techno','3e','S03',$1) returning id",[A])).rows[0].id;
            await assert.rejects(submit(db,empty,[]),e=>e.code==='22023');
            await db.query("insert into work_answers(work_session_id,question_key,reponse) values($1,'q1','Réponse fictive')",[empty]);
            await db.exec('reset role');await db.query("update profiles set enrollment_status='pending' where user_id=$1",[A]);
            await actor(db,A);await assert.rejects(submit(db,empty),e=>e.code==='42501');
        });
    } finally {await db.close();}
});
