# Groupes par séance et suivi professeur — lot activé

Évolution également validée et appliquée : [copie de référence et historique individuel](HISTORIQUE-DES-COPIES.md), migration `20261019131318`. Les règles de reprise et de classement ci-dessous ont été adaptées par ce lot.

État au 19 octobre 2026 : migration `refonte_groupes_et_suivi_professeur` **appliquée après validation explicite**, version Supabase `20261019124130`. `collaborative_work` et `teacher_tracking` sont activés localement sur `refonte-jekyll`, ainsi que la sauvegarde individuelle. Aucun déploiement, aucune fusion, aucune suppression de donnée.

`04_verification_suivi_transactionnelle.sql` a réussi sur la base hébergée : lecture professeur, périmètre affecté, commentaire visible par son destinataire, interdiction de modifier les réponses en tant que professeur, clôture/réouverture et refus anonyme. Le contrôle a été annulé par transaction : aucune copie de contrôle conservée, aucune réponse existante modifiée. Les séquences ont pu avancer. L’affectation effective est `college / techno / 3e` ; une copie S02 existait au contrôle. Il n’y a qu’un compte élève dans cette classe : la recette des invitations dans plusieurs navigateurs nécessite encore un deuxième compte fictif de 3e collège.

Le diagnostic de sécurité ne relève pas de nouvelle alerte sur ce lot. Restent les alertes préexistantes : [search_path de public.set_updated_at](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable), [protection contre les mots de passe compromis désactivée](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection) et `student_results` volontairement fermée sans politique. Aucun paramètre Auth n’a été changé.

## Fonctionnement proposé

- Depuis la séance, un élève choisit un ou deux camarades de sa classe et envoie les invitations. Une copie collective reprend désormais ses réponses enregistrées. Son individuel reste dans un historique en lecture seule.
- Les invitations apparaissent dans l’espace de chaque destinataire. Accepter ouvre l’accès à la copie commune ; refuser ne donne aucun accès et ne bloque pas l’autre invité. Personne ne peut répondre à la place d’un camarade.
- Un élève participe à un seul groupe accepté pour une séance donnée. Cette copie est son travail de référence ; son ancien individuel est consultable dans l’historique. Chaque autre séance a ses propres invitations et participants. Les anciens participants conservent leurs droits sur l’ancienne copie, même si leur classe change ensuite.
- Les réponses sont sauvegardées automatiquement. Les réponses communes se rafraîchissent toutes les cinq secondes lorsque la page est visible et sans brouillon local. Deux modifications concurrentes du même champ produisent un conflit explicite ; aucune fusion silencieuse ni écrasement du brouillon.
- Les liens vers les copies collectives acceptées restent dans l’espace élève, y compris après reconnexion. Le catalogue de séances et les cours restent dans les fichiers Jekyll ; la base conserve uniquement les identifiants de séance, les appartenances, réponses et éléments de suivi.
- Le professeur suit **matière → classe → séance → copie**. Il voit les participants, le nombre de champs renseignés et la dernière sauvegarde, consulte les réponses dans les composants du cours existant, écrit un commentaire visible des participants et termine ou rouvre une copie. Il ne modifie pas les réponses des élèves.

Le nombre de champs renseignés mesure une activité, pas une note ni une réponse correcte. Ce lot fournit la correction manuelle ; l’assistance automatique et les corrigés privés restent une étape distincte. Aucun corrigé n’est ajouté au dépôt public ni à Supabase.

## Changement Supabase approuvé et appliqué

Le script réutilise `work_sessions`, `work_answers` et `work_session_members`. Il ajoute deux tables : `teacher_class_assignments` (affectations administrées) et `work_feedback` (commentaires). Les nouveaux index servent à retrouver les copies et leurs participants. Les droits sur les profils ne sont pas modifiés.

Les politiques de lecture/écriture des réponses sont étendues aux seuls participants **acceptés** et aux professeurs affectés pour la lecture. Les adhésions, commentaires et clôtures passent par des opérations serveur contrôlant l’utilisateur connecté. Les fonctions privilégiées sont dans `refonte_private`, avec `search_path` fixé et contrôles explicites ; les interfaces publiques s’exécutent sans élévation de privilège. Ni les élèves ni les professeurs ne peuvent s’attribuer eux-mêmes une affectation ou modifier directement un consentement.

L’affectation initiale proposée concerne uniquement le professeur unique existant et **Technologie / collège / 3e**, où se trouve S02. Elle permet de suivre les copies individuelles déjà présentes de ce périmètre et les futures copies collectives. Le script s’arrête si plusieurs professeurs sont présents ou si les politiques du lot individuel ont changé. Les autres enseignements seront affectés explicitement ensuite, sans ouvrir un accès global à toutes les classes.

Contrôle de la base réelle effectué en lecture seule le 19 octobre : un professeur, aucune copie collective, aucune adhésion, nouvelles tables/schéma absents, cinq politiques attendues du lot individuel. Aucune donnée personnelle ni réponse n’est exportée pour ce contrôle.

La classe est déclarée à l’inscription puis contrôlée par le professeur. Le lot ultérieur [gestion des élèves](GESTION-ELEVES.md) ferme la modification personnelle de classe par l’API et impose la validation des nouvelles inscriptions avant le travail Jekyll ou les groupes. Les comptes existants conservent leur accès et sont signalés « à vérifier ». Le consentement individuel accepté reste nécessaire pour accéder à une copie collective.

## Validation et activation

Les tests locaux exécutent les vrais modules JavaScript avec une interface simulée et les politiques SQL dans PostgreSQL/PGlite sur des données fictives : acceptation/refus, tentative d’acceptation pour autrui, ancien groupe/nouvelle séance, autre classe, restauration, conflits, commentaires, périmètre professeur, clôture/réouverture et changements de compte. Ils ne valident pas encore les appels HTTP de la base hébergée ni une concurrence entre plusieurs connexions PostgreSQL réelles.

Résultats avant activation : **105 tests réussis, aucun échec** ; le contrôle transactionnel supplémentaire est également testé localement. Construction Jekyll stricte réussie après activation ; neuf pages, ressources et imports contrôlés, sept champs uniques sur S02, catalogue partagé valide et 374 fichiers d’archives vérifiés par empreinte. Archives, scripts SQL et tests absents du site généré. La recette complète dans plusieurs navigateurs reste à réaliser.

```text
node --experimental-vm-modules --test _checks/auth.test.mjs _checks/work.test.mjs _checks/work-ui.test.mjs _checks/collaboration-ui.test.mjs _checks/work-rls.test.mjs _checks/groups-rls.test.mjs
bundle exec jekyll build --strict_front_matter
```

Procédure d’activation et recette (étapes 1 et 2 terminées, drapeaux activés à l’étape 3) :

1. Recontrôler les politiques, droits, fonctions et affectations, puis appliquer le script par une migration Supabase identifiée.
2. Vérifier les accès sur la base hébergée avec des opérations de contrôle annulées en transaction et examiner les diagnostics de sécurité.
3. Activer localement les deux drapeaux, reconstruire et tester avec le professeur et deux ou trois comptes élèves fictifs de 3e collège, dans des navigateurs ou profils séparés.
4. Envoyer, refuser et accepter une invitation ; saisir des réponses communes, recharger et se reconnecter ; consulter puis commenter/terminer/rouvrir la copie depuis `/prof/suivi/`.
5. Vérifier le refus d’accès d’un non-participant, le comportement hors connexion et les conflits. Vérifier que les anciennes copies restent intactes.
6. Présenter les résultats avant toute publication.

Il n’y a pas encore de retrait, remplacement ou exclusion d’un membre d’un groupe déjà accepté. Un changement de partenaires sur une autre séance est indépendant. Une copie terminée reste consultable. Les réponses non envoyées restent dans la mémoire de l’onglet ; fermer de force cet onglet peut perdre ces seules modifications.

## Suspension

Remettre les drapeaux à `false` masque les fonctions dans l’interface mais ne révoque pas les droits serveur. `91_suspendre_groupes_et_suivi.sql` fournit une suspension complète testée : retrait des droits de table et de colonne, des droits d’exécution des nouvelles opérations et de l’accès au schéma privé, sans suppression des données. `90_suspendre_copies.sql`, écrit pour le lot individuel, ne suffit pas à suspendre les nouvelles opérations privilégiées. La réouverture devra être revue explicitement ; ne pas réexécuter le lot 03 à l’aveugle.
