# Tableau des notes professeur

Réalisé localement le 20 octobre 2026, après accord de poursuite.

## Accès et fonctionnement

Menu professeur « Notes » ou raccourci « Tableau des notes », route `/prof/notes/`.
Choisir la matière et la classe parmi les affectations du professeur, puis éventuellement une séance.
Les lignes correspondent aux élèves, les colonnes aux séances ; seules les notes validées courantes sont affichées sur 20. Une absence de note reste une absence, jamais un zéro. Une note collective est répétée pour chacun des participants acceptés.

Les copies ouvertes, à corriger ou rouvertes sont distinguées. Une ancienne copie individuelle reste dans l’historique lorsque la copie collective devient la référence. En cas de références multiples incohérentes, aucune note n’est choisie arbitrairement.

Le bouton « Détail et historique » charge à la demande les points par question/case et les appréciations conservées. Les liens ouvrent directement la copie dans le suivi professeur, avec le filtre historique si nécessaire.

## Données et limites

Aucune migration, modification de politique RLS ni nouvelle fonction Supabase. Réutilisation des affectations, du registre des élèves, des copies, des membres acceptés et des évaluations existantes, sous les droits du professeur connecté.

La vue initiale ne lit ni réponses, ni corrigés, ni appréciations détaillées. Lectures paginées et regroupées ; actualisation manuelle. Les réponses tardives après déconnexion sont ignorées et l’affichage privé est effacé.

Un ancien élève dont le profil n’est plus dans la classe est présenté par un libellé « Ancien élève ». Sa copie permet de retrouver ses participants. Aucun élargissement des droits sur les profils n’a été ajouté.

L’historique conserve les anciennes notes et appréciations, mais pas le texte des réponses à chaque correction. Le lien ouvre les réponses actuelles de la copie ; cette limite est indiquée à l’écran. Aucun calcul de moyenne ni classement ajouté.

## Vérification

- 295 tests réussis, dont modèle, pagination, accès professeur, chargement différé, déconnexion, protection du texte affiché et lien direct vers une copie historique.
- Construction Jekyll stricte réussie.
- 12 pages, ressources et imports locaux vérifiés ; 8 champs de réponse inchangés et 374 archives intactes.
- Parcours authentifié du nouveau tableau à confirmer avec le compte professeur.

Aucune publication GitHub Pages ni fusion vers `main` dans ce lot.
