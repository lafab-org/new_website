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
- Il lance `npm test`, construit le site avec l'API de TiBillet, puis le
  publie. Il garde `.cache/` d'un déploiement à l'autre. Si une étape
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
  modifie en Markdown.
- Les éditeurs sans accès au dépôt y sont invités par courriel, comme
  collaborateurs de Pages CMS.
- Chaque modification est un commit sur `main`, au nom et au courriel de
  l'éditeur, qui lance le déploiement.

## Édition des actualités

- Un article se crée, se modifie et se supprime dans Pages CMS.
- À sa création, son fichier est nommé `<AAAA-MM-JJ>-<titre>.md`, par
  le jour de sa création et son titre ; l'éditeur peut changer ce nom à
  la création, plus ensuite.
- Ses photos vont dans `src/actualites/photos/`.

## Édition des réalisations

- Une réalisation se crée, se modifie et se supprime dans Pages CMS.
- À sa création, son fichier est nommé `<AAAA-MM-JJ>-<titre>-<auteur>.md`,
  par sa date, son titre et son auteur ; ce nom ne change plus ensuite.
- Ses photos vont dans `src/realisations/photos/`.

## Édition des évènements

- Une page d'évènement se crée, se modifie et se supprime dans Pages
  CMS.
- À sa création, son fichier est nommé `<titre>.md`, par son titre ;
  l'éditeur peut changer ce nom à la création, plus ensuite.
- Les images de son corps vont dans `src/evenements/photos/`.

## Politique de tests et de qualité

- Outil : `node:test`, dans `tests/`, sans dépendance supplémentaire ;
  `npm test` n'a pas besoin du réseau.
- Les tests construisent le site avec `TIBILLET_FICHIER` désignant
  `tests/tibillet.mjs`, un module d'exemple sans donnée personnelle,
  qui sert aussi au développement local. Ses dates sont relatives au
  jour où il est lu, et plusieurs de ses séances ont lieu dans les 7
  jours qui le commencent.
- Les tests sont un contrôle de forme du site construit. Ils vident
  `_site/`, le construisent une fois par `npm run build`, puis lisent
  `_site/` : ni serveur, ni navigateur, et sans lire les gabarits. Les
  pages sont énumérées sur `src/`, hors les fichiers des réalisations
  et ceux des articles non publiés le jour où les tests construisent
  le site, chacune lue dans son fichier de `_site/`.
- Le contrôle de forme vérifie, sur chaque page construite : la langue,
  un titre non vide, le titre du navigateur, un seul `<h1>` portant le
  titre, et que chaque lien interne mène à une page du site, qui porte
  l'identifiant visé par son fragment s'il en a un ; un fragment seul
  mène à un identifiant de sa page ; et que chaque image a un texte
  alternatif et que son adresse mène à un fichier de `_site/`. Les liens
  morts sont rapportés tous ensemble, chacun avec sa page. Les liens externes ne sont pas
  vérifiés. Sur chaque source
  d'évènement, il vérifie que les informations pratiques sont
  renseignées et que sa catégorie est une catégorie du site ; sur
  chaque source de page et de réalisation, que ses catégories en sont ;
  sur chaque source d'article, que son nom de fichier commence par
  une date `AAAA-MM-JJ` valide suivie de `-`, et que sa mise en avant,
  s'il en a une, est bien formée. Sur la page de l'agenda, il vérifie qu'elle montre le nom
  de chaque séance du module d'exemple ; sur la page d'accueil, qu'elle
  montre le nom de chaque séance du module d'exemple des 7 jours qui
  commencent le jour où les tests construisent le site, et le titre de
  trois réalisations distinctes du site, ou de toutes s'il y en a moins ; sur la page des actualités,
  qu'elle a un lien vers chaque article publié, et que la page de
  chaque article non publié n'est pas dans `_site/` ; sur la page d'accueil et sur
  celle de l'agenda, qu'elles ont un lien vers chaque article en avant
  sur elles, le jour où les tests construisent le site.
- Une affirmation de la spécification porte une étiquette seulement si
  le contrôle de forme peut la vérifier ; les autres se terminent par
  `(not testable)`. Elles se vérifient à la relecture, comme le contenu
  des pages selon `contents.md` et l'apparence par `design.md`.
- Les tests ne testent pas leurs propres fonctions d'aide.
- Aucun linter ni formateur n'est imposé.
