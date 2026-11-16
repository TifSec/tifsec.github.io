# Interface des séances harmonisée avec l'accueil élève

20 octobre 2026. Demande du professeur : le cours doit être prioritaire, le bandeau reprendre celui de l'accueil et le choix des camarades s'ouvrir sur demande.

## Réalisation locale

- Bandeau commun `_includes/eleve/student-header.html`, utilisé par l'accueil et les cinq pages de cours. Logo, matières du profil, identité, établissement, classe et statut ; apparence et déconnexion. Lien « Mes séances » dans le cours. Le lien de connexion n'apparaît qu'en l'absence de session confirmée.
- Présentation du profil extraite dans `auth/profile-presentation.js`, sans décision d'autorisation. Le contrôleur de séance réutilise `checkSession` et le contrôle de déconnexion existants. Les vérifications simultanées profitent du regroupement existant ; aucun cache persistant de profil ajouté. Effacement de l'identité et fermeture du groupe au changement de session, réponses tardives ignorées.
- Styles communs du bandeau extraits de la feuille du tableau de bord. Nouvelle feuille par composant `cours/course-shell.css`, chargement dans le head avant les thèmes. Plus de bandeau générique listant toutes les matières dans les cours.
- Barre compacte de sauvegarde et de copie active, erreurs et boutons de reprise toujours disponibles. L'identité technique utilisée par la progression est conservée, sans affichage en double.
- Bouton « Travailler ensemble » visible quand les contrôles de groupe existants sont disponibles à l'élève. Panneau fermé au chargement, affiché par action explicite ; bouton « Revenir au cours » et touche Échap pour fermer. Focus clavier transmis au panneau puis rendu au bouton. Copie de groupe ou historique toujours indiqué dans la barre compacte. Les fonctions de groupe, leur consentement et les réponses ne sont pas modifiés.
- Progression à gauche sur grand écran. Liste des étapes repliée au démarrage sur petit écran et dépliable, pour réduire le volume avant le cours. Les choix d'ouverture ne changent qu'au passage d'un seuil de taille, pas à chaque saisie.

## Vérifications

**Retour du professeur après essai : « C'est vérifié, c'est beaucoup mieux. »** Présentation validée par l'utilisateur. Construction stricte finale réussie, 99 fichiers générés et 16 pages contrôlés, 374 archives intactes. Cette validation de l'interface ne constitue pas l'autorisation d'activer les corrigés S11/S12.

398 tests locaux réussis : identité commune et matière exacte, effacement à la déconnexion malgré une réponse tardive, groupe caché avant disponibilité et action explicite, restitution du focus, comportement mobile, absence de sélection pour professeur/compte en attente/anonyme. Tests existants de sauvegarde, partage, notes et auth conservés.

Construction stricte et contrôle du site généré à refaire après les derniers ajustements CSS. Contrôler les 16 pages, les liens et imports, et les 374 archives. La vérification navigateur a confirmé l'aperçu professeur et a révélé puis permis de corriger le contraste du bandeau sans thème. La recette connectée élève reste distincte des scénarios simulés : ne pas prétendre avoir créé un groupe ou testé une déconnexion réelle sans le faire.

Aucune migration, écriture de note/réponse pour la recette, publication GitHub Pages ni modification des droits dans ce lot. Les corrigés/versions de S11 et S12 restent au stade local choisi par le professeur ; cette harmonisation n'active pas leur raccordement distant.
