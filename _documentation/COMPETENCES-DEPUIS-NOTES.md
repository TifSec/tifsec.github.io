# Réussites par compétence calculées depuis les notes

20 octobre 2026. L’utilisateur demande de réutiliser les objectifs des cours et leurs notes ; cette demande remplace la proposition de niveaux manuels obligatoires. Aucun changement Supabase nécessaire.

## Ce qui existe dans les fichiers

Audit structurel sans modification des archives, puis lecture des objectifs et des énoncés concernés. Les occurrences ci-dessous sont des titres explicites repérés hors commentaires HTML : ce ne sont ni un décompte de compétences BO distinctes, ni une garantie que chaque ancienne séance est terminée.

| Ancien fichier | Titres compétence visée | Titres objectifs |
| --- | ---: | ---: |
| techno/5/index.html | 47 | 0 |
| techno/4/index.html | 40 | 12 |
| techno/3/index.html | 13 | 10 |
| mfr/3/index.html | 4 | 4 |
| mfr/2nd/index.html | 4 | 0 |
| mfr/bacpro1/index.html | 3 | 0 |
| mfr/bts1/index.html | 0 | 0 |
| mfr/maths/4e-3e/index.html | 0 | 4 |
| mfr/maths/2nd/index.html | 0 | 0 |
| mfr/maths/bacpro1/index.html | 0 | 0 |
| mfr/maths/bacpro2/index.html | 0 | 6 |

Technologie et plusieurs cours TIM : compétences de séance bien présentes. Maths : objectifs et notions pédagogiques disponibles, mais rattachement aux compétences pas uniforme ; un titre absent ne veut pas dire qu’il n’y a aucun objectif dans le contenu. Exemple Bacpro2 : diagnostic, pourcentages, proportionnalité, équation, fonction et justification. Le premier diagnostic y est explicitement non noté : ne pas lui inventer une note. Le BTS demande un examen plus approfondi lors de l’import.

## Lot actif localement

Trois seuls cours Jekyll actuels : S02, S10 ancien essai et S10R reprise originale, tous v1. 24 questions reliées dans _data/competences_evaluees.yml au domaine usages-évolution du référentiel Technologie 2024. Rattachement pédagogique fondé sur énoncés/objectifs, pas un code déjà normalisé dans les anciens fichiers. S02 : besoins/usages/évolution. S10 et S10R : usages responsables du numérique et cybersécurité, composante de ce domaine décrite dans l’annexe BO p. 6–7. N’attribuer aucune réussite aux huit autres domaines par analogie. Le graphique indique un résultat partiel sur des questions liées, pas la maîtrise intégrale du domaine.

Les cours Maths/TIM restent en archives jusqu’à l’import demandé avant publication. Leurs correspondances question-compétence seront ajoutées lors de cette étape, après contrôle des énoncés et barèmes ; aucune ancienne copie ou note n’est inventée.

## Calcul et restitution

Pour chaque compétence : somme des points attribués aux questions liées divisée par somme de leurs maximums, multipliée par 100. Moyenne pondérée par les points possibles, sans utiliser la note globale du cours pour les autres compétences. Exemple fictif : 3/4 et 1/2 donnent 4/6, soit 66,7 %. Aucune moyenne globale entre compétences ; une même question peut alimenter plusieurs compétences si son rattachement le justifie, sans total inter-compétences.

Questions de barème nul exclues. Zéro réellement noté = 0 %, absence de preuve = Pas encore évalué. Tableaux comptés une seule fois au niveau question, après vérification des sous-totaux des cases. Affichage du nombre de copies/questions, nombre de questions sans tous les points à relire, et détail des sources avec lien vers l’activité. Cette invitation à relire ne déduit pas un diagnostic automatique.

Individuel et collectif calculés séparément. Pas de certification individuelle déduite d’un groupe. Historique individuel remplacé par la copie collective de référence selon le modèle existant ; anciennes classes hors résumé actuel.

## Sécurité et performances

Lecture du champ marks et course_version des seules notes déjà autorisées au client élève par les RLS existantes. Option competencies activée uniquement sur l’accueil doté de ses correspondances ; autres lecteurs inchangés. Même nombre de requêtes, données JSON plus volumineuses. Aucun corrigé, attendu, dictionnaire ou barème privé ajouté aux données publiques. Seuls identifiants pédagogiques des questions/compétences publics ; points affichés issus des évaluations validées autorisées.

Contrôle de destinataire, version du cours/catalogue/copie/évaluation, référence d’évaluation courante et clôture ; nouvelle vérification des copies après lecture des notes. Une réouverture retire la correction du graphique. Doublons, barèmes invalides, correspondances ambiguës et totaux incohérents exclus sans pourcentage inventé. Nettoyage de l’interface sur changement de compte inchangé.

## Vérification

370 tests réussis, compilation stricte, 14 pages et 374 archives intactes. Identifiants des 24 questions et références comparés au catalogue et aux trois YAML élèves. Lecture distante de compteurs uniquement : une correction courante S02/v1, trois questions notées. Vérification transactionnelle sous rôle authenticated avec identité de son destinataire : cette correction et ses trois notes restent lisibles, ROLLBACK final. Aucune copie, note ou réponse modifiée ; pas de migration, déploiement de fonction ou publication du site. Parcours navigateur authentifié et rendu graphique réel à confirmer par le professeur.

Documents consultés : documentation Supabase select et journal officiel local consulté durant le lot précédent ; aucune nouveauté pertinente sur cet usage. Sources BO et Chlorofil conservées dans COMPETENCES-REFERENTIELS.md. Cette entrée remplace l’affirmation précédente selon laquelle des observations manuelles séparées sont indispensables au graphique.

## Présentation simplifiée rétablie
À la demande utilisateur : retour aux quatre segments compacts à côté du libellé. Remplissage proportionnel (chaque segment = 25 % des points), sans inventer quatre seuils de maîtrise ; pointillés si non évalué. Individuel/collectif séparés. Les explications, compteurs et preuves passent dans des volets fermés par défaut. Calcul et lectures inchangés. 20 tests ciblés réussis, compilation stricte et intégrité vérifiées.
