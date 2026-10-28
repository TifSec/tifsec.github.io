# Saisie des points et validation de la correction — à approuver

**Statut actualisé : proposition approuvée et activée le 20 octobre 2026.** Voir [NOTATION-ACTIVEE.md](NOTATION-ACTIVEE.md). Migration appliquée, service de validation actif et `grade_validation: true` ; 274 tests réussis. Les formulations d’attente ci-dessous décrivent la proposition avant accord.

20 octobre 2026. Interface et service préparés localement ; aucune modification de Supabase appliquée et aucun service de validation déployé. Le drapeau `grade_validation` reste désactivé.

## Parcours proposé

**Disposition revue à la demande du professeur :** dans le tableau, une note par case est placée à côté de la réponse et le total du tableau est calculé, sans seconde note globale modifiable. Une seule appréciation globale du tableau, repliée par défaut. Pour une réponse rédigée, la note suit immédiatement la réponse, avant les aides ; pour le QCM, elle est à côté du choix. Chaque appréciation est dans un volet fermé par défaut. Les repères privés de correction sont eux aussi repliables afin de conserver la réponse et sa note au premier plan.

Le JSON d’évaluation préparé conserve désormais les détails `{cle, points, maximum}` de chaque case du tableau, en plus du total et de son appréciation globale. Le service contrôle les clés exactes et les maxima depuis la proposition privée ; le SQL vérifie aussi les bornes, l’unicité des clés et l’égalité des sommes. La restitution dans le cours élève est désormais raccordée et testée localement : points par réponse et appréciations, sans dictionnaires ni corrigés privés. Elle reste désactivée avec `grade_validation: false` jusqu’à l’accord sur l’enregistrement des notes. Voir [RESTITUTION-ELEVE.md](RESTITUTION-ELEVE.md).

**Dernière vérification : 273 tests réussis et construction stricte réussie.** Le bouton de validation, le service de validation et la restitution élève ne sont pas activés en ligne ; l’accord Supabase reste nécessaire.

262 tests réussis après cet ajustement, construction stricte réussie et archives intactes. Activation Supabase toujours désactivée, conformément à la demande « avant de valider le bouton ».

Après « Préparer la correction », chaque réponse comporte un champ de points limité à son maximum et chaque question une appréciation facultative repliable. Les points d’une réponse déterministe ou d’une case reconnue sont préremplis et modifiables. Les réponses manuelles et les cases non reconnues restent sans points préremplis : le professeur les attribue après lecture, avec les suggestions sous les yeux. Le maximum des questions obligatoires doit totaliser 20.

Le total sur 20 apparaît en bas de la copie. Les virgules sont acceptées. Toutes les questions doivent recevoir des points valides, y compris un zéro décidé explicitement par le professeur ; un champ vide ne vaut pas zéro.

Le bouton **Valider la correction et verrouiller la copie** enregistre les points, les appréciations par question et le commentaire général, puis verrouille les réponses dans une seule transaction. Il est préparé mais désactivé tant que la modification Supabase n’est pas approuvée. La saisie visible actuellement reste un brouillon local, non sauvegardé ; avertissement lors d’un changement de copie ou d’un départ avec des points saisis.

Une correction validée est rechargée en lecture seule. Pour la modifier, rouvrir explicitement la copie : l’ancienne évaluation demeure dans l’historique, la note courante est retirée, puis une nouvelle validation crée une nouvelle évaluation. Cette réouverture est signalée avant l’action. Le tableau complet des notes et une page d’historique des rectifications restent des étapes ultérieures ; les données nécessaires seront conservées.

## Modification concrète soumise à validation

SQL préparé : [`09_notation.sql`](../_supabase/09_notation.sql).

- Ajouter `work_evaluations` : copie, professeur, version du cours, empreinte du corrigé, révisions des réponses, points/maxima et appréciations, total sur 20, participants et date. Aucun cours, énoncé, dictionnaire ou corrigé en base.
- Ajouter à `work_sessions` la version du cours et la référence de sa correction courante. Seul le pilote S02 connu est rattaché à v1 ; les autres séances restent sans version jusqu’à une intégration explicite.
- Ajouter une opération de validation réservée aux professeurs affectés à cette classe. Les écritures directes dans les évaluations sont interdites. Les fonctions privilégiées restent dans `refonte_private`, avec identité, rôle et affectation vérifiés ; le point d’entrée public reste `security invoker`.
- Activer la RLS sur les évaluations : professeur affecté pour les évaluations de son périmètre ; élève validé uniquement pour sa correction courante, individuelle ou collective, dont il est destinataire. Les anciennes évaluations restent consultables au professeur, sans être exposées comme note actuelle à l’élève. L’affichage de la note dans le tableau de bord élève reste à raccorder.
- Conserver les évaluations précédentes sans mise à jour ni suppression directe. Une copie collective reçoit une note commune pour ses participants acceptés au moment de la validation. Un invité en attente n’en est pas destinataire ; son acceptation est bloquée après validation tant que la copie n’est pas rouverte.
- Réutiliser le verrou existant des réponses pour vérifier les révisions et fermer la copie atomiquement. Une nouvelle réponse, une révision modifiée, une autre validation ou un changement de version rendent l’ancienne proposition non validable. Aucun effacement des données existantes.

Le service préparé `teacher-grade` réutilise la passerelle de correction actuelle : rôle professeur, affectations, copie de référence, RLS et lecture du fichier GitHub privé. Il recalcule les métadonnées depuis le fichier privé avant de vérifier les points choisis par le professeur, puis appelle l’opération SQL avec le JWT du professeur. Aucune clé privilégiée ni nouveau secret. Déploiement avec `verify_jwt: true` uniquement après accord.

Les professeurs affectés sont autorisés à attribuer manuellement les points : l’opération SQL calcule le total, exige des maxima totalisant 20 et vérifie les bornes et les révisions ; le service applique en plus la répartition exacte du barème privé. Les clients élèves ne sont autorisés à appeler aucune opération de notation avec succès.

## Vérifications

Structure distante relue sans modification : colonnes de copies actuelles, absence de table d’évaluations et de fonction de validation, présence du verrou `refonte_lock_work_answer` et des helpers de périmètre. Aucun contenu de copie d’élève n’a été lu pour cet audit.

Tests PostgreSQL locaux sur base fictive : élève/anonyme refusés, points hors limites et barèmes incomplets refusés, version/révisions périmées refusées, enregistrement note/commentaire et clôture atomiques, doublon de validation refusé, historique non modifiable, accès élève isolé, réponses verrouillées, réouverture et groupe avec consentement. Tests serveur et interface : barème privé, virgule, champs incomplets, brouillon conservé en erreur, compte modifié, résultat tardif, restauration d’une note validée et activation distante désactivée.

259 tests réussis, construction Jekyll stricte réussie et 374 archives intactes. Aucun test authentifié de validation en ligne : le service et la migration ne sont pas activés.

## Après accord

Appliquer la proposition SQL de manière transactionnelle après une dernière vérification des préconditions, contrôler les règles, déployer `teacher-grade` avec toutes ses dépendances et activer `grade_validation`. Exécuter ensuite les contrôles distants sans données d’élèves de test conservées, puis faire une recette avec une copie de test du professeur. Le site public reste à publier séparément, uniquement sur accord.
