# Vérificateur déterministe — premier sous-lot réalisé

20 octobre 2026, branche `refonte-jekyll`. Module pur : `_supabase/functions/_shared/deterministic-checker.mjs`. Tests fictifs : `_checks/deterministic-checker.test.mjs`.

**État actualisé : raccordé au service protégé et à l’interface des copies le 20 octobre 2026.** Voir [RACCORDEMENT-CORRECTION.md](RACCORDEMENT-CORRECTION.md). Aucune modification des tables, RLS, réponses, notes ou corrigés réels. Aucun nouvel écran/page de test. Le module reste exclu de la publication Jekyll avec `_supabase/`. Les paragraphes de préparation ci-dessous décrivent le premier sous-lot ; la sauvegarde des évaluations reste à concevoir et à valider.

## Ce que le moteur distingue

| Résultat | Conséquence pour la proposition |
| --- | --- |
| Réponse déterministe correcte | Points prévus proposés, si un barème est défini. |
| Réponse déterministe incorrecte | Zéro proposé pour ce critère, si un barème est défini. |
| Réponse vide | Absence signalée, points laissés à examiner ; aucun zéro final imposé. |
| Format invalide ou choix inconnu | À examiner ; ne pas transformer une erreur de saisie en note automatique. |
| Réponse ouverte, tableau ou type non pris en charge | Correction professeur. |
| Règle déterministe incomplète/incohérente | Erreur de configuration, aucune proposition restituée pour l’ensemble. |
| Barème absent | Vérification possible, aucun maximum global inventé. |

Même si toutes les réponses sont correctes, la restitution porte `statut: proposition`, `validation_requise: true` et `note_finale: null`. Les totaux séparent les points proposés automatiquement et les points restant à examiner. Le résultat ne contient ni attendu, ni réponse brute, ni explication privée.

Le pilote S02 contient des réponses ouvertes : elles restent manuelles. Ce module ne transforme pas son tableau en exercice à mots-clés et ne change aucune copie enregistrée.

## Contrat de calcul préparé

`checkQuestion` reçoit la question publique, sa règle issue du fichier professeur privé et la réponse enregistrée. `proposeCorrection` reçoit une liste d’entrées avec une clé unique par critère ; le raccordement serveur devra construire ces entrées depuis les sources autorisées, pas depuis un score envoyé par l’élève.

### Nombres

- Virgule ou point décimal ; espaces ordinaires/insécables de groupement des milliers s’ils sont correctement placés ; signe plus ou moins, y compris le signe moins typographique.
- Comparaison décimale exacte par entiers, sans marge flottante ajoutée en secret. La tolérance absolue est explicitement fournie par `tolerance_absolue` ; en son absence, comparaison exacte. Une tolérance négative, nulle au sens YAML `null` ou non numérique est refusée.
- `arrondi_decimales`, facultatif : 0 à 12 décimales. Arrondir l’attendu à la précision demandée, les égalités à mi-chemin vers la valeur absolue supérieure ; exiger que la réponse représente déjà un nombre à cette précision. Les zéros finaux supplémentaires ne pénalisent pas l’élève. Ne pas arrondir une réponse trop précise pour la rendre juste silencieusement.
- `unite_attendue`, facultative : unité littérale. La valeur seule est autorisée puisque l’unité peut déjà figurer à côté du champ ; `unite_obligatoire: true` exige sa présence dans la saisie. Aucune conversion implicite entre mètres/centimètres ni entre devises.
- Aucune expression ou fraction exécutée/interprétée ; notation scientifique saisie par l’élève non prise en charge dans ce sous-lot. Le format invalide reste à examiner. Un petit attendu numérique YAML sérialisé en exposant par JavaScript est néanmoins reconnu correctement.
- Pour de très grands nombres, écrire l’attendu sous forme de chaîne décimale dans le YAML privé : un entier JavaScript déjà hors de sa précision sûre est refusé. Bornes de traitement : 256 caractères pour le nombre normalisé à analyser, au plus 100 chiffres au total et 100 décimales ; les réponses longues sont rejetées sans évaluation de code.

### QCM

Le premier périmètre est le choix unique, comme le composant élève actuel. `choix_attendus` doit contenir exactement un identifiant présent parmi les choix publics. Comparer les identifiants, sans dépendre de l’ordre ou du texte des propositions. Les identifiants dupliqués, attendus absents ou règles à choix multiples sont refusés avant attribution de points.

### Barème

`points`, facultatif : de 0 à 10 000, avec au plus six décimales. Les additions se font sur des entiers mis à la même échelle afin d’éviter les artefacts d’addition flottante. Une proposition contient au plus 1 000 critères, avec des clés uniques non vides de 200 caractères maximum.

Ces bornes et choix sont explicites et testables ; les ajuster si un futur cours nécessite un format supplémentaire. Ils ne constituent ni une publication de barème pédagogique ni une note d’élève.

## Vérifications réalisées

21 tests réussis : variantes décimales, zéro/absence, milliers, unités, tolérance aux bornes, grands nombres, petits nombres, arrondis positifs/négatifs, expressions refusées, tailles limites, QCM, questions ouvertes, configuration invalide, confidentialité des résultats, totaux mixtes, points décimaux et validation toujours professorale.

Commande : `node --test _checks/deterministic-checker.test.mjs`. Aucun besoin de compte réel, de réseau ou de nouvelle dépendance pour ce sous-lot.

## Étape suivante

Raccorder le calcul aux copies via une opération professeur protégée, avec contrôle du rôle/affectation, lecture des réponses côté serveur et version du fichier privé. Associer la proposition aux révisions des réponses pour refuser une validation périmée. Définir ensuite les écritures et l’historique des évaluations ; présenter la migration et ses tests avant application distante, conformément à la proposition validée.

Une sortie calculée seule n’est pas une preuve d’autorisation, de provenance des réponses ou de validation de note. Ne pas l’utiliser comme justificatif de confiance d’un score fourni par le navigateur élève. Le retour formatif aux élèves et son contrôle des tentatives restent un lot séparé.
