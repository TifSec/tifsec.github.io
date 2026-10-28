-- Copie fictive sous rôles réels ; tous les changements sont annulés.
begin;
set local lock_timeout='5s';
set local statement_timeout='30s';
do $$
declare pupil uuid; teacher uuid; other uuid; copy_id bigint; n integer; denied boolean;
begin
    select p.user_id,t.user_id into pupil,teacher from public.profiles p cross join public.profiles t
        join public.teacher_class_assignments a on a.teacher_id=t.user_id
        where p.role='student' and p.enrollment_status in ('approved','legacy') and p.etablissement='college' and p.classe='3e'
            and t.role='teacher' and a.etablissement='college' and a.classe='3e' and a.matiere='techno' limit 1;
    if pupil is null or teacher is null then raise exception 'approved_student_and_teacher_required'; end if;
    select user_id into other from public.profiles where role='student' and user_id<>pupil limit 1;
    insert into public.work_sessions(etablissement,matiere,classe,seance,created_by,course_version)
        values('college','techno','3e','__verification_fin_'||pg_catalog.txid_current()::text,pupil,'v1') returning id into copy_id;
    perform set_config('request.jwt.claim.sub',pupil::text,true);execute 'set local role authenticated';
    insert into public.work_answers(work_session_id,question_key,reponse) values(copy_id,'verification','Texte fictif');
    denied:=false;
    begin perform public.refonte_submit_copy(copy_id,'[]'::jsonb);exception when serialization_failure then denied:=true;end;
    if not denied then raise exception 'stale_revision_accepted';end if;
    perform public.refonte_submit_copy(copy_id,'[{"cle":"verification","revision":"1"}]'::jsonb);
    if not(select submitted_at is not null and submitted_by=pupil and not terminee and current_evaluation_id is null from public.work_sessions where id=copy_id) then
        raise exception 'declaration_incorrect';end if;
    update public.work_answers set reponse='Complément fictif après déclaration' where work_session_id=copy_id;
    get diagnostics n=row_count;if n<>1 then raise exception 'student_cannot_continue';end if;
    if other is not null then
        perform set_config('request.jwt.claim.sub',other::text,true);denied:=false;
        begin perform public.refonte_submit_copy(copy_id,'[{"cle":"verification","revision":"2"}]'::jsonb);exception when insufficient_privilege then denied:=true;end;
        if not denied then raise exception 'foreign_submission_accepted';end if;
    end if;
    perform set_config('request.jwt.claim.sub',teacher::text,true);perform public.refonte_finish_copy(copy_id,true);
    perform set_config('request.jwt.claim.sub',pupil::text,true);
    update public.work_answers set reponse='Modification interdite' where work_session_id=copy_id;
    get diagnostics n=row_count;if n<>0 then raise exception 'teacher_closure_not_enforced';end if;
    perform set_config('request.jwt.claim.sub',teacher::text,true);perform public.refonte_finish_copy(copy_id,false);
    if not(select submitted_at is null and submitted_by is null and not terminee from public.work_sessions where id=copy_id) then raise exception 'reopen_failed';end if;
    execute 'reset role';perform set_config('request.jwt.claim.sub','',true);
end $$;
rollback;
