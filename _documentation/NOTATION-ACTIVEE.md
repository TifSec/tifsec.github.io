# Notation activée après accord

20 octobre 2026. Autorisation explicite de l’utilisateur après présentation des changements : « Ok, fais le s'il te plaît ».

## État appliqué

- Migration `20261020110703 refonte_notation_et_validation` appliquée avec succès. Source conservée dans `_supabase/09_notation.sql` (nom historique, ne pas réappliquer).
- `work_evaluations` créée avec RLS et lecture limitée au périmètre professeur ou à l’élève validé destinataire de sa correction courante. Aucun droit direct d’insertion/modification/suppression accordé aux clients.
- Version du cours et correction courante ajoutées aux copies ; seul le pilote S02 est rattaché à v1.
- Service `teacher-grade` version 1 actif, JWT obligatoire, réutilisant les contrôles du service de correction et du dépôt privé. Aucun nouveau secret.
- `grade_validation: true` dans le site local : saisie, total, validation/verrouillage et restitution dans la copie élève activés ensemble. Aucune publication du site public ou fusion vers main.

## Vérifications effectuées

274 tests locaux réussis, construction stricte réussie, 11 pages et ressources contrôlées, huit champs de réponse préservés et 374 archives intactes.

Recette PostgreSQL distante sous rôles anonyme/élève/professeur, avec une copie fictive annulée par ROLLBACK : refus d’un élève ou d’un visiteur, refus de révisions périmées, points par case conservés, total calculé côté base, note/commentaire/clôture enregistrés ensemble, doublon de validation refusé, accès de l’élève à sa note seulement, réponses verrouillées et réouverture conservant l’historique. Script dans `_supabase/10_verification_notation_transactionnelle.sql`, également testé sur PostgreSQL local fictif. Une ambiguïté d’alias dans le premier contrôle a été corrigée ; aucun changement de données n’a été conservé par cet essai annulé.

Comptages avant/après : trois copies et quinze réponses dans les deux cas ; zéro évaluation définitive créée par les tests, zéro copie de vérification conservée. Les écritures directes et la lecture anonyme des évaluations sont refusées, ainsi que l’appel anonyme à la fonction SQL. En ligne : appel anonyme HTTP 401, faux JWT HTTP 401, prévol du navigateur HTTP 204 avec origine locale autorisée.

Les contrôles de sécurité Supabase avant/après ne signalent aucune nouvelle alerte liée à ce lot. Les observations préexistantes restent :

- `public.set_updated_at` sans chemin de recherche fixé : [explication et correction](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable).
- Protection des mots de passe compromis désactivée : [configuration Supabase Auth](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).
- Information sur `student_results`, table ancienne fermée avec RLS sans politique : [description du contrôle](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy). Aucun accès ouvert dans ce lot.

## Dernière recette navigateur

À confirmer par le professeur : actualiser avec Ctrl+F5, préparer la correction d’une copie de test S02, compléter toutes les notes (y compris les cases non reconnues), puis cliquer sur **Valider la correction et verrouiller la copie**. Recharger pour vérifier la persistance ; côté élève, retrouver les points par réponse et les appréciations dans la copie en lecture seule. Une réouverture retire la note courante et garde l’évaluation précédente pour le professeur.

La note finale n’est jamais validée par les tests à la place du professeur sur une copie réelle. Le tableau récapitulatif des notes, l’écran de consultation de toutes les anciennes corrections et les notes sur les cartes du tableau de bord élève restent des lots suivants.
