# Réalisation du premier lot — 19 octobre 2026

Travail sur `refonte-jekyll`, sans publication du site, sans fusion vers sa branche `main` et sans modification distante des tables, politiques ou données Supabase. Mise à jour du raccordement : passerelle `teacher-course` déployée en version 1, authentification obligatoire ; refus HTTP 401 des appels anonymes et faux jetons vérifié. Dépôt privé confirmé et fichier fictif créé. Secret de lecture et recette professeur/élève encore nécessaires ; drapeau du site désactivé. Les constats « non déployé » ci-dessous décrivent l’état initial du lot.

## Disponible localement

- `/eleve/` : bandeau avec identité, établissement, classe, statut d’inscription et déconnexion ; repères à gauche, séances intégrées au centre, invitations conservées. Lecture des copies sous les RLS existantes, sans écriture lors de la consultation. Le catalogue grandira avec les imports ; pour l’instant seul S02 de Technologie 3e est intégré.
- Avancement : une réponse enregistrée non vide commence le travail ; la clôture professeur marque ici la séance terminée. Le groupe de référence remplace l’individuel historique dans les compteurs. Les retours professeur sont présentés sans être assimilés automatiquement à une erreur ou à un acquis. Les anciens travaux accessibles restent visibles si leur séance est au catalogue.
- Cours : layout commun `_layouts/cours.html`, identité portée par les métadonnées de page ; introduction, sens, application quotidienne, démarche, activités, aides et synthèse issus du YAML. Progression latérale sur grand écran, au-dessus sur petit écran. Les champs facultatifs sont exclus du décompte obligatoire. Les types nombre et QCM à choix unique réutilisent des valeurs texte pour la sauvegarde existante ; pas encore de vérificateur.
- S02 : explications enrichies et synthèse affichée, sept identifiants de réponse préservés. Ce pilote technique n’est pas présenté comme une nouvelle séance complète de 50 minutes déjà adaptée au BO ; cette adaptation pédagogique reste à réaliser dans un lot de contenus.
- `/prof/cours/` : séances filtrées sur les affectations du professeur, cours élève en consultation et notes privées dans un panneau séparé, avec bouton d’effacement. Accès privé désactivé par défaut, sans faux corrigé de démonstration affiché comme réel.
- Passerelle : `_supabase/functions/teacher-course/`, contrôles Auth/rôle/affectation avant GitHub, dépôt obligatoirement privé, chemins contrôlés, YAML limité et validé, aucun contenu mis en base ou journalisé. Secret GitHub serveur uniquement. **Code non déployé**, aucune fonction distante existante lors de la vérification.

Les fichiers `.env` sont désormais ignorés par Git. Aucun secret n’a été créé ou enregistré dans ce lot.

## Vérifications

- 167 tests JavaScript/PostgreSQL local réussis : anciens parcours, politiques RLS, sauvegarde, consentement, historique, validation des élèves et 31 nouveaux tests des repères, de la progression et de l’accès privé.
- Construction Jekyll stricte réussie ; 4 contrôles supplémentaires de sortie générée et contrôle existant des ressources, des sept champs et des 374 archives.
- Rendu en mémoire du gabarit pédagogique fictif : nombre, QCM, texte, activité facultative, démarches en étapes et bilan. Aucune nouvelle page de test publiée.
- Contrôle navigateur du pilote sans session : contenu lisible, progression présente, champs de réponse désactivés. Les comportements authentifiés nouveaux sont testés avec données simulées, pas encore validés en navigateur avec les comptes réels.
- Passerelle : tests locaux du cœur et du parseur ; ni exécution Deno distante ni recette Auth/GitHub réelle à ce stade.

Commandes locales : `node --experimental-vm-modules --test _checks/*.test.mjs` (après construction pour les tests de sortie), `ruby -S bundle exec jekyll build --strict_front_matter`, `ruby -S bundle exec ruby _checks/render-course-fixture.rb`. Dépendances de test épinglées dans `_checks/package.json` et `_checks/pnpm-lock.yaml`.

## Prochaine étape nécessaire

Configurer le dépôt GitHub privé et son secret de lecture, puis vérifier les quotas et déployer/tester la passerelle selon [le guide de configuration](../_supabase/functions/teacher-course/README.md). L’utilisateur ne devra pas communiquer le secret dans la conversation ; la saisie se fera directement dans les interfaces sécurisées.

Ensuite : premier parcours de vérification formative et correction déterministe, critères/barèmes, proposition de note et validation exclusivement professeur, tableau de notes et statistiques fondées sur ces évaluations. Préparer toute évolution de schéma et ses tests avant validation/application.

Enfin, importer progressivement les cours adaptés, avec correspondance aux textes officiels et continuité des séances. Technologie : 50 minutes pédagogiques complètes après les 5 minutes d’installation/appel, en comptant lecture, réflexion, recherche, réponses et synthèse. Repères réels : 3e S09 ; 4e groupe 1 S09 ; groupe 2 S08 ; 5e S10. Revoir aussi les séances antérieures sans réinterpréter les copies existantes.
