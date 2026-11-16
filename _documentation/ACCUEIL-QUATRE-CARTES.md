# Essai d’accueil en quatre cartes

Demande utilisateur : quatre petites cartes, informations minimales puis détails au survol en superposition. Les quatre entrées sont Le prochain pas, Mon espace de travail, Comprendre et progresser et Invitations à collaborer. Les repères restent à gauche. Cette demande remplace le placement précédent des invitations sous la colonne gauche.

Composant natif details/summary : boutons/liens dans le panneau, pas dans le résumé ; ouverture souris, clic/tactile et focus clavier. Une seule carte ouverte ; fermeture par sortie de survol si sans focus, bouton, Échap ou clic extérieur. Clic maintient l’ouverture pour interagir. Fermeture clavier restitue le focus sans rouvrir. Sur mobile, panneau superposé fixé à l’écran et hauteur bornée avec défilement ; sur ordinateur, panneau au-dessus de la grille. Réduction des animations respectée.

Les blocs existants et leurs identifiants sont réutilisés dans les panneaux : aucune duplication de données, aucune nouvelle requête, aucune modification Supabase ni des autorisations. Le lien depuis les retours ouvre la carte des séances avant de placer le focus. Résumés statiques ne prétendent pas signaler un état non lu ou un nombre d’invitations.

358 tests réussis, compilation stricte et intégrité vérifiées. Rendu sur navigateur utilisateur à confirmer, notamment survol/tactile et tous les thèmes. Aucun déploiement public.

## Interaction corrigée à la demande utilisateur
Le survol est abandonné : seule une activation explicite du résumé Ouvrir avec flèche ouvre la carte. Le focus seul ne l’ouvre pas non plus. Refermer avec flèche, Échap et clic extérieur ferment le panneau ; maintien de l’ouverture depuis le lien interne vers les séances. 13 tests ciblés réussis et compilation stricte vérifiée. Cette consigne remplace la description de survol précédente.
