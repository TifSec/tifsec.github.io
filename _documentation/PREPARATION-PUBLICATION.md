# Nettoyage et préparation de publication

20 octobre 2026. Branche de travail : `refonte-jekyll`. Aucune publication, fusion vers `main`, modification distante de Supabase ou suppression de données dans ce lot.

## Nettoyage vérifié

- Regroupement de la règle de curseur du bouton de déconnexion professeur avec son style existant.
- Retrait des règles de thème dupliquées ou remplacées par les règles finales : filtre actif, lien de séance, couleur des métadonnées et fond du prochain cours. Conservation des règles finales de contraste et des particularités des thèmes.
- Suppression des anciens ordres mobiles appliqués aux sections désormais contenues dans les cartes, et d'une déclaration de marge intérieure identique à la valeur de base. Les cartes conservent leur propre disposition mobile.
- Exclusion du fichier de configuration VSCode du site généré ; fichier de travail conservé.
- Conservation des archives, des variantes de séances utilisées par les copies existantes, des composants de sécurité et des outils de vérification. Aucun fichier n'est supprimé au seul motif qu'il n'est pas accessible depuis l'accueil.

Cette passe cible les styles remaniés et le résultat de la génération ; elle ne garantit pas l'absence de toute ligne inutilisée dans chaque fonctionnalité. Les noms de classes produits par JavaScript et les chemins construits dynamiquement demandent une vérification avant toute suppression.

## Performances

Les optimisations de connexion, de chargement parallèle et de dépendances sont décrites dans [PERFORMANCES-CHARGEMENT.md](PERFORMANCES-CHARGEMENT.md). Les vérifications d'identité et les contrôles de copie ne sont pas supprimés pour gagner du temps.

Nouvelles mesures locales, trois transferts publics sans session par page :

| Page | Temps mesurés | Taille HTML |
| --- | --- | --- |
| `/prof/` | 40, 22, 26 ms | 7 904 octets |
| `/prof/cours/` | 15, 36, 31 ms | 8 847 octets |
| `/eleve/` | 16, 25, 16 ms | 20 961 octets |

Ces mesures portent sur le transfert HTML local, pas sur le rendu complet, les appels authentifiés ou l'hébergement GitHub Pages. Le nettoyage CSS améliore principalement la lisibilité et la maintenance ; aucun gain global chiffré n'est annoncé.

## Contrôles effectués

- Construction Jekyll stricte réussie.
- 384 tests réussis, aucun échec.
- 14 pages, ressources et imports vérifiés ; 374 archives intactes.
- Contrôle de publication sur les 93 fichiers générés : liens locaux et fragments, imports JavaScript et ressources CSS, identifiants HTML, exclusions et motifs connus de secrets.
- Fichiers de préparation, archives, SQL, configuration VSCode et outils de vérification absents du site généré.

Le contrôleur `_checks/check-publication.mjs` fonctionne hors ligne sur `_site`. Il ne vérifie pas les liens externes et ne remplace pas un audit de sécurité complet. Les essais connectés et leurs limites figurent dans [RECETTE-SUIVI-20-OCTOBRE.md](RECETTE-SUIVI-20-OCTOBRE.md).

## Avant publication, sur accord du professeur

1. Fournir puis adapter les cours retenus, juste avant publication comme convenu : contenu élève public, préparation/corrigé/barème sur 20 dans le dépôt privé, rattachement des questions aux compétences. Tester chaque ensemble.
2. Refaire la construction stricte, les tests et le contrôle de publication après ces imports. Vérifier le rendu des cours, les thèmes clairs/sombres et le parcours mobile si leur présentation change.
3. Examiner les différences et les fichiers à versionner. Préserver les archives et ne pas ajouter de secrets ni de nouveaux corrigés au dépôt public. Les archives historiques contiennent déjà d'anciens éléments professeur : leur exclusion de Jekyll ne rend ni les sources GitHub ni leur historique privés. Aucune réécriture d'historique n'est réalisée automatiquement.
4. Avant activation publique, vérifier la configuration GitHub Pages, les URL de connexion et redirection Supabase pour l'adresse publique, puis présenter le résultat et demander l'accord de publication. Aucune migration à réappliquer dans cette procédure.
5. Après publication autorisée, vérifier connexion, restauration d'une copie de test, accès professeur et refus d'accès privé côté élève. Ne pas modifier les copies réelles pour ces essais.

## Retour arrière

Avant le déploiement autorisé, relever la révision effectivement publiée et conserver la version précédente des réglages modifiés. En cas de problème, republier cette révision avec le même mécanisme de déploiement, après accord du professeur, puis vérifier la connexion et la lecture des copies. Un retour du site n'implique aucune suppression ou restauration automatique de la base. Si une future évolution de schéma est nécessaire, prévoir sa compatibilité et son retour arrière séparément avant application.
