# Cours professeur intégré — premier pilote S02

19 octobre 2026. Développement local sur `refonte-jekyll`, sans publication du site public ni changement de schéma Supabase.

## Parcours réalisé

Depuis `/prof/cours/`, « Ouvrir le cours professeur » charge la même introduction, les mêmes activités, questions et synthèse que la page élève, puis les notes privées autorisées. Navigation des étapes à gauche sur grand écran. La préparation générale et l’évaluation sont repliées au départ ; les indications de conduite apparaissent dans l’activité et les corrigés dans les questions concernées. Chaque panneau peut être replié.

« Version élève / projection » et « Masquer et effacer les notes privées » retirent les annotations du DOM, pas seulement leur visibilité. Le changement de séance, la déconnexion et les réponses tardives sont aussi pris en compte. La feuille d’impression masque les annotations privées ; cela ne constitue pas une protection supplémentaire du serveur ni une garantie d’absence de capture d’écran par un professeur autorisé.

Le chargement public est vérifié par établissement, matière, classe et séance. Les notes sont rattachées à des identifiants d’activité/question validés et à la même version ; en cas de discordance, aucun corrigé partiel n’est affiché. Les valeurs privées restent du texte, sans HTML exécutable. Aucun stockage local ou nouvelle persistance privée ajouté.

## Contenu et confidentialité

Le fichier `techno/3e/S02.v1.yml` du dépôt **privé** `TifSec/tifsec-corriges-prives` remplace le fichier de vérification initial. Commit : `8d69b7ec8295366e06378c1f4a1ab19baed1f36f`. Il contient la conduite de la séance, les aides, relances, réponses possibles et critères. Aucun corrigé réel n’est enregistré dans les sources ou tests du dépôt public. Les tests et l’aperçu visuel utilisent des données fictives.

La préparation totalise 50 minutes pédagogiques après l’installation/appel : reprise, lecture, comparaison/recherche, justification/échanges, synthèse. Ce découpage reste à ajuster à la classe réelle. Le tableau et la justification sont ouverts : correction professeur, sans mots-clés imposés ni note automatique.

Le YAML élève de S02 reçoit des repères de lecture et une démarche explicite, sans changer les deux questions ni les sept clés des réponses enregistrées. Les repères de lecture sont rendus par le composant commun. Les autres matières pourront utiliser les mêmes composants.

## Continuité et programme

Lecture des objectifs de S01 et S02 dans l’archive 3e : la première porte sur la méthode de travail et la trace des essais. Le passage de Writer à la saisie du nouveau site est pris en compte. Ne pas confondre cet objectif antérieur avec une acquisition constatée.

La classe réelle a déjà terminé S09 : S02 est un pilote repris, pas la prochaine séance imposée. Le travail de migration des séances suivantes reste à faire.

Cadre vérifié : [BO du 29 février 2024](https://www.education.gouv.fr/bo/2024/Hebdo9/MENE2402802A), [annexe du programme](https://www.education.gouv.fr/sites/default/files/document/Annexe%20%E2%80%94%20Programme%20de%20technologie%20du%20cycle%204-368016.pdf), pages 3–4 du PDF. L’approfondissement de 3e doit relier les évolutions techniques aux sciences, inventions, usages et enjeux du cycle de vie. Le simple tableau constitue une réactivation ; les relances proposent un approfondissement oral. Aucune conformité exhaustive à tous les attendus de 3e n’est déclarée pour ce pilote.

## Vérifications

- 180 tests locaux réussis, dont placement des annotations, retrait complet en projection, correspondance de version, isolement des comptes et absence d’exécution HTML.
- Construction Jekyll stricte et vérification des 11 pages, ressources, sept clés de réponse et 374 archives intactes réussies.
- YAML privé validé en mémoire : format accepté par la passerelle, correspondance des identifiants, somme des phases égale à 50 minutes. Le fichier privé a été mis à jour via GitHub sans copie locale dans le dépôt public.
- Contrôle navigateur sur aperçu fictif : cours et navigation visibles, notes intégrées sous les questions, disparition des notes lors du passage en version élève. Serveur d’aperçu arrêté et script temporaire retiré ; aucune page de test ajoutée à Jekyll.
- Le raccordement avec le compte professeur et le refus de la page pour un compte élève avaient été confirmés par l’utilisateur. La nouvelle présentation enrichie et le nouveau contenu privé restent à essayer avec sa session réelle.

## Suite

Faire essayer S02 enrichie au professeur, puis préparer une séance adaptée en continuité avec l’avancement réel. Développer séparément le vérificateur déterministe et la proposition de notation ; seules les décisions professeur pourront valider une note. Les réponses ouvertes de ce pilote ne doivent pas être présentées comme corrigées automatiquement.
