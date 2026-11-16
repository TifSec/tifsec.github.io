# Règle de rédaction — ressources, recherche et attendus officiels

Demande du professeur du 20 octobre 2026. Règle applicable à toutes les matières et classes, lors de la création, de l'adaptation et de la reprise des cours.

## Règle obligatoire

Chaque séance comporte des ressources publiques pertinentes et un lien vers le programme ou référentiel officiel applicable au niveau. Placer les aides utiles près des exercices concernés, pas uniquement dans une bibliographie finale. Un exercice ne nécessite pas systématiquement une nouvelle URL : une même ressource peut servir plusieurs activités si la recherche demandée diffère.

- Sélectionner peu de ressources : en général une ou deux par activité, en français et adaptées au niveau de lecture. Privilégier les institutions, ressources éducatives publiques et documentations des concepteurs. Ne pas ajouter un lien seulement pour remplir une rubrique.
- Pour chaque lien, indiquer l'éditeur, le titre et une courte piste : quoi chercher, quel paragraphe lire ou quelle partie examiner. Utiliser des liens précis, pas la page d'accueil d'un moteur de recherche.
- Aider à apprendre : définition, exemple différent, document technique ou méthode. Ne pas lier un corrigé privé, un projet professeur complet ou un résultat qui remplace le raisonnement demandé. Les pages externes restent des sources à examiner, pas une autorité suffisante sur le fonctionnement de notre maquette.
- Habituer progressivement l'élève à repérer l'auteur, retrouver une information, la vérifier et la reformuler. Selon l'activité, lui demander simplement d'indiquer la source utilisée dans sa réponse. Ne pas imposer une longue fiche de recherche à chaque question.
- Distinguer aide facultative et recherche nécessaire. Une aide facultative ne conditionne ni la remise ni les 20 points. Le temps de recherche obligatoire est inclus dans les 50 minutes.
- Conserver des consignes courtes. Présenter les ressources dans un volet repliable près de l'activité ou de la question ; ouvrir un nouvel onglet pour conserver le travail en cours. Aucun chargement automatique de vidéo ou de contenu tiers.
- Vérifier l'adresse et le contenu lors de la préparation ; noter la date dans le dossier professeur. Préférer une lecture utilisable sans compte ni abonnement. Prévoir une aide locale suffisante si une ressource facultative est filtrée ou inaccessible. L'accès depuis les postes des deux collèges doit être essayé avant utilisation en classe.

## Attendus ministériels

Fournir le lien vers le BO ou référentiel exact et, si utile, vers son annexe avec page ou intitulé de rubrique. Ajouter une courte reformulation compréhensible de ce que la séance prépare. Distinguer attendus du cycle, repères de classe et travail de cette séance : un cours ne valide pas à lui seul tout un attendu de fin de cycle.

L'élève peut consulter les textes officiels sans devoir les lire intégralement pour réussir l'exercice. Les références ne remplacent pas l'explication du cours. Les parcours et spécialités agricoles utilisent les référentiels adaptés, pas automatiquement ceux du collège général. Vérifier les versions applicables lors de chaque nouvelle intégration.

## Format compatible avec le moteur

`activite.ressources` et `question.ressources` contiennent des blocs publics existants (`paragraphe`, `lien`, etc.). `cours.reperes_officiels` utilise les mêmes blocs dans l'introduction. Le composant commun `cours/cours-ressources.html` affiche un volet fermé par défaut. Les champs restent du contenu pédagogique, sans logique de correction ni HTML libre.

```yaml
ressources:
    - type: paragraphe
      texte: "Cherche le rôle du bouton, puis reformule avec tes mots."
    - type: lien
      titre: "micro:bit — LEDs et boutons (en français)"
      url: "https://microbit.org/fr/get-started/features/leds-and-buttons/"
```

## Première application

S11 et S12 : ressources d'aide facultatives placées dans les trois activités obligatoires et repères officiels dans l'introduction. Liens examinés le 20 octobre 2026 : micro:bit (boutons/LEDs et exemple SI/SINON), texte de Lumni sur la chaîne d'énergie et BO Technologie 2024/annexe. Les pages micro:bit portent sur une carte, pas le câblage du monte-charge. Les ressources restent des aides : aucune réponse obligatoire, aucun identifiant de copie, aucun barème ni corrigé privé modifié.

Vérifications : construction stricte et 399 tests réussis ; volets fermés, liens placés avant les questions de leur activité, ouverture séparée et protections des liens, repères ministériels. 99 fichiers générés et 16 pages contrôlés, 374 archives intactes. Les liens externes ont été examinés avec la navigation web, pas testés depuis les réseaux des deux collèges. Aucun changement Supabase ni publication.
