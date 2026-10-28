# Apparence personnelle de l’espace élève

20 octobre 2026. Sélecteur Apparence sur accueil et cours : Océan, Forêt, Prune, Terre cuite. Fond, carte prochaine séance, liens et accents de navigation ; messages de correction, erreurs et succès inchangés. Aucun contenu ou suivi modifié.

Le compte Auth Supabase conserve uniquement la clé user_metadata.student_theme via auth.updateUser({ data: { student_theme } }). Lecture depuis l’utilisateur vérifié par le mécanisme de session existant. Cela suit le compte entre ordinateurs, sans dépendre d’un stockage local et sans table, migration, droit ou RLS supplémentaire. Cette métadonnée modifiable n’est jamais une source d’autorisation. Ni mot de passe, ni email, ni rôle ne sont modifiés ; aucun objet complet de métadonnées client n’est réécrit.

Palette limitée à quatre identifiants ; toute valeur inconnue revient à Océan. Valeur confirmée par la réponse serveur avant application et message de succès. En échec, ancienne couleur et bouton Réessayer. Déconnexion et changement de compte effacent le thème ; résultats tardifs ignorés. Mise à jour Auth reçue par les mécanismes existants de revalidation du profil et des copies. Le professeur garde son propre affichage.

346 tests réussis dont huit nouveaux : restauration, sauvegarde, refus des valeurs inconnues, réseau, changement de compte, déconnexion pendant enregistrement, écritures concurrentes, contrastes principaux au moins 4,5:1. Compilation stricte et 14 pages/374 archives vérifiées. Aucun compte réel modifié par l’agent ; essai authentifié entre deux navigateurs/ordinateurs à confirmer par le professeur. Aucun déploiement public.

Référence officielle : https://supabase.com/docs/reference/javascript/auth-updateuser (mise à jour des métadonnées utilisateur). Journal officiel consulté ; aucun changement pertinent identifié pour cet usage.

## Extension des palettes et néon

À la demande du professeur : ajout Rubis, Ardoise, Minuit, Rosée et Néon, soit neuf palettes. Bandeau, boutons, surfaces, tableaux et champs harmonisés ; Minuit et Néon sombres. Sauvegarde existante identique, aucune migration. Les couleurs sémantiques de correction et d’erreur restent lisibles dans leurs encadrés.

Néon : contour RGB par dégradé conique, rotation CSS sur sept secondes, lumière douce sur les commandes ; texte immobile. Pause disponible dans Apparence et arrêt automatique avec prefers-reduced-motion. Sur navigateur sans animation des propriétés CSS enregistrées, contour multicolore statique. Aucun script d’animation, image distante ou requête supplémentaire. Pause valable sur la page courante ; seul le choix du thème est sauvegardé dans le compte.

348 tests réussis, compilation stricte et intégrité vérifiées ; rendu visuel réel à confirmer sur l’appareil de l’utilisateur, le navigateur de contrôle ne pouvant pas joindre le serveur local lors du lot précédent. Aucun déploiement.

Correction après capture utilisateur : la spécificité maximale de :is() faisait gagner le fond blanc des panneaux sur le fond de la prochaine séance, et les boutons génériques sur le filtre actif. Sélecteurs rééquilibrés, métadonnée matière claire explicitement sur la carte prioritaire. Compilation stricte, dix tests de thèmes et intégrité réussis ; rendu sur écran utilisateur à reconfirmer.

## Ambiances Cyberpunk, Minecraft et Farming

Trois thèmes supplémentaires autorisés par l’utilisateur, douze au total. Cyberpunk sombre avec grille, jaune signal, accents cyan/rose et angles techniques ; Minecraft clair avec damier discret, boutons en relief et décors herbe/terre ; Farming clair avec sillons, vert agricole, beige et or. Décors originaux uniquement en CSS, aucun logo, image de jeu ou police externe. Zones de lecture unies et décors masqués sur petit écran.

Styles séparés dans assets/css/eleve/student-theme-worlds.css, chargés après les thèmes communs sur accueil et cours. Même préférence de compte, aucun nouvel appel ou changement de base. Tests existants étendus aux douze identifiants et contrastes principaux. 348 tests réussis, compilation stricte et intégrité vérifiées ; rendu réel à confirmer par l’utilisateur. Aucun déploiement.

## Espace professeur
À la demande de l’utilisateur, sélecteur Apparence commun ajouté au bandeau professeur. Douze thèmes, contrôleur réutilisé avec rôle teacher sur le layout professeur ; préférence student_theme du compte connecté conservée pour compatibilité, aucune nouvelle table ni API. Identité et rôle restent contrôlés séparément. Adaptation CSS du bandeau, navigation, cartes et commandes ; surfaces de correction conservées lisibles. 354 tests réussis, compilation stricte et intégrité vérifiées. Essai authentifié de sauvegarde/restauration professeur à confirmer ; aucun déploiement.
