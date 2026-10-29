-- XP des élèves et thèmes à débloquer (29 octobre 2026).
-- XP gagnée = 10 par séance remise (copie terminée dont l'élève est membre accepté)
--           + la meilleure note sur 20 obtenue pour chaque séance (arrondie à l'entier inférieur).
-- Solde = XP gagnée - coût des thèmes débloqués. Océan est gratuit.
-- Tout est calculé côté serveur : l'élève ne peut ni s'attribuer d'XP ni débloquer un thème sans solde.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

create table if not exists public.theme_unlocks (
    user_id uuid not null references auth.users(id) on delete cascade,
    theme text not null check (theme ~ '^[a-z]{2,20}$'),
    cost integer not null check (cost between 0 and 1000),
    unlocked_at timestamptz not null default now(),
    primary key (user_id, theme)
);
alter table public.theme_unlocks enable row level security;
drop policy if exists "Lire ses thèmes débloqués" on public.theme_unlocks;
create policy "Lire ses thèmes débloqués" on public.theme_unlocks for select to authenticated using (user_id = (select auth.uid()));
revoke all on public.theme_unlocks from anon, authenticated;
grant select on public.theme_unlocks to authenticated;

create or replace function refonte_private.theme_cost(p_theme text) returns integer
language sql immutable set search_path = '' as $$
    select case p_theme
        when 'ocean' then 0
        when 'forest' then 30 when 'plum' then 30 when 'terracotta' then 30
        when 'ruby' then 30 when 'slate' then 30 when 'rose' then 30
        when 'midnight' then 60 when 'neon' then 60
        when 'cyberpunk' then 100 when 'minecraft' then 100 when 'farming' then 100
    end
$$;

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
    )
    select (10 * (select count(*) from remises) + coalesce((select floor(sum(least(greatest(meilleure, 0), 20))) from notes), 0))::integer
$$;

create or replace function public.refonte_my_xp()
returns table (earned integer, spent integer, balance integer, unlocked text[])
language plpgsql stable security definer set search_path = '' as $$
declare
    v_user uuid := auth.uid();
    v_earned integer;
    v_spent integer;
    v_unlocked text[];
begin
    if v_user is null then raise exception 'not_authenticated' using errcode = '42501'; end if;
    v_earned := refonte_private.student_xp_earned(v_user);
    select coalesce(sum(t.cost), 0)::integer, coalesce(array_agg(t.theme order by t.theme), '{}')
      into v_spent, v_unlocked
      from public.theme_unlocks t where t.user_id = v_user;
    return query select v_earned, v_spent, v_earned - v_spent, v_unlocked;
end
$$;

create or replace function public.refonte_unlock_theme(p_theme text)
returns table (earned integer, spent integer, balance integer, unlocked text[])
language plpgsql volatile security definer set search_path = '' as $$
declare
    v_user uuid := auth.uid();
    v_cost integer := refonte_private.theme_cost(p_theme);
    v_balance integer;
begin
    if v_user is null then raise exception 'not_authenticated' using errcode = '42501'; end if;
    if v_cost is null then raise exception 'unknown_theme' using errcode = '22023'; end if;
    -- Deux clics simultanés ne peuvent pas dépenser deux fois le même solde.
    perform pg_advisory_xact_lock(hashtextextended('theme_unlock:' || v_user::text, 0));
    if not exists (select 1 from public.theme_unlocks t where t.user_id = v_user and t.theme = p_theme) then
        select x.balance into v_balance from public.refonte_my_xp() x;
        if v_balance < v_cost then raise exception 'insufficient_xp' using errcode = 'P0001'; end if;
        insert into public.theme_unlocks (user_id, theme, cost) values (v_user, p_theme, v_cost);
    end if;
    return query select * from public.refonte_my_xp();
end
$$;

revoke all on function refonte_private.theme_cost(text) from public, anon, authenticated;
revoke all on function refonte_private.student_xp_earned(uuid) from public, anon, authenticated;
revoke all on function public.refonte_my_xp() from public, anon;
revoke all on function public.refonte_unlock_theme(text) from public, anon;
grant execute on function public.refonte_my_xp() to authenticated;
grant execute on function public.refonte_unlock_theme(text) to authenticated;

notify pgrst, 'reload schema';
commit;
