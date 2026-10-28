import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";

const read = path => readFileSync(new URL(path, import.meta.url), "utf8");
const fixture = read("./work-fixture.sql");
const migration = read("../_supabase/01_copies_individuelles.sql");
const pause = read("../_supabase/90_suspendre_copies.sql");
const audit = read("../_supabase/00_audit_copies.sql");
const A = "00000000-0000-0000-0000-000000000001";
const B = "00000000-0000-0000-0000-000000000002";
const PROF = "00000000-0000-0000-0000-000000000003";

async function as(db, role, user = "") {
    assert.ok(["postgres", "anon", "authenticated"].includes(role));
    await db.exec("reset role; set role " + role);
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [user]);
}
const denied = async promise => assert.rejects(promise, error => error.code === "42501");
const createCopy = (db, user, seance = "S02", size = 1, classe = "3e") => db.query(
    "insert into public.work_sessions (created_by, etablissement, matiere, classe, seance, max_members) values ($1, 'college', 'techno', $2, $3, $4) returning id",
    [user, classe, seance, size]
);

test("règles PostgreSQL réelles sur base locale fictive", async t => {
    const db = new PGlite();
    try {
        await db.exec(fixture);
        // Un ancien groupe et sa réponse doivent rester intacts mais inaccessibles.
        const group = (await createCopy(db, A, "ancien-groupe", 2)).rows[0].id;
        await db.query("insert into work_answers (work_session_id, question_key, reponse) values ($1, 'q', 'archive intacte')", [group]);
        await db.exec(migration);
        const report = (await db.query(audit)).rows[0].audit_copies;
        assert.equal(Number(report.individual_duplicate_groups), 0);
        let copyA;
        let copyB;

        await t.test("anonyme : lecture et écriture refusées", async () => {
            await as(db, "anon");
            await denied(db.query("select * from public.work_sessions"));
            await denied(createCopy(db, A));
            await denied(db.query("select * from public.work_answers"));
        });
        await t.test("élève : création et lecture de sa copie", async () => {
            await as(db, "authenticated", A);
            copyA = (await createCopy(db, A)).rows[0].id;
            assert.equal((await db.query("select id from public.work_sessions")).rows.length, 1);
        });
        await t.test("propriétaire usurpé, autre classe ou copie collective refusés", async () => {
            await denied(createCopy(db, B, "usurpation"));
            await denied(createCopy(db, A, "autre-classe", 1, "4e"));
            await denied(createCopy(db, A, "groupe", 2));
        });
        await t.test("une seule copie individuelle par élève et séance", async () => {
            await assert.rejects(createCopy(db, A), error => error.code === "23505");
        });
        await t.test("insertion réponse : auteur et révision calculés par le serveur", async () => {
            const result = await db.query("insert into public.work_answers (work_session_id, question_key, reponse) values ($1, 'a01_q02', 'première réponse') returning *", [copyA]);
            assert.equal(result.rows[0].updated_by, A);
            assert.equal(Number(result.rows[0].revision), 1);
        });
        await t.test("auteur, révision et déplacement d’une réponse non modifiables par le client", async () => {
            await denied(db.query("update public.work_answers set updated_by = $1 where work_session_id = $2", [B, copyA]));
            await denied(db.query("update public.work_answers set revision = 900 where work_session_id = $1", [copyA]));
            await denied(db.query("update public.work_answers set work_session_id = $1 where work_session_id = $2", [group, copyA]));
        });
        await t.test("mise à jour avec révision : un onglet périmé ne remplace pas la réponse", async () => {
            const sql = "update public.work_answers set reponse = $1 where work_session_id = $2 and question_key = 'a01_q02' and revision = $3 returning revision, reponse";
            const first = await db.query(sql, ["réponse récente", copyA, 1]);
            assert.equal(Number(first.rows[0].revision), 2);
            const stale = await db.query(sql, ["ancienne réponse", copyA, 1]);
            assert.equal(stale.rows.length, 0);
            assert.equal((await db.query("select reponse from work_answers where work_session_id = $1", [copyA])).rows[0].reponse, "réponse récente");
        });
        await t.test("réponse vide enregistrable, texte excessif refusé", async () => {
            await db.query("update public.work_answers set reponse = '' where work_session_id = $1", [copyA]);
            await denied(db.query("update public.work_answers set reponse = $1 where work_session_id = $2", ["x".repeat(20001), copyA]));
        });
        await t.test("autre élève : copies et réponses invisibles, écriture étrangère refusée", async () => {
            await as(db, "authenticated", B);
            assert.equal((await db.query("select * from work_sessions")).rows.length, 0);
            assert.equal((await db.query("select * from work_answers")).rows.length, 0);
            copyB = (await createCopy(db, B)).rows[0].id;
            await denied(db.query("insert into work_answers (work_session_id, question_key, reponse) values ($1, 'q', 'intrusion')", [copyA]));
            const changed = await db.query("update work_answers set reponse = 'intrusion' where work_session_id = $1 returning id", [copyA]);
            assert.equal(changed.rows.length, 0);
        });
        await t.test("suppression et modification de la copie refusées", async () => {
            await denied(db.query("delete from work_sessions where id = $1", [copyB]));
            await denied(db.query("update work_sessions set created_by = $1 where id = $2", [A, copyB]));
            await denied(db.query("delete from work_answers"));
            await denied(db.query("truncate work_answers"));
        });
        await t.test("groupes et invitations restent fermés", async () => {
            await as(db, "authenticated", A);
            assert.equal((await db.query("select * from work_sessions where id = $1", [group])).rows.length, 0);
            assert.equal((await db.query("select * from work_answers where work_session_id = $1", [group])).rows.length, 0);
            await denied(db.query("select * from work_session_members"));
            await denied(db.query("insert into work_session_members (work_session_id, user_id, status) values ($1, $2, 'accepted')", [group, A]));
        });
        await t.test("professeur : aucun accès général aux copies tant que les affectations ne sont pas définies", async () => {
            await as(db, "authenticated", PROF);
            assert.equal((await db.query("select * from work_sessions")).rows.length, 0);
            assert.equal((await db.query("select * from work_answers")).rows.length, 0);
            await denied(createCopy(db, PROF));
        });
        await t.test("copie terminée : réponses lisibles mais non modifiables", async () => {
            await as(db, "postgres");
            await db.query("update work_sessions set terminee = true where id = $1", [copyA]);
            await as(db, "authenticated", A);
            assert.equal((await db.query("select * from work_answers where work_session_id = $1", [copyA])).rows.length, 1);
            assert.equal((await db.query("update work_answers set reponse = 'tardif' where work_session_id = $1 returning id", [copyA])).rows.length, 0);
        });
        await t.test("migration répétée arrêtée sans modifier les copies", async () => {
            await as(db, "postgres");
            await assert.rejects(db.exec(migration), /Politiques déjà présentes/);
            await db.exec("rollback");
            assert.equal((await db.query("select count(*)::int as n from work_sessions")).rows[0].n, 3);
            assert.equal((await db.query("select reponse from work_answers where work_session_id = $1", [group])).rows[0].reponse, "archive intacte");
        });
        await t.test("suspension sans suppression des données", async () => {
            await db.exec(pause);
            await as(db, "authenticated", A);
            await denied(db.query("select * from work_sessions"));
            await denied(db.query("select * from work_answers"));
            await as(db, "postgres");
            assert.equal((await db.query("select count(*)::int as n from work_sessions")).rows[0].n, 3);
        });
    } finally {
        await db.close();
    }
});

test("doublons préexistants : migration annulée, données intactes", async () => {
    const db = new PGlite();
    try {
        await db.exec(fixture);
        await createCopy(db, A);
        await createCopy(db, A);
        await assert.rejects(db.exec(migration), /doublon/);
        await db.exec("rollback");
        assert.equal((await db.query("select count(*)::int as n from work_sessions")).rows[0].n, 2);
        assert.equal((await db.query("select count(*)::int as n from information_schema.columns where table_name = 'work_answers' and column_name = 'revision'")).rows[0].n, 0);
    } finally {
        await db.close();
    }
});

test("trigger, vue ou fonction privilégiée inconnus : arrêt avant modification", async () => {
    for (const [setup, expected] of [
        ["create function public.unknown_trigger() returns trigger language plpgsql as $$ begin return new; end $$; create trigger old_trigger before update on work_answers for each row execute function public.unknown_trigger();", /Triggers existants/],
        ["create view public.old_answers as select * from public.work_answers", /Vue sur les copies/],
        ["create function public.old_reader() returns bigint language sql security definer as $$ select count(*) from public.work_answers $$", /Fonction privilégiée/]
    ]) {
        const db = new PGlite();
        try {
            await db.exec(fixture);
            await db.exec(setup);
            await assert.rejects(db.exec(migration), expected);
            await db.exec("rollback");
            assert.equal((await db.query("select count(*)::int as n from information_schema.columns where table_name = 'work_answers' and column_name = 'revision'")).rows[0].n, 0);
        } finally {
            await db.close();
        }
    }
});
