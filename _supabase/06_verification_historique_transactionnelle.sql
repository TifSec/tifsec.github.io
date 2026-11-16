-- Contrôle après le lot 05 : uniquement des copies temporaires, annulées en fin de transaction.
begin;
set local statement_timeout='30s';
do $$
declare pupils uuid[]; teacher uuid; a bigint; b bigint; g bigint; invitation bigint; changed bigint;
    lesson text := '__verification_historique_' || pg_catalog.txid_current()::text;
begin
    select array_agg(user_id) into pupils from (select user_id from public.profiles
        where role='student' and etablissement='college' and classe='3e' order by user_id limit 2) p;
    select teacher_id into teacher from public.teacher_class_assignments where etablissement='college' and matiere='techno' and classe='3e' limit 1;
    if cardinality(pupils)<>2 or teacher is null then raise exception 'Deux élèves 3e et un professeur affecté sont nécessaires'; end if;
    perform set_config('request.jwt.claim.sub',pupils[1]::text,true);
    perform set_config('request.jwt.claims',json_build_object('sub',pupils[1],'role','authenticated')::text,true);
    execute 'set local role authenticated';
    insert into public.work_sessions(created_by,etablissement,matiere,classe,seance,max_members)
        values(pupils[1],'college','techno','3e',lesson,1) returning id into a;
    insert into public.work_answers(work_session_id,question_key,reponse) values(a,'__controle__','début individuel A');
    perform set_config('request.jwt.claim.sub',pupils[2]::text,true);
    perform set_config('request.jwt.claims',json_build_object('sub',pupils[2],'role','authenticated')::text,true);
    insert into public.work_sessions(created_by,etablissement,matiere,classe,seance,max_members)
        values(pupils[2],'college','techno','3e',lesson,1) returning id into b;
    insert into public.work_answers(work_session_id,question_key,reponse) values(b,'__controle__','début individuel B');
    perform set_config('request.jwt.claim.sub',pupils[1]::text,true);
    perform set_config('request.jwt.claims',json_build_object('sub',pupils[1],'role','authenticated')::text,true);
    g:=public.refonte_create_group('college','techno','3e',lesson,array[pupils[2]]);
    if not exists(select 1 from public.work_answers where work_session_id=g and reponse='début individuel A') then
        raise exception 'Travail initial non repris'; end if;
    select id into invitation from public.work_session_members where work_session_id=g and user_id=pupils[2];
    perform set_config('request.jwt.claim.sub',pupils[2]::text,true);
    perform set_config('request.jwt.claims',json_build_object('sub',pupils[2],'role','authenticated')::text,true);
    if exists(select 1 from public.work_answers where work_session_id=g) then raise exception 'Accès avant consentement'; end if;
    perform public.refonte_reply_invitation(invitation,true);
    if not exists(select 1 from public.work_answers where work_session_id=b and reponse='début individuel B') then
        raise exception 'Historique personnel perdu'; end if;
    if exists(select 1 from public.work_answers where work_session_id=a) then raise exception 'Historique du camarade visible'; end if;
    update public.work_answers set reponse='ancien onglet' where work_session_id=b;
    get diagnostics changed=row_count;
    if changed<>0 then raise exception 'Historique encore modifiable'; end if;
    update public.work_answers set reponse='suite collective' where work_session_id=g;
    get diagnostics changed=row_count;
    if changed<>1 then raise exception 'Collectif non modifiable'; end if;
    perform set_config('request.jwt.claim.sub',teacher::text,true);
    perform set_config('request.jwt.claims',json_build_object('sub',teacher,'role','authenticated')::text,true);
    if (select count(*) from public.refonte_teacher_copies('college','techno','3e',lesson))<>1 or
        (select count(*) from public.refonte_teacher_copies('college','techno','3e',lesson,true))<>2 then
        raise exception 'Référence et historique professeur non séparés'; end if;
    execute 'reset role';
end $$;
rollback;
select 'passed' as verification,
    (select count(*) from public.work_sessions where seance like '__verification_historique_%') as retained_test_copies;
