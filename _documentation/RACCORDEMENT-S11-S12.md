# Séances 11 et 12 — préparation du raccordement

**Décision du professeur après présentation : garder l'aperçu local pour le moment.** Ne pas appliquer le SQL ci-dessous, transférer les corrigés ni déployer les catalogues sans une nouvelle autorisation. Les deux cours élèves sont consultables localement ; le bouton du cours professeur ne peut pas encore charger leurs notes privées distantes. Le raccordement de notation reste préparé, non actif pour S11/S12.

20 octobre 2026. Contenus élèves locaux créés, corrigés préparés hors du dépôt public dans `../preparation-privee/techno/3e/S11.v1.yml` et `S12.v1.yml`. Six questions et barème de 20 points par séance ; déroulement proposé de 50 minutes. Aucune nouvelle réponse réelle ni note enregistrée pour vérifier ces cours.

## Changement Supabase précis à valider

La fonction existante `refonte_private.grading_copy_state()` ne lie actuellement à v1 que S02, S10 et S10R. Le raccordement ajoute S11 et S12 à cette liste. Aucun nouveau droit, aucune nouvelle table, aucun changement RLS. Les copies antérieures des autres séances sont inchangées. Une éventuelle copie S11/S12 créée pendant l'aperçu local est liée à v1 uniquement si elle n'a pas de version ni d'évaluation.

Proposition, non appliquée :

```sql
begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';

create or replace function refonte_private.grading_copy_state() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
    if tg_op = 'INSERT' and new.etablissement = 'college'
        and new.matiere = 'techno' and new.classe = '3e'
        and new.seance in ('S02', 'S10', 'S10R', 'S11', 'S12') then
        new.course_version := 'v1';
    end if;
    if not new.terminee then new.current_evaluation_id := null; end if;
    return new;
end $$;
revoke all on function refonte_private.grading_copy_state() from public, anon, authenticated;

update public.work_sessions s set course_version = 'v1'
where s.etablissement = 'college' and s.matiere = 'techno' and s.classe = '3e'
    and s.seance in ('S11', 'S12') and s.course_version is null
    and not exists (select 1 from public.work_evaluations e where e.work_session_id = s.id);

commit;
```

Le même raccordement comprend l'ajout des deux fichiers dans le dépôt GitHub **privé** déjà vérifié, puis l'actualisation des catalogues autorisés des trois services existants `teacher-course`, `teacher-correction` et `teacher-grade`, avec JWT obligatoire. Les algorithmes de sécurité et de notation restent inchangés. Cela ne publie pas le site GitHub Pages.

## Préparation et pédagogie

**Relecture de clarté demandée par le professeur :** S11 et S12 raccourcies, verbes concrets et analogies brèves. S11 a02/q02 propose désormais deux trajets à compléter, présentés avant la réponse. Les questions comportant plusieurs tâches sont décomposées en points visibles. Introduction du bloc optionnel `question.contenu`, rendu par les composants existants avant le champ ; `question.suite` conserve son rôle après réponse pour les cours antérieurs. Aucun identifiant, type de réponse ou barème modifié ; corrigés privés préparés toujours compatibles, aucun raccordement distant activé. La réduction de lecture ne supprime pas les temps de réflexion, de rédaction et de comparaison prévus.

- S11 : composants, chaînes d'énergie/information et justification d'un test de panne. Réponses par case pour les rôles et la chaîne ; formulation avec flèches dans un champ texte pour les relations. Aucun outil de dessin ou dépôt de fichiers prétendu disponible.
- S12 : conventions d'entrées, condition composée, priorité, exécution à la main et contre-exemple. Modèle de montée à bouton maintenu ; pas de descente ni de freinage physique simulés.
- Deux petits blocs communs de présentation ajoutés : tableau documentaire en lecture seule et texte d'algorithme préformaté. Le contenu est échappé, sans HTML libre ; aucune réponse supplémentaire créée dans les documents.
- Un QCM vérifiable par séance, jusqu'à deux points proposés ; tableaux, tests et raisonnements restent à examiner. Les aides et critères sont fournis par le fichier privé près des questions, comme pour S10.
- Rattachement des questions au suivi des compétences. S11 puis S12 deviennent accessibles dans le parcours après remise de la séance précédente. S13 Pix est annoncée sans lien de cours inexistant.
- La durée est une planification, à confirmer en classe. Les activités facultatives restent hors du barème.

## Vérifications avant activation

Contrôler les deux couples YAML en mémoire : identifiants et version, six questions, 50 minutes, 20 points, barèmes des cases et QCM. Exécuter les tests généraux et le scénario PostgreSQL fictif du raccordement. Construire Jekyll strictement et contrôler ressources, archives et exclusions. Examiner les deux rendus sur grand et petit écran. Après accord et activation, vérifier le cours professeur authentifié et le refus anonyme ; ne pas écrire de note ou de réponse sur une copie réelle pour la recette.

Résultats locaux : 393 tests réussis, dont le scénario PostgreSQL fictif sur versions, sauvegarde/restauration par lecture des réponses, isolation, consentement, validation et réouverture. Deux couples YAML validés : six questions, 50 minutes et 20 points chacun. Construction stricte réussie ; 16 pages et 95 fichiers générés contrôlés ; 374 archives intactes. Les deux séances apparaissent dans le sélecteur professeur et leur aperçu élève a été lu dans le navigateur avec le compte professeur. Champs désactivés en aperçu, aucune réponse ni note réelle créée. S12 contrôlée à 390 × 844 : largeur de page 375 px et défilement de page 375 px, sans débordement horizontal ; tableau et code disposent de leur propre défilement. Taille de navigateur réinitialisée.

La sauvegarde sur une vraie session élève S11/S12 et le chargement des corrigés privés n'ont pas été testés en ligne. Ne pas les annoncer comme une recette authentifiée complète de ces deux séances. Les tests locaux du raccordement ne signifient pas que la proposition SQL a été appliquée.
