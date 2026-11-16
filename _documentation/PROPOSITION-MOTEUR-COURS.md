# Proposition concrète du moteur de cours

19 octobre 2026 — proposition initiale, suivie d’une réalisation décrite dans `REALISATION-LOT-1.md`. Le dépôt privé est créé et la passerelle déployée avec authentification obligatoire ; son secret de lecture et sa recette authentifiée restent à terminer. Aucun changement du site public en production ni des tables Supabase.

## Ce qui existe réellement

Lecture de cinq pages d’archives, sans les modifier :

| Source | Sections de séances repérées hors commentaires | Constats |
| --- | ---: | --- |
| Maths Bac Pro 2 | 6 | Objectifs, reprise progressive, continuité entre séances, situations professionnelles/TIM, notes de conduite professeur. Le HTML ne comporte pas de champs de réponse dans les sections inspectées. |
| Maths 4e/3e MFR | 8 | Progression latérale, saisie, retours automatiques ; format à prendre comme référence d’usage, sans recopier son volume de questions. |
| Technologie 5e | 53 | Longue progression à revoir selon la classe réelle et le temps disponible. |
| Technologie 4e | 51 | Même nécessité de sélectionner et répartir le socle obligatoire. |
| Technologie 3e | 50 | S02 correspond au thème du pilote Jekyll actuel ; ses identifiants de réponse doivent être conservés. |

Ces nombres sont un inventaire du HTML, pas un nombre de cours validés ou un diagnostic complet de conformité. La détection ignore les sections commentées ; elle ne rend pas les séances générées dynamiquement par JavaScript. Les champs de réponse ne mesurent pas à eux seuls la charge pédagogique. Le détail reproductible est dans `inventaire-contenus.json`, produit par `node _checks/audit-cours.mjs --write`.

La première séance Maths MFR comporte 47 champs HTML ; les deuxième et troisième, respectivement 69 et 70. Il faudra choisir le socle et les prolongements plutôt qu’utiliser ces volumes comme norme. Bac Pro 2 propose déjà un diagnostic progressif sur les séances 1 et 2 et une continuité explicite pour les suivantes. C’est la démarche pédagogique que l’on réutilisera.

### Séparation des contenus à corriger

La page Maths MFR contient 145 attributs `data-answer` et 77 blocs de commentaire commençant par `PROF` ; celle de Bac Pro 2 en contient 43. Des notes professeur existent aussi dans les autres sources. Les comptages ne détectent pas tous les corrigés et ne prouvent pas leur absence ailleurs.

Les commentaires HTML et attributs de réponse sont consultables par les visiteurs si la page est publiée. Ne pas recopier ces éléments dans les futurs fichiers publics. L’exclusion actuelle des archives de `_site` ne retire pas leur contenu de Git ni de l’ancien site. Aucun historique ne sera réécrit sans accord. L’inventaire créé ici ne reproduit aucune réponse attendue.

## Quatre éléments, un seul moteur

1. **Catalogue pédagogique** : établissement, matière, classe, séance, ordre annuel, version et chemin du contenu. Prolonger `_data/seances.yml` ; ne pas dupliquer ces identités dans toutes les pages.
2. **YAML élève** : uniquement le contenu nécessaire à apprendre et à répondre. Une séance = un fichier, sans JavaScript ni blocs HTML libres.
3. **YAML professeur privé** : réponses attendues, explications, conduite, barème obligatoire sur 20 réparti par question et critères de points partiels ; associé à une identité et une version de séance. Préparer le barème dès la génération ou l’adaptation du cours et contrôler que les questions obligatoires totalisent 20 points, sans exiger les prolongements facultatifs. Voir [BAREME-ET-GENERATION.md](BAREME-ET-GENERATION.md). Aucun fichier réel de ce type dans le dépôt public.
4. **Présentation commune** : composants existants enrichis, progression à gauche et contenu au centre. Le tableau de bord annuel élève reste une page distincte, avec ses statistiques personnelles et son bandeau.

Les exemples joints sont fictifs et exclus de la construction Jekyll : `cours-eleve.exemple.yml`, `cours-prof.exemple.yml`. Le second est un exemple de structure sans corrigé réel ; son emplacement ne doit jamais être repris pour stocker de véritables corrigés.

### Contenu élève proposé

- Titre, thème, pourquoi l’étudier et application concrète.
- Connaissances/compétences visées, prérequis et lien avec la séance précédente.
- Activités : identifiant, titre, raison de l’activité, démarche, consigne et questions.
- Questions : identifiant stable, type, énoncé, données et choix publics, unité éventuelle, aide accessible ; jamais de réponse attendue confidentielle.
- Socle obligatoire et prolongements facultatifs clairement distingués ; seuls les champs obligatoires entrent dans l’avancement obligatoire.
- Synthèse « À retenir » et court bilan personnel, distinct d’une évaluation de maîtrise.

Conserver les types actuels `texte` et `tableau` ; ajouter ensuite `nombre` et `qcm` en réutilisant le mécanisme de sauvegarde. Les durées de planification, références précises au programme et observations sur ce qui a réellement été fait appartiennent à la préparation professeur, sans transformer une durée indicative en chronomètre imposé aux élèves.

### Compatibilité avec les copies existantes

Ne pas changer les sept clés de réponse de S02 : le tableau `a01/q01` utilise les coordonnées de cellule et la réponse libre utilise `a01_q02`. Ne pas déplacer les lignes/colonnes déjà répondues sans migration/version explicite. Pour les futurs tableaux, prévoir des identifiants stables par ligne et colonne plutôt que dépendre de leur position.

Une simple amélioration d’explication peut conserver les identifiants si le sens des questions reste inchangé. Une modification d’attendu ou de barème doit être versionnée ; aucune ancienne note ou réponse ne doit être réinterprétée silencieusement. Le détail de conservation des versions sera arrêté avant le premier import évalué.

## Vérification, corrigés et notation

Le moteur distingue : avancement de saisie, vérification d’une réponse, remise du travail et validation de la note. Ne pas annoncer « maîtrisé » à partir d’un champ rempli, ni « note validée » à partir d’un calcul local.

Deux usages du vérificateur sont nécessaires : aide formative pendant le travail lorsqu’elle est autorisée, et correction après remise. Le barème et les attendus privés alimentent la correction de confiance ; la proposition automatique reste distincte de la décision professeur. Les réponses ouvertes restent à examiner manuellement.

Une vérification confidentielle ne peut pas être uniquement réalisée dans le JavaScript public. Le futur accès privé doit vérifier l’utilisateur Supabase et son autorisation réelle côté serveur, empêcher la lecture élève des fichiers professeur et le cache partagé, puis ne délivrer que le contenu autorisé. Un enseignant ne doit pas transmettre par erreur un corrigé dans le HTML élève ou un bundle JavaScript.

### Stockage privé : principe validé, activation à préparer

Les contraintes excluent un corrigé dans GitHub public, GitHub Pages et dans la base Supabase. L’utilisateur a précisé ne disposer que de GitHub et Supabase. Le 19 octobre 2026, il valide le principe suivant : conserver les YAML professeur dans un **dépôt GitHub privé distinct**, sans GitHub Pages, et les lire par une **Edge Function Supabase** après contrôle du compte professeur et de ses affectations. Sa connexion habituelle à l’espace professeur doit suffire ; aucune seconde connexion GitHub ne doit être nécessaire pour consulter un cours. Le dépôt et le secret serveur demanderont une configuration initiale ; cet accord ne signifie pas que l’accès est déjà activé.

Cet usage étend Supabase à une passerelle de contrôle d’accès : les fichiers restent sur GitHub privé, mais leur contenu transite dans la mémoire de la fonction. Aucune copie dans PostgreSQL, Storage, journaux ou code déployé. Les réponses et corrigés ne doivent pas être journalisés. Cette extension pour l’accès protégé est validée ; la correction automatique reste un lot ultérieur à concevoir et tester.

Le navigateur ne recevra jamais le jeton GitHub : celui-ci sera un secret serveur, limité à la lecture du seul dépôt privé concerné. La fonction vérifiera l’identité et le profil/les affectations actuels ; un jeton de connexion valide ne suffit pas à prouver le rôle professeur. Les chemins de fichiers et versions autorisés seront résolus depuis un catalogue contrôlé, sans téléchargement arbitraire à partir d’une URL fournie par le navigateur. Réponses privées non mises en cache par un intermédiaire partagé.

Pour une future vérification élève, une opération séparée ne renverra que le retour pédagogique autorisé, jamais le YAML professeur ni le barème privé. Il faudra limiter les appels et définir les tentatives pour éviter de transformer le vérificateur en accès indirect à toutes les réponses.

Les possibilités techniques sont décrites dans les documentations officielles : [authentification des Edge Functions](https://supabase.com/docs/guides/functions/auth), [secrets serveur](https://supabase.com/docs/guides/functions/secrets), [lecture des contenus GitHub](https://docs.github.com/en/rest/repos/contents#get-repository-content). Les quotas du plan effectif et de l’API GitHub restent à vérifier avant activation ; aucun coût nul illimité n’est promis.

Le principe GitHub privé + passerelle Supabase est retenu. Le dépôt précis, son secret de lecture, les quotas applicables et le déploiement restent à configurer et vérifier. Aucun abonnement ni service supplémentaire n’est créé. Le plan de mise en service est décrit dans `ACCES-PROFESSEUR-PRIVE.md` ; les vrais corrigés ne sont pas encore sécurisés par ce dispositif.

### Technologie : durée validée de 50 minutes

La durée de référence est **50 minutes entières de travail pédagogique**, précision apportée par l’utilisateur le 19 octobre 2026. Les 5 minutes d’installation, de connexion aux ordinateurs du collège et d’appel sont déjà prises en charge par le professeur, en dehors de cette enveloppe. Ne pas les déduire à nouveau et ne pas limiter le cœur de séance à 25 minutes.

Ces 50 minutes comprennent la lecture du cours et des consignes, les temps de réflexion, les réponses, les manipulations ou recherches éventuelles, les échanges et la synthèse. Exemple indicatif à adapter au contenu : 5 minutes pour reprendre la séance précédente et comprendre l’objectif ; 10 minutes de découverte et de lecture guidée ; 15 minutes d’investigation, recherche ou manipulation avec réflexion ; 15 minutes de réponses et de mise en application ; 5 minutes de synthèse et de bilan. Les réponses peuvent aussi être intégrées à l’investigation plutôt que séparées en fin de séance. Il ne s’agit ni d’un chronomètre élève ni d’une garantie de faisabilité avant essai en classe.

Prévoir un objectif principal et des activités essentielles cohérentes avec une séance entière ; déplacer les répétitions et approfondissements en prolongements facultatifs. Estimer la charge en comptant aussi la lecture, la réflexion et la recherche, pas seulement le temps de saisie. Si le socle dépasse les 50 minutes, répartir les notions sur plusieurs séances. Les adaptations restent guidées par les attendus du BO et par ce qui a réellement été compris précédemment.

## Références officielles consultées le 19 octobre 2026

- **Technologie collège** : [BO n°9 du 29 février 2024, arrêté MENE2402802A](https://www.education.gouv.fr/bo/2024/Hebdo9/MENE2402802A). Son calendrier prévoit l’application en 5e à la rentrée 2024, en 4e à la rentrée 2025 et en 3e à la rentrée 2026. Pour 2026-2027, le même nouveau texte concerne donc les trois niveaux, avec les attendus de chaque classe. Une page de projet du CSP ne doit pas être confondue avec un programme adopté.
- **3e enseignement agricole** : [page officielle Chlorofil](https://chlorofil.fr/diplomes/secondaire/4e-3e), qui présente le référentiel d’avril 2025 comme applicable en 3e à partir de la rentrée 2026. [Référentiel 2025](https://chlorofil.fr/fileadmin/user_upload/02-diplomes/referentiels/secondaire/4e3e/4e3e-EA-ref-2025.pdf). Ne pas s’appuyer uniquement sur le document de 2018 encore lié dans d’anciens cours.
- **Bac professionnel agricole** : [tronc commun sur Chlorofil](https://chlorofil.fr/diplomes/secondaire/bac-pro/1re-tle/tronc-commun), avec référentiels et documents MG1. La spécialité et la cohorte applicables restent à confirmer avant de certifier la progression. La présence d’un lien CGEH dans le cours source est un indice, pas une validation de la formation actuelle.

Ces références fixent le cadre ; aucune correspondance exhaustive entre toutes les questions et tous les attendus n’est encore certifiée. Il faudra préparer une fiche de correspondance avant validation de chaque lot.

## Premier lot proposé, avant généralisation

1. La dernière séance réalisée est connue : 3e S09, 4e groupe 1 S09, 4e groupe 2 S08, 5e S10. Revoir les séances antérieures **et** suivantes, tout en préparant la continuité du travail réel. Calibrer la Technologie sur 50 minutes ; conserver des parcours distincts pour les deux groupes de 4e sans modifier les données existantes à l’aveugle.
2. Préparer et tester l’accès privé validé, puis présenter les résultats avant publication. Les autres changements importants restent soumis à validation.
3. Enrichir le pilote S02 sans casser ses clés ni ses copies : sens, application concrète, courte démarche, synthèse et progression de saisie. Préserver ses deux questions actuelles tant qu’un changement de version n’a pas été décidé.
4. Construire le bandeau et le catalogue annuel élève avec l’avancement réellement disponible. Les statistiques de maîtrise restent « pas encore évalué » tant que les critères et évaluations n’existent pas.
5. Importer un petit lot adapté, dont une séance de Technologie allégée en continuité avec le travail réel. Tester élèves/professeur, individuel/collectif et absence d’exposition des corrigés avant toute diffusion.

Ce document propose les choix ; il ne les active pas. Les archives, les données et le site fonctionnel ont été conservés.
