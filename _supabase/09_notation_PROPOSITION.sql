-- Proposition validée par le professeur et appliquée le 20 octobre 2026.
-- Migration distante : 20261020110703 refonte_notation_et_validation. Ne pas réappliquer.
-- Aucune réponse, aucun cours et aucun corrigé stockés dans les évaluations.
begin;
set local lock_timeout='5s';
set local statement_timeout='60s';

do $$ begin
    if exists(select 1 from information_schema.columns where table_schema='public' and table_name='work_sessions' and column_name='current_evaluation_id')
        or to_regclass('public.work_evaluations') is not null then raise exception 'grading_already_present'; end if;
    if not exists(select 1 from pg_catalog.pg_trigger where tgname='refonte_lock_work_answer' and tgrelid='public.work_answers'::regclass) then
        raise exception 'answer_lock_required'; end if;
end $$;

alter table public.work_sessions add column course_version text check(course_version ~ '^v[1-9][0-9]*$');
alter table public.work_sessions add column current_evaluation_id bigint;
-- Seul le pilote connu est lié à une version. Aucun ancien cours n'est supposé migré.
update public.work_sessions set course_version='v1' where etablissement='college' and matiere='techno' and classe='3e' and seance='S02';

create table public.work_evaluations (
    id bigint generated always as identity primary key,
    work_session_id bigint not null references public.work_sessions(id),
    teacher_id uuid not null references auth.users(id),
    course_version text not null,
    correction_fingerprint text not null check(correction_fingerprint ~ '^[0-9a-f]{64}$'),
    answer_revisions jsonb not null check(jsonb_typeof(answer_revisions)='array'),
    marks jsonb not null check(jsonb_typeof(marks)='array'),
    total numeric(12,6) not null check(total between 0 and 20),
    recipient_ids uuid[] not null check(cardinality(recipient_ids) between 1 and 3),
    validated_at timestamptz not null default clock_timestamp(),
    unique(work_session_id,id)
);
alter table public.work_sessions add constraint current_evaluation_same_copy foreign key(id,current_evaluation_id)
    references public.work_evaluations(work_session_id,id);
alter table public.work_evaluations enable row level security;
revoke all on public.work_evaluations from public,anon,authenticated;
grant select on public.work_evaluations to authenticated;
revoke all on sequence public.work_evaluations_id_seq from public,anon,authenticated;
create index work_evaluations_copy_date on public.work_evaluations(work_session_id,validated_at desc);
create policy evaluation_read on public.work_evaluations for select to authenticated using (
    exists(select 1 from public.work_sessions s where s.id=work_session_id and (
        refonte_private.teacher_scope(s.etablissement,s.matiere,s.classe) or
        (s.current_evaluation_id=work_evaluations.id and auth.uid()=any(recipient_ids) and
            exists(select 1 from public.profiles p where p.user_id=auth.uid() and p.role='student' and p.enrollment_status in ('approved','legacy')))))
);

create function refonte_private.grading_copy_state() returns trigger
language plpgsql security definer set search_path='' as $$
begin
    if tg_op='INSERT' and new.etablissement='college' and new.matiere='techno' and new.classe='3e' and new.seance='S02' then new.course_version:='v1'; end if;
    if not new.terminee then new.current_evaluation_id:=null; end if;
    return new;
end $$;
revoke all on function refonte_private.grading_copy_state() from public,anon,authenticated;
create trigger refonte_grading_copy_state before insert or update on public.work_sessions
    for each row execute function refonte_private.grading_copy_state();

create function refonte_private.lock_graded_members() returns trigger
language plpgsql security definer set search_path='' as $$
declare evaluation bigint;
begin
    select current_evaluation_id into evaluation from public.work_sessions where id=new.work_session_id for update;
    if evaluation is not null and new.status='accepted' and (tg_op='INSERT' or old.status<>'accepted') then
        raise exception 'graded_copy_locked' using errcode='42501'; end if;
    return new;
end $$;
revoke all on function refonte_private.lock_graded_members() from public,anon,authenticated;
create trigger refonte_lock_graded_members before insert or update on public.work_session_members
    for each row execute function refonte_private.lock_graded_members();

create function refonte_private.validate_grade(p_copy bigint,p_version text,p_fingerprint text,p_revisions jsonb,p_marks jsonb,p_expected bigint,p_comment text)
returns bigint language plpgsql security definer set search_path='' as $$
declare s public.work_sessions; item jsonb; cell jsonb; snapshot jsonb; total_points numeric:=0; maximum_points numeric:=0;
    cell_points numeric; cell_maximum numeric;
    score numeric; maximum numeric; evaluation bigint; recipients uuid[];
begin
    select * into s from public.work_sessions where id=p_copy for update;
    if not found or not refonte_private.teacher_scope(s.etablissement,s.matiere,s.classe) or refonte_private.individual_is_history(s.id) then
        raise exception 'teacher_scope_required' using errcode='42501'; end if;
    if s.current_evaluation_id is distinct from p_expected then raise exception 'evaluation_changed' using errcode='40001'; end if;
    if s.course_version is null or p_version is distinct from s.course_version or p_fingerprint is null or p_fingerprint !~ '^[0-9a-f]{64}$' then
        raise exception 'course_version_required' using errcode='22023'; end if;
    select coalesce(jsonb_agg(jsonb_build_object('cle',question_key,'revision',revision::text) order by question_key collate "C"),'[]'::jsonb)
        into snapshot from public.work_answers where work_session_id=s.id;
    if p_revisions is distinct from snapshot then raise exception 'answers_changed' using errcode='40001'; end if;
    if p_marks is null or jsonb_typeof(p_marks)<>'array' or jsonb_array_length(p_marks) not between 1 and 1000 then
        raise exception 'invalid_marks' using errcode='22023'; end if;
    for item in select value from jsonb_array_elements(p_marks) loop
        if jsonb_typeof(item)<>'object' or not(item ?& array['cle','points','maximum','commentaire']) or
            exists(select 1 from jsonb_object_keys(item) key where key not in ('cle','points','maximum','commentaire','details')) or jsonb_typeof(item->'cle')<>'string' or length(trim(item->>'cle')) not between 1 and 160 or
            jsonb_typeof(item->'points')<>'number' or jsonb_typeof(item->'maximum')<>'number' or
            jsonb_typeof(item->'commentaire')<>'string' or length(item->>'commentaire')>2000 then
            raise exception 'invalid_marks' using errcode='22023'; end if;
        score:=(item->>'points')::numeric; maximum:=(item->>'maximum')::numeric;
        if maximum not between 0 and 20 or score not between 0 and maximum or scale(score)>6 or scale(maximum)>6 then
            raise exception 'invalid_points' using errcode='22023'; end if;
        if item ? 'details' then
            if jsonb_typeof(item->'details')<>'array' or jsonb_array_length(item->'details') not between 1 and 1000 then raise exception 'invalid_cell_marks' using errcode='22023'; end if;
            cell_points:=0; cell_maximum:=0;
            for cell in select value from jsonb_array_elements(item->'details') loop
                if jsonb_typeof(cell)<>'object' or not(cell ?& array['cle','points','maximum']) or (select count(*) from jsonb_object_keys(cell))<>3 or
                    jsonb_typeof(cell->'cle')<>'string' or length(trim(cell->>'cle')) not between 1 and 160 or
                    jsonb_typeof(cell->'points')<>'number' or jsonb_typeof(cell->'maximum')<>'number' then raise exception 'invalid_cell_marks' using errcode='22023'; end if;
                if (cell->>'maximum')::numeric not between 0 and maximum or (cell->>'points')::numeric not between 0 and (cell->>'maximum')::numeric or
                    scale((cell->>'points')::numeric)>6 or scale((cell->>'maximum')::numeric)>6 then raise exception 'invalid_cell_points' using errcode='22023'; end if;
                cell_points:=cell_points+(cell->>'points')::numeric; cell_maximum:=cell_maximum+(cell->>'maximum')::numeric;
            end loop;
            if cell_points<>score or cell_maximum<>maximum or
                (select count(distinct value->>'cle') from jsonb_array_elements(item->'details'))<>jsonb_array_length(item->'details') then
                raise exception 'cell_total_mismatch' using errcode='22023'; end if;
        end if;
        total_points:=total_points+score; maximum_points:=maximum_points+maximum;
    end loop;
    if maximum_points<>20 or (select count(distinct value->>'cle') from jsonb_array_elements(p_marks))<>jsonb_array_length(p_marks) then
        raise exception 'barème_20_required' using errcode='22023'; end if;
    if s.max_members=1 then recipients:=array[s.created_by]; else
        select array_agg(user_id order by user_id) into recipients from public.work_session_members where work_session_id=s.id and status='accepted'; end if;
    if recipients is null or cardinality(recipients) not between 1 and 3 then raise exception 'invalid_participants'; end if;
    if p_comment is not null then
        if length(p_comment)>20000 then raise exception 'invalid_comment' using errcode='22023'; end if;
        perform refonte_private.save_feedback(s.id,p_comment);
    end if;
    insert into public.work_evaluations(work_session_id,teacher_id,course_version,correction_fingerprint,answer_revisions,marks,total,recipient_ids)
        values(s.id,auth.uid(),p_version,p_fingerprint,snapshot,p_marks,total_points,recipients) returning id into evaluation;
    update public.work_sessions set terminee=true,current_evaluation_id=evaluation,updated_at=clock_timestamp() where id=s.id;
    return evaluation;
end $$;
revoke all on function refonte_private.validate_grade(bigint,text,text,jsonb,jsonb,bigint,text) from public,anon,authenticated;
grant execute on function refonte_private.validate_grade(bigint,text,text,jsonb,jsonb,bigint,text) to authenticated;
create function public.refonte_validate_grade(p_copy bigint,p_version text,p_fingerprint text,p_revisions jsonb,p_marks jsonb,p_expected bigint default null,p_comment text default null)
returns bigint language sql security invoker set search_path='' as $$
    select refonte_private.validate_grade(p_copy,p_version,p_fingerprint,p_revisions,p_marks,p_expected,p_comment);
$$;
revoke all on function public.refonte_validate_grade(bigint,text,text,jsonb,jsonb,bigint,text) from public,anon,authenticated;
grant execute on function public.refonte_validate_grade(bigint,text,text,jsonb,jsonb,bigint,text) to authenticated;
notify pgrst,'reload schema';
commit;
