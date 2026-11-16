-- Gestion des élèves et validation ; comptes existants préservés, nouvelles inscriptions en attente.
begin;
set local lock_timeout='5s';
set local statement_timeout='60s';
alter table public.profiles add column enrollment_status text not null default 'pending'
    check(enrollment_status in ('pending','approved','legacy'));
alter table public.profiles add column validated_by uuid references auth.users(id);
alter table public.profiles add column validated_at timestamptz;
update public.profiles set enrollment_status='legacy' where role='student';
create index profiles_validated_by on public.profiles(validated_by);

-- Le professeur unique gère toutes les classes du référentiel, conformément au choix explicite.
do $$ begin
    if (select count(*) from public.profiles where role='teacher')<>1 then raise exception 'Choisir explicitement le professeur'; end if;
    insert into public.teacher_class_assignments(teacher_id,etablissement,matiere,classe)
        select p.user_id,c.school,c.subject,c.class from public.profiles p cross join
        (values ('college','techno','5e'),('college','techno','4e'),('college','techno','3e'),
            ('mfr','tim','4e'),('mfr','maths','4e'),('mfr','tim','3e'),('mfr','maths','3e'),
            ('mfr','tim','cap1'),('mfr','tim','cap2'),('mfr','tim','2de'),('mfr','maths','2de'),
            ('mfr','tim','1re'),('mfr','maths','1re'),('mfr','tim','term'),('mfr','maths','term'),
            ('mfr','tim','bts1'),('mfr','tim','bts2')) c(school,subject,class)
        where p.role='teacher' on conflict do nothing;
end $$;

-- Réduire les droits de profil sans toucher aux politiques de l’ancien site.
revoke insert,update on public.profiles from public,anon,authenticated;
do $$ declare c record; begin
    for c in select column_name from information_schema.columns where table_schema='public' and table_name='profiles' loop
        execute format('revoke insert (%I), update (%I) on public.profiles from public,anon,authenticated',c.column_name,c.column_name);
    end loop;
end $$;
grant insert(user_id,prenom,nom,role,etablissement,classe) on public.profiles to authenticated;
grant update(prenom,nom) on public.profiles to authenticated;

create function refonte_private.student_ready() returns boolean
language sql stable security definer set search_path='' as $$
    select auth.uid() is not null and exists(select 1 from public.profiles where user_id=auth.uid()
        and role='student' and enrollment_status in ('legacy','approved'));
$$;
create function refonte_private.manages_class(p_school text,p_class text) returns boolean
language sql stable security definer set search_path='' as $$
    select auth.uid() is not null and exists(select 1 from public.profiles p
        join public.teacher_class_assignments a on a.teacher_id=p.user_id where p.user_id=auth.uid() and p.role='teacher'
            and a.etablissement=p_school and a.classe=p_class);
$$;
create function refonte_private.class_exists(p_school text,p_class text) returns boolean
language sql stable security definer set search_path='' as $$
    select auth.uid() is not null and exists(select 1 from public.teacher_class_assignments where etablissement=p_school and classe=p_class);
$$;
create policy refonte_pending_profile_insert on public.profiles as restrictive for insert to authenticated
    with check(enrollment_status='pending' and validated_by is null and validated_at is null
        and refonte_private.class_exists(etablissement,classe));
create policy refonte_approved_student_insert on public.work_sessions as restrictive for insert to authenticated
    with check(refonte_private.student_ready());
create or replace function refonte_private.can_edit_copy(p_copy bigint)
returns boolean language sql stable security definer set search_path='' as $$
    select refonte_private.student_ready() and exists(select 1 from public.work_sessions s
        join public.profiles p on p.user_id=auth.uid() where s.id=p_copy and not s.terminee and p.role='student'
        and ((s.max_members=1 and s.created_by=auth.uid() and not refonte_private.individual_is_history(s.id))
            or (s.max_members>1 and exists(select 1 from public.work_session_members m
                where m.work_session_id=s.id and m.user_id=auth.uid() and m.status='accepted'))));
$$;

create or replace function refonte_private.create_group(p_school text, p_subject text, p_class text, p_lesson text, p_invitees uuid[])
returns bigint language plpgsql security definer set search_path = '' as $$
declare actor uuid := auth.uid(); copy_id bigint; source_id bigint; total integer := cardinality(p_invitees);
begin
    if not refonte_private.student_ready() then raise exception 'enrollment_pending' using errcode='42501'; end if;
    if actor is null or total is null or total not between 1 and 2 or actor = any(p_invitees)
        or total <> (select count(distinct i) from unnest(p_invitees) i)
        or coalesce(length(trim(p_subject)),0) = 0 or coalesce(length(trim(p_lesson)),0) = 0 then
        raise exception 'invalid_group' using errcode = '22023';
    end if;
    if not exists (select 1 from public.profiles where user_id = actor and role = 'student'
        and etablissement = p_school and classe = p_class) or total <> (
        select count(*) from public.profiles where user_id = any(p_invitees) and role = 'student'
            and etablissement = p_school and classe = p_class and enrollment_status in ('legacy','approved')) then
        raise exception 'class_mismatch' using errcode = '42501';
    end if;
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(
        actor::text || '|' || p_school || '|' || p_subject || '|' || p_class || '|' || p_lesson, 0));
    if exists (select 1 from public.work_session_members m join public.work_sessions s on s.id = m.work_session_id
        where m.user_id = actor and m.status = 'accepted' and s.max_members > 1
            and s.etablissement = p_school and s.matiere = p_subject and s.classe = p_class and s.seance = p_lesson) then
        raise exception 'already_in_group' using errcode = '22023';
    end if;
    select s.id into source_id from public.work_sessions s where s.created_by=actor and s.max_members=1
        and s.etablissement=p_school and s.matiere=p_subject and s.classe=p_class and s.seance=p_lesson for update;
    if source_id is not null and exists(select 1 from public.work_sessions where id=source_id and terminee) then
        raise exception 'copy_closed' using errcode='42501';
    end if;
    insert into public.work_sessions (created_by, etablissement, matiere, classe, seance, max_members)
        values (actor, p_school, p_subject, p_class, p_lesson, total + 1) returning id into copy_id;
    insert into public.work_session_members (work_session_id, user_id, status, joined_at)
        values (copy_id, actor, 'accepted', pg_catalog.clock_timestamp());
    insert into public.work_session_members (work_session_id, user_id)
        select copy_id, i from unnest(p_invitees) i;
    insert into public.work_answers(work_session_id,question_key,reponse)
        select copy_id,a.question_key,a.reponse from public.work_answers a where a.work_session_id=source_id;
    return copy_id;
end;
$$;


create or replace function refonte_private.reply_invitation(p_invitation bigint, p_accept boolean)
returns bigint language plpgsql security definer set search_path = '' as $$
declare actor uuid := auth.uid(); copy_row public.work_sessions; member_row public.work_session_members; n integer;
begin
    if actor is null or p_accept is null then raise exception 'not_authenticated' using errcode = '42501'; end if;
    select s.* into copy_row from public.work_sessions s join public.work_session_members m on m.work_session_id = s.id
        where m.id = p_invitation and m.user_id = actor;
    if not found then raise exception 'invitation_not_found' using errcode = '42501'; end if;
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(actor::text || '|' || copy_row.etablissement || '|'
        || copy_row.matiere || '|' || copy_row.classe || '|' || copy_row.seance, 0));
    select * into copy_row from public.work_sessions where id = copy_row.id for update;
    select * into member_row from public.work_session_members where id = p_invitation and user_id = actor for update;
    if member_row.status = 'accepted' and p_accept then return copy_row.id; end if;
    if member_row.status = 'declined' and not p_accept then return copy_row.id; end if;
    if member_row.status <> 'pending' then raise exception 'invitation_already_answered' using errcode = '22023'; end if;
    if not exists (select 1 from public.profiles where user_id = actor and role = 'student') then
        raise exception 'student_required' using errcode = '42501';
    end if;
    if p_accept then
        if not refonte_private.student_ready() then raise exception 'enrollment_pending' using errcode='42501'; end if;
        if copy_row.terminee or not exists (select 1 from public.profiles where user_id = actor
            and etablissement = copy_row.etablissement and classe = copy_row.classe) then
            raise exception 'copy_closed_or_class_changed' using errcode = '42501';
        end if;
        if exists (select 1 from public.work_session_members m join public.work_sessions s on s.id = m.work_session_id
            where m.user_id = actor and m.status = 'accepted' and s.max_members > 1 and s.id <> copy_row.id
                and s.etablissement = copy_row.etablissement and s.matiere = copy_row.matiere
                and s.classe = copy_row.classe and s.seance = copy_row.seance) then
            raise exception 'already_in_group' using errcode = '22023';
        end if;
        select count(*) into n from public.work_session_members where work_session_id = copy_row.id and status = 'accepted';
        if n >= copy_row.max_members then raise exception 'group_full' using errcode = '22023'; end if;
    end if;
    if p_accept then
        perform 1 from public.work_sessions i where i.created_by=actor and i.max_members=1
            and (i.etablissement,i.matiere,i.classe,i.seance)=
                (copy_row.etablissement,copy_row.matiere,copy_row.classe,copy_row.seance) for update;
    end if;
    update public.work_session_members set status = case when p_accept then 'accepted' else 'declined' end,
        joined_at = case when p_accept then pg_catalog.clock_timestamp() else null end where id = p_invitation and user_id = actor;
    return copy_row.id;
end;
$$;



create or replace function refonte_private.classmates()
returns table(user_id uuid,prenom text,nom text) language sql stable security definer set search_path='' as $$
    select other.user_id,other.prenom,other.nom from public.profiles me
    join public.profiles other on other.etablissement=me.etablissement and other.classe=me.classe
    where me.user_id=auth.uid() and me.role='student' and me.enrollment_status in ('legacy','approved')
        and other.role='student' and other.enrollment_status in ('legacy','approved')
        and other.user_id<>me.user_id order by other.nom,other.prenom,other.user_id;
$$;

create function refonte_private.students(p_school text,p_class text)
returns table(user_id uuid,prenom text,nom text,etablissement text,classe text,enrollment_status text,validated_at timestamptz)
language plpgsql stable security definer set search_path='' as $$
begin
    if not refonte_private.manages_class(p_school,p_class) then raise exception 'teacher_scope_required' using errcode='42501'; end if;
    return query select p.user_id,p.prenom,p.nom,p.etablissement,p.classe,p.enrollment_status,p.validated_at
        from public.profiles p where p.role='student' and p.etablissement=p_school and p.classe=p_class order by p.nom,p.prenom,p.user_id;
end $$;
create function refonte_private.update_student(p_student uuid,p_school text,p_class text,p_approve boolean,
    p_expected_school text,p_expected_class text,p_expected_status text)
returns void language plpgsql security definer set search_path='' as $$
declare pupil public.profiles;
begin
    select * into pupil from public.profiles where user_id=p_student for update;
    if not found or pupil.role<>'student' or p_approve is null
        or not refonte_private.manages_class(pupil.etablissement,pupil.classe)
        or not refonte_private.manages_class(p_school,p_class) then
        raise exception 'teacher_scope_required' using errcode='42501'; end if;
    if (pupil.etablissement,pupil.classe,pupil.enrollment_status) is distinct from
        (p_expected_school,p_expected_class,p_expected_status) then raise exception 'student_changed' using errcode='40001'; end if;
    update public.profiles set etablissement=p_school,classe=p_class,
        enrollment_status=case when p_approve then 'approved' else pupil.enrollment_status end,
        validated_by=case when p_approve then auth.uid() else pupil.validated_by end,
        validated_at=case when p_approve then pg_catalog.clock_timestamp() else pupil.validated_at end
        where user_id=p_student;
end $$;
create function public.refonte_students(p_school text,p_class text)
returns table(user_id uuid,prenom text,nom text,etablissement text,classe text,enrollment_status text,validated_at timestamptz)
language sql security invoker set search_path='' as $$ select * from refonte_private.students(p_school,p_class) $$;
create function public.refonte_update_student(p_student uuid,p_school text,p_class text,p_approve boolean,
    p_expected_school text,p_expected_class text,p_expected_status text)
returns void language sql security invoker set search_path='' as $$
    select refonte_private.update_student(p_student,p_school,p_class,p_approve,p_expected_school,p_expected_class,p_expected_status)
$$;
do $$ declare f record; begin
    for f in select p.oid::regprocedure signature from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace
        where (n.nspname='refonte_private' and p.proname in ('student_ready','manages_class','class_exists','students','update_student'))
            or (n.nspname='public' and p.proname in ('refonte_students','refonte_update_student')) loop
        execute format('revoke all on function %s from public,anon,authenticated',f.signature);
        execute format('grant execute on function %s to authenticated',f.signature);
    end loop;
end $$;
notify pgrst,'reload schema';
commit;

