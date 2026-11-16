-- Bonus d'XP pour le petit défi (29 octobre 2026).
-- Le défi reste facultatif et hors de la note sur 20. Le professeur coche « défi réussi »
-- sur une copie : chaque participant de cette copie gagne 5 XP, une seule fois par séance.
-- XP gagnée = 10 par séance remise + meilleure note sur 20 par séance + 5 par défi réussi.
-- Seul un professeur affecté à la classe peut accorder ou retirer le bonus ; l'élève peut seulement le lire.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

create table if not exists public.challenge_awards (
    work_session_id bigint primary key references public.work_sessions(id) on delete cascade,
    awarded_by uuid not null references auth.users(id) on delete cascade,
    awarded_at timestamptz not null default now()
);
alter table public.challenge_awards enable row level security;
drop policy if exists "Lire le bonus de défi de ses copies" on public.challenge_awards;
create policy "Lire le bonus de défi de ses copies" on public.challenge_awards for select to authenticated
    using (refonte_private.can_read_copy(work_session_id));
revoke all on public.challenge_awards from anon, authenticated;
grant select on public.challenge_awards to authenticated;

create or replace function refonte_private.set_challenge_award(p_copy bigint, p_awarded boolean)
returns boolean
language plpgsql volatile security definer set search_path = '' as $$
declare s public.work_sessions;
begin
    if auth.uid() is null then raise exception 'not_authenticated' using errcode = '42501'; end if;
    select * into s from public.work_sessions where id = p_copy for update;
    if not found or p_awarded is null or not refonte_private.teacher_scope(s.etablissement, s.matiere, s.classe) then
        raise exception 'teacher_scope_required' using errcode = '42501'; end if;
    if p_awarded then
        insert into public.challenge_awards (work_session_id, awarded_by) values (p_copy, auth.uid())
        on conflict (work_session_id) do nothing;
    else
        delete from public.challenge_awards where work_session_id = p_copy;
    end if;
    return p_awarded;
end
$$;

create or replace function public.refonte_set_challenge_award(p_copy bigint, p_awarded boolean)
returns boolean
language sql set search_path = '' as $$ select refonte_private.set_challenge_award(p_copy, p_awarded) $$;

create or replace function refonte_private.student_xp_earned(p_user uuid) returns integer
language sql stable security definer set search_path = '' as $$
    with remises as (
        select distinct s.etablissement, s.matiere, s.classe, s.seance
        from public.work_sessions s
        where s.terminee and (s.created_by = p_user or exists (
            select 1 from public.work_session_members m
            where m.work_session_id = s.id and m.user_id = p_user and m.status = 'accepted'))
    ), notes as (
        select s.etablissement, s.matiere, s.classe, s.seance, max(e.total) as meilleure
        from public.work_evaluations e
        join public.work_sessions s on s.id = e.work_session_id
        where p_user = any (e.recipient_ids)
        group by 1, 2, 3, 4
    ), defis as (
        select distinct s.etablissement, s.matiere, s.classe, s.seance
        from public.challenge_awards c
        join public.work_sessions s on s.id = c.work_session_id
        where s.created_by = p_user or exists (
            select 1 from public.work_session_members m
            where m.work_session_id = s.id and m.user_id = p_user and m.status = 'accepted')
    )
    select (10 * (select count(*) from remises)
        + coalesce((select floor(sum(least(greatest(meilleure, 0), 20))) from notes), 0)
        + 5 * (select count(*) from defis))::integer
$$;

revoke all on function refonte_private.set_challenge_award(bigint, boolean) from public, anon, authenticated;
grant execute on function refonte_private.set_challenge_award(bigint, boolean) to authenticated;
revoke all on function public.refonte_set_challenge_award(bigint, boolean) from public, anon;
grant execute on function public.refonte_set_challenge_award(bigint, boolean) to authenticated;
revoke all on function refonte_private.student_xp_earned(uuid) from public, anon, authenticated;

notify pgrst, 'reload schema';
commit;
