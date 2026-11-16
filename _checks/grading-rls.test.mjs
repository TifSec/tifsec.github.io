import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');
const A='00000000-0000-0000-0000-000000000001', B='00000000-0000-0000-0000-000000000002', T='00000000-0000-0000-0000-000000000003';
async function actor(db,id,role='authenticated') { await db.exec('reset role;set role '+role);await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]); }
const marks = [{ cle:'a_q1',points:8,maximum:12,commentaire:'Exemple fictif',details:[{cle:'cell1',points:4,maximum:6},{cle:'cell2',points:4,maximum:6}] },{ cle:'a_q2',points:6,maximum:8,commentaire:'' }];
const snap = [{cle:'q1',revision:'1'}];
const save = (db,copy,options={}) => db.query('select refonte_validate_grade($1,$2,$3,$4::jsonb,$5::jsonb,$6,$7) as id',
    [copy,options.version||'v1','a'.repeat(64),JSON.stringify(options.snapshot||snap),JSON.stringify(options.marks||marks),options.expected??null,options.comment??null]);
test('notation : migration proposée sur PostgreSQL local fictif', async t => {
    const db=new PGlite(); let copy,evaluation;
    try {
        for (const path of ['./work-fixture.sql','../_supabase/01_copies_individuelles.sql','../_supabase/03_groupes_et_suivi.sql','../_supabase/05_copie_reference_et_historique.sql','../_supabase/07_validation_eleves.sql','../_supabase/09_notation.sql']) await db.exec(read(path));
        await actor(db,A); copy=(await db.query("insert into work_sessions(etablissement,matiere,classe,seance,created_by) values('college','techno','3e','S02',$1) returning id",[A])).rows[0].id;
        await db.query("insert into work_answers(work_session_id,question_key,reponse) values($1,'q1','réponse fictive')",[copy]);
        await t.test('élève et anonyme ne peuvent valider une note', async()=>{
            await assert.rejects(save(db,copy),e=>e.code==='42501');
            await actor(db,'','anon');await assert.rejects(save(db,copy),e=>e.code==='42501');
        });
        await actor(db,T);
        await t.test('note incomplète, hors limites ou maximum différent de 20 refusés', async()=>{
            for(const invalid of [[{...marks[0],points:13},marks[1]],[marks[0]],[marks[0],marks[0]],[{...marks[0],points:-1},marks[1]]]) await assert.rejects(save(db,copy,{marks:invalid}));
            assert.equal((await db.query('select count(*)::int as n from work_evaluations')).rows[0].n,0);
        });
        await t.test('révision périmée et mauvaise version refusées sans verrouiller la copie',async()=>{
            await assert.rejects(save(db,copy,{snapshot:[]}),e=>e.code==='40001');
            await assert.rejects(save(db,copy,{version:'v2'}));
            assert.equal((await db.query('select terminee from work_sessions where id=$1',[copy])).rows[0].terminee,false);
        });
        await t.test('validation : note calculée côté base et clôture dans la même transaction', async()=>{
            evaluation=(await save(db,copy,{comment:'Commentaire de validation'})).rows[0].id;
            const result=(await db.query('select * from work_evaluations where id=$1',[evaluation])).rows[0];
            assert.equal(Number(result.total),14);assert.equal(result.teacher_id,T);assert.deepEqual(result.recipient_ids,[A]);
            assert.deepEqual(result.marks[0].details,marks[0].details);
            const session=(await db.query('select * from work_sessions where id=$1',[copy])).rows[0];assert.equal(session.terminee,true);assert.equal(session.current_evaluation_id,evaluation);
            assert.equal((await db.query('select commentaire from work_feedback where work_session_id=$1',[copy])).rows[0].commentaire,'Commentaire de validation');
        });
        await t.test('double validation périmée refusée et historique immuable',async()=>{
            await assert.rejects(save(db,copy),e=>e.code==='40001');
            await assert.rejects(db.query('update work_evaluations set total=20 where id=$1',[evaluation]),e=>e.code==='42501');
            await assert.rejects(db.query('delete from work_evaluations where id=$1',[evaluation]),e=>e.code==='42501');
        });
        await t.test('élève : sa note lisible, sa copie non modifiable ; camarade sans accès',async()=>{
            await actor(db,A);assert.equal((await db.query('select * from work_evaluations')).rows.length,1);
            assert.equal((await db.query("update work_answers set reponse='nouvelle réponse' where work_session_id=$1 returning id",[copy])).rows.length,0);
            await actor(db,B);assert.equal((await db.query('select * from work_evaluations')).rows.length,0);
        });
        await t.test('réouverture : ancienne correction conservée au professeur, note courante retirée',async()=>{
            await actor(db,T);await db.query('select refonte_finish_copy($1,false)',[copy]);
            assert.equal((await db.query('select current_evaluation_id from work_sessions where id=$1',[copy])).rows[0].current_evaluation_id,null);
            assert.equal((await db.query('select count(*)::int as n from work_evaluations')).rows[0].n,1);
            await actor(db,A);assert.equal((await db.query('select * from work_evaluations')).rows.length,0);
            await db.query("update work_answers set reponse='modifiée' where work_session_id=$1",[copy]);
            await actor(db,T);await assert.rejects(save(db,copy),e=>e.code==='40001');
        });
        await t.test('copie collective : note commune aux seuls participants acceptés',async()=>{
            await actor(db,A); const group=(await db.query("select refonte_create_group('college','techno','3e','S02',$1::uuid[]) as id",[[B]])).rows[0].id;
            const invitation=(await db.query('select id from work_session_members where work_session_id=$1 and user_id=$2',[group,B])).rows[0].id;
            await actor(db,B);await db.query('select refonte_reply_invitation($1,true)',[invitation]);
            await actor(db,T);const id=(await save(db,group,{snapshot:[{cle:'q1',revision:'1'}]})).rows[0].id;
            assert.deepEqual((await db.query('select recipient_ids from work_evaluations where id=$1',[id])).rows[0].recipient_ids,[A,B]);
            await assert.rejects(save(db,copy,{snapshot:[{cle:'q1',revision:'2'}]}),e=>e.code==='42501');
        });
        await t.test('recette transactionnelle : aucune copie de contrôle conservée',async()=>{
            await db.exec('reset role');
            const before=(await db.query('select count(*)::int as n from work_sessions')).rows[0].n;
            await db.exec(read('../_supabase/10_verification_notation_transactionnelle.sql'));
            assert.equal((await db.query('select count(*)::int as n from work_sessions')).rows[0].n,before);
        });
    } finally {await db.close();}
});
