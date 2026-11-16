-- Contrôles sur les rôles réels, sans lire les réponses existantes.
-- Les copies de contrôle sont annulées par ROLLBACK. Les séquences peuvent avancer.
begin;
set local statement_timeout = '30s';
do $$
declare
    pupil_a record;
    pupil_b record;
    copy_a bigint;
    copy_b bigint;
    answer_revision bigint;
    changed bigint;
    lesson text := '__verification_' || pg_catalog.txid_current()::text;
begin
    select user_id, etablissement, classe into pupil_a from public.profiles
        where role = 'student' and etablissement in ('college','mfr') and nullif(classe,'') is not null
        order by user_id limit 1;
    select user_id, etablissement, classe into pupil_b from public.profiles
        where role = 'student' and etablissement in ('college','mfr') and nullif(classe,'') is not null
            and user_id <> pupil_a.user_id order by user_id limit 1;
    if pupil_a.user_id is null or pupil_b.user_id is null then
        raise exception 'Deux profils élèves nécessaires aux contrôles';
    end if;

    perform set_config('request.jwt.claim.sub', pupil_a.user_id::text, true);
    perform set_config('request.jwt.claims', json_build_object('sub', pupil_a.user_id, 'role', 'authenticated')::text, true);
    execute 'set local role authenticated';
    insert into public.work_sessions (created_by, etablissement, matiere, classe, seance, max_members)
        values (pupil_a.user_id, pupil_a.etablissement, 'techno', pupil_a.classe, lesson, 1) returning id into copy_a;
    insert into public.work_answers (work_session_id, question_key, reponse)
        values (copy_a, '__controle__', 'texte de contrôle sans donnée élève') returning revision into answer_revision;
    if answer_revision <> 1 then raise exception 'Révision initiale incorrecte'; end if;
    if not exists (select 1 from public.work_answers where work_session_id = copy_a
        and reponse = 'texte de contrôle sans donnée élève' and updated_by = pupil_a.user_id) then
        raise exception 'Restauration ou auteur incorrect';
    end if;
    update public.work_answers set reponse = 'version récente'
        where work_session_id = copy_a and question_key = '__controle__' and revision = 1
        returning revision into answer_revision;
    if answer_revision <> 2 then raise exception 'Incrément de révision incorrect'; end if;
    update public.work_answers set reponse = 'version périmée'
        where work_session_id = copy_a and question_key = '__controle__' and revision = 1;
    get diagnostics changed = row_count;
    if changed <> 0 then raise exception 'Écriture périmée acceptée'; end if;

    perform set_config('request.jwt.claim.sub', pupil_b.user_id::text, true);
    perform set_config('request.jwt.claims', json_build_object('sub', pupil_b.user_id, 'role', 'authenticated')::text, true);
    if exists (select 1 from public.work_sessions where id = copy_a)
        or exists (select 1 from public.work_answers where work_session_id = copy_a) then
        raise exception 'Copie étrangère visible';
    end if;
    begin
        insert into public.work_answers (work_session_id, question_key, reponse) values (copy_a, '__intrusion__', 'refus attendu');
        raise exception 'Insertion étrangère acceptée';
    exception when insufficient_privilege then null;
    end;
    update public.work_answers set reponse = 'refus attendu' where work_session_id = copy_a;
    get diagnostics changed = row_count;
    if changed <> 0 then raise exception 'Modification étrangère acceptée'; end if;
    insert into public.work_sessions (created_by, etablissement, matiere, classe, seance, max_members)
        values (pupil_b.user_id, pupil_b.etablissement, 'techno', pupil_b.classe, lesson, 1) returning id into copy_b;
    begin
        insert into public.work_sessions (created_by, etablissement, matiere, classe, seance, max_members)
            values (pupil_b.user_id, pupil_b.etablissement, 'techno', pupil_b.classe, lesson, 1);
        raise exception 'Doublon de copie accepté';
    exception when unique_violation then null;
    end;
    begin
        update public.work_answers set updated_by = pupil_b.user_id where work_session_id = copy_a;
        raise exception 'Droit de modification de l’auteur accordé';
    exception when insufficient_privilege then null;
    end;
    begin
        perform 1 from public.work_session_members;
        raise exception 'Groupes accessibles';
    exception when insufficient_privilege then null;
    end;

    execute 'reset role';
    execute 'set local role anon';
    perform set_config('request.jwt.claim.sub', '', true);
    perform set_config('request.jwt.claims', '{}', true);
    begin
        perform 1 from public.work_answers;
        raise exception 'Lecture anonyme acceptée';
    exception when insufficient_privilege then null;
    end;
    execute 'reset role';
end;
$$;
rollback;
select 'passed' as verification,
    (select count(*) from public.work_sessions where seance like '__verification_%') as retained_test_copies;
