-- Deux cours MFR uniquement. Aucun cours, corrigé ou barème en base.
-- Aucun changement de droits ; aucune reprise des anciennes copies.
create or replace function refonte_private.grading_copy_state() returns trigger
language plpgsql security definer set search_path='' as $$
begin
    if tg_op='INSERT' and (
        (new.etablissement='college' and new.matiere='techno' and new.classe='3e' and new.seance in ('S02','S10','S10R'))
        or (new.etablissement='mfr' and new.matiere='tim' and new.classe='cap2' and new.seance='S03')
        or (new.etablissement='mfr' and new.matiere='maths' and new.classe='term' and new.seance='S05')
    ) then new.course_version:='v1'; end if;
    if not new.terminee then new.current_evaluation_id:=null; end if;
    return new;
end $$;
revoke all on function refonte_private.grading_copy_state() from public,anon,authenticated;
