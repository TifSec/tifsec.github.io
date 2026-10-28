# Chargements : mesures et optimisations

20 octobre 2026, après signalement de lenteurs par le professeur. Changements locaux uniquement : aucune nouvelle migration, aucun changement des règles RLS, aucun service distant remplacé et aucune publication du site public.

## Constat mesuré

Trois requêtes par ressource avec Node depuis ce poste, sans connexion, sans jeton de session et sans lecture de copies :

| Ressource | Avant | Après |
| --- | --- | --- |
| `/prof/` | 41, 9, 15 ms | 41, 10, 31 ms |
| `/prof/cours/` | 29, 31, 36 ms | 15, 32, 30 ms |
| SDK Supabase sur CDN | 80, 20, 30 ms | 80, 26, 27 ms (comparaison) |
| Même SDK servi localement | — | 34, 29, 31 ms |
| Auth `/health`, sans clé, refus 401 | 91, 57, 50 ms | 92, 60, 73 ms |

Les pages HTML sont petites et le serveur local répond vite. Ces mesures ne prouvent pas une lenteur globale du site ni un gain authentifié : elles mesurent les transferts de ressources seulement. Le refus public `/health` donne un ordre de grandeur de trajet réseau, pas le temps d’une authentification complète. Script reproductible : `_checks/measure-loading.mjs`.

L’audit du code identifie cependant des attentes évitables : le bandeau et les fonctionnalités déclenchent séparément `checkSession`, donc chacun lance `getUser` puis une lecture du profil ; le cours professeur attendait l’aperçu public avant de commencer la demande privée. Les contrôles successifs nécessaires aux copies restent conservés.

## Changements effectués

1. **Regroupement des contrôles simultanés.** Pendant une vérification en cours, les autres composants partagent sa promesse. Le résultat n’est pas conservé après réponse : le contrôle suivant relit Auth et le rôle actuel. Déconnexion, connexion, renouvellement ou modification du compte invalident immédiatement le contrôle en cours. Le callback reste synchrone et ne lance aucune requête.
2. **Chargement parallèle du cours professeur.** Après vérification de l’accès, l’aperçu public et les notes privées commencent ensemble. Les contrôles serveur, les règles d’effacement et l’annulation lors d’un changement de compte/classe demeurent en place.
3. **Bibliothèque Supabase locale, version figée.** Le CDN non figé servait la version 2.118.0 au moment des mesures. Copie exacte de cette même version, sans modification, avec licence MIT et empreinte d’intégrité, désormais servie avec le site et préchargée. Cela évite une dépendance à un hôte externe pour démarrer les pages et ne constitue pas une mise à jour du SDK. Provenance : [SUPABASE-JS-LOCAL.md](SUPABASE-JS-LOCAL.md).
4. **Préparation réseau.** Préconnexion au domaine Supabase et préchargement du module de session dans les pages qui l’utilisent.
5. **Cache de l’aperçu public.** `no-cache` permet au navigateur de revalider une copie publique existante, au lieu d’interdire tout stockage avec `no-store`. Les corrigés et propositions privés restent sans cache. Aucun profil stocké dans le navigateur par ces changements.

## Résultats et limites

280 tests réussis, construction stricte réussie, 11 pages vérifiées et 374 archives intactes. Un test avec quatre composants concurrents confirme une seule requête Auth et une seule lecture de profil au lieu d’un couple par composant. D’autres tests vérifient le rôle relu au contrôle suivant, la panne puis la nouvelle tentative et l’invalidation au changement de connexion. Test dédié du parallélisme public/privé et contrôle des empreintes du SDK généré.

Page de connexion ouverte en navigateur local sans session : ressource locale et intégrité présentes, formulaire utilisable, aucun message d’erreur de script capturé. L’inventaire du navigateur ne contenait pas la session connectée du professeur. Aucun mot de passe ou jeton n’a été récupéré. L’API de diagnostic du navigateur ne fournissant pas les entrées Performance, aucun temps de rendu navigateur n’est annoncé.

Le gain sur le parcours professeur authentifié reste à confirmer par l’utilisateur après Ctrl+F5. Les appels vers Supabase et GitHub restent distants, notamment l’accès privé, la correction et la validation. Ne pas annoncer un pourcentage d’accélération global à partir des seules mesures statiques. Si une étape demeure lente, mesurer spécifiquement cette action authentifiée avant un éventuel lot serveur ; ne pas supprimer des contrôles de sécurité ni conserver les profils/corrigés pour masquer le problème.
