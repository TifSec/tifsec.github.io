import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');
const A = '00000000-0000-0000-0000-000000000001';
const B = '00000000-0000-0000-0000-000000000002';
const T = '00000000-0000-0000-0000-000000000003';
async function actor(db, id) { await db.exec('reset role; set role authenticated'); await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]); }
const proposed = read('../_documentation/RACCORDEMENT-S11-S12.md').match(/```sql\n([\s\S]*?)```/)[1];

test('S11/S12 : raccordement de version, sauvegarde, consentement et note sur PostgreSQL fictif', async t => {
    const db = new PGlite();
    try {
        for (const file of ['./work-fixture.sql', '../_supabase/01_copies_individuelles.sql', '../_supabase/03_groupes_et_suivi.sql',
            '../_supabase/05_copie_reference_et_historique.sql', '../_supabase/07_validation_eleves.sql',
            '../_supabase/09_notation.sql', '../_supabase/11_remise.sql']) await db.exec(read(file));
        await actor(db, A);
        const old = (await db.query("insert into work_sessions(etablissement,matiere,classe,seance,created_by) values('college','techno','3e','S11',$1) returning *", [A])).rows[0];
        assert.equal(old.course_version, null);
        await db.exec('reset role'); await db.exec(proposed);
        await actor(db, A);
        await t.test('copie déjà commencée : version liée, réponses conservées', async () => {
            assert.equal((await db.query('select course_version from work_sessions where id=$1', [old.id])).rows[0].course_version, 'v1');
            await db.query("insert into work_answers(work_session_id,question_key,reponse) values($1,'a01_q01_r0_c1','Réponse fictive')", [old.id]);
            await db.query("update work_answers set reponse='Réponse fictive relue' where work_session_id=$1", [old.id]);
            const row = (await db.query('select reponse,revision from work_answers where work_session_id=$1', [old.id])).rows[0];
            assert.equal(row.reponse, 'Réponse fictive relue'); assert.equal(String(row.revision), '2');
        });
        const copy = (await db.query("insert into work_sessions(etablissement,matiere,classe,seance,created_by) values('college','techno','3e','S12',$1) returning *", [A])).rows[0];
        await t.test('nouvelle copie : version serveur, isolation autre élève', async () => {
            assert.equal(copy.course_version, 'v1');
            await db.query("insert into work_answers(work_session_id,question_key,reponse) values($1,'a01_q01','Réponse fictive')", [copy.id]);
            await actor(db, B);
            assert.equal((await db.query('select id from work_sessions where id=$1', [copy.id])).rows.length, 0);
            await actor(db, A);
        });
        const group = await db.query("select refonte_create_group('college','techno','3e','S12',$1::uuid[]) as id", [[B]]);
        const groupId = group.rows[0].id;
        const invitation = (await db.query('select id from work_session_members where work_session_id=$1 and user_id=$2', [groupId, B])).rows[0].id;
        await t.test('groupe : même version, copie visible après consentement seulement', async () => {
            assert.equal((await db.query('select course_version from work_sessions where id=$1', [groupId])).rows[0].course_version, 'v1');
            await actor(db, B);
            assert.equal((await db.query('select id from work_sessions where id=$1', [groupId])).rows.length, 0);
            await db.query('select refonte_reply_invitation($1,true)', [invitation]);
            assert.equal((await db.query('select id from work_sessions where id=$1', [groupId])).rows.length, 1);
            await actor(db, A);
        });
        await t.test('notation : six critères fictifs sur 20, fermeture puis réouverture', async () => {
            await actor(db, T);
            const maxima = [2,2,4,4,5,3];
            const keys = ['a01_q01','a01_q02','a02_q01','a02_q02','a03_q01','a03_q02'];
            const marks = keys.map((cle,i) => ({ cle, points: maxima[i], maximum: maxima[i], commentaire: '' }));
            await db.query('select refonte_validate_grade($1,$2,$3,$4::jsonb,$5::jsonb,null,null)', [groupId,'v1','a'.repeat(64),
                JSON.stringify([{ cle: 'a01_q01', revision: '1' }]), JSON.stringify(marks)]);
            await actor(db, A);
            assert.equal((await db.query('select terminee from work_sessions where id=$1', [groupId])).rows[0].terminee, true);
            assert.equal(Number((await db.query('select total from work_evaluations where work_session_id=$1', [groupId])).rows[0].total), 20);
            await actor(db, T);
            await db.query('select refonte_finish_copy($1,false)', [groupId]);
            await actor(db, A);
            assert.equal((await db.query('select current_evaluation_id from work_sessions where id=$1', [groupId])).rows[0].current_evaluation_id, null);
        });
    } finally { await db.close(); }
});
