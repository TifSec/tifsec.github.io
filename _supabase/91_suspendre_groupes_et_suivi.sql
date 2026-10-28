-- Suspension complète après le lot 03. Aucune donnée ni politique supprimée.
-- À appliquer uniquement sur décision explicite ; les drapeaux visuels ne suffisent pas.
begin;
revoke all privileges on public.work_sessions, public.work_answers, public.work_session_members,
    public.teacher_class_assignments, public.work_feedback from public, anon, authenticated;
do $$ declare item record; begin
    for item in select table_name,column_name from information_schema.columns where table_schema='public'
        and table_name in ('work_sessions','work_answers','work_session_members','teacher_class_assignments','work_feedback') loop
        execute format('revoke all privileges (%I) on table public.%I from public, anon, authenticated',item.column_name,item.table_name);
    end loop;
    for item in select p.oid::regprocedure as signature from pg_catalog.pg_proc p
        join pg_catalog.pg_namespace n on n.oid=p.pronamespace
        where n.nspname='refonte_private' or (n.nspname='public' and p.proname in
            ('refonte_classmates','refonte_create_group','refonte_reply_invitation','refonte_invitations',
             'refonte_my_groups','refonte_teacher_copies','refonte_save_feedback','refonte_finish_copy',
             'refonte_students','refonte_update_student')) loop
        execute format('revoke all on function %s from public, anon, authenticated',item.signature);
    end loop;
end $$;
revoke all on schema refonte_private from public, anon, authenticated;
notify pgrst,'reload schema';
commit;
