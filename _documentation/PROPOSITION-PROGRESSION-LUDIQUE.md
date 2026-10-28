# Proposition : personnage et progression ludique

Document de conception préparé le 22 octobre 2026. Rien de ce document ne change Supabase ou la publication.

## Direction visuelle des cours

Présenter chaque séance comme un parcours d'étapes visuelles : objectif de mission, repères du cours, exemple lorsqu'il existe, activité à accomplir et étape suivante. Garder les réponses saisies et le contenu au centre. Utiliser des cartes, balises, parcours et schémas lisibles, avec animations légères et réglage de mouvement réduit. Les thèmes choisis par l'élève colorent aussi le cours. Un décor ne doit pas gêner la lecture ni cacher une consigne.

## Personnage de l'élève

- Créer un avatar en SVG avec quelques formes et couleurs choisies par du JavaScript déterministe. Aucun fichier image n'est généré ni téléversé. Le compte détermine une base stable ; l'élève pourrait débloquer des variantes de couleur, accessoires ou expressions.
- Afficher à côté du personnage un niveau, l'expérience, la prochaine récompense et les objectifs de compétence déjà présents dans l'espace élève.
- Faire de l'expérience une mesure de travail et de progression, pas une note ni une comparaison entre élèves. Aucun classement public.
- Continuer à autoriser l'accès aux copies, au cours et aux aides quelle que soit l'expérience, la note ou le thème choisi.

## Calcul proposé pour l'expérience

Garder deux sources compréhensibles :

1. **XP de participation :** petite récompense quand l'élève remet une séance avec ses réponses obligatoires renseignées. Calculée une seule fois par copie de séance. Aucun bonus pour se connecter ou répondre vite.
2. **XP de progression :** points attribués sur les corrections que le professeur a validées. Ainsi les réponses justes et le travail personnel sont valorisés sans envoyer de corrigé au navigateur de l'élève. Pour une copie de groupe, les participants reconnus dans l'évaluation reçoivent le même nombre de points de groupe ; le graphique continue à distinguer les résultats collectifs des résultats individuels.

Valeur de départ à valider : 20 XP pour une séance remise et 5 XP par point sur 20 après correction validée. La participation représente l'effort ; les points corrigés représentent les réponses et compétences reconnues. Le professeur peut corriger la copie sans que les élèves aient à attendre pour poursuivre leurs séances.

L'XP de correction est calculée à partir de l'évaluation actuellement validée. Si le professeur rouvre et corrige de nouveau une copie, cette valeur peut évoluer avec la correction. Une expérience qui ne baisse jamais demanderait un historique de récompenses séparé, donc une évolution de la base à examiner et à approuver. Aucun tel historique n'est prévu dans cette proposition.

## Récompenses proposées

- Thèmes déjà existants débloqués par paliers d'expérience. Garder le thème actuel de chaque élève disponible pendant la transition.
- Variantes d'avatar générées en SVG/CSS aux mêmes paliers, plutôt que stocker des images.
- Insignes de régularité liés aux séances successives remises (par exemple 3, 5 puis 10), sans série quotidienne ni sanction pour absence.
- Seuils à ajuster avec l'enseignante afin que les récompenses arrivent régulièrement au cours de l'année et restent accessibles à ceux qui progressent lentement.

## Données et protection

Le tableau de bord lit déjà les copies de l'élève, les remises et les notes validées auxquelles il a droit. Le total d'expérience pourrait être calculé sans stocker de cours, de corrigé, d'image ou de réponse supplémentaire. Les notes de groupe restent identifiées comme collectives. Les avatars et thèmes sont cosmétiques ; ils ne donnent accès à aucune séance, copie, classe, note ou fonction professeur.

La préférence de thème est déjà mémorisée dans `user_metadata`. Une préférence d'avatar pourrait y être mémorisée comme un petit identifiant de variante, jamais comme une image. Ce champ modifiable par son propriétaire ne doit jamais servir à vérifier une note, une autorisation ou un droit d'accès. Si l'enseignante demande un compteur d'XP figé, un historique de récompenses ou des règles que l'élève ne peut pas contourner, cela exige une nouvelle architecture serveur et des règles RLS à concevoir avec son accord explicite.

## Étapes

1. Valider les règles de gain d'XP et les seuils de récompense.
2. Préparer une maquette locale de l'espace élève et des cours, sans migration de base.
3. Vérifier les résultats sur des données de test et contrôler qu'un élève ne lit jamais les données d'un autre.
4. Examiner séparément les éventuels changements Supabase avant de les appliquer.
5. Faire valider la maquette avant publication.
