# Technique

- Un site statique : des fichiers générés à la construction, sans code
  serveur.
- Générateur : Eleventy 3.x, en modules ECMAScript, avec des modèles
  Nunjucks.
- Exécution : une version LTS de Node.js, avec npm.
- Styles : CSS simple, sans étape de construction.
- Organisation : sources dans `src/`, site généré dans `_site/`.
- Une page est un fichier Markdown de `src/`, hors ceux de
  `realisations/` : son URL est formée de son dossier
  et de son nom de fichier, sans extension. `index.md` est écrit dans
  `_site/index.html` et sert `/` ; `topic/page.md` est écrit dans
  `_site/topic/page/index.html` et sert `/topic/page`.
- Les pages sont mises en page par des gabarits Nunjucks, dans
  `src/_includes/`. Le gabarit de base porte la balise viewport.
- Les informations communes du site sont dans le répertoire `src/_data`
- Images : `@11ty/eleventy-img`, qui produit chaque photo en WebP et en
  JPEG, en plusieurs largeurs, avec ses dimensions et un chargement
  différé. Il les écrit dans `.cache/`, que git ignore et que les
  constructions gardent : une photo déjà produite n'est pas refaite.
  Chaque construction copie dans `_site/img/` les fichiers de ce cache
  que les pages construites utilisent.
  Chaque image annonce par `sizes` la largeur où elle s'affiche, et les
  largeurs produites en sont proches, jusqu'à une densité d'écran de 3.
- Commandes : `npm run build` génère le site ; `npm start` le sert en
  local avec rechargement, sur `http://localhost:8080`.
- Les messages vus par l'utilisateur ne sont pas spécifiés.
- Les séances viennent de l'API v2 de TiBillet, lue seulement, à la
  construction : les évènements par `GET /api/v2/events/?only_futur=1`,
  les réservations d'un évènement par
  `GET /api/v2/reservations/?event=<identifiant>`, avec l'en-tête
  `Authorization: Api-Key <clé>`.
- L'adresse de TiBillet et la clé sont les variables d'environnement
  `TIBILLET_URL` et `TIBILLET_API_KEY`, lues aussi dans le fichier
  `.env` à la racine, que git ignore.
- `TIBILLET_FICHIER`, variable d'environnement lue aussi dans `.env`,
  désigne un module JavaScript local qui tient lieu de TiBillet : il
  exporte par défaut les évènements et les réservations, au format des
  réponses de l'API ; la forme qui les réunit est libre.
- Des réservations, la construction ne garde que leur nombre de
  billets : aucune donnée personnelle n'est écrite, ni dans `_site/` ni
  ailleurs.

## Hébergement et déploiement

- Le site est publié sur GitHub Pages, depuis le dépôt public
  `lafab-org/new_website`, à l'adresse `https://nouveau.lafab.org/`,
  servi à la racine du domaine.
- Un workflow GitHub Actions déploie le site : à chaque push sur
  `main`, chaque jour à 3 h UTC (4 h ou 5 h à Paris), et à la demande
  depuis l'onglet Actions.
- Il lance `npm test`, construit le site avec l'API de TiBillet, en
  vérifie le contenu par `npm run verifier`, puis le publie. Il garde
  `.cache/` d'un déploiement à l'autre. Si une étape
  échoue, ou si l'adresse ou la clé de TiBillet manque, rien n'est
  publié et la version précédente reste en ligne.
- La CI a sa propre clé TiBillet, dans le secret `TIBILLET_API_KEY` du
  dépôt ; `TIBILLET_URL` est une variable du dépôt.
- Quand GitHub suspend la tâche quotidienne faute d'activité sur le
  dépôt, elle est réactivée à la main.

## Édition du contenu

- Le contenu se modifie dans le dépôt, directement ou par Pages CMS,
  dans sa version hébergée, `app.pagescms.org`, par son application
  GitHub installée sur le dépôt.
- `.pages.yml`, à la racine du dépôt, déclare ce que Pages CMS modifie :
  pour chaque sorte de contenu, ses fichiers, ses champs sous leurs noms
  du front matter, et son dossier de médias. Le corps d'une page se
  modifie dans l'éditeur riche de Pages CMS, qui l'enregistre en
  Markdown.
- Le corps d'une page est du Markdown seul, sans code de gabarit : ce
  que le site calcule, les gabarits le placent.
- Les éditeurs sans accès au dépôt y sont invités par courriel, comme
  collaborateurs de Pages CMS.
- Chaque modification est un commit sur `main`, au nom et au courriel de
  l'éditeur, qui lance le déploiement.

## Édition des actualités

- Un article se crée, se modifie et se supprime dans Pages CMS.
- À sa création, son fichier est nommé `<AAAA-MM-JJ>-<titre>.md`, par
  le jour de sa création et son titre ; ce nom ne change plus ensuite.
- Ses photos vont dans `src/actualites/photos/`.

## Édition des réalisations

- Une réalisation se crée, se modifie et se supprime dans Pages CMS.
- À sa création, son fichier est nommé `<AAAA-MM-JJ>-<titre>-<auteur>.md`,
  par sa date, son titre et son auteur ; ce nom ne change plus ensuite.
- Ses photos vont dans `src/realisations/photos/`.

## Édition des évènements

- Une page d'évènement se crée, se modifie et se supprime dans Pages
  CMS.
- À sa création, l'éditeur nomme son fichier `<nom>.md` ; ce nom ne
  change plus ensuite.
- Sa couverture et les images de son corps vont dans
  `src/evenements/photos/`.

## Édition des pages et des ateliers

- Les pages de la racine de `src/` et les ateliers se modifient dans
  Pages CMS, sans création ni suppression.
- Les blocs de la page d'accueil se modifient dans Pages CMS : l'éditeur
  en ajoute, en retire et les ordonne, et choisit la page d'un bloc
  `section` parmi les pages de la racine de `src/`.
- Les images des pages de la racine vont dans `src/photos/`, celles des
  ateliers dans `src/ateliers/photos/`.

## Vérification du contenu

- Le contenu est ce que les éditeurs modifient, dans le dépôt ou par
  Pages CMS : les fichiers Markdown de `src/`, front matter compris, et
  les images de leurs dossiers `photos/`. Le reste du dépôt est le
  code, que seul un incrément change. Les évènements de TiBillet sont
  aussi du contenu, modifié dans TiBillet.
- `npm run verifier` vérifie le contenu du site déjà construit : il lit
  `src/` et `_site/`, sans construire le site, et sans dépendance
  supplémentaire.
- Il vérifie chaque invariant étiqueté de `model.md`, sur les pages
  énumérées sur `src/`, hors les fichiers des réalisations et ceux des
  articles non publiés le jour où il s'exécute, chacune lue dans son
  fichier de `_site/`, et sur les fichiers de `src/`, ceux de données
  compris. Chaque vérification cite, en commentaire, le chemin de
  l'invariant qu'elle vérifie. Les liens externes ne sont pas
  vérifiés.
- Il rapporte tous les problèmes ensemble, chacun avec son fichier
  source et l'invariant en cause, et échoue s'il y en a un.
- La construction écrit, dans un fichier hors de `_site/` que git
  ignore, les évènements de TiBillet qu'elle a lus sans en tirer de
  séance. `npm run verifier` les liste à la suite du rapport, chacun
  avec son nom et sa date de début, sans échouer pour eux.
- Dans GitHub Actions, il écrit ce rapport dans le résumé de
  l'exécution, et chaque problème en annotation sur son fichier source ;
  ailleurs, dans le terminal.
- Il n'a pas de tests.

## Politique de tests et de qualité

- Outil : `node:test`, dans `tests/`, sans dépendance supplémentaire ;
  `npm test` n'a pas besoin du réseau.
- Les tests construisent le site avec `TIBILLET_FICHIER` désignant
  `tests/tibillet.mjs`, un module d'exemple sans donnée personnelle,
  qui sert aussi au développement local. Ses dates sont relatives au
  jour où il est lu, et plusieurs de ses séances ont lieu dans les 7
  jours qui le commencent.
- Les tests valident le code sur un contenu d'exemple, dans
  `tests/contenu/`, rangé comme le contenu de `src/`, jamais sur le
  contenu de `src/`. Ils construisent le site une fois, à partir du
  code du dépôt et de ce contenu, dans un autre dossier que `_site/`,
  puis lisent ses fichiers : ni serveur, ni navigateur, et sans lire
  les gabarits.
- `npm run build` prend son contenu dans le dossier que désigne la
  variable d'environnement `CONTENU`, et écrit le site dans celui que
  désigne `SORTIE` ; sans elles, `src/` et `_site/`. Avec `SORTIE`, la
  construction n'écrit pas la liste des évènements ignorés. Le fichier
  `.env` ne les donne pas.
- Le contenu d'exemple respecte les invariants de `model.md`, n'a
  aucune donnée personnelle, et réunit les cas que demandent les
  affirmations étiquetées.
- Une affirmation de `ui.md` ou d'`operations.md` porte une étiquette
  si les tests peuvent l'observer dans les fichiers construits à
  partir du contenu d'exemple : présence, ordre, texte, liens et
  attributs des éléments. Un invariant de `model.md` porte une
  étiquette si `npm run verifier` peut le vérifier. Les autres
  affirmations se terminent par `(not testable)`. L'apparence selon
  `design.md` et le contenu des pages selon `contents.md` se vérifient
  à la relecture.
- Les tests ne testent pas leurs propres fonctions d'aide.
- Aucun linter ni formateur n'est imposé.
