# Une copie de référence par élève et par séance

Fonctionnement validé par l’utilisateur et appliqué le 19 octobre 2026 : migration Supabase `20261019131318`, `refonte_copie_reference_et_historique`, script `05_copie_reference_et_historique.sql`.

## Parcours

- Seul : l’élève travaille sur sa copie individuelle.
- Création d’un groupe : les réponses enregistrées de son créateur initialisent la copie commune. L’interface attend la fin de la sauvegarde avant d’envoyer les invitations. La copie individuelle du créateur devient un historique en lecture seule.
- Invitation en attente : le destinataire continue de disposer de son individuel et ne peut pas lire le collectif.
- Acceptation : le collectif devient sa copie de référence ; son propre travail individuel est conservé dans son historique, sans fusion avec les réponses communes. Il ne peut pas consulter l’historique privé d’un autre participant.
- Nouvelle séance : choix individuel ou nouveau groupe indépendant ; les droits des séances précédentes sont conservés.

La page de cours retrouve automatiquement le groupe accepté, même en passant par le lien général de la séance. Le menu permet de consulter le travail individuel historique lorsqu’il existe. Un élève n’ayant pas commencé individuellement n’a pas de copie individuelle créée artificiellement pour l’historique.

Le suivi professeur affiche les copies de référence à corriger. La case **Consulter l’historique individuel** affiche séparément les anciens travaux ; leur panneau de correction est masqué. Le professeur affecté peut lire ces historiques, comme leurs propriétaires. La clôture/réouverture d’un collectif ne réactive pas les anciens individuels.

## Protection des données

La classification « historique » est calculée à partir des adhésions acceptées et de la séance. Aucune nouvelle table, aucune suppression ni modification des réponses déjà existantes pour ce classement. Les droits serveur empêchent toute nouvelle réponse sur l’individuel historique, y compris depuis un ancien onglet ou un appel direct à l’API. La création d’un nouvel individuel parallèle est refusée lorsqu’un groupe est déjà accepté.

Les écritures de réponses verrouillent leur copie et revérifient l’autorisation ; la création du groupe et l’acceptation verrouillent l’individuel concerné. Ces protections ordonnent la sauvegarde, la reprise initiale et le passage dans l’historique. Une saisie non enregistrée reste protégée dans l’ancien onglet ; le changement de copie exige un choix explicite avant de l’abandonner.

Les copies collectives créées avant ce lot conservent leurs réponses actuelles. Aucune reprise rétroactive ou fusion n’est exécutée. Les deux copies individuelles des participants au groupe pilote existant sont désormais historiques ; leur collectif existant reste la copie de référence.

## Validation

**122 tests locaux réussis**, incluant la reprise initiale du créateur, le consentement, la conservation du travail du destinataire, le refus d’écriture depuis un ancien onglet, l’isolation des historiques, la séparation professeur et les parcours JavaScript. Les suites des lots précédents restent présentes pour vérifier leurs étapes respectives.

`06_verification_historique_transactionnelle.sql` a également réussi sur la base hébergée : deux individuels temporaires, copie commune initialisée, acceptation, historique privé figé, collectif modifiable et séparation du suivi professeur. Tout a été annulé en transaction : **zéro copie de contrôle conservée**, aucune réponse existante modifiée ; les séquences ont pu avancer.

Le diagnostic de sécurité ne relève aucune nouvelle alerte. Restent les alertes précédentes documentées dans [GROUPES-ET-SUIVI.md](GROUPES-ET-SUIVI.md). Le script de suspension `91_suspendre_groupes_et_suivi.sql` couvre aussi les nouvelles fonctions privées et la nouvelle signature du suivi professeur.

Recette utilisateur : recharger `/prof/suivi/` et vérifier que le groupe existant apparaît dans les copies de référence, puis cocher l’historique pour retrouver les deux individuels. Côté élève, ouvrir la séance générale : le collectif doit être chargé, avec accès à son seul historique dans le menu. Pour vérifier la reprise initiale, utiliser une nouvelle séance intégrée ou de nouveaux comptes fictifs ; ne pas effacer les groupes existants.

Aucune publication ni fusion vers `main`.
