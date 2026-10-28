-- Appliqué après validation explicite le 19 octobre 2026 : refonte_groupes_et_suivi_professeur.
-- Les adhésions sont attachées à UNE copie d’UNE séance ; elles ne sont jamais reconduites.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

-- Arrêt si le lot individuel ou ses protections ont changé depuis l’audit.
do $$ begin
    if (select array_agg(policyname::text order by policyname) from pg_catalog.pg_policies
        where schemaname='public' and tablename in ('work_sessions','work_answers','work_session_members'))
        is distinct from array['refonte_own_individual_answers_insert','refonte_own_individual_answers_read',
            'refonte_own_individual_answers_update','refonte_own_individual_sessions_insert','refonte_own_individual_sessions_read'] then
        raise exception 'Politiques inattendues : refaire l’audit avant application';
    end if;
    if exists (select 1 from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace
        where n.nspname='public' and c.relname in ('work_sessions','work_answers','work_session_members') and not c.relrowsecurity) then
        raise exception 'RLS désactivée : arrêt';
    end if;
end $$;

create schema refonte_private;
revoke all on schema refonte_private from public, anon, authenticated;
grant usage on schema refonte_private to authenticated;

create table public.teacher_class_assignments (
    teacher_id uuid not null references auth.users(id),
    etablissement text not null, matiere text not null, classe text not null,
    primary key (teacher_id, etablissement, matiere, classe)
);
alter table public.teacher_class_assignments enable row level security;
revoke all on public.teacher_class_assignments from public, anon, authenticated;
grant select on public.teacher_class_assignments to authenticated;
create policy teacher_own_assignments on public.teacher_class_assignments for select to authenticated
    using (teacher_id = (select auth.uid()) and exists
        (select 1 from public.profiles p where p.user_id = (select auth.uid()) and p.role = 'teacher'));

create table public.work_feedback (
    work_session_id bigint not null references public.work_sessions(id),
    teacher_id uuid not null references auth.users(id),
    commentaire text not null check (length(commentaire) <= 20000),
    updated_at timestamptz not null default now(),
    primary key (work_session_id, teacher_id)
);
alter table public.work_feedback enable row level security;
revoke all on public.work_feedback from public, anon, authenticated;
grant select on public.work_feedback to authenticated;
create index work_members_user_status on public.work_session_members(user_id,status,work_session_id);
create index work_sessions_teacher_scope on public.work_sessions(etablissement,matiere,classe,seance);
create index work_feedback_teacher on public.work_feedback(teacher_id);

create function refonte_private.teacher_scope(p_school text, p_subject text, p_class text)
returns boolean language sql stable security definer set search_path = '' as $$
    select auth.uid() is not null and exists (select 1 from public.profiles p
        join public.teacher_class_assignments a on a.teacher_id = p.user_id
        where p.user_id = auth.uid() and p.role = 'teacher' and a.etablissement = p_school
            and a.matiere = p_subject and a.classe = p_class);
$$;
create function refonte_private.can_read_copy(p_copy bigint)
returns boolean language sql stable security definer set search_path = '' as $$
    select auth.uid() is not null and exists (select 1 from public.work_sessions s
        join public.profiles p on p.user_id = auth.uid() where s.id = p_copy and (
            (p.role = 'teacher' and refonte_private.teacher_scope(s.etablissement, s.matiere, s.classe)) or
            (p.role = 'student' and ((s.max_members = 1 and s.created_by = auth.uid()) or
                (s.max_members > 1 and exists (select 1 from public.work_session_members m
                    where m.work_session_id = s.id and m.user_id = auth.uid() and m.status = 'accepted'))))));
$$;
create function refonte_private.can_edit_copy(p_copy bigint)
returns boolean language sql stable security definer set search_path = '' as $$
    select auth.uid() is not null and exists (select 1 from public.work_sessions s
        join public.profiles p on p.user_id = auth.uid() where s.id = p_copy and not s.terminee
        and p.role = 'student' and ((s.max_members = 1 and s.created_by = auth.uid()) or
            (s.max_members > 1 and exists (select 1 from public.work_session_members m
                where m.work_session_id = s.id and m.user_id = auth.uid() and m.status = 'accepted'))));
$$;

drop policy refonte_own_individual_sessions_read on public.work_sessions;
create policy refonte_copy_read on public.work_sessions for select to authenticated
    using ((max_members=1 and created_by=(select auth.uid()) and exists
        (select 1 from public.profiles p where p.user_id=(select auth.uid()) and p.role='student'))
        or refonte_private.can_read_copy(id));
drop policy refonte_own_individual_answers_read on public.work_answers;
drop policy refonte_own_individual_answers_insert on public.work_answers;
drop policy refonte_own_individual_answers_update on public.work_answers;
create policy refonte_answer_read on public.work_answers for select to authenticated
    using (refonte_private.can_read_copy(work_session_id));
create policy refonte_answer_insert on public.work_answers for insert to authenticated
    with check (refonte_private.can_edit_copy(work_session_id) and updated_by = (select auth.uid())
        and length(trim(question_key)) between 1 and 160 and length(reponse) <= 20000);
create policy refonte_answer_update on public.work_answers for update to authenticated
    using (refonte_private.can_edit_copy(work_session_id))
    with check (refonte_private.can_edit_copy(work_session_id) and updated_by = (select auth.uid()) and length(reponse) <= 20000);
grant select on public.work_session_members to authenticated;
create policy refonte_members_read on public.work_session_members for select to authenticated
    using (user_id = (select auth.uid()) or refonte_private.can_read_copy(work_session_id));
create policy refonte_feedback_read on public.work_feedback for select to authenticated
    using (refonte_private.can_read_copy(work_session_id));

create function refonte_private.classmates()
returns table(user_id uuid, prenom text, nom text)
language sql stable security definer set search_path = '' as $$
    select other.user_id, other.prenom, other.nom from public.profiles me
    join public.profiles other on other.etablissement = me.etablissement and other.classe = me.classe
    where me.user_id = auth.uid() and me.role = 'student' and other.role = 'student'
        and other.user_id <> me.user_id order by other.nom, other.prenom, other.user_id;
$$;

create function refonte_private.create_group(p_school text, p_subject text, p_class text, p_lesson text, p_invitees uuid[])
returns bigint language plpgsql security definer set search_path = '' as $$
declare actor uuid := auth.uid(); copy_id bigint; total integer := cardinality(p_invitees);
begin
    if actor is null or total is null or total not between 1 and 2 or actor = any(p_invitees)
        or total <> (select count(distinct i) from unnest(p_invitees) i)
        or coalesce(length(trim(p_subject)),0) = 0 or coalesce(length(trim(p_lesson)),0) = 0 then
        raise exception 'invalid_group' using errcode = '22023';
    end if;
    if not exists (select 1 from public.profiles where user_id = actor and role = 'student'
        and etablissement = p_school and classe = p_class) or total <> (
        select count(*) from public.profiles where user_id = any(p_invitees) and role = 'student'
            and etablissement = p_school and classe = p_class) then
        raise exception 'class_mismatch' using errcode = '42501';
    end if;
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(
        actor::text || '|' || p_school || '|' || p_subject || '|' || p_class || '|' || p_lesson, 0));
    if exists (select 1 from public.work_session_members m join public.work_sessions s on s.id = m.work_session_id
        where m.user_id = actor and m.status = 'accepted' and s.max_members > 1
            and s.etablissement = p_school and s.matiere = p_subject and s.classe = p_class and s.seance = p_lesson) then
        raise exception 'already_in_group' using errcode = '22023';
    end if;
    insert into public.work_sessions (created_by, etablissement, matiere, classe, seance, max_members)
        values (actor, p_school, p_subject, p_class, p_lesson, total + 1) returning id into copy_id;
    insert into public.work_session_members (work_session_id, user_id, status, joined_at)
        values (copy_id, actor, 'accepted', pg_catalog.clock_timestamp());
    insert into public.work_session_members (work_session_id, user_id)
        select copy_id, i from unnest(p_invitees) i;
    return copy_id;
end;
$$;

create function refonte_private.reply_invitation(p_invitation bigint, p_accept boolean)
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
    update public.work_session_members set status = case when p_accept then 'accepted' else 'declined' end,
        joined_at = case when p_accept then pg_catalog.clock_timestamp() else null end where id = p_invitation and user_id = actor;
    return copy_row.id;
end;
$$;

create function refonte_private.invitations()
returns table(invitation_id bigint, copy_id bigint, invited_by text, etablissement text, matiere text, classe text, seance text)
language sql stable security definer set search_path = '' as $$
    select m.id, s.id, trim(owner.prenom || ' ' || owner.nom), s.etablissement, s.matiere, s.classe, s.seance
    from public.work_session_members m join public.work_sessions s on s.id = m.work_session_id
    join public.profiles owner on owner.user_id = s.created_by
    where m.user_id = auth.uid() and m.status = 'pending' and exists
        (select 1 from public.profiles me where me.user_id = auth.uid() and me.role = 'student') order by m.created_at;
$$;
create function refonte_private.my_groups(p_school text, p_subject text, p_class text, p_lesson text)
returns table(copy_id bigint, max_members smallint, participants text, etablissement text, matiere text, classe text, seance text)
language sql stable security definer set search_path = '' as $$
    select s.id, s.max_members, string_agg(trim(p.prenom || ' ' || p.nom), ', ' order by p.nom, p.prenom),
        s.etablissement,s.matiere,s.classe,s.seance
    from public.work_sessions s join public.work_session_members m on m.work_session_id = s.id and m.status = 'accepted'
    join public.profiles p on p.user_id = m.user_id
    where s.max_members > 1 and (p_school is null or s.etablissement = p_school) and (p_subject is null or s.matiere = p_subject)
        and (p_class is null or s.classe = p_class) and (p_lesson is null or s.seance = p_lesson) and exists (select 1 from public.work_session_members mine
            where mine.work_session_id = s.id and mine.user_id = auth.uid() and mine.status = 'accepted')
        and exists (select 1 from public.profiles me where me.user_id = auth.uid() and me.role = 'student')
    group by s.id order by s.id;
$$;

create function refonte_private.teacher_copies(p_school text, p_subject text, p_class text, p_lesson text)
returns table(copy_id bigint, max_members smallint, participants text, answer_count bigint, last_saved timestamptz, terminee boolean)
language plpgsql stable security definer set search_path = '' as $$
begin
    if not refonte_private.teacher_scope(p_school,p_subject,p_class) then raise exception 'teacher_scope_required' using errcode='42501'; end if;
    return query select s.id, s.max_members,
        case when s.max_members = 1 then trim(owner.prenom || ' ' || owner.nom) else
            (select string_agg(trim(p.prenom || ' ' || p.nom), ', ' order by p.nom,p.prenom)
                from public.work_session_members m join public.profiles p on p.user_id=m.user_id
                where m.work_session_id=s.id and m.status='accepted') end,
        (select count(*) from public.work_answers a where a.work_session_id=s.id and length(trim(a.reponse))>0),
        (select max(a.updated_at) from public.work_answers a where a.work_session_id=s.id), s.terminee
    from public.work_sessions s join public.profiles owner on owner.user_id=s.created_by
    where s.etablissement=p_school and s.matiere=p_subject and s.classe=p_class and s.seance=p_lesson order by s.id;
end;
$$;
create function refonte_private.save_feedback(p_copy bigint, p_comment text)
returns void language plpgsql security definer set search_path = '' as $$
declare s public.work_sessions;
begin
    select * into s from public.work_sessions where id=p_copy;
    if not found or not refonte_private.teacher_scope(s.etablissement,s.matiere,s.classe) then
        raise exception 'teacher_scope_required' using errcode='42501'; end if;
    if p_comment is null or length(p_comment)>20000 then raise exception 'invalid_feedback' using errcode='22023'; end if;
    insert into public.work_feedback (work_session_id,teacher_id,commentaire) values(p_copy,auth.uid(),p_comment)
        on conflict(work_session_id,teacher_id) do update set commentaire=excluded.commentaire,updated_at=pg_catalog.clock_timestamp();
end;
$$;
create function refonte_private.finish_copy(p_copy bigint, p_finished boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare s public.work_sessions;
begin
    select * into s from public.work_sessions where id=p_copy for update;
    if not found or p_finished is null or not refonte_private.teacher_scope(s.etablissement,s.matiere,s.classe) then
        raise exception 'teacher_scope_required' using errcode='42501'; end if;
    update public.work_sessions set terminee=p_finished,updated_at=pg_catalog.clock_timestamp() where id=p_copy;
end;
$$;

-- Wrappers invoker exposés ; les fonctions privilégiées restent dans le schéma privé.
create function public.refonte_classmates() returns table(user_id uuid,prenom text,nom text)
    language sql security invoker set search_path='' as $$ select * from refonte_private.classmates() $$;
create function public.refonte_create_group(p_school text,p_subject text,p_class text,p_lesson text,p_invitees uuid[]) returns bigint
    language sql security invoker set search_path='' as $$ select refonte_private.create_group(p_school,p_subject,p_class,p_lesson,p_invitees) $$;
create function public.refonte_reply_invitation(p_invitation bigint,p_accept boolean) returns bigint
    language sql security invoker set search_path='' as $$ select refonte_private.reply_invitation(p_invitation,p_accept) $$;
create function public.refonte_invitations() returns table(invitation_id bigint,copy_id bigint,invited_by text,etablissement text,matiere text,classe text,seance text)
    language sql security invoker set search_path='' as $$ select * from refonte_private.invitations() $$;
create function public.refonte_my_groups(p_school text default null,p_subject text default null,p_class text default null,p_lesson text default null)
    returns table(copy_id bigint,max_members smallint,participants text,etablissement text,matiere text,classe text,seance text)
    language sql security invoker set search_path='' as $$ select * from refonte_private.my_groups(p_school,p_subject,p_class,p_lesson) $$;
create function public.refonte_teacher_copies(p_school text,p_subject text,p_class text,p_lesson text)
    returns table(copy_id bigint,max_members smallint,participants text,answer_count bigint,last_saved timestamptz,terminee boolean)
    language sql security invoker set search_path='' as $$ select * from refonte_private.teacher_copies(p_school,p_subject,p_class,p_lesson) $$;
create function public.refonte_save_feedback(p_copy bigint,p_comment text) returns void
    language sql security invoker set search_path='' as $$ select refonte_private.save_feedback(p_copy,p_comment) $$;
create function public.refonte_finish_copy(p_copy bigint,p_finished boolean) returns void
    language sql security invoker set search_path='' as $$ select refonte_private.finish_copy(p_copy,p_finished) $$;

do $$ declare f record; begin
    for f in select p.oid::regprocedure as signature from pg_catalog.pg_proc p
        join pg_catalog.pg_namespace n on n.oid=p.pronamespace
        where n.nspname='refonte_private' or (n.nspname='public' and p.proname in
            ('refonte_classmates','refonte_create_group','refonte_reply_invitation','refonte_invitations',
             'refonte_my_groups','refonte_teacher_copies','refonte_save_feedback','refonte_finish_copy')) loop
        execute format('revoke all on function %s from public, anon, authenticated',f.signature);
        execute format('grant execute on function %s to authenticated',f.signature);
    end loop;
end $$;

-- Affectation initiale proposée : uniquement le professeur unique et la séance pilote 3e collège.
-- Arrêt si plusieurs professeurs : aucun choix silencieux de compte.
do $$ begin
    if (select count(*) from public.profiles where role='teacher') <> 1 then
        raise exception 'Choisir explicitement le professeur à affecter avant application';
    end if;
    insert into public.teacher_class_assignments(teacher_id,etablissement,matiere,classe)
        select user_id,'college','techno','3e' from public.profiles where role='teacher';
end $$;
notify pgrst,'reload schema';
commit;
