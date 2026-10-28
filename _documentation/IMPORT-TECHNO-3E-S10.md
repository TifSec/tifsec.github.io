# Premier import adapté : Technologie 3e, S10

Préparé localement le 20 octobre 2026. Accès privé et correction de S10 non déployés à ce stade.

## Sources examinées

- Archive `techno/3/index.html` : S08 (circulation dans un réseau), objectifs de S09 (routage et dépannage), intégralité de S10 (comptes, hameçonnage, vie privée) et titre de S11 (énergie/information).
- Introductions de Maths Bac Pro 2 et 4e-3e MFR : progression explicite, démarche justifiée, droit à l’erreur et situations concrètes. Ces principes sont repris ; aucune équivalence de programme entre les formations n’est supposée.
- Le professeur situe l’avancement réel de 3e à S09. Cela ne prouve pas l’acquisition des notions réseau : courte réactivation prévue.

## Choix pédagogiques

L’ancienne S10 accumulait onze questions numérotées, deux tableaux à compléter, un problème supplémentaire et plusieurs conclusions à rédiger, en plus de la création/dépôt d’un fichier Writer.

La nouvelle S10 se concentre sur l’accès aux comptes : trois activités, cinq questions, réponses dans le site et un bilan oral. Les étapes sont : distinguer identification/authentification, justifier des protections complémentaires, analyser une demande et proposer une réaction. Deux QCM sont déterministes ; trois réponses restent à examiner. Le prolongement oral est facultatif, sans champ ni point obligatoire.

Le minutage professeur totalise 50 minutes après installation/appel : réactivation 5, lecture 7, activité 1 10, activité 2 15, activité 3 8, bilan/accompagnement 5. Ces temps incluent réflexion et rédaction ; ils restent à ajuster après usage réel. Aucune garantie que tous les élèves finiront n’est annoncée.

Le barème privé totalise 20 points : 2 + 4 + 6 + 2 + 6. Les 16 points des justifications restent manuels, avec critères partiels et pistes de correction ; les 4 points des QCM restent soumis à validation finale.

## Notions déplacées, pas abandonnées

La protection de la vie privée, les traces, la géolocalisation, les autorisations d’applications et les mises à jour ne sont pas évaluées dans cette première séance. Prévoir un second temps obligatoire de 50 minutes (identifiant proposé `S10B`, à confirmer dans la progression) avant de considérer le volet cybersécurité couvert. Il devra travailler données personnelles, traces visibles ou non, choix d’autorisations et protection de l’environnement numérique. Ne pas réduire ces attendus à un prolongement facultatif. S11 reste conservée dans l’archive et n’est pas renumérotée.

## Programme applicable et limites

[Arrêté du 9 février 2024, BO du 29 février](https://www.education.gouv.fr/bo/2024/Hebdo9/MENE2402802A) : entrée en application en 3e à la rentrée 2026-2027.

[Annexe du programme](https://www.education.gouv.fr/sites/default/files/document/Annexe%20%E2%80%94%20Programme%20de%20technologie%20du%20cycle%204-368016.pdf), pages PDF 4-5 : usages et impacts sociétaux du numérique, identification/authentification, protection des données et règles d’usage raisonné. S10 contribue à ces attendus et réactive les bases ; elle ne couvre pas toute la progressivité annuelle, notamment l’argumentaire sur le numérique dans la société et les professions. Ces éléments doivent être répartis dans la progression complète.

Ressources pratiques consultées : [hameçonnage](https://www.cybermalveillance.gouv.fr/tous-nos-contenus/fiches-reflexes/hameconnage-phishing), [double authentification](https://www.cybermalveillance.gouv.fr/tous-nos-contenus/actualites/double-authentification). Situations inventées, aucun vrai secret ou paramétrage de compte demandé.

## Séparation et activation à approuver

Le YAML élève est dans `_data/cours/techno/3e/S10.yml` et réutilise le moteur commun sans nouvelle page de test. La page locale est `/cours/techno/3e/s10/` et S10 figure dans le catalogue local.

Le fichier professeur réel est préparé **hors du dépôt public**, dans `../preparation-privee/techno/3e/S10.v1.yml`. Ne jamais le déplacer dans le dépôt public ni l’inclure dans un test versionné. Il devra être envoyé dans le dépôt GitHub privé existant. Le stockage local est une préparation, pas une distribution au navigateur.

Les catalogues serveur locaux sont prêts pour S10 : chemin privé autorisé et schéma des cinq réponses, sans attendu dans le schéma. Pour rendre le parcours professeur opérationnel, il reste à publier le fichier dans le dépôt privé et déployer les trois fonctions `teacher-course`, `teacher-correction`, `teacher-grade` avec leurs catalogues actualisés, JWT et contrôles existants conservés. Aucune migration, règle RLS, donnée ou secret à changer. Ne pas présenter S10 comme corrigeable en ligne avant cette activation.

L’archive originale contient déjà des notes en commentaires HTML. Elle reste exclue de la construction ; cette nouvelle séparation ne retire pas les anciennes publications de l’historique Git. Aucun historique réécrit.

## Vérifications

- Construction Jekyll stricte réussie ; 305 tests réussis avant le dernier changement de titre, puis contrôles ciblés du dernier ajustement.
- Contrôle du vrai couple YAML en mémoire : cinq questions, correspondance des identifiants/version, préparation de 50 minutes, somme de 20 et propositions correctes pour les deux choix attendus. Aucun contenu privé affiché dans les sorties.
- Contrôleur réutilisable `_checks/check-course-import.mjs` : champs privés interdits dans le contenu public, méthode par activité, barème complet, types reconnus et validation professorale.
- Treize pages, ressources locales, huit clés inchangées de S02 et 374 archives intactes vérifiées.
- Parcours authentifié S10 (sauvegarde/groupe, cours professeur et validation d’une copie) à vérifier après activation ; les tests simulés du système existant ne remplacent pas cette recette.

Aucune publication du site, aucun envoi du nouveau corrigé et aucun déploiement Supabase dans ce lot.
