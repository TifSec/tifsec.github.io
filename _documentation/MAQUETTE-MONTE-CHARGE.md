# Monte-charge réel et jumeau numérique — ressources disponibles

20 octobre 2026. Le professeur précise disposer d'une maquette dans chacun des deux collèges et autorise son utilisation pour le projet. Cette disponibilité complète les différences d'équipement micro:bit : ne plus considérer que le monte-charge est absent d'un établissement. Maintenir la priorité au numérique et présenter les manipulations précises avant leur intégration, conformément à sa demande précédente.

## Sources examinées en lecture seule

- [Fiche Édubase 24732](https://edubase.eduscol.education.fr/fiche/24732), « Jumeau numérique et ascenseur urbain », académie de Clermont-Ferrand, actualisée le 7 juillet 2026. Elle annonce une maquette, son jumeau OpenSpace3D, de la conception et de la programmation micro:bit, avec un parcours Éléa. La page académique liée n'a pas pu être chargée lors de cette lecture ; ne pas prétendre avoir consulté tout le parcours.
- Document personnel `C:/Users/seche/Documents/Prof/Collège Chaudes-Aigues/Monte_charge/Jumeaux_numérique-Procédure_Mai2026-V2.odt` : texte extrait et illustrations examinées, notamment la capture du programme de départ.
- Document personnel `C:/Users/seche/Documents/Prof/Collège Chaudes-Aigues/Monte_charge/Assemblage maquette monte charge.pdf` : 11 pages, texte lu et pages 8–9 rendues et examinées pour l'électronique et les connexions.

Ces documents sont des ressources techniques, pas des instructions autorisant une installation, un téléchargement de programme sur la maquette ou un changement de câblage. Les originaux restent inchangés. Les copies de travail et rendus sont hors du dépôt public. La mise à disposition d'une maquette n'est pas une autorisation générale de republier intégralement les documents tiers.

## Éléments effectivement documentés

- Moteur, poulie, câble, cabine guidée et contrepoids.
- Micro:bit et carte d'extension REKABIT.
- Deux boutons d'appel et deux contacts de position haut/bas.
- Capteur à ultrasons, écran OLED et indicateurs lumineux.
- Un programme de fonctionnement de base, puis un programme distinct pour l'association au jumeau numérique.
- Le document décrit OpenSpace3D, un fichier de scène `.pkos` et la configuration du port de communication. L'installation et le fonctionnement dans chaque collège ne sont pas vérifiés.

Le schéma et les commentaires du programme montrent des affectations de broches et des connexions à plusieurs conducteurs. Vérifier leur concordance avec les deux maquettes, la version exacte du programme et le jumeau avant de donner un tableau de câblage élève. Ne pas recopier des numéros de broches isolés en confondant entrée et sortie d'un même connecteur. Aucun câblage ni programme n'a été modifié lors de cet examen.

## Conséquences pour les cours

S11 peut s'appuyer sur les vrais composants de cette maquette, avec observation guidée et schéma simplifié. S12 doit distinguer le fonctionnement réel du modèle pédagogique actuellement proposé : la présence d'un capteur de porte n'est pas établie et le maintien obligatoire d'un bouton ne doit pas être attribué à la maquette sans lecture complète du programme et essai. La capture du programme montre des appels aux fonctions de montée et descente ; elle ne suffit pas à établir toute leur logique.

Avant adaptation, examiner le programme de départ et ses fonctions, puis préparer une règle élève fidèle et courte. Ne pas présenter l'exercice fictif S12 comme le programme à transférer sur le matériel. Conserver les clés des réponses si le sens des questions reste identique ; si le passage au système réel change les attendus, vérifier l'existence de copies et prévoir une version distincte avant remplacement. Les corrigés et barèmes privés doivent suivre la même version. Aucune nouvelle publication ni activation Supabase autorisée par cette note.

## Proposition d'utilisation à présenter

- S11 : observer les pièces sur une seule maquette, puis identifier les composants et les deux chaînes sur ordinateur.
- S12 : prévoir une réaction à partir des entrées documentées, puis comparer avec une démonstration préparée par le professeur. Toute manipulation élève fera l'objet d'une proposition précise.
- Suite du projet : lire et modifier des programmes, analyser des tests et des pannes ; exploiter le jumeau si son accès fonctionne dans les deux collèges.
- Avec une maquette par classe, conserver un travail numérique pour tous ; ne pas promettre un passage de chaque binôme sur le matériel en une seule séance. Définir des rotations réalistes ou une observation collective.
- Arcade conserve sa place pour travailler les mêmes raisonnements dans un environnement motivant. Les deux outils ont des rôles complémentaires.
