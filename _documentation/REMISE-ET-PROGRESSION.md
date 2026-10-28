# Remise des copies et prochaine séance

Activé le 20 octobre 2026 après accord et correction explicite du professeur : la déclaration de fin ne bloque pas les réponses. Seul le professeur clôture la saisie. Voir aussi [FIN-DE-TRAVAIL-ET-S10-ACTIVES.md](FIN-DE-TRAVAIL-ET-S10-ACTIVES.md).

## Fonctionnement demandé

Le professeur privilégie l’évaluation continue des séances, de l’implication et de la progression plutôt qu’un contrôle ponctuel. Ne pas déduire automatiquement l’implication du nombre de réponses, des clics, d’une note ou de la vitesse. Les critères personnels d’observation et la future moyenne restent à préciser ; ce lot ne les calcule pas.

La remise et la correction sont deux événements distincts :

1. L’élève clique en fin de cours sur « J’ai terminé — remettre ma copie ».
2. Après confirmation, les réponses en attente sont sauvegardées et les révisions contrôlées. La copie est déclarée terminée, mais reste modifiable jusqu’à la clôture par le professeur.
3. À la prochaine connexion ou actualisation de l’espace, la séance suivante prend la place de la précédente, sans attendre de note.
4. Le professeur peut corriger plus tard, valider la note ou rouvrir la copie pour une reprise. La réouverture retire la remise courante et la note courante selon les règles déjà en place ; les anciennes évaluations sont conservées.

En groupe, un participant accepté peut déclarer la copie commune terminée ; le dialogue explique que tous les participants seront concernés et pourront encore compléter les réponses. Une invitation non acceptée ne donne pas ce droit. Une copie individuelle devenue historique n’est pas soumissible. Le professeur peut clôturer puis rouvrir la copie commune.

Les réponses manquantes donnent lieu à un avertissement, sans obligation de toutes les compléter pour remettre. Une copie entièrement vide ne peut pas être remise. Une erreur de sauvegarde ou de révision ne transforme pas la copie en travail terminé.

## Prochaine séance en 3e

Le professeur précise que S09 a été faite ensemble. `_data/progressions.yml` commence donc à S10R, affichée « S10 — Comment protéger ses données et ses comptes ? ». L’ancien essai S10 et le pilote S02 ne déterminent pas la suite du parcours.

S11 suit S10R. S11 n’étant pas encore importée, elle est annoncée comme non disponible : aucun lien de cours inexistant, aucune création de copie et aucun saut automatique à un autre cours. Les progressions des autres classes restent à renseigner avec leurs cours ; aucun point de départ arbitraire n’est inventé. La progression est un fichier de références pédagogiques public, sans calendrier ni nouvelle table de cours.

La copie collective de référence est utilisée, conformément au modèle existant. Une copie remise ou clôturée suffit pour avancer. Une réouverture ramène cette séance parmi les travaux à poursuivre. Une correction ou une note n’est jamais utilisée comme condition de passage.

## Changements appliqués en base

`_supabase/11_remise_PROPOSITION.sql`, appliqué sous `20261020135647 refonte_fin_de_travail_et_versions_s10` (nom de fichier conservé ; ne pas réappliquer) :

- Deux colonnes sur `work_sessions` : `submitted_at` et `submitted_by`, nulles pour les copies existantes ; index sur l’auteur.
- Fonction privée de remise et wrapper public `refonte_submit_copy`, authentifiés, sans droit d’UPDATE direct accordé aux élèves.
- Contrôle du profil validé, de l’appartenance acceptée, de l’historique et des révisions avant déclaration. Aucun changement de `terminee` par cette opération : la saisie reste ouverte.
- Nettoyage des informations de remise lors d’une réouverture professeur.

Aucune table supplémentaire, aucun cours/corrigé en base, aucune note automatique, aucune suppression, aucun changement des affectations. Les copies S10/S10R non encore évaluées et sans version sont liées explicitement à v1 ; les nouvelles copies de ces deux séances reçoivent la même version côté serveur.

## Activation et contrôle

`course_progression: true` et `student_submission: true` après succès de la migration et de sa recette distante. Site local reconstruit. La publication GitHub Pages reste séparée et soumise à accord.

337 tests réussis : permissions, révisions, déclaration sans note ni verrouillage, édition après déclaration, clôture professeur, correction, réouverture, groupe, réponses courtes, barèmes par case et interfaces. Compilation stricte réussie, 14 pages/ressources et 374 archives vérifiées.

Recette distante `_supabase/12_verification_remise_transactionnelle.sql` réussie sous rôles réels et annulée par ROLLBACK : édition après déclaration, accès tiers refusé, clôture et réouverture professeur. Aucune copie réelle déclarée par les tests. Parcours navigateur authentifié à confirmer avec les comptes de test. S10 et S10R disposent désormais de leurs fichiers privés et des trois fonctions actualisées, selon le document d’activation.
