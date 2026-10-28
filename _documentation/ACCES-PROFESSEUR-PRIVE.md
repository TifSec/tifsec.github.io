# Accès aux cours professeur — décision et mise en service

19 octobre 2026. Dépôt privé accessible et passerelle déployée avec authentification obligatoire, appels anonymes/faux jetons refusés en HTTP 401. L’utilisateur indique le secret GitHub enregistré ; le bouton est activé localement pour la recette authentifiée, encore à confirmer selon [le guide de mise en service](../_supabase/functions/teacher-course/README.md). La requête préalable du navigateur est autorisée (OPTIONS 204). Ce document ne contient aucun secret ni corrigé.

## Parcours quotidien retenu

Le professeur se connecte à son espace habituel, choisit matière, classe et séance, puis ouvre le cours professeur. La même session Supabase autorise la demande. Aucune connexion GitHub supplémentaire n’est demandée pendant le cours.

Le parcours élève et la version projetable restent exempts de corrigés. Le mode professeur doit être explicite pour éviter de projeter des réponses involontairement. À la déconnexion ou au changement de compte, retirer les contenus privés de l’affichage ; ne pas les conserver dans le stockage local du navigateur.

## Répartition des responsabilités

- GitHub public : moteur, contenus élèves et catalogue public.
- GitHub privé distinct, sans Pages : YAML professeur, associés à l’identifiant et à la version du cours.
- Fonction Supabase : vérifier la session, le rôle actuel dans `profiles` et l’affectation à l’établissement, la classe et la matière ; charger ensuite seulement le fichier autorisé depuis GitHub.
- PostgreSQL et Storage : aucun cours ni corrigé. Le contenu privé transite uniquement en mémoire de la fonction et dans la réponse autorisée au professeur.

Le jeton GitHub reste un secret serveur, limité à la lecture des contenus du seul dépôt privé concerné. Ne jamais le mettre dans le dépôt public, le JavaScript, les documents ou la conversation. Une éventuelle configuration manuelle se fera directement dans les interfaces sécurisées des fournisseurs.

## Étapes avant activation

1. Vérifier les ressources disponibles et les quotas applicables ; ne souscrire aucun service payant sans accord.
2. Préparer la passerelle et ses tests localement, avec des données fictives. Résoudre les chemins depuis un catalogue contrôlé ; ne pas accepter de chemin ou d’URL arbitraire fourni par le navigateur.
3. Configurer le dépôt privé et le secret de lecture. Vérifier que le dépôt est effectivement privé ; refuser le chargement s’il ne l’est pas.
4. Relier la vue professeur à la session existante. Refuser l’accès si l’authentification, le rôle, l’affectation ou la version du fichier ne peuvent pas être confirmés. Ne pas utiliser les métadonnées modifiables par l’utilisateur comme autorisation.
5. Présenter les tests et le résultat avant publication. Importer un vrai corrigé seulement après vérification de la confidentialité du circuit complet.

## Critères d’acceptation

- Visiteur, élève, session expirée et professeur hors affectation : aucun contenu privé renvoyé ; aucun appel GitHub avant autorisation.
- Professeur affecté : accès par sa session habituelle, au bon fichier et à la bonne version uniquement.
- Dépôt devenu public, secret absent/révoqué, fichier absent ou service indisponible : message compréhensible, sans fuite du secret ni du contenu, cours élève toujours utilisable.
- Aucun vrai corrigé dans la sortie Jekyll, les ressources publiques, les journaux, le stockage local ou un cache partagé. Réponses privées avec interdiction de mise en cache.
- Déconnexion/changement de compte pendant un chargement : annuler ou ignorer la réponse pour ne pas réafficher le contenu privé.
- Fichier YAML invalide ou contenu inattendu : refus contrôlé ; aucun HTML ou script libre exécuté.

La correction automatique, les retours formatifs aux élèves et la validation des notes sont des étapes ultérieures. Un accès au cours professeur ne doit pas devenir une API de téléchargement des corrigés pour les élèves.
