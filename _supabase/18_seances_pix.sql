-- Séances Pix déclarées par l'élève (29 octobre 2026).
-- Pix n'est plus une séance numérotée : le professeur fait du Pix quand il le souhaite. L'élève ouvre
-- la séance où il en est (sa progression ne bouge pas) et clique « J'ai fait ma séance Pix » en bas de page.
-- La déclaration ne crée aucune copie, ne change ni la note ni la progression. Une seule par jour et par matière.
-- Aucune réponse ni aucun mot de passe Pix n'est enregistré : seulement la date et la séance ouverte.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

create table if not exists public.pix_declarations (
    id bigint generated always as identity primary key,
    student_id uuid not null references auth.users(id) on delete cascade,
    etablissement text not null check (length(etablissement) between 1 and 40),
    matiere text not null check (length(matiere) between 1 and 40),
    classe text not null check (length(classe) between 1 and 40),
    seance text not null check (length(seance) between 1 and 40),
    declared_on date not null default ((now() at time zone 'Europe/Paris')::date),
    created_at timestamptz not null default now(),
    unique (student_id, matiere, declared_on)
);
alter table public.pix_declarations enable row level security;
drop policy if exists "Lire ses séances Pix" on public.pix_declarations;
create policy "Lire ses séances Pix" on public.pix_declarations for select to authenticated
    using (student_id = (select auth.uid()) or refonte_private.teacher_scope(etablissement, matiere, classe));
revoke all on public.pix_declarations from anon, authenticated;
grant select on public.pix_declarations to authenticated;

create or replace function refonte_private.declare_pix(p_school text, p_subject text, p_class text, p_lesson text)
returns date
language plpgsql volatile security definer set search_path = '' as $$
declare today date := (now() at time zone 'Europe/Paris')::date;
begin
    if not refonte_private.student_ready() or not exists (select 1 from public.profiles p where p.user_id = auth.uid()
        and p.etablissement = p_school and p.classe = p_class) then
        raise exception 'student_scope_required' using errcode = '42501'; end if;
    if coalesce(length(p_subject), 0) not between 1 and 40 or coalesce(length(p_lesson), 0) not between 1 and 40 then
        raise exception 'invalid_lesson' using errcode = '22023'; end if;
    insert into public.pix_declarations (student_id, etablissement, matiere, classe, seance, declared_on)
    values (auth.uid(), p_school, p_subject, p_class, p_lesson, today)
    on conflict (student_id, matiere, declared_on) do nothing;
    return today;
end
$$;

create or replace function public.refonte_declare_pix(p_school text, p_subject text, p_class text, p_lesson text)
returns date
language sql set search_path = '' as $$ select refonte_private.declare_pix(p_school, p_subject, p_class, p_lesson) $$;

revoke all on function refonte_private.declare_pix(text, text, text, text) from public, anon, authenticated;
grant execute on function refonte_private.declare_pix(text, text, text, text) to authenticated;
revoke all on function public.refonte_declare_pix(text, text, text, text) from public, anon;
grant execute on function public.refonte_declare_pix(text, text, text, text) to authenticated;

-- Professeur affecté : liste des séances Pix déclarées dans sa classe (nom de l'élève, date, séance ouverte).
create or replace function refonte_private.pix_class(p_school text, p_subject text, p_class text)
returns table (eleve text, declared_on date, seance text)
language plpgsql stable security definer set search_path = '' as $$
begin
    if not refonte_private.teacher_scope(p_school, p_subject, p_class) then
        raise exception 'teacher_scope_required' using errcode = '42501'; end if;
    return query select trim(coalesce(p.prenom, '') || ' ' || coalesce(p.nom, '')), d.declared_on, d.seance
        from public.pix_declarations d left join public.profiles p on p.user_id = d.student_id
        where d.etablissement = p_school and d.matiere = p_subject and d.classe = p_class
        order by d.declared_on desc, 1 limit 2000;
end
$$;
create or replace function public.refonte_pix_class(p_school text, p_subject text, p_class text)
returns table (eleve text, declared_on date, seance text)
language sql set search_path = '' as $$ select * from refonte_private.pix_class(p_school, p_subject, p_class) $$;
revoke all on function refonte_private.pix_class(text, text, text) from public, anon, authenticated;
grant execute on function refonte_private.pix_class(text, text, text) to authenticated;
revoke all on function public.refonte_pix_class(text, text, text) from public, anon;
grant execute on function public.refonte_pix_class(text, text, text) to authenticated;

notify pgrst, 'reload schema';
commit;
