# Gestion des élèves et validation des inscriptions

Lot validé par l’utilisateur, avec choix explicite de toutes les classes collège et MFR. Migration `refonte_validation_et_classes_eleves` appliquée le 19 octobre 2026, version `20261019132537`. Scripts `07_validation_eleves.sql` et `08_verification_eleves_transactionnelle.sql`.

## Utilisation

Ouvrir `/prof/eleves/` depuis le tableau de bord. Choisir une classe, puis :

- **Valider l’inscription** confirme le profil et ouvre le travail Jekyll à un nouvel élève.
- **Enregistrer l’affectation** change l’établissement/classe vers une classe gérée par le professeur, sans valider implicitement une inscription en attente.
- Les copies et appartenances aux groupes des séances précédentes sont conservées.

Les 12 classes et 17 combinaisons matière/classe de `_data/classes.yml` sont affectées au professeur unique existant, conformément au choix de l’utilisateur. La matière reste un filtre du suivi des copies ; les listes d’élèves dédoublonnent les classes TIM/Mathématiques communes. Un autre professeur sans affectation n’accède pas à ces listes et ne peut pas modifier un profil.

## Comptes existants et nouvelles inscriptions

Les 32 profils élèves existants ont le statut **legacy**, affiché « Compte existant — à vérifier ». Leur accès est conservé ; ce statut ne prétend pas que le professeur a déjà validé ces élèves. Les champs `validated_by` et `validated_at` restent vides jusqu’à une validation explicite. Les cours, réponses et identités existants ne sont pas modifiés.

Toute nouvelle inscription possède le statut **pending**, fixé par défaut côté serveur. L’élève se connecte et voit son profil mais ne peut pas commencer une copie, envoyer/recevoir une invitation de groupe ou figurer dans l’annuaire de collaboration avant validation. Après validation, il recharge son espace ou sa séance.

Un professeur peut corriger l’affectation avant de valider. La vérification administrative du nom et de l’appartenance réelle à la classe reste sa responsabilité : le logiciel ne la déduit pas de l’adresse de connexion ou des métadonnées.

## Sécurité

Les droits de profil sont réduits à l’insertion des champs d’inscription et à la modification personnelle du prénom/nom. L’élève ne peut changer ni classe, ni établissement, ni rôle, ni validation, même par appel direct à l’API. Les nouvelles insertions sont contrôlées par une politique restrictive : profil en attente, sans faux validateur, dans une classe configurée.

La liste professeur ne renvoie que les noms, identifiants internes, affectations et statut/date de validation ; aucun mot de passe ou adresse e-mail. La modification exige un professeur affecté à la classe source **et** à la destination. Les valeurs attendues du profil et un verrou empêchent une requête périmée de remplacer une correction concurrente. Les nouvelles interfaces publiques sont sans élévation de privilège ; les opérations privilégiées restent dans `refonte_private`, avec contrôle de l’utilisateur et `search_path` fixé.

Les droits de création/écriture du moteur Jekyll et de collaboration vérifient l’état de validation. Les comptes existants restent utilisables. Les tables du site historique ne sont pas modifiées ; la modification directe de la classe dans `profiles` est désormais interdite, conformément à l’objectif de sécurité.

## Validation

136 tests locaux couvrent les étapes précédentes et ce lot : inscription en attente, refus d’auto-validation/auto-affectation, refus d’administration par un élève ou professeur non affecté, validation puis changement de classe, refus des requêtes périmées, conservation des anciens groupes, absence de données après déconnexion et actions explicites dans l’interface. Construction Jekyll et contrôle des dix pages réussis ; les archives restent intactes et exclues du site généré.

Le contrôle transactionnel `08` a également réussi sur la base hébergée. Il place temporairement un profil pilote en attente, teste les refus puis une validation/correction par le professeur, et restaure le profil par `ROLLBACK`. Aucune réponse, copie ou identité n’est modifiée par ce contrôle ; aucune validation effective n’est effectuée pour l’utilisateur.

Aucune nouvelle alerte de sécurité Supabase. Les deux avertissements antérieurs restent documentés dans [GROUPES-ET-SUIVI.md](GROUPES-ET-SUIVI.md). La suspension `91` ferme également les nouvelles opérations de gestion des élèves. Aucune publication ni fusion vers `main`.
