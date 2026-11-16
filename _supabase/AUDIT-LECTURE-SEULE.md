# Vérification de la base réelle — 19 octobre 2026

Projet identifié via la connexion Supabase : `aqbjykgppbyrzqxlzxuf`, correspondant à l’URL déjà utilisée par le site. PostgreSQL hébergé : version 17.11.

Seules des lectures de structure, droits et compteurs ont été exécutées. Aucun compte, profil, réponse, schéma ou paramètre n’a été modifié. Aucune identité ni réponse d’élève n’a été lue.

## Constats confirmés

- Les colonnes et identités des trois tables `work_sessions`, `work_answers`, `work_session_members` correspondent à l’export initial. La colonne `revision` est absente.
- La RLS est activée sur les trois tables ; aucune politique n’y est définie.
- Aucune copie individuelle ou collective n’existe actuellement dans `work_sessions`, donc aucun doublon à traiter.
- Aucun trigger utilisateur sur `work_*` ou `profiles`, aucune vue publique, aucune fonction publique `SECURITY DEFINER` exécutable par les clients.
- Aucune vue dépendante des copies, tous schémas confondus, ni fonction privilégiée accessible aux clients qui référence directement ces tables dans son code.
- Aucun droit explicite par colonne supplémentaire sur les trois tables `work_*`.
- Les rôles API `anon` et `authenticated` ne sont ni superutilisateurs ni exemptés de RLS.
- L’insertion d’un profil est limitée à son propre compte avec `role = student`.
- Le rôle et l’identifiant du profil ne sont pas modifiables par `authenticated`. L’incertitude de l’audit initial sur les droits par colonne du rôle est donc levée.
- Les colonnes prénom, nom et classe du profil sont modifiables pour son propre compte selon les droits actuels ; l’établissement ne l’est pas. Le rôle professeur ne peut pas être obtenu par cette mise à jour directe.

## Limites

Les tests des nouvelles politiques ont été exécutés uniquement sur un PostgreSQL local isolé avec des données fictives. La migration n’est pas appliquée à la base hébergée. Les réglages de schémas exposés ne sont pas présents dans le paramètre SQL de rôle interrogé ; cela ne prouve pas leur absence dans la configuration du service. L’audit des fonctions ne garantit pas l’absence de toute référence construite par SQL dynamique.

Le profil actuel permet à un élève de choisir sa classe lors de l’inscription et d’en modifier la valeur par l’API selon les droits existants. La future gestion des affectations doit distinguer ce choix d’une validation par l’établissement. Le lot proposé ne donne aucun accès aux copies d’autres utilisateurs, même si la classe change.

## Proposition au terme de l’audit préalable

Valider `01_copies_individuelles.sql` avant application. Il réutilise les tables existantes, ajoute la révision des réponses et l’unicité des copies individuelles, limite les droits et maintient les groupes fermés. Aucun changement aux anciennes tables ni aux règles de profil n’est prévu dans ce lot.

## Mise à jour après validation de l’utilisateur

La migration a ensuite été appliquée (`20261019120010`, `refonte_copies_individuelles`). Les cinq politiques, la colonne de révision et le trigger ont été confirmés dans la base réelle. Les contrôles transactionnels ont réussi et toutes les copies de contrôle ont été annulées. Voir `README.md` et `02_verification_transactionnelle.sql`. La sauvegarde est activée localement ; la recette dans le navigateur reste à confirmer par l’utilisateur.
