# Dictionnaires de réponses pour les tableaux

20 octobre 2026 : fonctionnalité demandée et autorisée par l’utilisateur. Premier raccordement sur le tableau de S02, sans changer les réponses enregistrées ni le barème sur 20.

## Fonctionnement

Le YAML professeur privé peut fournir une liste `dictionnaire` dans la règle de correction du tableau. Chaque entrée comporte `champ` (clé exacte d’une case), `points` et `reponses_acceptees` (liste de réponses entières). Aucune liste réelle d’attendus n’est copiée dans le dépôt public, la base ou les tests.

Le comparateur normalise uniquement la casse, les accents et les espaces, y compris les espaces insécables. La ponctuation, les mots supplémentaires et les négations ne sont pas supprimés. Il n’effectue ni recherche de sous-chaîne, ni rapprochement approximatif, ni découpage automatique de plusieurs réponses. Une formulation pertinente non répertoriée reste à examiner plutôt que d’être déclarée fausse.

Le dictionnaire est propre à chaque case : une variante reconnue dans une colonne ou une ligne ne l’est pas automatiquement ailleurs. Toutes les cases du tableau doivent être couvertes une seule fois, avec des points dont la somme correspond exactement au maximum de la question. Une configuration incohérente refuse la proposition entière. Maximum de 250 variantes de 256 caractères par case, sous les limites de lecture du YAML privé existantes.

Une réponse reconnue propose le maximum de la case. Une réponse inconnue ou vide conserve des points indéterminés, jamais un zéro imposé. Le tableau peut donc recevoir des points partiels proposés tout en restant « À examiner ». Les totaux distinguent le maximum déjà vérifié et les points restant à attribuer, sans compter deux fois une case ni faire passer le sous-total pour une note complète. La note finale reste nulle et aucune évaluation n’est enregistrée.

## Présentation et sécurité

Une indication est placée sous le champ, dans sa cellule : réponse reconnue, case vide ou réponse non répertoriée. L’aide générale et les critères restent sous la question. Ces indications sont retirées lors des changements de copie/connexion et des nouveaux calculs. Les cibles inconnues ou dupliquées sont refusées avant affichage.

Seul le service professeur protégé utilise les listes. Il conserve les contrôles Auth, rôle, affectations, RLS, copie de référence et révisions de réponses. Aucune ouverture d’accès élève ni nouvelle politique SQL. Le résultat ne renvoie pas la liste des variantes ni les réponses brutes ; les repères de correction privés existants restent visibles au professeur autorisé.

## Pilote et validation

S02 possède six listes, 99 variantes déclarées (certaines deviennent équivalentes après normalisation) et 2 points par case, soit 12 points pour le tableau. Le reste du barème est inchangé : justification 6 points, QCM 2 points. Ce dictionnaire n’est pas exhaustif et pourra être enrichi après appréciation du professeur ; aucune interface de modification à distance des listes n’est ajoutée ici.

Fonction `teacher-correction` version 4 active, moteur version 2. Corrigé privé mis à jour, site public inchangé. Toujours pilote S02/v1 avant toute note validée ; les versions de cours déjà évaluées devront être conservées avec leur barème et leur dictionnaire.

238 tests réussis et construction stricte réussie. Tests : variantes, accents/espaces, réponses entières, négations, mauvaise case, absences, configuration invalide, points partiels et décimaux, totaux, contrôle serveur et affichage/nettoyage. Vérification du vrai YAML privé en mémoire : somme sur 20, tableau entièrement reconnu puis partiellement inconnu. 374 archives intactes, huit clés de réponses inchangées. En ligne : anonyme/faux JWT HTTP 401, prévol HTTP 204. Dernière recette authentifiée à confirmer par l’utilisateur.
