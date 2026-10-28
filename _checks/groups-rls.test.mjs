import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
const read = file => readFileSync(new URL(file, import.meta.url), 'utf8');
const A='00000000-0000-0000-0000-000000000001', B='00000000-0000-0000-0000-000000000002';
const T='00000000-0000-0000-0000-000000000003', D='00000000-0000-0000-0000-000000000004';
const E='00000000-0000-0000-0000-000000000005';
const deny = promise => assert.rejects(promise, error => error.code === '42501');
async function actor(db, uid, role='authenticated') {
    await db.exec('reset role; set role '+role);
    await db.query("select set_config('request.jwt.claim.sub',$1,false)",[uid]);
}
const group=(db,lesson,peers)=>db.query("select public.refonte_create_group('college','techno','3e',$1,$2::uuid[]) as id",[lesson,peers]);
const reply=(db,id,accept)=>db.query('select public.refonte_reply_invitation($1,$2)',[id,accept]);

test('consentement par séance, isolation et suivi professeur sur PostgreSQL local', async t=>{
    const db=new PGlite();
    try {
        await db.exec(read('./work-fixture.sql'));
        await db.exec(read('../_supabase/01_copies_individuelles.sql'));
        await db.exec(`insert into auth.users values('${D}'),('${E}');
            insert into profiles(user_id,prenom,nom,role,etablissement,classe) values
            ('${D}','Élève','D','student','college','3e'),('${E}','Élève','E','student','college','4e');`);
        await db.exec(read('../_supabase/03_groupes_et_suivi.sql'));
        let g1,g2,g3,ib,id,other;
        await t.test('annuaire limité aux élèves de sa classe',async()=>{
            await actor(db,A);
            const rows=(await db.query('select * from public.refonte_classmates()')).rows;
            assert.deepEqual(rows.map(r=>r.user_id).sort(),[B,D].sort());
        });
        await t.test('création trinôme : seul le créateur est accepté',async()=>{
            g1=(await group(db,'S02',[B,D])).rows[0].id;
            const members=(await db.query('select user_id,status,id from work_session_members where work_session_id=$1',[g1])).rows;
            assert.equal(members.filter(m=>m.status==='accepted').length,1);
            ib=members.find(m=>m.user_id===B).id; id=members.find(m=>m.user_id===D).id;
            await db.query("insert into work_answers(work_session_id,question_key,reponse) values($1,'q1','texte A')",[g1]);
        });
        await t.test('autre classe, auto-invitation, doublon et quatrième membre refusés',async()=>{
            await deny(group(db,'invalide',[E]));
            await assert.rejects(group(db,'invalide',[A]));
            await assert.rejects(group(db,'invalide',[B,B]));
            await assert.rejects(group(db,'invalide',[B,D,E]));
            await assert.rejects(group(db,'S02',[B]),/already_in_group/);
        });
        await t.test('invité en attente : voit l’invitation, jamais les réponses',async()=>{
            await actor(db,B);
            assert.equal((await db.query('select * from public.refonte_invitations()')).rows.length,1);
            assert.equal((await db.query('select * from work_sessions where id=$1',[g1])).rows.length,0);
            assert.equal((await db.query('select * from work_answers where work_session_id=$1',[g1])).rows.length,0);
            await deny(db.query("insert into work_answers(work_session_id,question_key,reponse) values($1,'q2','non')",[g1]));
        });
        await t.test('personne ne peut accepter pour un camarade ni modifier directement son consentement',async()=>{
            await deny(reply(db,id,true));
            await deny(db.query("update work_session_members set status='accepted' where id=$1",[ib]));
        });
        await t.test('refus : aucun accès ; l’autre invitation reste indépendante',async()=>{
            await reply(db,ib,false);
            assert.equal((await db.query('select * from work_answers where work_session_id=$1',[g1])).rows.length,0);
            await actor(db,D);
            await reply(db,id,true);
            assert.equal((await db.query('select * from work_answers where work_session_id=$1',[g1])).rows[0].reponse,'texte A');
            await reply(db,id,true);
        });
        await t.test('réponses communes et révisions conservées',async()=>{
            await db.query("update work_answers set reponse='texte D' where work_session_id=$1 and revision=1",[g1]);
            await actor(db,A);
            const row=(await db.query('select * from work_answers where work_session_id=$1',[g1])).rows[0];
            assert.equal(row.reponse,'texte D'); assert.equal(row.updated_by,D); assert.equal(Number(row.revision),2);
            assert.equal((await db.query("update work_answers set reponse='périmé' where work_session_id=$1 and revision=1 returning id",[g1])).rows.length,0);
        });
        await t.test('un seul groupe accepté pour une même séance',async()=>{
            await actor(db,B); g2=(await group(db,'S02',[D])).rows[0].id;
            other=(await db.query('select id from work_session_members where work_session_id=$1 and user_id=$2',[g2,D])).rows[0].id;
            await actor(db,D); await assert.rejects(reply(db,other,true),/already_in_group/);
        });
        await t.test('séance suivante : autre groupe sans retirer les droits sur la précédente',async()=>{
            await actor(db,A); g3=(await group(db,'S03',[B])).rows[0].id;
            const next=(await db.query('select id from work_session_members where work_session_id=$1 and user_id=$2',[g3,B])).rows[0].id;
            await actor(db,B); await reply(db,next,true);
            await actor(db,D);
            assert.equal((await db.query('select * from work_sessions where id=$1',[g3])).rows.length,0);
            assert.equal((await db.query("update work_answers set reponse='retour séance précédente' where work_session_id=$1 returning id",[g1])).rows.length,1);
        });
        await t.test('copie individuelle conservée à côté de la collective',async()=>{
            await actor(db,A);
            const own=(await db.query("insert into work_sessions(created_by,etablissement,matiere,classe,seance,max_members) values($1,'college','techno','3e','S02',1) returning id",[A])).rows[0].id;
            assert.notEqual(own,g1);
        });
        await t.test('professeur : affectation explicite et suivi des copies',async()=>{
            await actor(db,T);
            const rows=(await db.query("select * from refonte_teacher_copies('college','techno','3e','S02')")).rows;
            assert.equal(rows.length,3);
            await deny(db.query("select * from refonte_teacher_copies('college','techno','4e','S02')"));
            assert.equal((await db.query('select * from work_answers where work_session_id=$1',[g1])).rows.length,1);
            assert.equal((await db.query("update work_answers set reponse='réponse du professeur' where work_session_id=$1 returning id",[g1])).rows.length,0);
            await deny(db.query("insert into work_answers(work_session_id,question_key,reponse) values($1,'faux','non')",[g1]));
        });
        await t.test('commentaire professeur lisible par les membres acceptés uniquement',async()=>{
            await db.query("select refonte_save_feedback($1,'À préciser')",[g1]);
            await actor(db,D); assert.equal((await db.query('select * from work_feedback where work_session_id=$1',[g1])).rows.length,1);
            await actor(db,B); assert.equal((await db.query('select * from work_feedback where work_session_id=$1',[g1])).rows.length,0);
            await deny(db.query("select refonte_save_feedback($1,'faux professeur')",[g1]));
        });
        await t.test('clôture et réouverture réservées au professeur affecté',async()=>{
            await deny(db.query('select refonte_finish_copy($1,true)',[g1]));
            await actor(db,T); await db.query('select refonte_finish_copy($1,true)',[g1]);
            await actor(db,D);
            assert.equal((await db.query("update work_answers set reponse='non' where work_session_id=$1 returning id",[g1])).rows.length,0);
            await actor(db,T); await db.query('select refonte_finish_copy($1,false)',[g1]);
            await actor(db,D);
            assert.equal((await db.query("update work_answers set reponse='réouverte' where work_session_id=$1 returning id",[g1])).rows.length,1);
        });
        await t.test('droits historiques indépendants de la classe actuelle du profil',async()=>{
            await actor(db,'','postgres'); await db.query("update profiles set classe='4e' where user_id=$1",[D]);
            await actor(db,D);
            assert.equal((await db.query('select * from work_answers where work_session_id=$1',[g1])).rows.length,1);
            assert.equal((await db.query("update work_answers set reponse='toujours membre de S02' where work_session_id=$1 returning id",[g1])).rows.length,1);
        });
        await t.test('pas d’auto-affectation professeur ni d’accès anonyme aux RPC',async()=>{
            await deny(db.query("insert into teacher_class_assignments values($1,'college','techno','3e')",[D]));
            await actor(db,'','anon'); await deny(db.query('select * from refonte_classmates()'));
            await deny(db.query('select * from work_feedback'));
        });
        await t.test('contrôle transactionnel du suivi : succès sans conserver de copie de contrôle',async()=>{
            await actor(db,'','postgres');
            await db.exec(read('../_supabase/04_verification_suivi_transactionnelle.sql'));
            assert.equal((await db.query("select count(*)::int as n from work_sessions where seance like '__verification_suivi_%'")).rows[0].n,0);
        });
        await t.test('migration déjà appliquée : arrêt sans altérer les copies',async()=>{
            await actor(db,'','postgres');
            const before=(await db.query('select count(*)::int as n from work_sessions')).rows[0].n;
            await assert.rejects(db.exec(read('../_supabase/03_groupes_et_suivi.sql')),/Politiques inattendues/);
            await db.exec('rollback');
            assert.equal((await db.query('select count(*)::int as n from work_sessions')).rows[0].n,before);
        });
        await t.test('suspension complète : appels privilégiés et lectures bloqués, réponses conservées',async()=>{
            const before=(await db.query('select count(*)::int as n from work_answers')).rows[0].n;
            await db.exec(read('../_supabase/91_suspendre_groupes_et_suivi.sql'));
            await actor(db,A);await deny(group(db,'S04',[B]));
            await deny(db.query('select * from work_answers'));
            await actor(db,T);await deny(db.query("select * from refonte_teacher_copies('college','techno','3e','S02')"));
            await deny(db.query("select refonte_private.save_feedback($1,'interdit')",[g1]));
            await actor(db,'','postgres');
            assert.equal((await db.query('select count(*)::int as n from work_answers')).rows[0].n,before);
        });
    } finally { await db.close(); }
});
