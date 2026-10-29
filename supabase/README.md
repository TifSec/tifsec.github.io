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
| 20261028202050 | suppression_tables_ancien_site | `_supabase/15_suppression_tables_ancien_site.sql` (testé en local et sur le projet de test, appliqué avec l'accord du professeur) |
| — | xp_et_themes | `_supabase/16_xp_et_themes.sql` : XP des élèves et thèmes à débloquer. **Appliqué sur le projet de test uniquement (29 octobre 2026)** ; à appliquer en production à la mise en ligne. |

Les fichiers `0x_verification_*.sql` sont des contrôles exécutés puis annulés (`ROLLBACK`) ; `90_` et `91_` sont des procédures de suspension d'urgence.

Les politiques de la table `profiles` antérieures à la refonte (« Créer son propre profil », « Lire son propre profil », « Modifier son propre profil ») ne figuraient dans aucun fichier : elles sont désormais dans l'instantané.

**Règle à partir de maintenant :** toute modification de la base passe par un nouveau fichier numéroté dans `_supabase/`, appliqué d'abord sur le projet de test, puis l'instantané est régénéré.

## État après le 28 octobre 2026

- L'instantané `schema-2026-10-28.sql` décrit la base **avant** la migration 15 : les six tables de l'ancien site et `public.set_updated_at` y figurent encore, mais ont été supprimées depuis (7 tables restantes).
- Mots de passe : longueur minimale et exigences renforcées dans Auth par le professeur. La protection contre les mots de passe compromis (HaveIBeenPwned) n'est disponible qu'avec l'offre Pro : volontairement non activée (seul avertissement Supabase restant).
