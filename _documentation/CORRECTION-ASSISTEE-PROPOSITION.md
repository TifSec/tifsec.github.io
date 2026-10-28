# Prochain lot : correction assistée et notes

Proposition de reprise du 20 octobre 2026. L’utilisateur a validé l’ordre de travail proposé. Premier sous-lot de calcul réalisé et testé : voir `VERIFICATEUR-DETERMINISTE.md`. Les changements de schéma devront être présentés concrètement avant application distante ; aucune migration ni activation réalisée par ce document.

## État de départ

188 tests locaux réussis à la fin du lot navigation. Sauvegarde, groupes avec consentement, suivi professeur et accès aux fichiers privés déjà réalisés. L’utilisateur a confirmé le chargement privé avec son compte professeur et le refus de la page avec un compte élève. Le pilote S02 contient un tableau ouvert et une justification : conserver une correction humaine pour ces réponses. Ne pas leur imposer une correction par mots-clés pour démontrer le futur vérificateur.

## Résultat attendu dans l’espace professeur

Le parcours reste matière → classe → séance → copie. Une action « Préparer la correction » présente les résultats vérifiables, les éléments à examiner, le barème applicable et une proposition partielle. Le professeur complète les appréciations/points manuels et reste seul à valider la note finale. Un tableau récapitulatif affiche ensuite une ligne par élève et une colonne par séance, avec distinction entre travail individuel et collectif.

Une proposition ne doit jamais apparaître comme une note définitive. Une copie collective produit une correction commune clairement identifiée ; les ajustements individuels éventuels doivent être explicites et tracés, sans assimiler le résultat du groupe à une maîtrise individuelle.

## Premier sous-lot : calcul sans écriture en base

Préparer et tester le moteur de vérification sur des données fictives conservées uniquement dans les tests exclus de Jekyll : nombres, QCM à choix unique et réponses ouvertes. Pas de nouvelle page de test ni de modification des réponses existantes.

- Nombre : reconnaître la virgule décimale et le point ; refuser une expression à exécuter, une valeur non finie ou une unité incompatible. Unité attendue, arrondi et tolérance doivent être définis par la question et son corrigé privé ; ne pas inventer une tolérance pour accepter une réponse.
- QCM à choix unique : comparer l’identifiant choisi à l’identifiant attendu dans le fichier privé ; ne pas dépendre du texte ou de l’ordre d’affichage des choix.
- Réponse vide : la distinguer d’une erreur ; sa prise en compte dans une note dépend du barème et de la phase de correction.
- Réponse ouverte ou règle non prise en charge : indiquer « à examiner par le professeur », sans attribuer automatiquement une réussite ou un échec.
- Restituer les points automatiquement proposés, leur maximum et les points restant à examiner. Ne pas convertir cette fraction en note globale avant examen de la partie manuelle.

## Contrôle serveur proposé

Ajouter une opération protégée de correction réservée au professeur, en réutilisant les contrôles de la passerelle existante. Elle recevrait l’identifiant d’une copie, pas un score ou un corrigé fourni par le navigateur. Elle vérifierait l’identité, le rôle actuel, l’affectation et la copie exacte, puis lirait les réponses autorisées et le YAML privé de la bonne version. Aucun énoncé ou corrigé ne serait stocké dans PostgreSQL ou Storage.

La proposition devrait porter la version du cours/barème et les révisions des réponses utilisées. Si la copie évolue après le calcul, afficher que la proposition est périmée et la recalculer avant validation. Une note ancienne ne doit pas être recalculée silencieusement quand un cours ou un corrigé change.

Le retour formatif pendant le travail élève est une opération distincte à réaliser ensuite : ne transmettre que le retour autorisé, avec contrôle des tentatives, jamais le YAML professeur ni ses critères privés.

## Écriture et historique : proposition avant migration

Préparer un schéma et des règles testables pour les évaluations, sans ouvrir automatiquement la table préexistante `student_results` :

- référence de copie et séance/version, évaluateur, état proposé/validé, points et maximum ;
- détails d’évaluation nécessaires au suivi, sans recopier les énoncés ni les attendus ;
- lien aux participants de la copie, visibilité élève décidée explicitement, ajustements individuels tracés ;
- historique des validations et rectifications, avec auteur et date ;
- validation par une opération serveur, contrôle de concurrence et refus d’une proposition périmée.

Présenter le SQL concret, les politiques RLS, les cas de test et les choix de visibilité avant application distante. Aucun effacement ni remplacement des réponses, groupes ou évaluations existants.

## Vérifications avant mise en service

Tester notamment : visiteur/élève/professeur non affecté refusés, copies individuelles et collectives correctement isolées, historique individuel non corrigé comme copie de référence, valeurs numériques limites, virgule/unité/tolérance, QCM inconnu, réponse ouverte manuelle, absence de note finale automatique, validation concurrente, réponse modifiée après proposition, changement de compte et absence de contenu privé dans la sortie Jekyll.

Une fois le premier sous-lot testé, relier la correction aux copies du professeur ; préparer ensuite la persistance et le récapitulatif. L’import des cours reste progressif, avec continuité réelle et références officielles vérifiées. Les séances de Technologie conservent 50 minutes pédagogiques après installation/appel.
