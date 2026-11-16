-- Validation temporaire d’un profil existant, entièrement annulée par ROLLBACK.
-- Aucune réponse, copie ou identité n’est lue ou modifiée.
begin;
set local statement_timeout='30s';
do $$
declare pupil uuid; teacher uuid; old_status text;
begin
    select user_id,enrollment_status into pupil,old_status from public.profiles
        where role='student' and etablissement='college' and classe='3e' order by user_id limit 1;
    select a.teacher_id into teacher from public.teacher_class_assignments a join public.profiles p on p.user_id=a.teacher_id
        where p.role='teacher' and a.etablissement='college' and a.classe='3e' limit 1;
    if pupil is null or teacher is null then raise exception 'Professeur et élève pilote nécessaires'; end if;
    update public.profiles set enrollment_status='pending' where user_id=pupil;
    perform set_config('request.jwt.claim.sub',pupil::text,true);
    perform set_config('request.jwt.claims',json_build_object('sub',pupil,'role','authenticated')::text,true);
    execute 'set local role authenticated';
    if refonte_private.student_ready() then raise exception 'Inscription en attente déjà autorisée'; end if;
    begin
        update public.profiles set classe='4e' where user_id=pupil;
        raise exception 'Auto-affectation autorisée';
    exception when insufficient_privilege then null; end;
    begin
        update public.profiles set enrollment_status='approved' where user_id=pupil;
        raise exception 'Auto-validation autorisée';
    exception when insufficient_privilege then null; end;
    begin
        perform * from public.refonte_students('college','3e');
        raise exception 'Liste professeur visible par un élève';
    exception when insufficient_privilege then null; end;
    perform set_config('request.jwt.claim.sub',teacher::text,true);
    perform set_config('request.jwt.claims',json_build_object('sub',teacher,'role','authenticated')::text,true);
    if not exists(select 1 from public.refonte_students('college','3e') where user_id=pupil and enrollment_status='pending') then
        raise exception 'Profil en attente absent de la liste'; end if;
    perform public.refonte_update_student(pupil,'college','4e',true,'college','3e','pending');
    if not exists(select 1 from public.refonte_students('college','4e') where user_id=pupil and enrollment_status='approved') then
        raise exception 'Correction et validation non confirmées'; end if;
    begin
        perform public.refonte_update_student(pupil,'college','3e',true,'college','3e','pending');
        raise exception 'Requête périmée acceptée';
    exception when serialization_failure then null; end;
    perform set_config('request.jwt.claim.sub',pupil::text,true);
    perform set_config('request.jwt.claims',json_build_object('sub',pupil,'role','authenticated')::text,true);
    if not refonte_private.student_ready() then raise exception 'Validation sans effet'; end if;
    execute 'reset role';
end $$;
rollback;
select 'passed' as verification;
