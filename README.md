# Portail pédagogique Jekyll

**Point de reprise actuel :** [référence du moteur de cours et état du projet](_documentation/REFERENCE-ET-REPRISE.md). Ce document distingue les fonctionnalités réalisées, la cible pédagogique et les décisions encore à valider.

L’espace professeur utilise une navigation commune « Enseignements · Élèves et inscriptions · Copies et corrections ». Les styles restent isolés par composant professeur : filtres regroupés, statuts d’inscription, copies individuelles/collectives/historiques distinctes et dispositions adaptées aux petites largeurs. Ce lot de présentation ne modifie aucune règle Supabase. Vérification visuelle sur ordinateur avec données fictives et 59 tests des parcours concernés réussis ; aucun aperçu de test supplémentaire n’est conservé dans le site.

Branche de refonte : `refonte-jekyll`. La branche `main` n’est pas modifiée par cette réorganisation.

## Organisation

- `_layouts/` : structures communes des pages.
- `_includes/` : composants HTML réutilisables.
- `_data/` : référentiels et contenu pédagogique YAML.
- `_supabase/` : règles d’accès appliquées après validation, audit et vérifications transactionnelles.
- `_checks/` : tests techniques, exclus du site généré.
- `assets/css/` : styles par composant.
- `assets/js/` : JavaScript par fonctionnalité.
- `connexion/`, `eleve/`, `prof/`, `cours/` : pages du nouveau site.
- `images/` et `favicon.png` : ressources communes conservées.
- `_archives/ancien-site/` : anciennes pages, scripts et documents conservés pour la migration.
- `_archives/prototypes/` : prototype de contrôle d’accès remplacé par le layout professeur commun.

Les pages « test » réutilisables ont été renommées plutôt que dupliquées. La connexion accepte un identifiant existant ou une adresse e-mail, charge le profil et oriente vers l’espace correspondant. Le portail élève affiche l’identité, l’établissement et la classe. Les espaces réagissent aux changements de session et proposent la déconnexion du navigateur courant. Le parcours professeur a été vérifié manuellement par l’utilisateur (connexion, rechargement, déconnexion entre onglets et retour arrière).

L’inscription élève est raccordée : prénom, nom, établissement, classe, identifiant et confirmation du mot de passe. Le rôle envoyé est toujours `student`. Le profil est inséré uniquement pour l’utilisateur vérifié, sans mise à jour ni remplacement d’un profil existant. Une inscription interrompue peut être reprise après connexion, sans recréer le compte. L’identifiant choisi manuellement n’est plus écrasé lorsque le nom change.

Les parcours professeur et élève (inscription, profil, reconnexion), puis la sauvegarde et la restauration des réponses sur S02 (3e collège), ont été confirmés par l’utilisateur. Les règles Supabase des copies individuelles ont été appliquées après validation et vérifiées par des opérations de contrôle annulées en fin de transaction. Voir [_supabase/README.md](_supabase/README.md) pour les contrôles et la procédure de suspension.

Priorité actuelle : travail en binôme/trinôme par séance et suivi professeur. Les deux fonctionnalités sont activées localement après validation explicite et application de la migration Supabase `20261019124130` : invitations/consentement, copie commune, commentaires et clôture/réouverture. Le contrôle transactionnel du suivi a réussi sur la base hébergée, sans conserver de copie de contrôle ni modifier les réponses existantes. Voir [_supabase/GROUPES-ET-SUIVI.md](_supabase/GROUPES-ET-SUIVI.md). Le professeur est affecté à Technologie / collège / 3e ; la recette dans plusieurs navigateurs reste à réaliser avec un deuxième compte élève de cette classe. Le suivi utilise les composants de cours déjà présents ; une seule nouvelle page fonctionnelle, `/prof/suivi/`, est ajoutée. Aucun cours de l’ancien site n’a été migré ; cette migration est reportée, ainsi que la correction automatique et les corrigés privés.

## Construire le site

La [gestion des élèves et inscriptions](_supabase/GESTION-ELEVES.md) est activée dans `/prof/eleves/` : douze classes collège/MFR, validation des nouveaux comptes, correction d’affectation par le professeur et interdiction des changements de classe personnels. Les comptes existants gardent leur accès et apparaissent « à vérifier ». Migration appliquée : `20261019132537`.

Le collectif est maintenant la **copie de référence** de chaque participant pour sa séance. Les individuels précédents restent dans un **historique en lecture seule**, accessible à leur propriétaire et au professeur affecté. Un nouveau groupe reprend les réponses enregistrées de son créateur. Le lot `20261019131318` est appliqué et vérifié, sans modification des réponses existantes ; voir [_supabase/HISTORIQUE-DES-COPIES.md](_supabase/HISTORIQUE-DES-COPIES.md).

Depuis la racine du dépôt :

```text
bundle exec jekyll build
bundle exec jekyll serve
```

`_site/` est le résultat généré par Jekyll : les modèles, données et ressources y sont assemblés pour obtenir le site publiable. Ce dossier est recréable, ignoré par Git et ne doit pas être édité à la main. Il ne représente pas une seconde version des sources à maintenir.

`_archives/` est explicitement exclu dans `_config.yml`. Il ne doit jamais apparaître dans le résultat généré. Il reste néanmoins visible aux personnes ayant accès au dépôt Git ; ce n’est pas un stockage privé pour les corrigés.

## Vérification de la connexion

Tests locaux sans accès à Supabase et sans création de compte :

```text
node --experimental-vm-modules --test _checks/auth.test.mjs
```

Les tests exécutent les vrais modules du site avec un service et une interface simulés. Ils couvrent les rôles, les erreurs de connexion/profil, les changements de compte, les réponses tardives après déconnexion, le retour depuis le cache du navigateur, l’inscription, les doubles soumissions, les profils incomplets et les doublons de profil. Ils ne remplacent pas une vérification avec les comptes réels ni un audit RLS.

Après `bundle exec jekyll serve`, ouvrir `http://127.0.0.1:4000/connexion/` dans un navigateur normal :

1. Se connecter avec le compte professeur existant et vérifier son nom sur le tableau de bord.
2. Recharger la page : l’identité doit être retrouvée.
3. Ouvrir le même espace dans un deuxième onglet, puis se déconnecter dans le premier : l’autre onglet doit masquer le profil.
4. Revenir en arrière après déconnexion : le profil ne doit pas réapparaître.
5. Essayer un mot de passe erroné : une erreur doit s’afficher sans ouvrir l’espace.

Pour la recette élève : se déconnecter du compte professeur, recharger `/connexion/`, créer un compte avec une identité fictive et un identifiant inédit, vérifier l’identité/établissement/classe, puis se déconnecter et se reconnecter avec cet identifiant. Vérifier aussi le refus d’accès à `/prof/`. Ne pas communiquer de mot de passe ou de clé privée dans les comptes rendus.

Les réglages publics Auth ont été lus le 19 octobre 2026 : inscription et fournisseur e-mail activés, confirmation automatique activée. Aucun paramètre ni politique Supabase n’a été modifié et aucun compte n’a été créé par les tests. Si ces réglages changent, l’absence de session après inscription est signalée sans tentative d’écriture anonyme du profil. Les données de profil envoyées en métadonnées servent à la reprise ; leur éventuel champ `role` ne sert jamais à autoriser l’accès, qui repose sur `profiles.role` et les règles serveur existantes.

Références du SDK : [getUser](https://supabase.com/docs/reference/javascript/auth-getuser), [signUp](https://supabase.com/docs/reference/javascript/auth-signup), [onAuthStateChange](https://supabase.com/docs/reference/javascript/auth-onauthstatechange), [signOut](https://supabase.com/docs/reference/javascript/auth-signout).

## Migration des archives

L’inventaire `_archives/inventaire-ancien-site.json` indique, pour chaque fichier de l’ancien site, son chemin d’origine, sa destination et son empreinte SHA-256. Les contenus ont été déplacés sans modification. Les anciens liens absolus ne sont pas réécrits : ces archives servent de références pour la migration, pas de site autonome.

Les archives pourront être supprimées après adaptation et vérification de leur contenu, avec accord explicite. Aucune donnée Supabase n’est modifiée par cette organisation. Toute publication ou fusion vers `main` nécessite une validation préalable.
