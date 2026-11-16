# Test en classe — 21 octobre 2026

**S05 remplacée à la demande de l’utilisateur :** la première adaptation provenait d’une archive obsolète. La version désormais publiée reprend « Fonction du second degré – Rechercher un coût minimal », C(x)=5x²−40x+260, depuis le fichier actuel de main (ancien site). Sept parties, 40 consignes d’origine, 34 obligatoires et six facultatives ; 45 champs, dont six cellules du tableau et deux valeurs fournies conservées. Les conseils et commentaires professeur de la source actuelle sont séparés du contenu public. Trois tests de non-régression supplémentaires et les contrôles privés réussissent ; le barème reste sur 20. Aucune copie S05 existante lors du remplacement, aucune migration ni modification des droits. Source pédagogique actuelle enregistrée hors dépôt public ; conversion : `../extraire-s05-actuelle.py` puis `../reprendre-s05-actuelle.mjs` (ne pas réexécuter l’ancien générateur MFR, qui utilisait la S05 obsolète).

Publication remplacée : commit `652156dfa9eacd09fa8852b673dfeba8d8350280`, déploiement Pages `39558444222` réussi. Corrigé privé remplacé au même chemin `maths/term/S05.v1.yml`, commit privé `a4bc6d34c2be3caf937110b3edee321dd79b81a2`. Seuls les schémas de questions S05 ont été actualisés dans teacher-correction v7 et teacher-grade v4 ; autres cours inchangés, JWT conservé, S11/S12 toujours exclus. Paramètre de version ajouté à l’URL de prof-theme.css pour renouveler son cache. Recette connectée finale réussie : titre actuel, premier exercice « Calculer 7²… », 40 questions, 45 champs, corrigé privé chargé, texte des questions rgb(240,241,244) sur fond sombre et effacement avant projection. Aucun enregistrement de note. Suite complète : 405 tests réussis ; audit des 100 fichiers publics réussi.

## Publication effectuée et accès professeur vérifié

L’utilisateur a autorisé le nouveau dépôt dans la connexion GitHub. Les fichiers publics ont été envoyés par cette connexion au seul dépôt `TifSec/tifsec-test-eleves`, commit `bcad4e10a639d16d844067288e20034f7455e119`. L’arbre Git distant correspond exactement au commit local vérifié (`137cf949de09c69d14312c5dde5fdae6a3783c26`). Déploiement Pages réussi : exécution `39547295494`.

Adresse publiée : https://tifsec.github.io/tifsec-test-eleves/ ; connexion sous `/connexion/`. L’utilisateur s’est connecté avec son compte professeur ; la redirection est restée sous le préfixe de test. Les deux cours et leurs notes privées ont été chargés avec succès depuis la vraie interface professeur, sans enregistrer de note. Le changement de matière et le mode projection effacent les notes privées. Les formulaires Maths comportent 34 champs et le cours TIM comprend bien ses 7 zones de texte en plus des cellules de tableau.

Correction de contraste demandée après publication : les titres des questions utilisaient un bleu foncé à l’intérieur des encadrés sombres. `prof-theme.css` utilise désormais `--student-text` pour leurs titres et `--student-link` pour leurs liens, en conservant les couleurs des fiches blanches. Commit de test `3be60f1b1b7555607c2830c8ee481a8d6bf95445` ; 12 tests de thèmes réussis et nouvel audit des 100 fichiers publics réussi. Contrôle visuel final du déploiement de contraste à terminer.

Le test connecté élève de sauvegarde/restauration sur cette nouvelle adresse n’a pas été rejoué : les tests PostgreSQL locaux couvrent les deux nouveaux périmètres. Les comptes et les copies utilisent le projet Supabase existant, pas une base isolée. Aucun fichier de tableur n’est téléversé.

Accord utilisateur : accès de test distinct, ancien site préservé. Dépôt public créé par l’utilisateur : `TifSec/tifsec-test-eleves`. Il déclare avoir activé Pages depuis `main` et `/(root)`. Ne pas confondre cette branche du dépôt de test avec `main` du site d’origine, qui reste intacte.

Deux adaptations à partir des vrais cours archivés :

- TIM CAPa 2 : `_data/cours/tim/cap2/S03.yml`, suivi fictif de maréchalerie, route `/cours/tim/cap2/s03/`.
- Maths Bac Pro 2 : `_data/cours/maths/term/S05.yml`, second degré, route `/cours/maths/term/s05/`.
- Barèmes de 20 points, aides et liens publics ciblés, formulaires et progression enregistrés dans les catalogues existants.
- Pratique réelle dans Calc/Excel ; aucun stockage serveur du fichier .ods/.xlsx. Le site conserve réponses, formules et démarches uniquement.
- Les écritures inconnues des dictionnaires restent à examiner ; le professeur valide la note.

## Raccordement distant approuvé et effectué

L’utilisateur a explicitement approuvé les deux nouveaux cours et leur notation.

- Migration `cours_mfr_cap2_s03_term_s05` appliquée : ajout des deux périmètres précis à la version v1 du déclencheur de nouvelles copies. Aucun changement de droits ni mise à jour des anciennes copies.
- Deux YAML déposés dans le dépôt **privé** `TifSec/tifsec-corriges-prives` : `tim/cap2/S03.v1.yml` et `maths/term/S05.v1.yml`. Commits `b260509bbed5ec1b8d2ffeeccec1ea78097bdec7` et `517790af9f3d361cc3dd2372b8e89ea840a176df`.
- Services protégés actualisés par remplacement des seuls catalogues dans les sources distantes précédentes : teacher-course v4, teacher-correction v6, teacher-grade v3. JWT obligatoire conservé.
- Catalogues distants limités aux trois séances précédemment actives et aux deux nouvelles MFR. **S11/S12 restent exclus**, malgré leur présence dans le catalogue local d’aperçu.
- Affectations professeur cap2/tim et term/maths présentes ; contrôle distant des versions et exclusions réussi.

## Contrôles réussis

402 tests, compilation Jekyll stricte, 18 pages locales et 374 archives intactes. Contrôle de 102 fichiers locaux sans archive/corrigé/secret. Base de test PostgreSQL fictive : versions, sauvegarde, RLS entre élèves, consentement, lecture professeur et notation collective. Vérification privée séparée des réponses reconnues et inconnues, sans affichage des corrigés.

## Préparation locale et historique du blocage initial résolu

Dans le dossier parent du dépôt :

- `publication-build/` : 100 fichiers publics compilés avec `/tifsec-test-eleves`, S11/S12 exclus.
- `publication-test/` : clone du seul dépôt public de test ; fichiers vérifiés, `.nojekyll` et commit local `caa55000cd261dc048e729c8e51790f2ad5eb73b`.
- Parent distant initial du dépôt de test : `c1fc4eb4ce0671dc157e3a588d261f67c293037d` (README utilisateur conservé).
- `config-publication-test.yml`, `preparer-publication-test.mjs` : configuration et copie contrôlée du résultat compilé. L’audit des chemins vérifie explicitement le préfixe.
- `verifier-cours-mfr-prives.mjs` : tests du barème réel hors dépôt public.
- Source auth : redirection adaptée à la racine ou au préfixe via `assets/js/auth/site-path.js` ; deux tests ajoutés.

Envoi Git refusé : les identifiants locaux utilisent un autre compte (`Skvvib-j2s`). Ne pas modifier les identifiants globaux, ni récupérer de jeton dans les fichiers de connexion. L’appel GitHub de création de blob dans le nouveau dépôt est aussi refusé, `Resource not accessible by integration` (403). Les deux dépôts précédents restent accessibles ; le nouveau dépôt nécessite vraisemblablement son ajout à l’installation ChatGPT Codex Connector.

Question utilisateur en cours : lien pour installer/configurer cette application. Lien officiel vérifié : https://github.com/apps/chatgpt-codex-connector ; gestion des installations : https://github.com/settings/installations. Attendre l’action utilisateur avant de réessayer l’écriture.

Après autorisation : envoyer les seuls fichiers publics au dépôt de test via la connexion GitHub, vérifier le déploiement Pages, les deux URL et l’authentification sous le préfixe. URL attendue, **non confirmée en ligne à ce stade** : `https://tifsec.github.io/tifsec-test-eleves/`. Les comptes et données Supabase sont ceux du projet existant, pas une base isolée.
