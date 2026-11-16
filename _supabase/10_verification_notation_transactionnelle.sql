-- Recette sous rôles réels, sur une copie fictive, annulée par ROLLBACK.
-- Aucun utilisateur, cours ou corrigé créé ; aucune copie existante modifiée.
begin;
set local lock_timeout='5s';
set local statement_timeout='30s';
do $$
declare teacher uuid; pupil uuid; other uuid; copy_id bigint; evaluation bigint; denied boolean; count_rows integer;
    marks jsonb := '[{"cle":"verification_tableau","points":9,"maximum":12,"commentaire":"Appréciation fictive","details":[{"cle":"case1","points":5,"maximum":6},{"cle":"case2","points":4,"maximum":6}]},{"cle":"verification_texte","points":7,"maximum":8,"commentaire":""}]'::jsonb;
    snapshot jsonb := '[{"cle":"verification_reponse","revision":"1"}]'::jsonb;
begin
    select p.user_id,t.user_id into pupil,teacher from public.profiles p cross join public.profiles t
        join public.teacher_class_assignments a on a.teacher_id=t.user_id
        where p.role='student' and p.enrollment_status in ('approved','legacy') and t.role='teacher'
            and p.etablissement='college' and p.classe='3e' and a.etablissement='college' and a.classe='3e' and a.matiere='techno' limit 1;
    if pupil is null or teacher is null then raise exception 'verification_requires_approved_student_and_teacher'; end if;
    select user_id into other from public.profiles where role='student' and user_id<>pupil limit 1;
    insert into public.work_sessions(etablissement,matiere,classe,seance,created_by,course_version)
        values('college','techno','3e','__verification_notes_'||pg_catalog.txid_current()::text,pupil,'v1') returning id into copy_id;
    perform set_config('request.jwt.claim.sub',pupil::text,true);
    execute 'set local role authenticated';
    insert into public.work_answers(work_session_id,question_key,reponse) values(copy_id,'verification_reponse','Texte fictif');
    denied:=false;
    begin perform public.refonte_validate_grade(copy_id,'v1',repeat('a',64),snapshot,marks); exception when insufficient_privilege then denied:=true; end;
    if not denied then raise exception 'student_validation_not_blocked'; end if;
    execute 'reset role'; perform set_config('request.jwt.claim.sub','',true); execute 'set local role anon';
    denied:=false;
    begin perform public.refonte_validate_grade(copy_id,'v1',repeat('a',64),snapshot,marks); exception when insufficient_privilege then denied:=true; end;
    if not denied then raise exception 'anonymous_validation_not_blocked'; end if;
    execute 'reset role'; perform set_config('request.jwt.claim.sub',teacher::text,true); execute 'set local role authenticated';
    denied:=false;
    begin perform public.refonte_validate_grade(copy_id,'v1',repeat('a',64),'[]'::jsonb,marks); exception when serialization_failure then denied:=true; end;
    if not denied then raise exception 'stale_answers_not_blocked'; end if;
    evaluation:=public.refonte_validate_grade(copy_id,'v1',repeat('a',64),snapshot,marks,null,'Commentaire de vérification fictif');
    if (select total from public.work_evaluations where id=evaluation)<>16 or
        (select e.marks->0->'details'->0->>'points' from public.work_evaluations e where e.id=evaluation)<>'5' or
        not(select terminee and current_evaluation_id=evaluation from public.work_sessions where id=copy_id) or
        (select commentaire from public.work_feedback where work_session_id=copy_id and teacher_id=teacher)<>'Commentaire de vérification fictif' then
        raise exception 'atomic_validation_failed'; end if;
    denied:=false;
    begin perform public.refonte_validate_grade(copy_id,'v1',repeat('a',64),snapshot,marks); exception when serialization_failure then denied:=true; end;
    if not denied then raise exception 'duplicate_validation_not_blocked'; end if;
    perform set_config('request.jwt.claim.sub',pupil::text,true);
    if (select count(*) from public.work_evaluations where id=evaluation)<>1 then raise exception 'student_cannot_read_own_grade'; end if;
    update public.work_answers set reponse='Modification interdite' where work_session_id=copy_id;
    get diagnostics count_rows=row_count;
    if count_rows<>0 then raise exception 'graded_answer_not_locked'; end if;
    denied:=false;
    begin update public.work_evaluations set total=20 where id=evaluation; exception when insufficient_privilege then denied:=true; end;
    if not denied then raise exception 'grade_direct_update_not_blocked'; end if;
    if other is not null then
        perform set_config('request.jwt.claim.sub',other::text,true);
        if (select count(*) from public.work_evaluations where id=evaluation)<>0 then raise exception 'foreign_grade_visible'; end if;
    end if;
    perform set_config('request.jwt.claim.sub',teacher::text,true);
    perform public.refonte_finish_copy(copy_id,false);
    if (select current_evaluation_id from public.work_sessions where id=copy_id) is not null or
        (select count(*) from public.work_evaluations where id=evaluation)<>1 then raise exception 'reopening_history_failed'; end if;
    perform set_config('request.jwt.claim.sub',pupil::text,true);
    if (select count(*) from public.work_evaluations where id=evaluation)<>0 then raise exception 'old_grade_visible_after_reopening'; end if;
    execute 'reset role';
end $$;
rollback;
select 'OK : accès, note par case, validation/clôture atomique, révisions, verrouillage et réouverture vérifiés ; aucune copie de vérification conservée.' as verification;
