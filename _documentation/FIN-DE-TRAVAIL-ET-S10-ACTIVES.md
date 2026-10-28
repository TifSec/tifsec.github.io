# Fin de travail élève et correction S10 activées

Le 20 octobre 2026, le professeur autorise le bouton à condition que l’élève puisse revenir modifier son travail et que seul le professeur clôture la saisie. Il demande également le raccordement du cours professeur et du correcteur S10.

## Déclaration sans verrouillage

Migration appliquée : `20261020135647 refonte_fin_de_travail_et_versions_s10`, source `11_remise.sql` mise à jour. `submitted_at` et `submitted_by` tracent la déclaration. L’opération ne met jamais `terminee=true`. La comparaison des révisions protège contre une déclaration faite sur une ancienne version des réponses.

La déclaration fait avancer le parcours, sans note requise. L’élève peut revenir dans le cours et compléter ses réponses ; le marqueur reste présent. Les membres acceptés d’un groupe conservent les mêmes droits d’édition. La clôture ou la validation de note par le professeur bloque la saisie ; sa réouverture retire la déclaration et la note courante, avec conservation des évaluations historiques.

Les cartes élève distinguent « Travail terminé — encore modifiable » et « Corrigée — note validée ». Le tableau des notes considère un travail déclaré terminé comme à corriger. Le suivi précise que les réponses restent modifiables jusqu’à la clôture. `student_submission: true` activé après migration.

## S10 : versions, corrigés et aides

L’audit a trouvé une copie S10 et une copie S10R sans version, aucune note sur ces séances. La migration lie ces copies à v1 sans changer leurs réponses et renseigne v1 sur leurs futures copies. L’unique note existante concerne S02 et reste conservée.

Dépôt vérifié privé : `TifSec/tifsec-corriges-prives`.

- `techno/3e/S10R.v1.yml` : cours original repris, commit `0b1b0964bac55cca913d02aff9a22b43327ac52a`, blob `cb67d4fdeb6451db4823160a02aa135fd759f63a`.
- `techno/3e/S10.v1.yml` : ancien essai conservé pour sa copie existante, commit `f3117b42ec898238724b796a973b27e2883d4847`, blob `0b4d188f020395f7993aae7a9786141015c3faf3`.

Ces vrais corrigés ne résident pas dans le dépôt public. Ils ont été vérifiés localement en mémoire puis relus dans le dépôt privé. Les préparations locales restent hors dépôt public dans `../preparation-privee/`. Les scripts d’import anciens ne doivent pas écraser cette correction finalisée.

S10R : attendus, explications, erreurs fréquentes et critères adaptés aux seize questions ; barème sur 20. Tableau identification/authentification reconnu par case et choix d’un exemple de mot de passe reconnu sur réponse entière : jusqu’à 2,5 points proposés. Une réponse inconnue reste à examiner, jamais notée zéro par défaut. Les tableaux de situations et de synthèse ont un barème par case et restent entièrement manuels. Les justifications ne sont pas notées par recherche de mots-clés. Le professeur peut revoir chaque point et reste seul à valider.

Les aides sont visibles dans « Ouvrir le cours professeur » ; dans une copie, « Préparer la correction » les place près des questions et rend les points saisissables. La déclaration élève ne mesure pas automatiquement implication, envie, progression ou maîtrise.

## Services déployés

Trois fonctions actives avec JWT obligatoire et contrôles existants conservés : `teacher-course` v3, `teacher-correction` v5, `teacher-grade` v2. Catalogues S02/S10/S10R et dépendances communes inclus. Aucun jeton GitHub exposé ou extrait, aucun nouveau secret et aucun fichier professeur dans la base.

Évolutions communes : reconnaissance exacte des réponses courtes, après normalisation limitée ; barèmes manuels par case réutilisant les composants existants. Les inconnues ne deviennent pas des erreurs certaines. S02 et son corrigé privé n’ont pas été réécrits.

## Vérification et limites

337 tests locaux réussis et compilation Jekyll stricte. Vérification de 14 pages, ressources/imports, huit champs du pilote inchangés et 374 archives intactes. Vrai couple YAML S10R vérifié en mémoire : 16 questions, total 20, 24 cases réparties sur trois tableaux, proposition déterministe de 2,5 et aucune note finale automatique. Ancien essai S10 vérifié également.

Recette distante de déclaration sur copie fictive réussie et annulée par ROLLBACK. Aucun utilisateur, aucune réponse réelle ni note réelle créé ou modifié par la recette. Après opération : cinq copies, 53 réponses, une note, aucune déclaration réelle et aucune S10 sans version. Les séquences peuvent avoir avancé lors des recettes annulées.

Les trois fonctions refusent les requêtes anonymes avec HTTP 401. Aucun onglet authentifié n’était disponible dans le navigateur de l’agent : la recette complète d’interface est à confirmer avec les comptes du professeur et des élèves. Ne pas présenter le refus anonyme comme une preuve suffisante du parcours professeur.

Audit de sécurité : mêmes trois constats préexistants, aucune nouvelle alerte sur le lot. Références pour une intervention séparée : [ancien student_results sans politique](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy), [ancien set_updated_at sans search_path fixé](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable), [protection des mots de passe compromis désactivée](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

Site local reconstruit ; aucune publication du site public ni fusion vers main. Le dépôt privé et les services nécessaires ont été actualisés dans le périmètre autorisé.

## Règle pour les prochains imports

Préparer ensemble la version élève et la version professeur : réponses attendues, explications, critères et barème sur 20, reconnaissance déterministe quand elle est fiable, décision manuelle pour le reste. Vérifier identifiants, champs et version de copie ; générer le schéma serveur, publier le fichier uniquement dans le dépôt privé puis actualiser les fonctions nécessaires. Vérifier le parcours complet avant d’annoncer la séance comme prête à corriger. Ne pas laisser le raccordement professeur pour une étape implicite ultérieure.
