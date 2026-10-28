# Correction assistée raccordée aux copies

20 octobre 2026, branche `refonte-jekyll`. Autorisation : « raccorde s'il te plaît ». Lot de lecture et proposition uniquement, sans migration, modification RLS, écriture de note ou publication GitHub Pages.

## Utilisation

**Repères enrichis — 20 octobre :** le service est passé en version 2. L’adaptateur professeur ajoute aux résultats les champs privés autorisés (attendu, explication, critères, erreurs fréquentes et paramètres déterministes), des formulations conditionnelles d’appréciation et une indication d’attribution selon le maximum existant. L’interface les affiche en texte inerte dans chaque question. Ce sont des références de correction, pas une évaluation sémantique de la réponse libre. Aucune proposition chiffrée pour une réponse ouverte ; aucune plage inventée sans barème. La sortie du moteur de calcul pur reste sans attendus. Les anciennes mentions de résultat sans attendu ci-dessous décrivent la version 1 ; cette nouvelle restitution privée est exclusivement accessible après les contrôles professeur existants. 229 tests et construction stricte réussis ; refus visiteur/faux JWT HTTP 401 et prévol HTTP 204 vérifiés après déploiement. Dernier essai authentifié à confirmer par l’utilisateur.

**Présentation ajustée le 20 octobre :** le bouton et le bilan court précèdent la copie ; chaque résultat apparaît directement sous la question correspondante. Résolution des cibles par activité et question, refus des cibles absentes ou dupliquées avant affichage. Annotations effacées lors d’un nouveau calcul, d’un changement de copie ou de connexion. Aucun changement serveur. Validation de cet ajustement : 22 tests d’interface/suivi et six contrôles du site construit réussis, construction stricte réussie. L’utilisateur a confirmé le bon fonctionnement authentifié du calcul avant cette évolution d’affichage.

Dans `/prof/suivi/`, choisir la séance puis une copie de référence individuelle ou collective. Cliquer sur **Préparer la correction**. Le résultat présente les vérifications déterministes, les questions à examiner et les points proposés lorsque le fichier professeur définit un barème. Aucune note finale n’est enregistrée. L’historique individuel reste consultable sans préparation de correction.

S02 est une séance formative à deux questions ouvertes, dont un tableau de six champs. Ces champs sont regroupés en une question ; le résultat n’affiche donc pas sept critères. Ses réponses restent à examiner par le professeur, sans note ni barème inventés. Un tableau partiellement rempli reste à examiner. Les absences ne reçoivent pas automatiquement zéro.

Le résultat utilise les réponses enregistrées au moment du calcul. La prévisualisation du cours peut dater de son ouverture : actualiser la liste puis rouvrir la copie pour relire les dernières réponses. Une copie en cours peut encore évoluer après le calcul. La proposition est temporaire et disparaît lors d’un changement de copie, d’état de connexion ou d’une clôture/réouverture effectuée ici.

## Serveur et confidentialité

- Fonction Supabase `teacher-correction`, version 1, active, `verify_jwt: true`. La passerelle `teacher-course` existante n’a pas été remplacée.
- Seul paramètre accepté : `copy_id`. Le navigateur ne fournit ni réponses à corriger, ni score, ni fichier privé, ni version arbitraire.
- Identité vérifiée auprès d’Auth ; rôle relu depuis `profiles`. Copies et réponses lues avec le JWT de l’appelant et les règles RLS existantes, sans clé privilégiée.
- Le RPC existant `refonte_teacher_copies`, filtré sur cette copie et sans historique, confirme la copie de référence et son périmètre. Il ne crée ni ne modifie de données.
- Réutilisation interne du contrôleur de cours privé : affectation professeur, catalogue fermé et dépôt GitHub obligatoirement privé. Le même secret GitHub déjà enregistré est utilisé ; aucun nouveau secret demandé.
- Schéma des questions exporté depuis les YAML publics : identifiants, types, champs et identifiants de choix uniquement. Aucun énoncé ou corrigé stocké en base.
- Deux lectures des réponses et de l’état de copie entourent le calcul. Révision, valeur, ensemble de réponses ou statut modifiés pendant ce calcul : aucun résultat retourné. Une lecture tronquée est également refusée.
- Résultat sans réponses brutes ni attendus privés ; aucun journal de ces contenus. En-têtes `no-store`, aucun stockage du résultat dans le navigateur ou la base. Empreinte du corrigé et révisions incluses pour préparer la traçabilité future.

## Limites à conserver avant le prochain lot

La double lecture n’est pas une transaction de validation. Une réponse peut changer après le calcul ; une future écriture de note devra vérifier les révisions sous verrou côté base, avec validation explicite du professeur.

Les copies actuelles ne portent pas de version de cours en base. Ce raccordement est limité au pilote S02/v1 et à ses clés préservées, via le catalogue serveur unique. Il refuse une séance absente ou plusieurs versions candidates. Ne pas remplacer le schéma S02/v1 par un contenu incompatible ni généraliser à des versions historiques sans définir la liaison copie/version. L’empreinte du corrigé décrit le contenu utilisé pour cette proposition, pas la version historique du cours suivi par l’élève.

La sauvegarde des évaluations, leur validation, l’historique des changements et le tableau récapitulatif des notes restent le prochain lot. Présenter une migration concrète et attendre son accord avant toute application.

## Vérifications

- 226 tests réussis : suite complète, dont calcul pur, serveur, confidentialité, contrôle d’accès, réponses concurrentes, copies collectives, historique et interface.
- Construction Jekyll stricte réussie ; 11 pages et leurs ressources vérifiées ; sept clés de réponses inchangées ; 374 archives intactes ; aucun backend/test/document/ancien site dans la sortie publiée.
- En ligne : requête anonyme HTTP 401, faux JWT HTTP 401, prévol du navigateur HTTP 204 avec origine locale autorisée.
- Dernier essai authentifié avec le compte professeur à effectuer par l’utilisateur. Aucun compte réel ni copie réelle modifiés par ces tests.

Pour ajouter un cours au raccordement : exporter le schéma avec `node _checks/export-question-catalogue.mjs --write`, compléter le catalogue serveur autorisé et le YAML privé cohérent, exécuter les tests, puis redéployer le service. Ne jamais joindre un corrigé réel aux fichiers publics, même pour un test.
