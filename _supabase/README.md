# Proposition : copies individuelles de la séance pilote

État : migration `refonte_copies_individuelles` appliquée à Supabase le 19 octobre 2026, après validation explicite de l’utilisateur. La sauvegarde individuelle est activée en local dans `_data/features.yml`. Aucune publication ni fusion vers `main` n’a été effectuée.

Version confirmée dans l’historique Supabase : `20261019120010`.

Le contrôle préalable de la base réelle a été effectué en lecture seule via la connexion Supabase : voir [AUDIT-LECTURE-SEULE.md](AUDIT-LECTURE-SEULE.md). Après migration, `02_verification_transactionnelle.sql` a confirmé l’écriture, la relecture, les révisions, l’isolation entre deux élèves, les refus d’accès anonymes et la fermeture des groupes. Les copies de contrôle ont été annulées par transaction ; aucune copie de contrôle n’est conservée et aucune réponse existante n’a été modifiée. Les séquences ont pu avancer pendant ces contrôles.

Le parcours complet de sauvegarde/restauration a été confirmé par l’utilisateur avec son compte élève fictif, en 3e collège. Le lot suivant est préparé mais non appliqué : [groupes par séance et suivi professeur](GROUPES-ET-SUIVI.md).

## Fonctionnement de ce lot

- Une copie individuelle par utilisateur, établissement, matière, classe et séance.
- Restitution des réponses avant d’autoriser la saisie ; aucune sauvegarde de champs vides après une erreur de lecture.
- Enregistrement temporisé, écritures ordonnées et reprise après une coupure tant que la page reste ouverte.
- Si deux onglets modifient la même réponse, la révision périmée est refusée. La saisie locale reste visible et n’écrase pas l’autre version.
- Un élève lit et modifie uniquement ses propres réponses. Aucun accès général professeur avant la définition de ses affectations.
- Aucune création de binôme/trinôme, aucune invitation ni lecture d’une copie collective dans ce lot.

Les tables `work_sessions` et `work_answers` existantes sont réutilisées. La seule colonne ajoutée est `work_answers.revision`. Un index unique partiel empêche les doublons de copies individuelles. Un trigger sans privilège élevé fixe l’auteur et la révision d’une réponse. Les cours, énoncés et corrigés restent hors base. Les tables de l’ancien site et les profils ne sont pas modifiés.

## Procédure préalable conservée pour référence

1. Exécuter uniquement `00_audit_copies.sql` dans l’éditeur SQL Supabase, ou utiliser la connexion Supabase proposée pour ce contrôle en lecture seule.
2. Examiner les politiques, triggers, vues, fonctions privilégiées et droits par colonne. Ce rapport n’exporte ni réponses ni noms d’élèves. Vérifier qu’une définition SQL ne contient pas de secret avant de partager le rapport.
3. Comparer les tables à l’export initial : RLS activée, aucune politique `work_*`. Aucun doublon individuel ne doit être supprimé automatiquement.
4. Valider explicitement ce lot et le script `01_copies_individuelles.sql` avant application.

Le script est transactionnel. Il refuse une situation différente de l’export (politiques, triggers, vues dépendantes, fonctions privilégiées référant directement aux tables, colonne de révision déjà présente, doublons). Il s’arrête sans appliquer la migration dans ces cas. La détection textuelle des fonctions ne couvre pas tout SQL dynamique : l’examen du rapport et des autres schémas exposés reste nécessaire avant de certifier la base réelle.

## Droits proposés

| Action | Non connecté | Élève propriétaire | Autre élève / professeur |
| --- | --- | --- | --- |
| Lire une copie individuelle | Refus | Autorisé | Refus |
| Créer une copie individuelle | Refus | Sa classe et son établissement uniquement | Refus |
| Lire ses réponses | Refus | Autorisé | Refus |
| Insérer/modifier une réponse | Refus | Si la copie n’est pas terminée | Refus |
| Modifier auteur, révision ou identifiant de copie | Refus | Refus | Refus |
| Supprimer une copie/réponse | Refus | Refus | Refus |
| Lire/modifier les groupes ou invitations | Refus | Refus | Refus |

Les droits de table et de colonne sont limités ensemble. Les clés d’identité et de classe sont contrôlées côté PostgreSQL, indépendamment des filtres du navigateur. La classe du profil est ici l’affectation de référence existante ; la validation de l’appartenance à une vraie classe et les affectations professeur devront être définies dans un lot ultérieur.

## Tests locaux

Depuis la racine du dépôt, installer si nécessaire la dépendance de test :

```text
npm install --prefix _checks --ignore-scripts
node --experimental-vm-modules --test _checks/auth.test.mjs _checks/work.test.mjs _checks/work-ui.test.mjs _checks/work-rls.test.mjs
```

La version PGlite est fixée dans `_checks/package.json`. Les tests SQL exécutent les politiques et triggers dans un PostgreSQL local en mémoire, sur une reproduction du schéma et des données entièrement fictives. Ils testent aussi la suspension et le refus des préconditions. Les tests JavaScript couvrent restauration, erreurs réseau, conflits, changements de compte et absence de faux succès. Ils ne constituent pas un test de la base hébergée ni de l’ensemble de ses RPC/vues.

Les dossiers `_checks`, `_supabase` et `_archives` sont exclus du site généré.

## Procédure d’activation et recette

1. Appliquer le script validé à Supabase et conserver son résultat.
2. Vérifier avec des comptes fictifs que deux élèves ne peuvent pas accéder à la même copie et qu’un appel direct étranger est refusé.
3. Passer `individual_work` à `true` dans `_data/features.yml`, reconstruire localement et tester la séance pilote avec un élève **collège, 3e**. Un compte d’une autre classe reste en lecture seule.
4. Saisir, attendre l’indication d’enregistrement, recharger, puis se déconnecter/reconnecter. Les réponses, y compris celles effacées, doivent être restaurées correctement.
5. Essayer une coupure réseau et deux onglets concurrents. Une sauvegarde en erreur ne doit jamais être annoncée réussie.
6. Présenter les résultats avant toute publication.

Les réponses non envoyées restent seulement dans la mémoire de l’onglet, sans stockage persistant sur un poste partagé. L’interface avertit avant un départ avec modifications non enregistrées ; fermer de force le navigateur peut perdre ces seules modifications. Un conflit exige un choix explicite de rechargement ; aucune fusion silencieuse ni remplacement automatique n’est effectué.

## Contrôle de sécurité Supabase après application

Aucune alerte ne vise le nouveau trigger, dont le `search_path` est fixé et qui s’exécute sans privilège élevé. Deux tables restent volontairement sans politique : `student_results` (correction future) et `work_session_members` (groupes fermés).

Le diagnostic relève aussi deux alertes préexistantes, non modifiées dans ce lot : le [search_path de public.set_updated_at](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable) et la [protection contre les mots de passe compromis désactivée](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). Elles sont à examiner séparément avant généralisation du site.

## Suspension sans suppression

Remettre le drapeau à `false` désactive la saisie dans le site, mais ne constitue pas une règle d’accès serveur. Le script `90_suspendre_copies.sql` retire aussi les droits clients sans supprimer aucune copie, réponse, colonne ou index. C’est une suspension sûre, pas un effacement ni une restauration de droits trop larges. La réouverture nécessitera de revoir les droits existants avant de les réaccorder.

Références : [RLS Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security), [politiques PostgreSQL](https://www.postgresql.org/docs/current/ddl-rowsecurity.html), [PGlite](https://pglite.dev/docs/).
