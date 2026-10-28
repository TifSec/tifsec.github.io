# Publication de test et S06 locale — 21 octobre 2026

## Résultat

Après la préparation locale, l’utilisateur a demandé la publication des modifications sur le site de test. Il a ensuite demandé une nouvelle S06 de Maths Bac Pro 2, puis précisé explicitement de la laisser en local. Cette dernière consigne prévaut.

- Site de test : https://tifsec.github.io/tifsec-test-eleves/
- Commit publié : `32e190a8a95cb864ca749aa945ed68e1626640b5`.
- Déploiement GitHub Pages `39606829362` terminé avec succès.
- 93 séances du lot : 63 MFR et 30 Technologie ; les deux anciens pilotes restent disponibles, soit 95 entrées de catalogue.
- 190 fichiers générés vérifiés et comparés aux objets Git distants avant publication.
- Aucun changement ni fusion sur main du dépôt d’origine ; ancien site conservé.

## Raccordement protégé

Les commentaires professeur des cours convertis restent dans le dépôt privé. Le premier lot privé a été enregistré au commit `887614090918159db2af31960b12ad0932a96a52`. Les catalogues activés excluent Maths terminale S06 et Technologie S11/S12.

Trois services existants ont reçu uniquement les nouveaux catalogues, sans modification de leurs contrôles d’accès : teacher-course v5, teacher-correction v8 et teacher-grade v5 ; vérification JWT conservée. La migration `activate_imported_test_course_versions_without_math_term_s06` étend la liste des versions de nouvelles copies à 95 périmètres. Aucun cours, corrigé ou barème n’est stocké dans la base ; aucune ancienne copie n’est modifiée et les règles RLS restent inchangées.

Le premier lot privé contient l’ancienne conversion de S06, désormais inactive et absente des catalogues distants. **La nouvelle réécriture de S06 n’a pas été envoyée.** Son envoi a été refusé, puis l’utilisateur a confirmé de la garder locale. Ne pas tenter de la publier sans nouvelle demande explicite.

## S06 classique, uniquement locale

Adresse : http://127.0.0.1:4000/cours/maths/term/s06/

La séance reprend le modèle de S05 : C(x) = 5(x − 4)² + 180. Déroulement de 55 minutes : automatismes, rappel sur les images et la symétrie, lecture d’une vraie parabole, exemple résolu, équations, budget et exercice de transfert. Elle comporte 17 questions et un barème privé proposé sur 20. Les réponses expliquées restent à lire par le professeur ; seules les cinq réponses numériques simples sont déterministes.

Fichiers élève et route : `_data/cours/maths/term/S06.yml`, `cours/maths/term/s06/index.html`. Corrigé et conduite : `../preparation-privee/maths/term/S06.v1.yml`, hors du dépôt public. Le graphique est `assets/images/cours/maths-term-s06-parabole.svg`.

La route, le graphique et le catalogue S06 sont exclus du lot de test par `../config-publication-test.yml`. La route locale porte `saving_enabled: false` : cet aperçu ne crée pas de copie dans la base partagée. Le corrigé n’est pas chargeable par les services distants ; son fichier local est disponible pour relecture.

Les anciennes versions de préparation sont sauvegardées dans le dossier parent. Ne pas relancer les générateurs génériques d’import sur S06 : ils rétabliraient la conversion précédente. `reprendre-s06-classique.mjs` est le générateur spécifique de cette réécriture.

## Optimisations

Le retour sur un onglet peut provoquer un nouvel événement SIGNED_IN pour le même compte. Le filtre commun conserve les changements de compte, la déconnexion, le renouvellement du jeton et les mises à jour utilisateur, et ignore seulement les répétitions du même SIGNED_IN. Il évite ainsi la reconstruction de tous les composants au retour sur l’onglet.

L’aperçu professeur conserve en mémoire au plus six HTML publics pendant cinq minutes. Chaque affichage reconstruit la vue et efface les champs ; aucune copie, réponse ou annotation privée n’est conservée dans ce cache. Les contrôles Auth/profil restent frais ; les fichiers privés sont toujours demandés au service protégé.

Le thème ne se recharge plus à chaque changement de visibilité. Le tableau de bord élève limite ses actualisations automatiques au retour sur la page à une minute ; le bouton Actualiser reste disponible immédiatement. Enfin, le catalogue annuel inutile a été retiré des pages de cours. Le lot de fichiers modifiés passe d’environ 5,95 Mo à 3,86 Mo, sans prétendre à une mesure du temps de chargement sur le réseau des établissements.

## Contrôles

- 409 tests réussis, aucun échec, après compilation locale.
- Compilation Jekyll stricte réussie ; audit des 190 fichiers publics réussi.
- Catalogue en ligne vérifié : 95 entrées, dont 63 MFR.
- Présence en ligne du filtre des événements, du cache public et des pages allégées vérifiée.
- S06 locale vérifiée par HTTP : réponse 200, nouveau titre et graphique présents. S06 distante : 404.
- Accès sans connexion aux trois services protégés : refus 401.
- Vérification SQL : nouvelles séances reconnues, S06 exclue.

La recette connectée de chaque nouvelle séance et des 90 nouveaux périmètres n’a pas été rejouée avec de vrais comptes. Aucune nouvelle note ou réponse d’élève n’a été écrite pendant ces contrôles.

## Limites et suite

Le reste du lot conserve principalement les anciens cours. Leurs barèmes restent des propositions à relire, et leur conversion ne garantit pas une durée de 50 minutes. Le contrôle de fidélité antérieur portait sur les textes et liens, pas sur l’ensemble des interactions JavaScript. En particulier, la manipulation interactive de tangente de l’ancienne S09 de Maths terminale reste à rétablir dans le moteur : le script d’origine n’est pas réinjecté dans les YAML. Cette relecture des supports reste nécessaire avant de considérer tous les cours comme prêts pour une diffusion générale.

Pour revoir les nouveautés dans un navigateur ayant déjà ouvert le site, une actualisation complète peut être nécessaire. L’ancien site reste disponible pour le contenu non encore adapté.
