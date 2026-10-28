-- Appliqué le 28 octobre 2026 : migration 20261028173039 refonte_register_techno_5e_s02_v2.
-- Récupéré depuis preparation-cours-28oct/S02-5e/deploiement/ (hors dépôt jusqu’ici). Ne pas réappliquer.
do $registration$
begin
    if md5(pg_get_functiondef('refonte_private.grading_copy_state()'::regprocedure)) <> '04cb1c7115caf7f39c3a5912865433e9' then
        raise exception 'Course version trigger changed since preparation';
    end if;
    execute $definition$CREATE OR REPLACE FUNCTION refonte_private.grading_copy_state()
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
$definition$;
end
$registration$;
