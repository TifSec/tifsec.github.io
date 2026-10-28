-- Lecture seule : aucun contenu de copie ni identité d’élève exportés.
select jsonb_build_object(
    'tables', (
        select jsonb_agg(jsonb_build_object('table', c.relname, 'rls', c.relrowsecurity))
        from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public' and c.relname in ('work_sessions', 'work_answers', 'work_session_members')
    ),
    'policies', (select jsonb_agg(to_jsonb(p)) from pg_catalog.pg_policies p
        where schemaname = 'public' and tablename in ('work_sessions', 'work_answers', 'work_session_members')),
    'triggers', (
        select jsonb_agg(jsonb_build_object('table', c.relname,
            'trigger', pg_catalog.pg_get_triggerdef(t.oid),
            'function', pg_catalog.pg_get_functiondef(t.tgfoid)))
        from pg_catalog.pg_trigger t join pg_catalog.pg_class c on c.oid = t.tgrelid
        join pg_catalog.pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public' and not t.tgisinternal
            and c.relname in ('work_sessions', 'work_answers', 'work_session_members', 'profiles')
    ),
    'column_privileges', (select jsonb_agg(to_jsonb(g)) from information_schema.column_privileges g
        where table_schema = 'public' and table_name in ('work_sessions', 'work_answers', 'work_session_members')
            and grantee in ('PUBLIC', 'anon', 'authenticated')),
    'public_views', (select jsonb_agg(jsonb_build_object('view', c.relname,
        'definition', pg_catalog.pg_get_viewdef(c.oid, true)))
        from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public' and c.relkind in ('v', 'm')),
    'exposed_security_definer_functions', (
        select jsonb_agg(jsonb_build_object('name', p.proname,
            'definition', pg_catalog.pg_get_functiondef(p.oid)))
        from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public' and p.prosecdef and p.prokind in ('f', 'p')
            and (has_function_privilege('anon', p.oid, 'execute')
                or has_function_privilege('authenticated', p.oid, 'execute'))
    ),
    'individual_duplicate_groups', (
        select count(*) from (
            select 1 from public.work_sessions where max_members = 1
            group by created_by, etablissement, matiere, classe, seance having count(*) > 1
        ) duplicates
    )
) as audit_copies;
