# Recette du suivi élève — 20 octobre 2026

## Vérifications en navigateur avec comptes connectés par le professeur

- Accueil élève : profil validé, établissement/classe corrects, bandeau limité à Technologie.
- Quatre cartes ouvertes au clic, bouton chevron de fermeture opérationnel.
- Comprendre et progresser : résultat de groupe 50 %, deux segments remplis sur quatre ; volet détaillé indiquant 10/20 sur trois questions et deux questions à relire. Résultat inconnu distingué d’un zéro.
- Lien vers activité : ouverture de la copie collective S02 correspondante, réponses restaurées et champs désactivés ; note validée 10/20 et points par réponse visibles. Aucune réponse modifiée.
- Mes séances : S10R déclarée terminée mais encore modifiable. S11 annoncée indisponible et non cliquable.
- Filtre Retours et notes : une copie collective corrigée retrouvée dans les anciens travaux ; lien vers la bonne copie.
- Bouton du suivi vers tous les retours : ouvre la carte des séances, applique le filtre et place le focus sur son titre.
- Petit écran de 390 × 844 : graphe lisible, panneau défilant, aucun débordement horizontal mesuré ; viewport rétabli ensuite.
- Après connexion professeur : accès à l’accueil, curseur pointer effectivement constaté sur Déconnexion, accès à la même copie S02 avec note 10/20 et état verrouillé. Aucune réouverture ou validation déclenchée sur une copie réelle.

Captures locales hors dépôt public : ../recette-suivi-mobile.jpg et ../recette-suivi-desktop.jpg. Elles montrent seulement le compte de test et son suivi.

## Nouvelle recette automatisée intégrée

_checks/competency-lifecycle.test.mjs traverse les fonctions PostgreSQL réelles de la refonte sur base PGlite fictive, les RLS, dashboardModel, les vrais catalogue/référentiel/correspondances générés, puis le calcul du graphe.

Scénarios : absence de résultat avant validation ; 10/20 donne 50 % ; autre élève sans accès ; réouverture retire le résultat et permet de compléter ; nouvelle correction 17/20 donne 85 % sans moyenne de l’ancien historique ; invité sans consentement ne voit pas le groupe ; après acceptation les deux élèves retrouvent le même résultat collectif sans résultat individuel inventé.

Bilan : 379 tests réussis. Compilation stricte et intégrité vérifiées : 14 pages, 374 archives intactes. Aucun nouvel écran de test publié ; tests dans le répertoire exclu _checks.

## Contrôle distant en lecture seule

5 copies, 53 réponses, 1 évaluation au moment du contrôle. Zéro référence courante incohérente, zéro total incohérent et zéro destinataire de note collective sans consentement. Les comptes ont été connectés par l’utilisateur ; aucune récupération de mot de passe ou de jeton. Aucun cours/corrigé transféré en base et aucune nouvelle écriture de copie, réponse ou note par l’agent.

## Limites et suite

Cette recette valide les parcours lus ci-dessus, pas tous les postes de l’établissement. Une nouvelle saisie et sa restauration sur deux ordinateurs physiques restent à vérifier avant diffusion ; elles ont des tests automatiques, mais n’ont pas été rejouées sur des copies réelles dans ce lot. MFR : correspondances par question à compléter au moment de l’import. Ne pas importer de nouveaux cours maintenant. Aucun déploiement ou fusion main.

## Complément professeur confirmé

Préparer la correction sur la copie existante : aide placée sous les questions, partie vérifiée automatiquement et questions manuelles, message explicite Aucune note enregistrée. Pas de clic sur validation, réouverture ou enregistrement de commentaire.

Cours professeur S02 : accès protégé confirmé avec le compte professeur, affichage de la version accompagnée des conseils/corrigés ; notes privées visibles uniquement après action dédiée. Masquer et effacer les notes privées utilisé ensuite : état masqué confirmé. Aucun texte de corrigé privé recopié dans ce rapport ou une capture.

Contrôle distant final : toujours 5 copies, 53 réponses et 1 évaluation. Une seule copie avec correction courante. Aucun nouveau résultat enregistré par la recette navigateur. Aucun changement de code de production dans ce lot : ajout d’un test intégré et documentation de recette seulement.
