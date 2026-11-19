-- Identifiant de connexion des élèves, visible par leur professeur (19/11/2026).
-- Appliqué sur la base de TEST (bac à sable). Vraie base : seulement avec l'accord du professeur.
-- Un élève se connecte avec un identifiant ; le site le stocke sous la forme <identifiant>@eleve.example.com.
-- Le professeur affecté à la classe ne reçoit que la partie avant « @ » : jamais d'adresse e-mail réelle,
-- jamais de mot de passe. Aucune table ni politique modifiée.
begin;
create or replace function refonte_private.student_logins(p_school text,p_class text)
returns table(user_id uuid,identifiant text)
language plpgsql stable security definer set search_path='' as $$
begin
    if not refonte_private.manages_class(p_school,p_class) then raise exception 'teacher_scope_required' using errcode='42501'; end if;
    return query select p.user_id,
            case when u.email like '%@eleve.example.com' then split_part(u.email::text,'@',1) end
        from public.profiles p join auth.users u on u.id=p.user_id
        where p.role='student' and p.etablissement=p_school and p.classe=p_class
        order by p.nom,p.prenom,p.user_id;
end $$;
create or replace function public.refonte_student_logins(p_school text,p_class text)
returns table(user_id uuid,identifiant text)
language sql security invoker set search_path='' as $$ select * from refonte_private.student_logins(p_school,p_class) $$;
do $$ declare f record; begin
    for f in select p.oid::regprocedure signature from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace
        where (n.nspname='refonte_private' and p.proname='student_logins')
            or (n.nspname='public' and p.proname='refonte_student_logins') loop
        execute format('revoke all on function %s from public,anon,authenticated',f.signature);
        execute format('grant execute on function %s to authenticated',f.signature);
    end loop;
end $$;
notify pgrst,'reload schema';
commit;
