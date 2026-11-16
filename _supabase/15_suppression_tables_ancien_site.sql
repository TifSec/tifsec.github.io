-- Suppression des six tables de l'ancien site, vides et inutilisées par le nouveau site.
-- Validé par le professeur le 28 octobre 2026. Testé sur la copie locale de la base puis sur le projet de test.
-- Arrêt sans rien supprimer si l'une des tables contient la moindre ligne.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

do $$
declare t text; n bigint;
begin
    foreach t in array array['course_sessions','course_exercises','student_work','student_results','student_hints','student_sessions'] loop
        if to_regclass('public.' || t) is null then continue; end if;
        execute format('select count(*) from public.%I', t) into n;
        if n > 0 then raise exception 'La table % contient % ligne(s) : arrêt, rien n''est supprimé', t, n; end if;
    end loop;
end $$;

drop table if exists public.student_hints, public.student_results, public.student_work,
    public.student_sessions, public.course_exercises, public.course_sessions;
-- Fonction de trigger utilisée uniquement par ces tables (alerte « search_path mutable »).
drop function if exists public.set_updated_at();

notify pgrst, 'reload schema';
commit;
