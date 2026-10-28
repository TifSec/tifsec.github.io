# Barème à prévoir lors de la génération des cours

Pour toute rédaction ou adaptation future, appliquer aussi [GUIDAGE-PROGRESSIF.md](GUIDAGE-PROGRESSIF.md) : formulations simples, guidage très présent en S01–S20, puis réduction légère par paliers de 20 séances. Cette règle inclut explicitement le TIM et les Mathématiques de la MFR, dans toutes les classes.

Lorsqu'un exemple change de contexte ou d'objet, préciser qu'il s'agit d'une comparaison et nommer explicitement le retour au sujet du cours. Contrôler cette transition dans chaque séance, quelle que soit la matière ou la classe.

La rédaction inclut également les aides documentaires ciblées et les liens aux attendus officiels : appliquer [RESSOURCES-ET-RECHERCHE.md](RESSOURCES-ET-RECHERCHE.md). Le temps de recherche nécessaire fait partie de la séance ; les aides facultatives ne conditionnent pas le barème.

Complément impératif du 20 octobre 2026 : la mise en service d’une séance inclut sa version professeur privée, les aides par question, le barème et le raccordement du correcteur. Les seules vérifications fiables sont proposées automatiquement ; les autres restent au jugement du professeur. Contrôler aussi la liaison copie/version, le dépôt privé et les catalogues déployés. Ne pas annoncer le cours prêt à corriger sur la seule présence du YAML élève. S10R est désormais raccordée ; détails dans [FIN-DE-TRAVAIL-ET-S10-ACTIVES.md](FIN-DE-TRAVAIL-ET-S10-ACTIVES.md).

Exigence utilisateur du 20 octobre 2026 : proposer un barème sur 20 pour chaque cours, dès sa création ou son adaptation.

## Règles de préparation

- Préparer ensemble contenu élève, corrigé professeur privé et répartition des 20 points. Cette règle concerne toutes les matières et classes, y compris les cours récupérés des archives.
- Pour chaque question obligatoire, préciser dans le YAML professeur les points maximum et les critères d’attribution. Utiliser le champ `points` déjà reconnu par le moteur pour le maximum de la question ; ne pas créer un second barème parallèle.
- La somme des maxima des questions obligatoires doit être exactement 20. Pas de conversion implicite d’un total arbitraire en note sur 20.
- Les réponses ouvertes et tableaux disposent de critères explicites : éléments attendus, points partiels et maximum de la question. Ces points restent attribués par le professeur. Les critères d’un tableau se répartissent à l’intérieur du maximum de la question, sans double comptage des cellules.
- Pour les calculs et QCM, préciser les règles déterministes compatibles avec la question : attendu, tolérance, précision ou unité lorsqu’ils sont nécessaires. Conserver les démarches et justifications à l’examen du professeur lorsque la réponse numérique seule ne suffit pas.
- Pondérer les points selon les apprentissages visés et les attendus du niveau, pas seulement selon le nombre de champs. Le barème doit rester adapté à la séance et à sa durée, notamment les 50 minutes de Technologie.
- Les prolongements facultatifs restent hors du total obligatoire : un élève doit pouvoir obtenir 20 sans les réaliser. Aucun mécanisme de bonus n’est ajouté dans ce lot.
- Les corrigés, critères détaillés et barèmes de correction restent dans le YAML professeur privé. Aucun corrigé ni cours n’est ajouté à Supabase.

## Contrôles avant intégration

Pour les tableaux de réponses courtes, préparer si pertinent un dictionnaire de variantes par case dans le YAML professeur privé. Couvrir chaque champ exactement une fois et vérifier que les points des cases totalisent le maximum du tableau. Les réponses non répertoriées restent à examiner, sans pénalité automatique. Voir [DICTIONNAIRE-REPONSES.md](DICTIONNAIRE-REPONSES.md). Ne pas présenter cette liste comme exhaustive ni appliquer la reconnaissance par mots-clés aux justifications libres.

Prévoir également un début de correction utilisable dans chaque question : attendu, démarche expliquée, critères de réussite/points partiels et erreurs possibles à vérifier. Le service professeur réutilise ces champs pour accompagner la lecture et propose des appréciations conditionnelles. Ne pas transformer ces références en attribution automatique de points aux réponses ouvertes. Le professeur décide après lecture effective de la copie.

Vérifier la correspondance activité/question entre les deux YAML, la présence d’un maximum pour chaque question obligatoire, la somme exacte de 20 et la cohérence des sous-critères avec le maximum de chaque question. Vérifier également la séparation des exercices facultatifs et la distinction entre points proposés automatiquement et points à attribuer manuellement.

Ces contrôles sont une exigence de génération et de revue. Leur automatisation complète avant import reste à intégrer au processus de validation des cours ; ce document ne prétend pas qu’elle est déjà réalisée.

## Validation et versions

Le professeur reste seul à valider la note finale, même si toutes les réponses sont déterministes. Une réponse absente ou de format invalide reste explicitement signalée et examinée avant validation.

Le pilote S02 dispose désormais d’un barème proposé sur 20 : 12 points pour le tableau, 6 pour la justification et 2 pour le QCM ajouté à la demande du professeur le 20 octobre. Cette extension additive du pilote intervient avant toute note validée. Ne pas remplacer silencieusement le barème d’une version déjà évaluée ni recalculer d’anciennes notes. Avant toute nouvelle version évaluée, finaliser la liaison entre copie et version du cours décrite dans le document de raccordement.

Aucun barème réel, changement de base, note enregistrée ou service déployé dans cette mise à jour documentaire.
