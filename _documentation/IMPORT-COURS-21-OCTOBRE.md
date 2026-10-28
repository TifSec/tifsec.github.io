# Import des cours — préparation locale du 21 octobre 2026

## Décision et état

L’utilisateur a choisi « Conserver la préparation locale pour le moment ». Aucun nouveau YAML professeur n’a été envoyé sur GitHub, aucune activation Supabase et aucune publication de ce lot n’ont été effectuées. Le site de test reste dans son état publié précédent. L’ancien site et la branche main d’origine sont préservés.

Les sources ont été reprises depuis les pages actuelles de main, et non depuis les archives obsolètes. Les instantanés et outils de conversion sont conservés hors du dépôt public, dans le dossier de travail parent. Certains contiennent des commentaires de correction : ne jamais les publier.

## Inventaire

| Matière | Classe | Séances | Nombre |
| --- | --- | --- | ---: |
| Technologie | 5e | S01–S10 | 10 |
| Technologie | 4e | S01–S10 | 10 |
| Technologie | 3e | S01–S10 | 10 |
| TIM | 4e agricole | S01–S05 | 5 |
| TIM | 3e agricole | S01–S05 | 5 |
| TIM | CAPa 1 | S01–S02 | 2 |
| TIM | CAPa 2 | S01–S05 | 5 |
| TIM | Seconde | S01–S04 | 4 |
| TIM | Bac pro 1 | S01–S03 | 3 |
| TIM | Bac pro 2 / terminale | S01–S04 | 4 |
| TIM | BTS 2 | S01–S08 | 8 |
| Mathématiques | 4e agricole | S01–S08 | 8 |
| Mathématiques | 3e agricole | S01–S08 | 8 |
| Mathématiques | Bac pro 1 | S01–S02 | 2 |
| Mathématiques | Bac pro 2 / terminale | S00–S09 | 10 |

Total : **94 séances**, dont 64 MFR et 30 Technologie. Cela représente **91 nouvelles paires élève/professeur** ; les trois paires déjà validées (Maths terminale S05, TIM CAPa 2 S03 et Technologie 3e S10R) sont conservées.

La séance logique S02 de 3e utilise S02R ; S10 utilise S10R. Les anciens pilotes S02 et S10 restent disponibles avec leurs copies. Le catalogue local contient également les deux aperçus S11/S12, exclus du lot de publication et de la proposition d’activation. Aucun contenu seulement commenté de BTS 1 n’a été ressuscité ; la page Maths seconde ne proposait pas de séance active à importer.

L’inventaire détaillé se trouve dans [IMPORT-COURS-INVENTAIRE.yml](IMPORT-COURS-INVENTAIRE.yml).

## Séparation et fonctionnement

Les cours élèves sont dans `_data/cours/`, les routes dans `cours/`. Les 91 nouveaux fichiers professeur restent dans `../preparation-privee/`, hors du dépôt public. La proposition SQL `_supabase/13_import_cours.sql` n’est pas appliquée : elle ne contient que les identités et versions autorisées, aucun cours ni corrigé.

Les formules, démarches et résultats des exercices Calc/Excel sont recueillis sur le site ; les élèves pratiquent toujours dans leur logiciel et conservent leur classeur séparément. Aucun dépôt de fichier n’est ajouté.

L’affichage des documents illustrés a été ajouté au moteur existant avec échappement du contenu et images HTTPS. La progression tient maintenant compte du dernier cours fait en classe, même lorsque les séances antérieures figurent toutes dans le catalogue. Les copies antérieures restent consultables ; aucune séance n’est artificiellement déclarée terminée.

Repères Technologie : 5e S10, 3e S09 et 4e S08. Pour la 4e, S08 reste le repère commun prudent : le groupe 1 était à S09 et le groupe 2 à S08 ; le modèle actuel ne distingue pas ces deux groupes pour cette progression.

## Vérifications effectuées

- 406 tests réussis, aucun échec.
- 94 paires élève/professeur validées : 1 562 questions et 2 130 champs.
- Correspondance vérifiée entre les champs HTML générés et les clés de sauvegarde/correction, sans doublons.
- Comparaison automatique des 91 conversions avec les sources : 5 759 blocs visibles et 243 références de ressources, sans omission détectée par ce contrôle.
- Compilation Jekyll stricte réussie ; audit des 191 fichiers publics générés réussi, liens internes et exclusions vérifiés.
- Copie de déploiement préparée localement uniquement.

Ces contrôles ne constituent pas une recette connectée des nouveaux cours : leur sauvegarde, leurs corrigés et leur notation ne sont pas encore activés à distance. Les 243 ressources n’ont pas toutes été testées en navigation réelle ou derrière les filtres des établissements.

## Relecture nécessaire avant diffusion

La conversion conserve principalement les consignes, l’ordre et la longueur des cours sources. Elle ne constitue pas une réécriture pédagogique complète ni une garantie de tenue en 50 minutes pour toutes les séances de Technologie.

Les barèmes sur 20 sont des propositions pondérées selon les questions et tableaux, à relire avant validation. Les diagnostics gardent leur caractère diagnostique. Les réponses déterministes sont issues des réponses explicitement encodées dans les sources ; les autres questions restent à l’appréciation du professeur. Lorsque la source ne fournit pas de corrigé précis, les indications privées sont des critères de lecture, pas un corrigé expert exhaustif. Les longues notes originales restent disponibles dans les aides privées de préparation.

Les compétences textuelles des sources sont conservées ; aucun nouveau niveau de maîtrise n’a été inventé. Le rattachement fin aux référentiels et aux graphiques reste à compléter selon les cours.

Des illustrations et documents pointent encore vers l’ancien site avec une adresse absolue : conserver leur disponibilité lors du test.

## Reprise après accord explicite

1. Relire les cours et barèmes prioritaires et corriger les éventuels écarts.
2. Sur accord, envoyer les 91 nouveaux YAML professeur dans le dépôt privé.
3. Appliquer la proposition de versions reconnues et actualiser les catalogues des trois services protégés ; S11/S12 restent exclus.
4. Refaire la compilation et les contrôles, présenter le résultat puis publier uniquement le site de test selon l’accord donné.
5. Vérifier avec des comptes de test le chargement, la sauvegarde/restauration, les aides privées et la correction, sans modifier les anciennes copies.

Les outils locaux `verifier-import-complet.mjs`, `verifier-fidelite-import.py` et `verifier-rendu-import.mjs`, ainsi que les journaux de tests, restent dans le dossier parent. Ne pas relancer l’ancien générateur MFR : il remplacerait la S05 validée par une archive obsolète.
