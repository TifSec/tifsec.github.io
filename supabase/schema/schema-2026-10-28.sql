-- Instantané du schéma de la base Supabase (projet aqbjykgppbyrzqxlzxuf, PostgreSQL 17, eu-west-1)
-- Exporté en lecture seule le 28 octobre 2026, après la migration 20261028173039.
-- Contient la structure (tables, politiques RLS, fonctions, triggers, droits) : AUCUNE donnée d'élève.
-- Sert de référence : en cas de perte, la base peut être reconstruite à partir de ce fichier.
-- Ne pas l'exécuter tel quel sur la base de production.

set check_function_bodies = off;
create schema if not exists refonte_private;

-- TABLES

create table public.course_exercises (
    id bigint not null,
    session_id bigint not null,
    exercise_key text not null,
    titre text,
    response_expected boolean not null default false,
    max_hint_level smallint not null default 3,
    sort_order integer not null default 0,
    created_at timestamp with time zone not null default now(),
    answer_type text,
    expected_value text,
    tolerance numeric,
    validation_mode text not null default 'none'::text,
    lock_when_correct boolean not null default false,
    constraint course_exercises_unique UNIQUE (session_id, exercise_key),
    constraint course_exercises_pkey PRIMARY KEY (id),
    constraint course_exercises_hint_level_check CHECK (((max_hint_level >= 0) AND (max_hint_level <= 10)))
);
alter table public.course_exercises enable row level security;

create table public.course_sessions (
    id bigint not null,
    matiere text not null,
    classe text not null,
    seance text not null,
    titre text,
    active boolean not null default true,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),
    constraint course_sessions_unique UNIQUE (matiere, classe, seance),
    constraint course_sessions_pkey PRIMARY KEY (id)
);
alter table public.course_sessions enable row level security;

create table public.profiles (
    user_id uuid not null,
    prenom text not null,
    nom text not null,
    classe text,
    created_at timestamp with time zone not null default now(),
    role text not null default 'student'::text,
    etablissement text,
    enrollment_status text not null default 'pending'::text,
    validated_by uuid,
    validated_at timestamp with time zone,
    constraint profiles_pkey PRIMARY KEY (user_id),
    constraint profiles_enrollment_status_check CHECK ((enrollment_status = ANY (ARRAY['pending'::text, 'approved'::text, 'legacy'::text]))),
    constraint profiles_role_check CHECK ((role = ANY (ARRAY['student'::text, 'teacher'::text])))
);
alter table public.profiles enable row level security;

create table public.student_hints (
    id bigint not null,
    user_id uuid not null,
    exercise_id bigint not null,
    hint_level smallint not null,
    opened_at timestamp with time zone not null default now(),
    constraint student_hints_unique UNIQUE (user_id, exercise_id, hint_level),
    constraint student_hints_pkey PRIMARY KEY (id),
    constraint student_hints_level_check CHECK (((hint_level >= 1) AND (hint_level <= 10)))
);
alter table public.student_hints enable row level security;

create table public.student_results (
    id bigint not null,
    user_id uuid not null,
    exercise_id bigint not null,
    value text not null default ''::text,
    is_correct boolean,
    attempts integer not null default 0,
    validated_at timestamp with time zone,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),
    constraint student_results_user_id_exercise_id_key UNIQUE (user_id, exercise_id),
    constraint student_results_pkey PRIMARY KEY (id)
);
alter table public.student_results enable row level security;

create table public.student_sessions (
    id bigint not null,
    user_id uuid not null,
    session_id bigint not null,
    status text not null default 'started'::text,
    started_at timestamp with time zone not null default now(),
    last_seen_at timestamp with time zone not null default now(),
    completed_at timestamp with time zone,
    constraint student_sessions_unique UNIQUE (user_id, session_id),
    constraint student_sessions_pkey PRIMARY KEY (id),
    constraint student_sessions_status_check CHECK ((status = ANY (ARRAY['started'::text, 'in_progress'::text, 'completed'::text])))
);
alter table public.student_sessions enable row level security;

create table public.student_work (
    id bigint not null,
    user_id uuid not null,
    exercise_id bigint not null,
    reponse text not null default ''::text,
    terminee boolean not null default false,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),
    constraint student_work_unique UNIQUE (user_id, exercise_id),
    constraint student_work_pkey PRIMARY KEY (id)
);
alter table public.student_work enable row level security;

create table public.teacher_class_assignments (
    teacher_id uuid not null,
    etablissement text not null,
    matiere text not null,
    classe text not null,
    constraint teacher_class_assignments_pkey PRIMARY KEY (teacher_id, etablissement, matiere, classe)
);
alter table public.teacher_class_assignments enable row level security;

create table public.work_answers (
    id bigint not null,
    work_session_id bigint not null,
    question_key text not null,
    reponse text not null default ''::text,
    updated_by uuid,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),
    revision bigint not null default 0,
    constraint work_answers_unique UNIQUE (work_session_id, question_key),
    constraint work_answers_pkey PRIMARY KEY (id),
    constraint work_answers_question_check CHECK ((length(TRIM(BOTH FROM question_key)) > 0)),
    constraint work_answers_revision_check CHECK ((revision >= 0))
);
alter table public.work_answers enable row level security;

create table public.work_evaluations (
    id bigint not null,
    work_session_id bigint not null,
    teacher_id uuid not null,
    course_version text not null,
    correction_fingerprint text not null,
    answer_revisions jsonb not null,
    marks jsonb not null,
    total numeric(12,6) not null,
    recipient_ids uuid[] not null,
    validated_at timestamp with time zone not null default clock_timestamp(),
    constraint work_evaluations_work_session_id_id_key UNIQUE (work_session_id, id),
    constraint work_evaluations_pkey PRIMARY KEY (id),
    constraint work_evaluations_answer_revisions_check CHECK ((jsonb_typeof(answer_revisions) = 'array'::text)),
    constraint work_evaluations_correction_fingerprint_check CHECK ((correction_fingerprint ~ '^[0-9a-f]{64}$'::text)),
    constraint work_evaluations_marks_check CHECK ((jsonb_typeof(marks) = 'array'::text)),
    constraint work_evaluations_recipient_ids_check CHECK (((cardinality(recipient_ids) >= 1) AND (cardinality(recipient_ids) <= 3))),
    constraint work_evaluations_total_check CHECK (((total >= (0)::numeric) AND (total <= (20)::numeric)))
);
alter table public.work_evaluations enable row level security;

create table public.work_feedback (
    work_session_id bigint not null,
    teacher_id uuid not null,
    commentaire text not null,
    updated_at timestamp with time zone not null default now(),
    constraint work_feedback_pkey PRIMARY KEY (work_session_id, teacher_id),
    constraint work_feedback_commentaire_check CHECK ((length(commentaire) <= 20000))
);
alter table public.work_feedback enable row level security;

create table public.work_session_members (
    id bigint not null,
    work_session_id bigint not null,
    user_id uuid not null,
    status text not null default 'pending'::text,
    joined_at timestamp with time zone,
    created_at timestamp with time zone not null default now(),
    constraint work_session_members_unique UNIQUE (work_session_id, user_id),
    constraint work_session_members_pkey PRIMARY KEY (id),
    constraint work_session_members_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'accepted'::text, 'declined'::text])))
);
alter table public.work_session_members enable row level security;

create table public.work_sessions (
    id bigint not null,
    etablissement text not null,
    matiere text not null,
    classe text not null,
    seance text not null,
    created_by uuid not null,
    max_members smallint not null default 1,
    terminee boolean not null default false,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),
    course_version text,
    current_evaluation_id bigint,
    submitted_at timestamp with time zone,
    submitted_by uuid,
    constraint work_sessions_pkey PRIMARY KEY (id),
    constraint submission_pair CHECK (((submitted_at IS NULL) = (submitted_by IS NULL))),
    constraint work_sessions_course_version_check CHECK ((course_version ~ '^v[1-9][0-9]*$'::text)),
    constraint work_sessions_etablissement_check CHECK ((etablissement = ANY (ARRAY['college'::text, 'mfr'::text]))),
    constraint work_sessions_members_check CHECK (((max_members >= 1) AND (max_members <= 3)))
);
alter table public.work_sessions enable row level security;


-- CLES ETRANGERES

alter table public.course_exercises add constraint course_exercises_session_id_fkey FOREIGN KEY (session_id) REFERENCES course_sessions(id) ON DELETE CASCADE;
alter table public.profiles add constraint profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.profiles add constraint profiles_validated_by_fkey FOREIGN KEY (validated_by) REFERENCES auth.users(id);
alter table public.student_hints add constraint student_hints_exercise_id_fkey FOREIGN KEY (exercise_id) REFERENCES course_exercises(id) ON DELETE CASCADE;
alter table public.student_hints add constraint student_hints_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.student_results add constraint student_results_exercise_id_fkey FOREIGN KEY (exercise_id) REFERENCES course_exercises(id) ON DELETE CASCADE;
alter table public.student_results add constraint student_results_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.student_sessions add constraint student_sessions_session_id_fkey FOREIGN KEY (session_id) REFERENCES course_sessions(id) ON DELETE CASCADE;
alter table public.student_sessions add constraint student_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.student_work add constraint student_work_exercise_id_fkey FOREIGN KEY (exercise_id) REFERENCES course_exercises(id) ON DELETE CASCADE;
alter table public.student_work add constraint student_work_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.teacher_class_assignments add constraint teacher_class_assignments_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES auth.users(id);
alter table public.work_answers add constraint work_answers_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);
alter table public.work_answers add constraint work_answers_work_session_id_fkey FOREIGN KEY (work_session_id) REFERENCES work_sessions(id) ON DELETE CASCADE;
alter table public.work_evaluations add constraint work_evaluations_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES auth.users(id);
alter table public.work_evaluations add constraint work_evaluations_work_session_id_fkey FOREIGN KEY (work_session_id) REFERENCES work_sessions(id);
alter table public.work_feedback add constraint work_feedback_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES auth.users(id);
alter table public.work_feedback add constraint work_feedback_work_session_id_fkey FOREIGN KEY (work_session_id) REFERENCES work_sessions(id);
alter table public.work_session_members add constraint work_session_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.work_session_members add constraint work_session_members_work_session_id_fkey FOREIGN KEY (work_session_id) REFERENCES work_sessions(id) ON DELETE CASCADE;
alter table public.work_sessions add constraint current_evaluation_same_copy FOREIGN KEY (id, current_evaluation_id) REFERENCES work_evaluations(work_session_id, id);
alter table public.work_sessions add constraint work_sessions_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
alter table public.work_sessions add constraint work_sessions_submitted_by_fkey FOREIGN KEY (submitted_by) REFERENCES auth.users(id);

-- INDEX

CREATE INDEX profiles_validated_by ON public.profiles USING btree (validated_by);
CREATE INDEX student_sessions_status_idx ON public.student_sessions USING btree (status);
CREATE INDEX student_sessions_user_idx ON public.student_sessions USING btree (user_id);
CREATE INDEX work_evaluations_copy_date ON public.work_evaluations USING btree (work_session_id, validated_at DESC);
CREATE INDEX work_members_user_status ON public.work_session_members USING btree (user_id, status, work_session_id);
CREATE INDEX work_sessions_submitted_by ON public.work_sessions USING btree (submitted_by);
CREATE UNIQUE INDEX refonte_individual_copy_unique ON public.work_sessions USING btree (created_by, etablissement, matiere, classe, seance) WHERE (max_members = 1);
CREATE INDEX student_hints_user_idx ON public.student_hints USING btree (user_id);
CREATE INDEX course_exercises_session_idx ON public.course_exercises USING btree (session_id);
CREATE INDEX student_work_user_idx ON public.student_work USING btree (user_id);
CREATE INDEX work_feedback_teacher ON public.work_feedback USING btree (teacher_id);
CREATE INDEX work_sessions_teacher_scope ON public.work_sessions USING btree (etablissement, matiere, classe, seance);

-- FONCTIONS

CREATE OR REPLACE FUNCTION refonte_private.can_edit_copy(p_copy bigint)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
    select refonte_private.student_ready() and exists(select 1 from public.work_sessions s
        join public.profiles p on p.user_id=auth.uid() where s.id=p_copy and not s.terminee and p.role='student'
        and ((s.max_members=1 and s.created_by=auth.uid() and not refonte_private.individual_is_history(s.id))
            or (s.max_members>1 and exists(select 1 from public.work_session_members m
                where m.work_session_id=s.id and m.user_id=auth.uid() and m.status='accepted'))));
$function$
;
CREATE OR REPLACE FUNCTION refonte_private.can_read_copy(p_copy bigint)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
    select auth.uid() is not null and exists (select 1 from public.work_sessions s
        join public.profiles p on p.user_id = auth.uid() where s.id = p_copy and (
            (p.role = 'teacher' and refonte_private.teacher_scope(s.etablissement, s.matiere, s.classe)) or
            (p.role = 'student' and ((s.max_members = 1 and s.created_by = auth.uid()) or
                (s.max_members > 1 and exists (select 1 from public.work_session_members m
                    where m.work_session_id = s.id and m.user_id = auth.uid() and m.status = 'accepted'))))));
$function$
;
CREATE OR REPLACE FUNCTION refonte_private.class_exists(p_school text, p_class text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
    select auth.uid() is not null and exists(select 1 from public.teacher_class_assignments where etablissement=p_school and classe=p_class);
$function$
;
CREATE OR REPLACE FUNCTION refonte_private.classmates()
 RETURNS TABLE(user_id uuid, prenom text, nom text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
    select other.user_id,other.prenom,other.nom from public.profiles me
    join public.profiles other on other.etablissement=me.etablissement and other.classe=me.classe
    where me.user_id=auth.uid() and me.role='student' and me.enrollment_status in ('legacy','approved')
        and other.role='student' and other.enrollment_status in ('legacy','approved')
        and other.user_id<>me.user_id order by other.nom,other.prenom,other.user_id;
$function$
;
CREATE OR REPLACE FUNCTION refonte_private.clear_submission_on_reopen()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
    if old.terminee and not new.terminee then new.submitted_at:=null; new.submitted_by:=null; end if;
    return new;
end $function$
;
CREATE OR REPLACE FUNCTION refonte_private.create_group(p_school text, p_subject text, p_class text, p_lesson text, p_invitees uuid[])
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
$function$
;
CREATE OR REPLACE FUNCTION refonte_private.finish_copy(p_copy bigint, p_finished boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare s public.work_sessions;
begin
    select * into s from public.work_sessions where id=p_copy for update;
    if not found or p_finished is null or not refonte_private.teacher_scope(s.etablissement,s.matiere,s.classe) then
        raise exception 'teacher_scope_required' using errcode='42501'; end if;
    update public.work_sessions set terminee=p_finished,updated_at=pg_catalog.clock_timestamp() where id=p_copy;
end;
$function$
;
CREATE OR REPLACE FUNCTION refonte_private.grading_copy_state()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
    if tg_op='INSERT' and (new.etablissement,new.matiere,new.classe,new.seance) in (
        ('college','techno','5e','S01'),
        ('college','techno','5e','S02'),
        ('college','techno','5e','S03'),
        ('college','techno','5e','S04'),
        ('college','techno','5e','S05'),
        ('college','techno','5e','S06'),
        ('college','techno','5e','S07'),
        ('college','techno','5e','S08'),
        ('college','techno','5e','S09'),
        ('college','techno','5e','S10'),
        ('college','techno','4e','S01'),
        ('college','techno','4e','S02'),
        ('college','techno','4e','S03'),
        ('college','techno','4e','S04'),
        ('college','techno','4e','S05'),
        ('college','techno','4e','S06'),
        ('college','techno','4e','S07'),
        ('college','techno','4e','S08'),
        ('college','techno','4e','S09'),
        ('college','techno','4e','S10'),
        ('college','techno','3e','S01'),
        ('college','techno','3e','S02'),
        ('college','techno','3e','S02R'),
        ('college','techno','3e','S03'),
        ('college','techno','3e','S04'),
        ('college','techno','3e','S05'),
        ('college','techno','3e','S06'),
        ('college','techno','3e','S07'),
        ('college','techno','3e','S08'),
        ('college','techno','3e','S09'),
        ('college','techno','3e','S10'),
        ('college','techno','3e','S10R'),
        ('mfr','tim','cap2','S01'),
        ('mfr','tim','cap2','S02'),
        ('mfr','tim','cap2','S03'),
        ('mfr','tim','cap2','S04'),
        ('mfr','tim','cap2','S05'),
        ('mfr','tim','4e','S01'),
        ('mfr','tim','4e','S02'),
        ('mfr','tim','4e','S03'),
        ('mfr','tim','4e','S04'),
        ('mfr','tim','4e','S05'),
        ('mfr','tim','3e','S01'),
        ('mfr','tim','3e','S02'),
        ('mfr','tim','3e','S03'),
        ('mfr','tim','3e','S04'),
        ('mfr','tim','3e','S05'),
        ('mfr','tim','2de','S01'),
        ('mfr','tim','2de','S02'),
        ('mfr','tim','2de','S03'),
        ('mfr','tim','2de','S04'),
        ('mfr','tim','1re','S01'),
        ('mfr','tim','1re','S02'),
        ('mfr','tim','1re','S03'),
        ('mfr','tim','term','S01'),
        ('mfr','tim','term','S02'),
        ('mfr','tim','term','S03'),
        ('mfr','tim','term','S04'),
        ('mfr','tim','cap1','S01'),
        ('mfr','tim','cap1','S02'),
        ('mfr','tim','bts2','S01'),
        ('mfr','tim','bts2','S02'),
        ('mfr','tim','bts2','S03'),
        ('mfr','tim','bts2','S04'),
        ('mfr','tim','bts2','S05'),
        ('mfr','tim','bts2','S06'),
        ('mfr','tim','bts2','S07'),
        ('mfr','tim','bts2','S08'),
        ('mfr','maths','term','S00'),
        ('mfr','maths','term','S01'),
        ('mfr','maths','term','S02'),
        ('mfr','maths','term','S03'),
        ('mfr','maths','term','S04'),
        ('mfr','maths','term','S05'),
        ('mfr','maths','term','S07'),
        ('mfr','maths','term','S08'),
        ('mfr','maths','term','S09'),
        ('mfr','maths','4e','S01'),
        ('mfr','maths','4e','S02'),
        ('mfr','maths','4e','S03'),
        ('mfr','maths','4e','S04'),
        ('mfr','maths','4e','S05'),
        ('mfr','maths','4e','S06'),
        ('mfr','maths','4e','S07'),
        ('mfr','maths','4e','S08'),
        ('mfr','maths','3e','S01'),
        ('mfr','maths','3e','S02'),
        ('mfr','maths','3e','S03'),
        ('mfr','maths','3e','S04'),
        ('mfr','maths','3e','S05'),
        ('mfr','maths','3e','S06'),
        ('mfr','maths','3e','S07'),
        ('mfr','maths','3e','S08'),
        ('mfr','maths','1re','S01'),
        ('mfr','maths','1re','S02')
    ) then new.course_version:='v1'; end if;
    if tg_op='INSERT' and (new.etablissement,new.matiere,new.classe,new.seance)=('college','techno','5e','S02V2') then
        new.course_version:='v2';
    end if;
    if not new.terminee then new.current_evaluation_id:=null; end if;
    return new;
end $function$
;
CREATE OR REPLACE FUNCTION refonte_private.has_group(p_school text, p_subject text, p_class text, p_lesson text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
    select auth.uid() is not null and exists(select 1 from public.work_sessions g
        join public.work_session_members m on m.work_session_id=g.id
        where m.user_id=auth.uid() and m.status='accepted' and g.max_members>1
            and (g.etablissement,g.matiere,g.classe,g.seance)=(p_school,p_subject,p_class,p_lesson));
$function$
;
CREATE OR REPLACE FUNCTION refonte_private.individual_is_history(p_copy bigint)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
    select refonte_private.can_read_copy(p_copy) and exists(
        select 1 from public.work_sessions i join public.work_session_members m on m.user_id=i.created_by and m.status='accepted'
        join public.work_sessions g on g.id=m.work_session_id and g.max_members>1
        where i.id=p_copy and i.max_members=1 and
            (i.etablissement,i.matiere,i.classe,i.seance)=(g.etablissement,g.matiere,g.classe,g.seance));
$function$
;
CREATE OR REPLACE FUNCTION refonte_private.invitations()
 RETURNS TABLE(invitation_id bigint, copy_id bigint, invited_by text, etablissement text, matiere text, classe text, seance text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
    select m.id, s.id, trim(owner.prenom || ' ' || owner.nom), s.etablissement, s.matiere, s.classe, s.seance
    from public.work_session_members m join public.work_sessions s on s.id = m.work_session_id
    join public.profiles owner on owner.user_id = s.created_by
    where m.user_id = auth.uid() and m.status = 'pending' and exists
        (select 1 from public.profiles me where me.user_id = auth.uid() and me.role = 'student') order by m.created_at;
$function$
;
CREATE OR REPLACE FUNCTION refonte_private.lock_answer_copy()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
$function$
;
CREATE OR REPLACE FUNCTION refonte_private.lock_graded_members()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare evaluation bigint;
begin
    select current_evaluation_id into evaluation from public.work_sessions where id=new.work_session_id for update;
    if evaluation is not null and new.status='accepted' and (tg_op='INSERT' or old.status<>'accepted') then
        raise exception 'graded_copy_locked' using errcode='42501'; end if;
    return new;
end $function$
;
CREATE OR REPLACE FUNCTION refonte_private.manages_class(p_school text, p_class text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
    select auth.uid() is not null and exists(select 1 from public.profiles p
        join public.teacher_class_assignments a on a.teacher_id=p.user_id where p.user_id=auth.uid() and p.role='teacher'
            and a.etablissement=p_school and a.classe=p_class);
$function$
;
CREATE OR REPLACE FUNCTION refonte_private.my_groups(p_school text, p_subject text, p_class text, p_lesson text)
 RETURNS TABLE(copy_id bigint, max_members smallint, participants text, etablissement text, matiere text, classe text, seance text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
    select s.id, s.max_members, string_agg(trim(p.prenom || ' ' || p.nom), ', ' order by p.nom, p.prenom),
        s.etablissement,s.matiere,s.classe,s.seance
    from public.work_sessions s join public.work_session_members m on m.work_session_id = s.id and m.status = 'accepted'
    join public.profiles p on p.user_id = m.user_id
    where s.max_members > 1 and (p_school is null or s.etablissement = p_school) and (p_subject is null or s.matiere = p_subject)
        and (p_class is null or s.classe = p_class) and (p_lesson is null or s.seance = p_lesson) and exists (select 1 from public.work_session_members mine
            where mine.work_session_id = s.id and mine.user_id = auth.uid() and mine.status = 'accepted')
        and exists (select 1 from public.profiles me where me.user_id = auth.uid() and me.role = 'student')
    group by s.id order by s.id;
$function$
;
CREATE OR REPLACE FUNCTION refonte_private.reply_invitation(p_invitation bigint, p_accept boolean)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
$function$
;
CREATE OR REPLACE FUNCTION refonte_private.save_feedback(p_copy bigint, p_comment text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare s public.work_sessions;
begin
    select * into s from public.work_sessions where id=p_copy;
    if not found or not refonte_private.teacher_scope(s.etablissement,s.matiere,s.classe) then
        raise exception 'teacher_scope_required' using errcode='42501'; end if;
    if p_comment is null or length(p_comment)>20000 then raise exception 'invalid_feedback' using errcode='22023'; end if;
    insert into public.work_feedback (work_session_id,teacher_id,commentaire) values(p_copy,auth.uid(),p_comment)
        on conflict(work_session_id,teacher_id) do update set commentaire=excluded.commentaire,updated_at=pg_catalog.clock_timestamp();
end;
$function$
;
CREATE OR REPLACE FUNCTION refonte_private.student_ready()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
    select auth.uid() is not null and exists(select 1 from public.profiles where user_id=auth.uid()
        and role='student' and enrollment_status in ('legacy','approved'));
$function$
;
CREATE OR REPLACE FUNCTION refonte_private.students(p_school text, p_class text)
 RETURNS TABLE(user_id uuid, prenom text, nom text, etablissement text, classe text, enrollment_status text, validated_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
    if not refonte_private.manages_class(p_school,p_class) then raise exception 'teacher_scope_required' using errcode='42501'; end if;
    return query select p.user_id,p.prenom,p.nom,p.etablissement,p.classe,p.enrollment_status,p.validated_at
        from public.profiles p where p.role='student' and p.etablissement=p_school and p.classe=p_class order by p.nom,p.prenom,p.user_id;
end $function$
;
CREATE OR REPLACE FUNCTION refonte_private.submit_copy(p_copy bigint, p_revisions jsonb)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare s public.work_sessions; snapshot jsonb;
begin
    select * into s from public.work_sessions where id=p_copy for update;
    if not found or not refonte_private.student_ready() or not refonte_private.can_read_copy(s.id)
        or (s.max_members=1 and refonte_private.individual_is_history(s.id)) then
        raise exception 'student_copy_required' using errcode='42501'; end if;
    select coalesce(jsonb_agg(jsonb_build_object('cle',question_key,'revision',revision::text) order by question_key collate "C"),'[]'::jsonb)
        into snapshot from public.work_answers where work_session_id=s.id;
    if p_revisions is distinct from snapshot then raise exception 'answers_changed' using errcode='40001'; end if;
    if s.terminee then return true; end if;
    if not refonte_private.can_edit_copy(s.id) then raise exception 'student_copy_required' using errcode='42501'; end if;
    if not exists(select 1 from public.work_answers where work_session_id=s.id and length(trim(reponse))>0) then
        raise exception 'empty_copy' using errcode='22023'; end if;
    if s.submitted_at is not null then return true; end if;
    update public.work_sessions set submitted_by=auth.uid(),submitted_at=clock_timestamp(),updated_at=clock_timestamp() where id=s.id;
    return true;
end $function$
;
CREATE OR REPLACE FUNCTION refonte_private.teacher_copies(p_school text, p_subject text, p_class text, p_lesson text, p_history boolean)
 RETURNS TABLE(copy_id bigint, max_members smallint, participants text, answer_count bigint, last_saved timestamp with time zone, terminee boolean, is_history boolean)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
$function$
;
CREATE OR REPLACE FUNCTION refonte_private.teacher_scope(p_school text, p_subject text, p_class text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
    select auth.uid() is not null and exists (select 1 from public.profiles p
        join public.teacher_class_assignments a on a.teacher_id = p.user_id
        where p.user_id = auth.uid() and p.role = 'teacher' and a.etablissement = p_school
            and a.matiere = p_subject and a.classe = p_class);
$function$
;
CREATE OR REPLACE FUNCTION refonte_private.update_student(p_student uuid, p_school text, p_class text, p_approve boolean, p_expected_school text, p_expected_class text, p_expected_status text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
end $function$
;
CREATE OR REPLACE FUNCTION refonte_private.validate_grade(p_copy bigint, p_version text, p_fingerprint text, p_revisions jsonb, p_marks jsonb, p_expected bigint, p_comment text)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare s public.work_sessions; item jsonb; cell jsonb; snapshot jsonb; total_points numeric:=0; maximum_points numeric:=0;
    cell_points numeric; cell_maximum numeric;
    score numeric; maximum numeric; evaluation bigint; recipients uuid[];
begin
    select * into s from public.work_sessions where id=p_copy for update;
    if not found or not refonte_private.teacher_scope(s.etablissement,s.matiere,s.classe) or refonte_private.individual_is_history(s.id) then
        raise exception 'teacher_scope_required' using errcode='42501'; end if;
    if s.current_evaluation_id is distinct from p_expected then raise exception 'evaluation_changed' using errcode='40001'; end if;
    if s.course_version is null or p_version is distinct from s.course_version or p_fingerprint is null or p_fingerprint !~ '^[0-9a-f]{64}$' then
        raise exception 'course_version_required' using errcode='22023'; end if;
    select coalesce(jsonb_agg(jsonb_build_object('cle',question_key,'revision',revision::text) order by question_key collate "C"),'[]'::jsonb)
        into snapshot from public.work_answers where work_session_id=s.id;
    if p_revisions is distinct from snapshot then raise exception 'answers_changed' using errcode='40001'; end if;
    if p_marks is null or jsonb_typeof(p_marks)<>'array' or jsonb_array_length(p_marks) not between 1 and 1000 then
        raise exception 'invalid_marks' using errcode='22023'; end if;
    for item in select value from jsonb_array_elements(p_marks) loop
        if jsonb_typeof(item)<>'object' or not(item ?& array['cle','points','maximum','commentaire']) or
            exists(select 1 from jsonb_object_keys(item) key where key not in ('cle','points','maximum','commentaire','details')) or jsonb_typeof(item->'cle')<>'string' or length(trim(item->>'cle')) not between 1 and 160 or
            jsonb_typeof(item->'points')<>'number' or jsonb_typeof(item->'maximum')<>'number' or
            jsonb_typeof(item->'commentaire')<>'string' or length(item->>'commentaire')>2000 then
            raise exception 'invalid_marks' using errcode='22023'; end if;
        score:=(item->>'points')::numeric; maximum:=(item->>'maximum')::numeric;
        if maximum not between 0 and 20 or score not between 0 and maximum or scale(score)>6 or scale(maximum)>6 then
            raise exception 'invalid_points' using errcode='22023'; end if;
        if item ? 'details' then
            if jsonb_typeof(item->'details')<>'array' or jsonb_array_length(item->'details') not between 1 and 1000 then raise exception 'invalid_cell_marks' using errcode='22023'; end if;
            cell_points:=0; cell_maximum:=0;
            for cell in select value from jsonb_array_elements(item->'details') loop
                if jsonb_typeof(cell)<>'object' or not(cell ?& array['cle','points','maximum']) or (select count(*) from jsonb_object_keys(cell))<>3 or
                    jsonb_typeof(cell->'cle')<>'string' or length(trim(cell->>'cle')) not between 1 and 160 or
                    jsonb_typeof(cell->'points')<>'number' or jsonb_typeof(cell->'maximum')<>'number' then raise exception 'invalid_cell_marks' using errcode='22023'; end if;
                if (cell->>'maximum')::numeric not between 0 and maximum or (cell->>'points')::numeric not between 0 and (cell->>'maximum')::numeric or
                    scale((cell->>'points')::numeric)>6 or scale((cell->>'maximum')::numeric)>6 then raise exception 'invalid_cell_points' using errcode='22023'; end if;
                cell_points:=cell_points+(cell->>'points')::numeric; cell_maximum:=cell_maximum+(cell->>'maximum')::numeric;
            end loop;
            if cell_points<>score or cell_maximum<>maximum or
                (select count(distinct value->>'cle') from jsonb_array_elements(item->'details'))<>jsonb_array_length(item->'details') then
                raise exception 'cell_total_mismatch' using errcode='22023'; end if;
        end if;
        total_points:=total_points+score; maximum_points:=maximum_points+maximum;
    end loop;
    if maximum_points<>20 or (select count(distinct value->>'cle') from jsonb_array_elements(p_marks))<>jsonb_array_length(p_marks) then
        raise exception 'barème_20_required' using errcode='22023'; end if;
    if s.max_members=1 then recipients:=array[s.created_by]; else
        select array_agg(user_id order by user_id) into recipients from public.work_session_members where work_session_id=s.id and status='accepted'; end if;
    if recipients is null or cardinality(recipients) not between 1 and 3 then raise exception 'invalid_participants'; end if;
    if p_comment is not null then
        if length(p_comment)>20000 then raise exception 'invalid_comment' using errcode='22023'; end if;
        perform refonte_private.save_feedback(s.id,p_comment);
    end if;
    insert into public.work_evaluations(work_session_id,teacher_id,course_version,correction_fingerprint,answer_revisions,marks,total,recipient_ids)
        values(s.id,auth.uid(),p_version,p_fingerprint,snapshot,p_marks,total_points,recipients) returning id into evaluation;
    update public.work_sessions set terminee=true,current_evaluation_id=evaluation,updated_at=clock_timestamp() where id=s.id;
    return evaluation;
end $function$
;
CREATE OR REPLACE FUNCTION public.refonte_classmates()
 RETURNS TABLE(user_id uuid, prenom text, nom text)
 LANGUAGE sql
 SET search_path TO ''
AS $function$ select * from refonte_private.classmates() $function$
;
CREATE OR REPLACE FUNCTION public.refonte_create_group(p_school text, p_subject text, p_class text, p_lesson text, p_invitees uuid[])
 RETURNS bigint
 LANGUAGE sql
 SET search_path TO ''
AS $function$ select refonte_private.create_group(p_school,p_subject,p_class,p_lesson,p_invitees) $function$
;
CREATE OR REPLACE FUNCTION public.refonte_finish_copy(p_copy bigint, p_finished boolean)
 RETURNS void
 LANGUAGE sql
 SET search_path TO ''
AS $function$ select refonte_private.finish_copy(p_copy,p_finished) $function$
;
CREATE OR REPLACE FUNCTION public.refonte_invitations()
 RETURNS TABLE(invitation_id bigint, copy_id bigint, invited_by text, etablissement text, matiere text, classe text, seance text)
 LANGUAGE sql
 SET search_path TO ''
AS $function$ select * from refonte_private.invitations() $function$
;
CREATE OR REPLACE FUNCTION public.refonte_my_groups(p_school text DEFAULT NULL::text, p_subject text DEFAULT NULL::text, p_class text DEFAULT NULL::text, p_lesson text DEFAULT NULL::text)
 RETURNS TABLE(copy_id bigint, max_members smallint, participants text, etablissement text, matiere text, classe text, seance text)
 LANGUAGE sql
 SET search_path TO ''
AS $function$ select * from refonte_private.my_groups(p_school,p_subject,p_class,p_lesson) $function$
;
CREATE OR REPLACE FUNCTION public.refonte_reply_invitation(p_invitation bigint, p_accept boolean)
 RETURNS bigint
 LANGUAGE sql
 SET search_path TO ''
AS $function$ select refonte_private.reply_invitation(p_invitation,p_accept) $function$
;
CREATE OR REPLACE FUNCTION public.refonte_save_feedback(p_copy bigint, p_comment text)
 RETURNS void
 LANGUAGE sql
 SET search_path TO ''
AS $function$ select refonte_private.save_feedback(p_copy,p_comment) $function$
;
CREATE OR REPLACE FUNCTION public.refonte_stamp_work_answer()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
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
$function$
;
CREATE OR REPLACE FUNCTION public.refonte_students(p_school text, p_class text)
 RETURNS TABLE(user_id uuid, prenom text, nom text, etablissement text, classe text, enrollment_status text, validated_at timestamp with time zone)
 LANGUAGE sql
 SET search_path TO ''
AS $function$ select * from refonte_private.students(p_school,p_class) $function$
;
CREATE OR REPLACE FUNCTION public.refonte_submit_copy(p_copy bigint, p_revisions jsonb)
 RETURNS boolean
 LANGUAGE sql
 SET search_path TO ''
AS $function$ select refonte_private.submit_copy(p_copy,p_revisions) $function$
;
CREATE OR REPLACE FUNCTION public.refonte_teacher_copies(p_school text, p_subject text, p_class text, p_lesson text, p_history boolean DEFAULT false)
 RETURNS TABLE(copy_id bigint, max_members smallint, participants text, answer_count bigint, last_saved timestamp with time zone, terminee boolean, is_history boolean)
 LANGUAGE sql
 SET search_path TO ''
AS $function$
    select * from refonte_private.teacher_copies(p_school,p_subject,p_class,p_lesson,p_history);
$function$
;
CREATE OR REPLACE FUNCTION public.refonte_update_student(p_student uuid, p_school text, p_class text, p_approve boolean, p_expected_school text, p_expected_class text, p_expected_status text)
 RETURNS void
 LANGUAGE sql
 SET search_path TO ''
AS $function$
    select refonte_private.update_student(p_student,p_school,p_class,p_approve,p_expected_school,p_expected_class,p_expected_status)
$function$
;
CREATE OR REPLACE FUNCTION public.refonte_validate_grade(p_copy bigint, p_version text, p_fingerprint text, p_revisions jsonb, p_marks jsonb, p_expected bigint DEFAULT NULL::bigint, p_comment text DEFAULT NULL::text)
 RETURNS bigint
 LANGUAGE sql
 SET search_path TO ''
AS $function$
    select refonte_private.validate_grade(p_copy,p_version,p_fingerprint,p_revisions,p_marks,p_expected,p_comment);
$function$
;
CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin

    new.updated_at = now();

    return new;

end;
$function$
;

-- TRIGGERS

CREATE TRIGGER course_sessions_set_updated_at BEFORE UPDATE ON public.course_sessions FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER student_work_set_updated_at BEFORE UPDATE ON public.student_work FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER refonte_stamp_work_answer BEFORE INSERT OR UPDATE ON public.work_answers FOR EACH ROW EXECUTE FUNCTION refonte_stamp_work_answer();
CREATE TRIGGER refonte_lock_work_answer BEFORE INSERT OR UPDATE ON public.work_answers FOR EACH ROW EXECUTE FUNCTION refonte_private.lock_answer_copy();
CREATE TRIGGER refonte_grading_copy_state BEFORE INSERT OR UPDATE ON public.work_sessions FOR EACH ROW EXECUTE FUNCTION refonte_private.grading_copy_state();
CREATE TRIGGER refonte_lock_graded_members BEFORE INSERT OR UPDATE ON public.work_session_members FOR EACH ROW EXECUTE FUNCTION refonte_private.lock_graded_members();
CREATE TRIGGER refonte_submission_reopen BEFORE UPDATE ON public.work_sessions FOR EACH ROW EXECUTE FUNCTION refonte_private.clear_submission_on_reopen();

-- POLITIQUES RLS

create policy "Authenticated users can read exercises" on public.course_exercises as permissive for select to authenticated
  using (true);
create policy "Authenticated users can read sessions" on public.course_sessions as permissive for select to authenticated
  using (true);
create policy "Créer son propre profil" on public.profiles as permissive for insert to authenticated
  with check (((auth.uid() = user_id) AND (role = 'student'::text)));
create policy "Lire son propre profil" on public.profiles as permissive for select to authenticated
  using ((auth.uid() = user_id));
create policy "Modifier son propre profil" on public.profiles as permissive for update to authenticated
  using ((auth.uid() = user_id))
  with check ((auth.uid() = user_id));
create policy refonte_pending_profile_insert on public.profiles as restrictive for insert to authenticated
  with check (((enrollment_status = 'pending'::text) AND (validated_by IS NULL) AND (validated_at IS NULL) AND refonte_private.class_exists(etablissement, classe)));
create policy "Students can insert own hints" on public.student_hints as permissive for insert to authenticated
  with check ((auth.uid() = user_id));
create policy "Students can read own hints" on public.student_hints as permissive for select to authenticated
  using ((auth.uid() = user_id));
create policy "Students can insert own sessions" on public.student_sessions as permissive for insert to authenticated
  with check ((auth.uid() = user_id));
create policy "Students can read own sessions" on public.student_sessions as permissive for select to authenticated
  using ((auth.uid() = user_id));
create policy "Students can update own sessions" on public.student_sessions as permissive for update to authenticated
  using ((auth.uid() = user_id))
  with check ((auth.uid() = user_id));
create policy "Students can insert own work" on public.student_work as permissive for insert to authenticated
  with check ((auth.uid() = user_id));
create policy "Students can read own work" on public.student_work as permissive for select to authenticated
  using ((auth.uid() = user_id));
create policy "Students can update own work" on public.student_work as permissive for update to authenticated
  using ((auth.uid() = user_id))
  with check ((auth.uid() = user_id));
create policy teacher_own_assignments on public.teacher_class_assignments as permissive for select to authenticated
  using (((teacher_id = ( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.user_id = ( SELECT auth.uid() AS uid)) AND (p.role = 'teacher'::text))))));
create policy refonte_answer_insert on public.work_answers as permissive for insert to authenticated
  with check ((refonte_private.can_edit_copy(work_session_id) AND (updated_by = ( SELECT auth.uid() AS uid)) AND ((length(TRIM(BOTH FROM question_key)) >= 1) AND (length(TRIM(BOTH FROM question_key)) <= 160)) AND (length(reponse) <= 20000)));
create policy refonte_answer_read on public.work_answers as permissive for select to authenticated
  using (refonte_private.can_read_copy(work_session_id));
create policy refonte_answer_update on public.work_answers as permissive for update to authenticated
  using (refonte_private.can_edit_copy(work_session_id))
  with check ((refonte_private.can_edit_copy(work_session_id) AND (updated_by = ( SELECT auth.uid() AS uid)) AND (length(reponse) <= 20000)));
create policy evaluation_read on public.work_evaluations as permissive for select to authenticated
  using ((EXISTS ( SELECT 1
   FROM work_sessions s
  WHERE ((s.id = work_evaluations.work_session_id) AND (refonte_private.teacher_scope(s.etablissement, s.matiere, s.classe) OR ((s.current_evaluation_id = work_evaluations.id) AND (auth.uid() = ANY (work_evaluations.recipient_ids)) AND (EXISTS ( SELECT 1
           FROM profiles p
          WHERE ((p.user_id = auth.uid()) AND (p.role = 'student'::text) AND (p.enrollment_status = ANY (ARRAY['approved'::text, 'legacy'::text])))))))))));
create policy refonte_feedback_read on public.work_feedback as permissive for select to authenticated
  using (refonte_private.can_read_copy(work_session_id));
create policy refonte_members_read on public.work_session_members as permissive for select to authenticated
  using (((user_id = ( SELECT auth.uid() AS uid)) OR refonte_private.can_read_copy(work_session_id)));
create policy refonte_approved_student_insert on public.work_sessions as restrictive for insert to authenticated
  with check (refonte_private.student_ready());
create policy refonte_copy_read on public.work_sessions as permissive for select to authenticated
  using ((((max_members = 1) AND (created_by = ( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.user_id = ( SELECT auth.uid() AS uid)) AND (p.role = 'student'::text))))) OR refonte_private.can_read_copy(id)));
create policy refonte_own_individual_sessions_insert on public.work_sessions as permissive for insert to authenticated
  with check (((created_by = ( SELECT auth.uid() AS uid)) AND (max_members = 1) AND (NOT terminee) AND (length(TRIM(BOTH FROM matiere)) > 0) AND (length(TRIM(BOTH FROM seance)) > 0) AND (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.user_id = ( SELECT auth.uid() AS uid)) AND (p.role = 'student'::text) AND (p.etablissement = work_sessions.etablissement) AND (p.classe = work_sessions.classe)))) AND (NOT refonte_private.has_group(etablissement, matiere, classe, seance))));

-- DROITS TABLES

grant delete, insert, references, select, trigger, truncate, update on public.course_exercises to anon;
grant delete, insert, references, select, trigger, truncate, update on public.course_exercises to authenticated;
grant delete, insert, references, select, trigger, truncate, update on public.course_sessions to anon;
grant delete, insert, references, select, trigger, truncate, update on public.course_sessions to authenticated;
grant delete, references, select, trigger, truncate on public.profiles to anon;
grant delete, references, select, trigger, truncate on public.profiles to authenticated;
grant delete, insert, references, select, trigger, truncate, update on public.student_hints to anon;
grant delete, insert, references, select, trigger, truncate, update on public.student_hints to authenticated;
grant delete, insert, references, select, trigger, truncate, update on public.student_results to anon;
grant delete, insert, references, select, trigger, truncate, update on public.student_results to authenticated;
grant delete, insert, references, select, trigger, truncate, update on public.student_sessions to anon;
grant delete, insert, references, select, trigger, truncate, update on public.student_sessions to authenticated;
grant delete, insert, references, select, trigger, truncate, update on public.student_work to anon;
grant delete, insert, references, select, trigger, truncate, update on public.student_work to authenticated;
grant select on public.teacher_class_assignments to authenticated;
grant select on public.work_answers to authenticated;
grant select on public.work_evaluations to authenticated;
grant select on public.work_feedback to authenticated;
grant select on public.work_session_members to authenticated;
grant select on public.work_sessions to authenticated;

-- DROITS COLONNES

grant insert (classe, etablissement, nom, prenom, role, user_id) on public.profiles to authenticated;
grant update (nom, prenom) on public.profiles to authenticated;
grant insert (question_key, reponse, work_session_id) on public.work_answers to authenticated;
grant update (reponse) on public.work_answers to authenticated;
grant insert (classe, created_by, etablissement, matiere, max_members, seance) on public.work_sessions to authenticated;

-- DROITS FONCTIONS

grant execute on function refonte_private.finish_copy(bigint,boolean) to authenticated;
grant execute on function refonte_private.can_edit_copy(bigint) to authenticated;
grant execute on function refonte_private.classmates() to authenticated;
grant execute on function refonte_reply_invitation(bigint,boolean) to authenticated;
grant execute on function refonte_invitations() to authenticated;
grant execute on function refonte_my_groups(text,text,text,text) to authenticated;
grant execute on function refonte_save_feedback(bigint,text) to authenticated;
grant execute on function refonte_finish_copy(bigint,boolean) to authenticated;
grant execute on function refonte_private.teacher_scope(text,text,text) to authenticated;
grant execute on function refonte_private.can_read_copy(bigint) to authenticated;
grant execute on function refonte_classmates() to authenticated;
grant execute on function set_updated_at() to anon;
grant execute on function set_updated_at() to authenticated;
grant execute on function refonte_create_group(text,text,text,text,uuid[]) to authenticated;
grant execute on function refonte_private.reply_invitation(bigint,boolean) to authenticated;
grant execute on function refonte_private.invitations() to authenticated;
grant execute on function refonte_private.my_groups(text,text,text,text) to authenticated;
grant execute on function refonte_private.save_feedback(bigint,text) to authenticated;
grant execute on function refonte_private.has_group(text,text,text,text) to authenticated;
grant execute on function refonte_private.individual_is_history(bigint) to authenticated;
grant execute on function refonte_teacher_copies(text,text,text,text,boolean) to authenticated;
grant execute on function refonte_update_student(uuid,text,text,boolean,text,text,text) to authenticated;
grant execute on function refonte_private.student_ready() to authenticated;
grant execute on function refonte_private.manages_class(text,text) to authenticated;
grant execute on function refonte_private.class_exists(text,text) to authenticated;
grant execute on function refonte_private.students(text,text) to authenticated;
grant execute on function refonte_private.teacher_copies(text,text,text,text,boolean) to authenticated;
grant execute on function refonte_private.create_group(text,text,text,text,uuid[]) to authenticated;
grant execute on function refonte_private.validate_grade(bigint,text,text,jsonb,jsonb,bigint,text) to authenticated;
grant execute on function refonte_validate_grade(bigint,text,text,jsonb,jsonb,bigint,text) to authenticated;
grant execute on function refonte_private.update_student(uuid,text,text,boolean,text,text,text) to authenticated;
grant execute on function refonte_students(text,text) to authenticated;
grant execute on function refonte_private.submit_copy(bigint,jsonb) to authenticated;
grant execute on function refonte_submit_copy(bigint,jsonb) to authenticated;
