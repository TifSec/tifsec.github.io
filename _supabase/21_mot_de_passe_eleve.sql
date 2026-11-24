-- Nouveau mot de passe d'un élève, saisi sur le poste du professeur (24/11/2026).
-- Appliqué sur la base de TEST (bac à sable). Vraie base : seulement avec l'accord du professeur.
-- Le professeur affecté à la classe de l'élève peut remplacer son mot de passe (8 caractères minimum).
-- Le mot de passe est chiffré (bcrypt) avant d'être enregistré ; il n'est jamais stocké ni renvoyé en clair.
-- Les sessions ouvertes de l'élève sont fermées. Aucune table ni politique modifiée.
begin;
create or replace function refonte_private.reset_student_password(p_student uuid,p_password text)
returns void
language plpgsql volatile security definer set search_path='' as $$
declare v_school text; v_class text;
begin
    select p.etablissement,p.classe into v_school,v_class from public.profiles p
        where p.user_id=p_student and p.role='student';
    if not found then raise exception 'student_not_found' using errcode='P0002'; end if;
    if not refonte_private.manages_class(v_school,v_class) then raise exception 'teacher_scope_required' using errcode='42501'; end if;
    if p_password is null or char_length(p_password)<8 or char_length(p_password)>72 then
        raise exception 'password_length' using errcode='22023';
    end if;
    update auth.users set encrypted_password=extensions.crypt(p_password,extensions.gen_salt('bf',10)),updated_at=now()
        where id=p_student;
    delete from auth.refresh_tokens where user_id=p_student::text;
    delete from auth.sessions where user_id=p_student;
end $$;
create or replace function public.refonte_reset_student_password(p_student uuid,p_password text)
returns void
language sql security invoker set search_path='' as $$ select refonte_private.reset_student_password(p_student,p_password) $$;
do $$ declare f record; begin
    for f in select p.oid::regprocedure signature from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace
        where (n.nspname='refonte_private' and p.proname='reset_student_password')
            or (n.nspname='public' and p.proname='refonte_reset_student_password') loop
        execute format('revoke all on function %s from public,anon,authenticated',f.signature);
        execute format('grant execute on function %s to authenticated',f.signature);
    end loop;
end $$;
notify pgrst,'reload schema';
commit;
