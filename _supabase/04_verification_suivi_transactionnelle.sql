-- Vérification après le lot 03, sans modifier les copies existantes ni conserver de données de contrôle.
-- Les séquences peuvent avancer. Les groupes nécessitent aussi une recette avec plusieurs comptes.
begin;
set local statement_timeout = '30s';
do $$
declare pupil uuid; teacher uuid; copy_id bigint; changed bigint;
    lesson text := '__verification_suivi_' || pg_catalog.txid_current()::text;
begin
    select user_id into pupil from public.profiles where role='student' and etablissement='college' and classe='3e' order by user_id limit 1;
    select a.teacher_id into teacher from public.teacher_class_assignments a join public.profiles p on p.user_id=a.teacher_id
        where p.role='teacher' and a.etablissement='college' and a.matiere='techno' and a.classe='3e' order by a.teacher_id limit 1;
    if pupil is null or teacher is null then raise exception 'Un élève 3e et un professeur affecté sont nécessaires'; end if;
    perform set_config('request.jwt.claim.sub',pupil::text,true);
    perform set_config('request.jwt.claims',json_build_object('sub',pupil,'role','authenticated')::text,true);
    execute 'set local role authenticated';
    insert into public.work_sessions(created_by,etablissement,matiere,classe,seance,max_members)
        values(pupil,'college','techno','3e',lesson,1) returning id into copy_id;
    insert into public.work_answers(work_session_id,question_key,reponse) values(copy_id,'__controle__','réponse de contrôle');

    perform set_config('request.jwt.claim.sub',teacher::text,true);
    perform set_config('request.jwt.claims',json_build_object('sub',teacher,'role','authenticated')::text,true);
    if not exists(select 1 from public.work_answers where work_session_id=copy_id and reponse='réponse de contrôle') then
        raise exception 'Lecture professeur refusée'; end if;
    if (select count(*) from public.refonte_teacher_copies('college','techno','3e',lesson)) <> 1 then
        raise exception 'Suivi professeur incorrect'; end if;
    begin
        perform * from public.refonte_teacher_copies('college','techno','4e',lesson);
        raise exception 'Classe non affectée accessible';
    exception when insufficient_privilege then null; end;
    update public.work_answers set reponse='écriture professeur interdite' where work_session_id=copy_id;
    get diagnostics changed = row_count;
    if changed <> 0 then raise exception 'Réponse élève modifiable par le professeur'; end if;
    perform public.refonte_save_feedback(copy_id,'retour de contrôle');
    perform public.refonte_finish_copy(copy_id,true);

    perform set_config('request.jwt.claim.sub',pupil::text,true);
    perform set_config('request.jwt.claims',json_build_object('sub',pupil,'role','authenticated')::text,true);
    if not exists(select 1 from public.work_feedback where work_session_id=copy_id and commentaire='retour de contrôle') then
        raise exception 'Retour professeur non visible par son destinataire'; end if;
    update public.work_answers set reponse='modification tardive interdite' where work_session_id=copy_id;
    get diagnostics changed = row_count;
    if changed <> 0 then raise exception 'Copie terminée encore modifiable'; end if;
    begin
        perform public.refonte_save_feedback(copy_id,'faux professeur');
        raise exception 'Élève autorisé à corriger';
    exception when insufficient_privilege then null; end;

    perform set_config('request.jwt.claim.sub',teacher::text,true);
    perform set_config('request.jwt.claims',json_build_object('sub',teacher,'role','authenticated')::text,true);
    perform public.refonte_finish_copy(copy_id,false);
    perform set_config('request.jwt.claim.sub',pupil::text,true);
    perform set_config('request.jwt.claims',json_build_object('sub',pupil,'role','authenticated')::text,true);
    update public.work_answers set reponse='réponse après réouverture' where work_session_id=copy_id;
    get diagnostics changed = row_count;
    if changed <> 1 then raise exception 'Copie rouverte non modifiable'; end if;
    execute 'reset role';
    execute 'set local role anon';
    perform set_config('request.jwt.claim.sub','',true);
    perform set_config('request.jwt.claims','{}',true);
    begin
        perform * from public.refonte_invitations();
        raise exception 'Invitations accessibles anonymement';
    exception when insufficient_privilege then null; end;
    execute 'reset role';
end $$;
rollback;
select 'passed' as verification,
    (select count(*) from public.work_sessions where seance like '__verification_suivi_%') as retained_test_copies;
