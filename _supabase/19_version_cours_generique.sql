-- Base de TEST uniquement (29/10/2026). Vraie base : seulement avec l'accord du professeur.
-- Toute nouvelle copie d'une séance « SNN » reçoit la version v1 : les séances 2026 (technologie S11 à S50,
-- TIM et maths de la MFR) n'ont plus besoin d'être listées une à une.
-- Aucun cours, corrigé ou barème en base ; aucun changement de droits.
create or replace function refonte_private.grading_copy_state() returns trigger
language plpgsql security definer set search_path='' as $$
begin
    if tg_op='INSERT' and new.course_version is null and new.seance ~ '^S[0-9]{2}R?$' then
        new.course_version:='v1';
    end if;
    if tg_op='INSERT' and (new.etablissement,new.matiere,new.classe,new.seance)=('college','techno','5e','S02V2') then
        new.course_version:='v2';
    end if;
    if not new.terminee then new.current_evaluation_id:=null; end if;
    return new;
end $$;
revoke all on function refonte_private.grading_copy_state() from public,anon,authenticated;
