# Base de données Supabase — référence

| Projet | Rôle |
| --- | --- |
| `aqbjykgppbyrzqxlzxuf` (« TifSec's Project ») | **Production** : comptes et copies réels des élèves. |
| `evbfflwfyiitrkgzjhwt` (« tifsec-test ») | **Test**, créé le 28 octobre 2026 : comptes fictifs uniquement. Toute migration y passe avant la production. Projet gratuit : il se met en pause après une semaine sans activité. |

Les deux sont en PostgreSQL 17, région eu-west-1 (Irlande).

## Ce que contient ce dossier

| Fichier | Rôle |
| --- | --- |
| `schema/schema-2026-10-28.sql` | **Instantané complet de la structure** de la base au 28 octobre 2026 : 13 tables, 24 politiques RLS, 38 fonctions, 7 triggers, droits. Aucune donnée d'élève. Vérifié : il se recharge sans erreur dans un PostgreSQL vierge et reproduit exactement ces chiffres. |
| `schema/stub-supabase-local.sql` | Minimum de Supabase (rôles `anon`/`authenticated`, `auth.users`, `auth.uid()`) pour recharger l'instantané dans un PostgreSQL local et tester les règles d'accès. |

Pour reconstruire une base locale de test :

```text
psql -d base_vide -f supabase/schema/stub-supabase-local.sql
psql -d base_vide -f supabase/schema/schema-2026-10-28.sql
```

**Ne jamais exécuter l'instantané sur la base de production.**

## Historique des migrations appliquées

Liste relevée dans la base le 28 octobre 2026, avec le fichier correspondant dans `_supabase/`.

| Version | Nom en base | Fichier |
| --- | --- | --- |
| 20261019120010 | refonte_copies_individuelles | `_supabase/01_copies_individuelles.sql` |
| 20261019124130 | refonte_groupes_et_suivi_professeur | `_supabase/03_groupes_et_suivi.sql` |
| 20261019131318 | refonte_copie_reference_et_historique | `_supabase/05_copie_reference_et_historique.sql` |
| 20261019132537 | refonte_validation_et_classes_eleves | `_supabase/07_validation_eleves.sql` |
| 20261020110703 | refonte_notation_et_validation | `_supabase/09_notation.sql` |
| 20261020135647 | refonte_fin_de_travail_et_versions_s10 | `_supabase/11_remise.sql` |
| 20261021044911 | cours_mfr_cap2_s03_term_s05 | `_supabase/12_cours_mfr.sql` |
| 20261021123304 | activate_imported_test_course_versions_without_math_term_s06 | `_supabase/13_import_cours.sql` |
| 20261028173039 | refonte_register_techno_5e_s02_v2 | `_supabase/14_register_techno_5e_s02_v2.sql` (récupéré hors dépôt) |
| — | *en attente d'accord pour la production* | `_supabase/15_suppression_tables_ancien_site.sql` — testé sur la copie locale et sur le projet de test le 28 octobre |

Les fichiers `0x_verification_*.sql` sont des contrôles exécutés puis annulés (`ROLLBACK`) ; `90_` et `91_` sont des procédures de suspension d'urgence.

Les politiques de la table `profiles` antérieures à la refonte (« Créer son propre profil », « Lire son propre profil », « Modifier son propre profil ») ne figuraient dans aucun fichier : elles sont désormais dans l'instantané.

**Règle à partir de maintenant :** toute modification de la base passe par un nouveau fichier numéroté dans `_supabase/`, appliqué d'abord sur le projet de test, puis l'instantané est régénéré.

## Points relevés lors de l'export (non corrigés, à valider)

- **Tables de l'ancien site, vides et inutilisées** (`course_sessions`, `course_exercises`, `student_work`, `student_results`, `student_hints`, `student_sessions`) et fonction `public.set_updated_at` : suppression validée par le professeur, migration 15 prête (voir ci-dessus).
- La protection contre les mots de passe compromis (HaveIBeenPwned) est désactivée dans Auth : un réglage à activer dans le tableau de bord Supabase.
