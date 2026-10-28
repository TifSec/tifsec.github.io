-- Désactivation d’urgence, sans supprimer les copies ni retirer la colonne revision.
begin;
revoke all privileges on public.work_sessions, public.work_answers, public.work_session_members from public, anon, authenticated;
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
commit;
