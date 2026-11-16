-- Migration appliquée après validation de l’utilisateur le 19 octobre 2026.
-- Réexécution volontairement refusée par les préconditions.
-- Périmètre : copies individuelles uniquement. Aucun cours ou corrigé en base.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';
lock table public.work_sessions, public.work_answers, public.work_session_members in share row exclusive mode;

do $$
begin
    if (select count(*) from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public' and c.relname in ('work_sessions', 'work_answers', 'work_session_members')
            and c.relrowsecurity) <> 3 then
        raise exception 'RLS ou tables différentes de l’export : refaire l’audit avant application';
    end if;
    if exists (select 1 from pg_catalog.pg_policies where schemaname = 'public'
        and tablename in ('work_sessions', 'work_answers', 'work_session_members')) then
        raise exception 'Politiques déjà présentes : arrêt sans modification';
    end if;
    if exists (select 1 from pg_catalog.pg_trigger t where not t.tgisinternal
        and t.tgrelid in ('public.work_sessions'::regclass, 'public.work_answers'::regclass,
            'public.work_session_members'::regclass)) then
        raise exception 'Triggers existants à examiner avant application';
    end if;
    if exists (select 1 from public.work_sessions where max_members = 1
        group by created_by, etablissement, matiere, classe, seance having count(*) > 1) then
        raise exception 'Copies individuelles en doublon : arrêt, aucune donnée supprimée';
    end if;
    if exists (select 1 from pg_catalog.pg_rewrite r
        join pg_catalog.pg_depend d on d.classid = 'pg_catalog.pg_rewrite'::regclass and d.objid = r.oid
        join pg_catalog.pg_class v on v.oid = r.ev_class
        join pg_catalog.pg_namespace n on n.oid = v.relnamespace
        where n.nspname = 'public' and v.relkind in ('v', 'm')
            and d.refobjid in ('public.work_sessions'::regclass, 'public.work_answers'::regclass,
                'public.work_session_members'::regclass)) then
        raise exception 'Vue sur les copies à examiner avant application';
    end if;
    if exists (select 1 from pg_catalog.pg_proc p
        join pg_catalog.pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public' and p.prosecdef and p.prokind in ('f', 'p')
            and (has_function_privilege('anon', p.oid, 'execute') or has_function_privilege('authenticated', p.oid, 'execute'))
            and p.prosrc ~* 'work_(sessions|answers|session_members)') then
        raise exception 'Fonction privilégiée sur les copies à examiner avant application';
    end if;
    if exists (select 1 from information_schema.columns where table_schema = 'public'
        and table_name = 'work_answers' and column_name = 'revision') then
        raise exception 'Colonne revision déjà présente : vérifier la migration';
    end if;
end;
$$;

alter table public.work_answers add column revision bigint not null default 0 check (revision >= 0);
create unique index refonte_individual_copy_unique on public.work_sessions
    (created_by, etablissement, matiere, classe, seance) where max_members = 1;

-- Les droits par colonne doivent aussi être retirés, pas seulement les droits de table.
do $$
declare item record;
begin
    for item in select table_name, column_name from information_schema.columns
        where table_schema = 'public' and table_name in ('work_sessions', 'work_answers', 'work_session_members') loop
        execute format('revoke all privileges (%I) on table public.%I from public, anon, authenticated',
            item.column_name, item.table_name);
    end loop;
end;
$$;
revoke all privileges on public.work_sessions, public.work_answers, public.work_session_members from public, anon, authenticated;
grant select on public.work_sessions, public.work_answers to authenticated;
grant insert (etablissement, matiere, classe, seance, created_by, max_members) on public.work_sessions to authenticated;
grant insert (work_session_id, question_key, reponse) on public.work_answers to authenticated;
grant update (reponse) on public.work_answers to authenticated;

do $$
declare sequence_name text;
begin
    foreach sequence_name in array array[
        pg_catalog.pg_get_serial_sequence('public.work_sessions', 'id'),
        pg_catalog.pg_get_serial_sequence('public.work_answers', 'id')
    ] loop
        if sequence_name is not null then
            execute format('revoke all privileges on sequence %s from public, anon, authenticated', sequence_name);
            execute format('grant usage on sequence %s to authenticated', sequence_name);
        end if;
    end loop;
end;
$$;

create policy refonte_own_individual_sessions_read on public.work_sessions for select to authenticated
    using (created_by = (select auth.uid()) and max_members = 1
        and exists (select 1 from public.profiles p where p.user_id = (select auth.uid()) and p.role = 'student'));

create policy refonte_own_individual_sessions_insert on public.work_sessions for insert to authenticated
    with check (created_by = (select auth.uid()) and max_members = 1 and not terminee
        and length(trim(matiere)) > 0 and length(trim(seance)) > 0
        and exists (select 1 from public.profiles p where p.user_id = (select auth.uid())
            and p.role = 'student' and p.etablissement = work_sessions.etablissement and p.classe = work_sessions.classe));

create policy refonte_own_individual_answers_read on public.work_answers for select to authenticated
    using (exists (select 1 from public.work_sessions s where s.id = work_answers.work_session_id
        and s.created_by = (select auth.uid()) and s.max_members = 1));

create policy refonte_own_individual_answers_insert on public.work_answers for insert to authenticated
    with check (updated_by = (select auth.uid()) and length(trim(question_key)) between 1 and 160
        and length(reponse) <= 20000
        and exists (select 1 from public.work_sessions s where s.id = work_answers.work_session_id
            and s.created_by = (select auth.uid()) and s.max_members = 1 and not s.terminee));

create policy refonte_own_individual_answers_update on public.work_answers for update to authenticated
    using (exists (select 1 from public.work_sessions s where s.id = work_answers.work_session_id
        and s.created_by = (select auth.uid()) and s.max_members = 1 and not s.terminee))
    with check (updated_by = (select auth.uid()) and length(reponse) <= 20000
        and exists (select 1 from public.work_sessions s where s.id = work_answers.work_session_id
            and s.created_by = (select auth.uid()) and s.max_members = 1 and not s.terminee));

-- Invoker : aucun contournement RLS. Auteur et révision fixés par PostgreSQL.
create function public.refonte_stamp_work_answer() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
    new.updated_by := auth.uid();
    new.updated_at := pg_catalog.clock_timestamp();
    if tg_op = 'INSERT' then
        new.revision := 1;
    else
        new.revision := old.revision + 1;
        new.created_at := old.created_at;
    end if;
    return new;
end;
$$;
revoke all on function public.refonte_stamp_work_answer() from public, anon, authenticated;
create trigger refonte_stamp_work_answer before insert or update on public.work_answers
    for each row execute function public.refonte_stamp_work_answer();

-- Membres/groupes : aucun droit accordé dans ce lot.
notify pgrst, 'reload schema';
commit;
