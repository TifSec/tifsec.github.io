-- Validé par l’utilisateur : une copie de référence et un historique individuel par séance.
begin;
set local lock_timeout='5s';
set local statement_timeout='60s';

create function refonte_private.individual_is_history(p_copy bigint)
returns boolean language sql stable security definer set search_path='' as $$
    select refonte_private.can_read_copy(p_copy) and exists(
        select 1 from public.work_sessions i join public.work_session_members m on m.user_id=i.created_by and m.status='accepted'
        join public.work_sessions g on g.id=m.work_session_id and g.max_members>1
        where i.id=p_copy and i.max_members=1 and
            (i.etablissement,i.matiere,i.classe,i.seance)=(g.etablissement,g.matiere,g.classe,g.seance));
$$;
create or replace function refonte_private.can_edit_copy(p_copy bigint)
returns boolean language sql stable security definer set search_path='' as $$
    select auth.uid() is not null and exists(select 1 from public.work_sessions s
        join public.profiles p on p.user_id=auth.uid() where s.id=p_copy and not s.terminee and p.role='student'
        and ((s.max_members=1 and s.created_by=auth.uid() and not refonte_private.individual_is_history(s.id))
            or (s.max_members>1 and exists(select 1 from public.work_session_members m
                where m.work_session_id=s.id and m.user_id=auth.uid() and m.status='accepted'))));
$$;

-- Lecture propre conservée ; pas de nouvelle copie individuelle parallèle à un groupe accepté.
create function refonte_private.has_group(p_school text,p_subject text,p_class text,p_lesson text)
returns boolean language sql stable security definer set search_path='' as $$
    select auth.uid() is not null and exists(select 1 from public.work_sessions g
        join public.work_session_members m on m.work_session_id=g.id
        where m.user_id=auth.uid() and m.status='accepted' and g.max_members>1
            and (g.etablissement,g.matiere,g.classe,g.seance)=(p_school,p_subject,p_class,p_lesson));
$$;
revoke all on function refonte_private.has_group(text,text,text,text) from public,anon,authenticated;
grant execute on function refonte_private.has_group(text,text,text,text) to authenticated;
drop policy refonte_own_individual_sessions_insert on public.work_sessions;
create policy refonte_own_individual_sessions_insert on public.work_sessions for insert to authenticated
    with check(created_by=(select auth.uid()) and max_members=1 and not terminee
        and length(trim(matiere))>0 and length(trim(seance))>0
        and exists(select 1 from public.profiles p where p.user_id=(select auth.uid()) and p.role='student'
            and p.etablissement=work_sessions.etablissement and p.classe=work_sessions.classe)
        and not refonte_private.has_group(etablissement,matiere,classe,seance));

-- Sérialise les réponses avec la transformation de l’individuel en historique et la clôture professeur.
create function refonte_private.lock_answer_copy() returns trigger
language plpgsql security definer set search_path='' as $$
begin
    if not refonte_private.can_edit_copy(new.work_session_id) then
        raise exception 'copy_read_only' using errcode='42501';
    end if;
    perform 1 from public.work_sessions where id=new.work_session_id for update;
    if not refonte_private.can_edit_copy(new.work_session_id) then
        raise exception 'copy_read_only' using errcode='42501';
    end if;
    return new;
end;
$$;
revoke all on function refonte_private.lock_answer_copy() from public,anon,authenticated;
create trigger refonte_lock_work_answer before insert or update on public.work_answers
    for each row execute function refonte_private.lock_answer_copy();

create or replace function refonte_private.create_group(p_school text, p_subject text, p_class text, p_lesson text, p_invitees uuid[])
returns bigint language plpgsql security definer set search_path = '' as $$
declare actor uuid := auth.uid(); copy_id bigint; source_id bigint; total integer := cardinality(p_invitees);
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


-- Même opération publique ; filtre explicite entre copies de référence et historique.
drop function public.refonte_teacher_copies(text,text,text,text);
drop function refonte_private.teacher_copies(text,text,text,text);
create function refonte_private.teacher_copies(p_school text,p_subject text,p_class text,p_lesson text,p_history boolean)
returns table(copy_id bigint,max_members smallint,participants text,answer_count bigint,last_saved timestamptz,terminee boolean,is_history boolean)
language plpgsql stable security definer set search_path='' as $$
begin
    if not refonte_private.teacher_scope(p_school,p_subject,p_class) then
        raise exception 'teacher_scope_required' using errcode='42501'; end if;
    return query select s.id,s.max_members,
        case when s.max_members=1 then trim(owner.prenom||' '||owner.nom) else
            (select string_agg(trim(p.prenom||' '||p.nom),', ' order by p.nom,p.prenom)
                from public.work_session_members m join public.profiles p on p.user_id=m.user_id
                where m.work_session_id=s.id and m.status='accepted') end,
        (select count(*) from public.work_answers a where a.work_session_id=s.id and length(trim(a.reponse))>0),
        (select max(a.updated_at) from public.work_answers a where a.work_session_id=s.id),s.terminee,
        refonte_private.individual_is_history(s.id)
    from public.work_sessions s join public.profiles owner on owner.user_id=s.created_by
    where s.etablissement=p_school and s.matiere=p_subject and s.classe=p_class and s.seance=p_lesson
        and refonte_private.individual_is_history(s.id)=p_history order by s.id;
end;
$$;
create function public.refonte_teacher_copies(p_school text,p_subject text,p_class text,p_lesson text,p_history boolean default false)
returns table(copy_id bigint,max_members smallint,participants text,answer_count bigint,last_saved timestamptz,terminee boolean,is_history boolean)
language sql security invoker set search_path='' as $$
    select * from refonte_private.teacher_copies(p_school,p_subject,p_class,p_lesson,p_history);
$$;
revoke all on function refonte_private.individual_is_history(bigint),
    refonte_private.teacher_copies(text,text,text,text,boolean),
    public.refonte_teacher_copies(text,text,text,text,boolean) from public,anon,authenticated;
grant execute on function refonte_private.individual_is_history(bigint),
    refonte_private.teacher_copies(text,text,text,text,boolean),
    public.refonte_teacher_copies(text,text,text,text,boolean) to authenticated;
notify pgrst,'reload schema';
commit;

