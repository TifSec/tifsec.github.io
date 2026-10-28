-- Appliqué après accord le 20 octobre 2026 : 20261020135647 refonte_fin_de_travail_et_versions_s10.
-- Ne pas réappliquer. La déclaration élève ne clôture PAS la saisie.
begin;
set local lock_timeout='5s';
set local statement_timeout='60s';

alter table public.work_sessions add column submitted_at timestamptz;
alter table public.work_sessions add column submitted_by uuid references auth.users(id);
create index work_sessions_submitted_by on public.work_sessions(submitted_by);
alter table public.work_sessions add constraint submission_pair check ((submitted_at is null)=(submitted_by is null));
create function refonte_private.clear_submission_on_reopen() returns trigger
language plpgsql security definer set search_path='' as $$
begin
    if old.terminee and not new.terminee then new.submitted_at:=null; new.submitted_by:=null; end if;
    return new;
end $$;
revoke all on function refonte_private.clear_submission_on_reopen() from public,anon,authenticated;
create trigger refonte_submission_reopen before update on public.work_sessions
    for each row execute function refonte_private.clear_submission_on_reopen();

create function refonte_private.submit_copy(p_copy bigint,p_revisions jsonb) returns boolean
language plpgsql security definer set search_path='' as $$
declare s public.work_sessions; snapshot jsonb;
begin
    select * into s from public.work_sessions where id=p_copy for update;
    if not found or not refonte_private.student_ready() or not refonte_private.can_read_copy(s.id)
        or (s.max_members=1 and refonte_private.individual_is_history(s.id)) then
        raise exception 'student_copy_required' using errcode='42501'; end if;
    select coalesce(jsonb_agg(jsonb_build_object('cle',question_key,'revision',revision::text) order by question_key collate "C"),'[]'::jsonb)
        into snapshot from public.work_answers where work_session_id=s.id;
    if p_revisions is distinct from snapshot then raise exception 'answers_changed' using errcode='40001'; end if;
    if s.terminee then return true; end if;
    if not refonte_private.can_edit_copy(s.id) then raise exception 'student_copy_required' using errcode='42501'; end if;
    if not exists(select 1 from public.work_answers where work_session_id=s.id and length(trim(reponse))>0) then
        raise exception 'empty_copy' using errcode='22023'; end if;
    if s.submitted_at is not null then return true; end if;
    update public.work_sessions set submitted_by=auth.uid(),submitted_at=clock_timestamp(),updated_at=clock_timestamp() where id=s.id;
    return true;
end $$;
create function public.refonte_submit_copy(p_copy bigint,p_revisions jsonb) returns boolean
language sql security invoker set search_path='' as $$ select refonte_private.submit_copy(p_copy,p_revisions) $$;
revoke all on function refonte_private.submit_copy(bigint,jsonb),public.refonte_submit_copy(bigint,jsonb) from public,anon,authenticated;
grant execute on function refonte_private.submit_copy(bigint,jsonb),public.refonte_submit_copy(bigint,jsonb) to authenticated;

-- Liaison explicite des deux S10 non encore notées au corrigé v1.
update public.work_sessions s set course_version='v1' where etablissement='college' and matiere='techno' and classe='3e'
    and seance in ('S10','S10R') and course_version is null and not exists(select 1 from public.work_evaluations e where e.work_session_id=s.id);
create or replace function refonte_private.grading_copy_state() returns trigger
language plpgsql security definer set search_path='' as $$
begin
    if tg_op='INSERT' and new.etablissement='college' and new.matiere='techno' and new.classe='3e'
        and new.seance in ('S02','S10','S10R') then new.course_version:='v1'; end if;
    if not new.terminee then new.current_evaluation_id:=null; end if;
    return new;
end $$;
revoke all on function refonte_private.grading_copy_state() from public,anon,authenticated;

commit;
