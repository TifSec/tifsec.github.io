# Copie corrigée : restitution des notes à l’élève

**Activation réalisée après accord le 20 octobre 2026 :** `grade_validation: true`, migration et service de validation opérationnels. Voir [NOTATION-ACTIVEE.md](NOTATION-ACTIVEE.md). Les indications d’attente ci-dessous sont historiques ; la dernière recette navigateur avec une note réellement validée par le professeur reste à confirmer.

20 octobre 2026. Réalisation locale à la suite de la revue de la notation par réponse. Le drapeau commun `grade_validation` reste désactivé ; aucune table ou fonction distante n’est modifiée dans ce lot.

## Présentation

Dans le cours habituel, la copie validée affiche une note sur 20 et un rappel pour relire les appréciations. Les points de chaque case du tableau sont placés à côté de la réponse correspondante. La note de la réponse rédigée est juste sous le texte, celle du QCM à côté du choix. Les appréciations par question, dont l’appréciation globale du tableau, sont repliées au départ. Une actualisation inchangée conserve les volets que l’élève a ouverts.

Les notes sont des libellés en lecture seule, sans nouveaux champs de saisie. Le module ne modifie aucune réponse, n’enregistre rien et ne charge aucun corrigé privé, dictionnaire ou proposition automatique. Une copie collective précise que la note est commune à ses participants.

## Chargement et contrôles

Le composant est raccordé à la restauration du cours et aux actualisations déjà existantes. Il ne lit rien tant que le réglage reste désactivé. Une copie ouverte ou un historique individuel ne reçoit aucune note courante.

Après vérification du compte élève validé, le composant lit la référence de correction courante de la copie autorisée par RLS, puis uniquement les points, commentaires et révisions de cette évaluation. Il recontrôle la référence courante et l’identité avant affichage. Les révisions doivent correspondre aux réponses effectivement restaurées dans la page. Une copie rouverte, une évaluation différente, une réponse modifiée ou une réponse tardive après déconnexion n’affichent pas une ancienne note sur un nouveau contenu.

Toutes les cibles et les sommes sont contrôlées avant insertion des notes : une anomalie ne produit pas de restitution partielle sous une mauvaise réponse. Les commentaires sont affichés comme texte inerte. Un zéro validé est affiché comme zéro ; un manque d’évaluation ne devient pas zéro. En cas de panne, les réponses restent intactes et un message propose de recharger la copie.

Les marqueurs sont effacés et les éléments de réponse remis à leur place lors d’un changement de copie, d’une déconnexion ou d’une revalidation de session. Si un brouillon élève empêche l’adoption de réponses distantes, aucune note correspondant à ces réponses distantes n’est affichée.

## Validation et activation restante

273 tests réussis, construction stricte et contrôle des 374 archives réussis. Onze nouveaux tests couvrent la restitution, l’accès, les sommes, la confidentialité, le maintien des volets, la réouverture, les révisions, les pannes et les réponses tardives. Les tests de sauvegarde/restauration existants passent avec le raccordement.

Aucun essai réel d’une note enregistrée n’est annoncé : le schéma d’évaluation et le service `teacher-grade` restent à approuver et à activer. La proposition détaillée demeure [NOTATION-VALIDATION-PROPOSITION.md](NOTATION-VALIDATION-PROPOSITION.md). Après accord, activer l’enregistrement et cette restitution ensemble, puis vérifier avec les comptes de test du professeur. L’affichage des notes dans les listes annuelles et le tableau récapitulatif professeur restent des lots ultérieurs.
