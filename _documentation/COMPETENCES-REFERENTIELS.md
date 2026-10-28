# Graphique de compétences et raccordement proposé

## Réalisé localement

Curseur pointer rétabli sur #prof-logout, avec ou sans thème.

Ajout limité à Comprendre et progresser : graphique de repères par objectif, regroupé par thème, source officielle dépliable. Restitution des retours existants inchangée. Pas d’API ou donnée supplémentaire ; catalogue public des référentiels dans _data/referentiels.yml. Les libellés courts sont des reformulations pédagogiques, pas les libellés réglementaires ni de nouveaux codes officiels.

Technologie collège 5e/4e/3e : neuf compétences et trois thèmes, programme BO 9 du 29 février 2024, applicable en 3e à la rentrée 2026. Repères annuels détaillés et correspondance exhaustive des questions à faire lors de l’import. Rattachement initial S02/S10/S10R au domaine usages/évolution pour les objectifs abordés, sans résultat attribué.

4e/3e agricoles : cinq objectifs mathématiques et six TIM, synthèse du référentiel 2025. Aucun cours MFR rattaché tant que le contenu n’est pas vérifié. Ne pas assimiler ces objectifs agricoles aux neuf compétences de Technologie collège.

Toutes les lignes sont actuellement Pas encore évalué : aucune observation de compétence n’existe en base. Le graphique ne prétend donc pas encore montrer les acquis individuels. Les quatre segments vides ne sont ni un zéro ni un pourcentage. Notes, remise, nombre de réponses et travail collectif ne déterminent pas un niveau personnel.

362 tests, compilation stricte et intégrité vérifiées ; rendu réel à confirmer par l’utilisateur. Aucun changement Supabase ni publication.

## Informations utilisateur MFR

MFR Saint-Flour, Cantal, spécialités équines, avec une 3e multi-métiers. Site établissement : CAPa Palefrenier soigneur, Bac pro CGEH et BTSA ACS’AGRI support équin. Ce sont les formations recensées sur le site, pas encore une confirmation de chaque cohorte enseignée par l’utilisateur. Pour le CAPa, Bac pro et BTSA, références et correspondances détaillées restent à vérifier avant affichage ; ne pas attribuer automatiquement les compétences du collège.

## Proposition concrète nécessitant accord avant modification de base

Ajouter des observations de compétences, séparées des notes et des cours, seules informations de suivi nécessaires : élève destinataire, professeur auteur, copie et version/révisions observées, identifiant du référentiel et de la compétence, niveau, conseil court et date de validation. Aucun cours ou corrigé en base.

Quatre repères pédagogiques proposés : À travailler, Avec de l’aide, En autonomie, Dans plusieurs situations. L’absence d’observation reste Pas encore évalué ; ne pas la convertir en premier niveau. Ces repères ne constituent pas une certification officielle de fin de cycle.

Le professeur renseigne explicitement les observations lors de la correction ; aucun calcul automatique depuis une note. Un travail collectif requiert une observation individuelle explicite avant d’en tirer un acquis personnel. Chaque niveau affiché doit pouvoir être relié à son observation et au conseil du professeur.

Droits envisagés : élève lit ses seules observations validées ; professeur lit/crée/valide dans son périmètre de classes ; élève ne modifie aucun niveau ; aucun accès anonyme. Historique conservé, pas de suppression de données existantes. Une copie rouverte ou modifiée rend ses observations liées aux révisions anciennes non courantes jusqu’à nouvelle validation. Afficher la dernière observation courante par compétence, sans moyenne entre compétences ; conserver le détail pour contextualiser.

Après accord : préparer migration et contrôles RLS transactionnels, tester les refus et l’isolement entre élèves, présenter les résultats avant publication. Cette proposition n’est ni appliquée ni implémentée côté serveur.

## Sources vérifiées

- https://www.education.gouv.fr/bo/2024/Hebdo9/MENE2402802A
- https://www.education.gouv.fr/media/160782/download (annexe pages 3 à 18)
- https://chlorofil.fr/diplomes/secondaire/4e-3e
- https://chlorofil.fr/fileadmin/user_upload/02-diplomes/referentiels/secondaire/4e3e/4e3e-EA-ref-2025.pdf
- https://www.mfr-saint-flour.fr/
