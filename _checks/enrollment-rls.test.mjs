import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
const read=n=>readFileSync(new URL(n,import.meta.url),'utf8');
const A='00000000-0000-0000-0000-000000000001', B='00000000-0000-0000-0000-000000000002', T='00000000-0000-0000-0000-000000000003', N='00000000-0000-0000-0000-000000000004', U='00000000-0000-0000-0000-000000000005';
async function actor(db,id,role='authenticated'){await db.exec('reset role; set role '+role);await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);}
const deny=p=>assert.rejects(p,e=>e.code==='42501');
const copy=(db,id,lesson)=>db.query("insert into work_sessions(created_by,etablissement,matiere,classe,seance,max_members) values($1,'college','techno','3e',$2,1) returning id",[id,lesson]);
const change=(db,id,school,classe,approve,oldSchool='college',oldClass='3e',status='pending')=>db.query('select refonte_update_student($1,$2,$3,$4,$5,$6,$7)',[id,school,classe,approve,oldSchool,oldClass,status]);
test('gestion des élèves, validation et protection des affectations',async t=>{
    const db=new PGlite();
    try{
        await db.exec(read('./work-fixture.sql'));
        await db.exec("grant insert on profiles to authenticated; grant update(classe,prenom,nom) on profiles to authenticated; create policy own_insert on profiles for insert to authenticated with check(user_id=auth.uid() and role='student'); create policy own_update on profiles for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());");
        for(const file of ['01_copies_individuelles','03_groupes_et_suivi','05_copie_reference_et_historique'])await db.exec(read('../_supabase/'+file+'.sql'));
        await actor(db,A);const old=(await copy(db,A,'S02')).rows[0].id;
        const g=(await db.query("select refonte_create_group('college','techno','3e','S02',$1::uuid[]) as id",[[B]])).rows[0].id;
        const invitation=(await db.query('select id from work_session_members where work_session_id=$1 and user_id=$2',[g,B])).rows[0].id;
        await actor(db,B);await db.query('select refonte_reply_invitation($1,true)',[invitation]);
        await actor(db,'','postgres');await db.exec(read('../_supabase/07_validation_eleves.sql'));
        await db.query('insert into auth.users values($1),($2)',[N,U]);
        await t.test('les comptes existants gardent leurs copies et groupes',async()=>{
            await actor(db,A);assert.equal((await db.query('select enrollment_status from profiles')).rows[0].enrollment_status,'legacy');
            assert.equal((await db.query('select * from work_sessions where id=$1',[g])).rows.length,1);
            await copy(db,A,'S03');
        });
        await t.test('inscription neuve en attente, sans auto-validation ni auto-affectation ultérieure',async()=>{
            await actor(db,N);await db.query("insert into profiles(user_id,prenom,nom,role,etablissement,classe) values($1,'Nouveau','Fictif','student','college','3e')",[N]);
            assert.equal((await db.query('select enrollment_status from profiles')).rows[0].enrollment_status,'pending');
            await deny(db.query("update profiles set enrollment_status='approved' where user_id=$1",[N]));
            await deny(db.query("update profiles set classe='4e' where user_id=$1",[N]));
            await deny(db.query("update profiles set role='teacher' where user_id=$1",[N]));
            await deny(copy(db,N,'S02'));
            await deny(db.query("select refonte_create_group('college','techno','3e','S02',$1::uuid[])",[[A]]));
            assert.equal((await db.query('select * from refonte_classmates()')).rows.length,0);
        });
        await t.test('un compte non validé ne peut pas être invité',async()=>{
            await actor(db,A);await deny(db.query("select refonte_create_group('college','techno','3e','S04',$1::uuid[])",[[N]]));
        });
        await t.test('professeur : listes limitées aux classes affectées, validation possible',async()=>{
            await actor(db,T);assert.equal((await db.query("select * from refonte_students('college','3e')")).rows.length,3);
            await deny(db.query("select * from refonte_students('college','inconnue')"));
            await change(db,N,'college','3e',true);
            await actor(db,N);await copy(db,N,'S02');
        });
        await t.test('changement de classe encadré et requête périmée refusée',async()=>{
            await actor(db,T);await change(db,N,'mfr','bts2',false,'college','3e','approved');
            await assert.rejects(change(db,N,'college','4e',false,'college','3e','approved'),e=>e.code==='40001');
            await deny(change(db,N,'college','inconnue',false,'mfr','bts2','approved'));
            await actor(db,N);assert.equal((await db.query('select classe from profiles')).rows[0].classe,'bts2');
        });
        await t.test('aucun élève ne peut administrer un camarade ; autre professeur non affecté refusé',async()=>{
            await deny(change(db,B,'college','4e',true,'college','3e','legacy'));
            await actor(db,'','postgres');await db.query("insert into profiles(user_id,prenom,nom,role) values($1,'Autre','Prof','teacher')",[U]);
            await actor(db,U);await deny(db.query("select * from refonte_students('college','3e')"));
        });
        await t.test('un changement de classe conserve les droits historiques du groupe',async()=>{
            await actor(db,T);await change(db,A,'college','4e',true,'college','3e','legacy');
            await actor(db,A);assert.equal((await db.query('select * from work_sessions where id=$1',[g])).rows.length,1);
            await db.query("insert into work_answers(work_session_id,question_key,reponse) values($1,'q','ancien groupe conservé')",[g]);
            assert.equal((await db.query('select * from work_sessions where id=$1',[old])).rows.length,1);
        });
        await t.test('vérification transactionnelle : profil restauré après validation temporaire',async()=>{
            await actor(db,'','postgres');await db.exec(read('../_supabase/08_verification_eleves_transactionnelle.sql'));
            assert.equal((await db.query('select enrollment_status from profiles where user_id=$1',[B])).rows[0].enrollment_status,'legacy');
        });
        await t.test('API administratives inaccessibles aux anonymes',async()=>{
            await actor(db,'','anon');await deny(db.query("select * from refonte_students('college','3e')"));
        });
    }finally{await db.close();}
});
