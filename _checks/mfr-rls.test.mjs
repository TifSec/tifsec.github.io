import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');
const A = '00000000-0000-0000-0000-000000000001';
const B = '00000000-0000-0000-0000-000000000002';
const T = '00000000-0000-0000-0000-000000000003';
async function actor(db, id) { await db.exec('reset role; set role authenticated'); await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]); }

test('MFR : nouvelles versions, sauvegarde isolée, consentement et notation sans activation S11/S12', async () => {
    const db = new PGlite();
    try {
        for (const file of ['./work-fixture.sql', '../_supabase/01_copies_individuelles.sql', '../_supabase/03_groupes_et_suivi.sql', '../_supabase/05_copie_reference_et_historique.sql', '../_supabase/07_validation_eleves.sql', '../_supabase/09_notation.sql', '../_supabase/11_remise.sql', '../_supabase/12_cours_mfr.sql']) await db.exec(read(file));
        for (const [subject, schoolClass, session] of [['tim', 'cap2', 'S03'], ['maths', 'term', 'S05']]) {
            await db.exec('reset role');
            await db.query("update profiles set etablissement='mfr',classe=$1 where role='student'", [schoolClass]);
            await actor(db, A);
            const copy = (await db.query("insert into work_sessions(etablissement,matiere,classe,seance,created_by) values('mfr',$1,$2,$3,$4) returning *", [subject, schoolClass, session, A])).rows[0];
            assert.equal(copy.course_version, 'v1');
            await db.query("insert into work_answers(work_session_id,question_key,reponse) values($1,'a01_q01','Démarche fictive')", [copy.id]);
            assert.equal((await db.query('select reponse from work_answers where work_session_id=$1', [copy.id])).rows[0].reponse, 'Démarche fictive');
            await actor(db, B);
            assert.equal((await db.query('select id from work_sessions where id=$1', [copy.id])).rows.length, 0);
            await actor(db, A);
            const group = (await db.query("select refonte_create_group('mfr',$1,$2,$3,$4::uuid[]) as id", [subject, schoolClass, session, [B]])).rows[0].id;
            const invitation = (await db.query('select id from work_session_members where work_session_id=$1 and user_id=$2', [group, B])).rows[0].id;
            await actor(db, B);
            assert.equal((await db.query('select id from work_sessions where id=$1', [group])).rows.length, 0);
            await db.query('select refonte_reply_invitation($1,true)', [invitation]);
            assert.equal((await db.query('select course_version from work_sessions where id=$1', [group])).rows[0].course_version, 'v1');
            await actor(db, T);
            assert.equal((await db.query('select id from work_sessions where id=$1', [group])).rows.length, 1);
            await db.query('select refonte_validate_grade($1,$2,$3,$4::jsonb,$5::jsonb,null,null)', [group, 'v1', 'a'.repeat(64), JSON.stringify([{ cle: 'a01_q01', revision: '1' }]), JSON.stringify([{ cle: 'a01_q01', points: 20, maximum: 20, commentaire: 'Barème fictif de test' }])]);
            await actor(db, B);
            assert.equal((await db.query('select terminee from work_sessions where id=$1', [group])).rows[0].terminee, true);
            assert.equal(Number((await db.query('select total from work_evaluations where work_session_id=$1', [group])).rows[0].total), 20);
        }
        await db.exec('reset role');
        await db.query("update profiles set etablissement='college',classe='3e' where user_id=$1", [A]);
        await actor(db, A);
        for (const session of ['S11', 'S12']) {
            const copy = (await db.query("insert into work_sessions(etablissement,matiere,classe,seance,created_by) values('college','techno','3e',$1,$2) returning *", [session, A])).rows[0];
            assert.equal(copy.course_version, null);
        }
    } finally { await db.close(); }
});
