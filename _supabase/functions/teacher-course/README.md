# Passerelle des cours professeur

**Recette professeur confirmée par l’utilisateur le 19 octobre 2026 :** le bouton « Charger les notes privées » affiche le fichier de vérification depuis le dépôt privé avec sa connexion professeur habituelle. Le circuit session Supabase → contrôle serveur → lecture GitHub privé → affichage fonctionne. Aucun jeton n’a été transmis dans la conversation. Les refus anonymes/faux jetons sont vérifiés sur le service déployé ; le refus avec un vrai compte élève reste à confirmer en situation réelle (tests locaux réussis).

Passerelle **déployée le 19 octobre 2026**, version 1, avec `verify_jwt=true`. Les appels anonymes et avec faux jeton sont refusés en HTTP 401 par la plateforme. L’utilisateur indique avoir enregistré le secret GitHub. Le drapeau du site est désormais activé **localement pour la recette** ; la réussite du chargement avec un vrai compte professeur reste à confirmer. La requête navigateur préalable OPTIONS renvoie 204 avec l’origine locale et les en-têtes autorisés. Aucun corrigé réel dans ce répertoire. Aucun changement des tables ou des politiques RLS.

## Configuration initiale nécessaire

1. Dépôt créé et confirmé privé/accesssible : `TifSec/tifsec-corriges-prives`, identifiant GitHub `1425875621`, branche par défaut `main` (du dépôt privé uniquement). Le connecteur a été autorisé par l’utilisateur.
2. Créer un accès GitHub limité au seul dépôt choisi, permission **Contents: read-only** (Metadata est normalement associé). Le jeton reste chez les fournisseurs : ne pas le coller dans la conversation ni dans un fichier public.
3. Dans les secrets des Edge Functions Supabase, **seul `COURSES_GITHUB_TOKEN` est à renseigner pour ce raccordement**. Les autres valeurs publiques sont déjà définies dans `deployment-config.mjs` ; elles restent surchargeables par environnement. Le jeton se saisit directement dans l’interface sécurisée. Les quotas inclus sont documentés par Supabase mais le plan et la consommation réels ne sont pas accessibles par les outils connectés ; les vérifier avant activation régulière. Aucun abonnement supplémentaire créé.
4. Fichier fictif de vérification créé et relu dans le dépôt privé : `techno/3e/S02.v1.yml`, commit `03f044fe2da7692aa839e8dca0d51c38131f3b54`. Il ne contient aucun corrigé pédagogique. Vérifier le circuit complet avant tout import réel.
5. Déploiement réalisé : fonction `teacher-course`, identifiant `a2d41f8a-61fc-4df8-8f7c-dc4d0598fbb2`, version 1, avec **verify_jwt=true**, `index.ts` et ses quatre dépendances locales. Après saisie du secret, tester les accès réels avec les comptes professeur et élève. La réussite de cette recette authentifiée n’est pas encore confirmée.
6. `private_teacher_courses` est activé localement pour permettre la recette sur `/prof/cours/`. 21 tests des composants concernés et de la sortie Jekyll réussis après activation ; construction stricte et contrôle des 11 pages/374 archives réussis. Dans le navigateur de contrôle sans session, la page refuse l’accès et propose la connexion. Faire le test avec le compte professeur, puis le compte élève, avant toute publication du site.

| Variable serveur | Valeur attendue |
| --- | --- |
| `COURSES_GITHUB_TOKEN` | Jeton de lecture limité au dépôt privé ; valeur confidentielle. |
| `COURSES_GITHUB_OWNER` | Propriétaire du dépôt, par exemple `TifSec`. |
| `COURSES_GITHUB_REPO` | Nom du dépôt, sans propriétaire. |
| `COURSES_GITHUB_REF` | Branche choisie ou référence Git contrôlée, par exemple `main` dans le dépôt privé uniquement. |
| `COURSES_ALLOWED_ORIGINS` | Origines exactes séparées par des virgules : `http://127.0.0.1:4000,https://tifsec.github.io` ; ajouter `http://localhost:4000` seulement si utilisé. |
| `COURSES_SUPABASE_PUBLISHABLE_KEY` | Clé publique du projet ; sinon utilisation de `SUPABASE_ANON_KEY` injectée par la plateforme. Aucune clé service_role nécessaire. |

`SUPABASE_URL` est injectée par Supabase. Le client côté serveur transmet le JWT de l’appelant à Auth et aux lectures REST ; il ne contourne pas les RLS.

## Contrat actuel

POST avec seulement `etablissement`, `matiere`, `classe`, `seance`, `version`. Le catalogue serveur autorise pour le moment uniquement le pilote : `college / techno / 3e / S02 / v1`, fichier `techno/3e/S02.v1.yml`. Une URL ou un chemin fourni par le navigateur est refusé. Étendre le catalogue serveur explicitement lors des prochains imports.

Le YAML doit porter `seance: S02`, `version_cours: v1`, une section `preparation` et une liste `correction`. L’identité et la version doivent correspondre à la demande. Ne pas remplacer silencieusement des attendus ou un barème d’une version déjà évaluée : créer une nouvelle version et conserver l’ancienne.

La fonction contrôle dans cet ordre : identité Auth, rôle actuel dans `profiles`, affectation dans `teacher_class_assignments`, configuration serveur, caractère privé du dépôt, fichier autorisé, validité du YAML. Les erreurs sont génériques et ne sont pas journalisées avec leur contenu distant. Les réponses interdisent la mise en cache ; aucune copie PostgreSQL/Storage n’est créée.

Le parseur YAML est épinglé à `2.9.1`, également utilisé dans les tests locaux avec un fichier de verrouillage. Tags inconnus, doublons, alias, structures excessivement profondes et clés dangereuses sont refusés. La vue rend les valeurs privées en texte, jamais en HTML libre.

La limitation de taille et le délai de requête protègent le chargement ; aucune limitation distribuée du nombre d’appels n’est encore ajoutée. Le service est réservé au professeur. Une future API de vérification élève nécessitera son propre contrôle des tentatives et ne devra pas renvoyer ce YAML.

## Références vérifiées

- [Authentification des fonctions Supabase](https://supabase.com/docs/guides/functions/auth).
- [Secrets serveur Supabase](https://supabase.com/docs/guides/functions/secrets).
- [Lecture des fichiers GitHub](https://docs.github.com/en/rest/repos/contents#get-repository-content).
- [Version du parseur YAML](https://github.com/eemeli/yaml/releases/tag/v2.9.1).
