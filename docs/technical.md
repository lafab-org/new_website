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
- Images : `@11ty/eleventy-img`, qui écrit chaque photo dans `_site/`
  en WebP et en JPEG, en plusieurs largeurs, avec ses dimensions et un
  chargement différé. Une photo entre dans le dépôt réduite à 2000 px au
  plus sur son grand côté, en JPEG.
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
  désigne un fichier JSON local qui tient lieu de
  TiBillet : les évènements et les réservations, au format des réponses
  de l'API ; la forme qui les réunit est libre.
- Des réservations, la construction ne garde que leur nombre de
  billets : aucune donnée personnelle n'est écrite, ni dans `_site/` ni
  ailleurs.

## Politique de tests et de qualité

- Outil : `node:test`, dans `tests/`, sans dépendance supplémentaire ;
  `npm test` n'a pas besoin du réseau.
- Les tests construisent le site avec `TIBILLET_FICHIER` désignant
  `tests/tibillet.json`, un fichier d'exemple sans donnée personnelle,
  qui sert aussi au développement local.
- Les tests sont un contrôle de forme du site construit. Ils le
  construisent une fois par `npm run build`, puis lisent `_site/` : ni
  serveur, ni navigateur, et sans lire les gabarits. Les pages sont
  énumérées sur `src/`, hors les fichiers des réalisations, chacune lue
  dans son fichier de `_site/`.
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
  sur chaque source d'article, que le nom de son dossier commence par
  une date `AAAA-MM-JJ` valide suivie de `-`, et que sa mise en avant,
  s'il en a une, est bien formée. Sur la page de l'agenda, il vérifie qu'elle montre le nom
  de chaque séance du fichier d'exemple ; sur la page des actualités,
  qu'elle a un lien vers chaque article ; sur la page d'accueil et sur
  celle de l'agenda, qu'elles ont un lien vers chaque article en avant
  sur elles, le jour où les tests construisent le site.
- Une affirmation de la spécification porte une étiquette seulement si
  le contrôle de forme peut la vérifier ; les autres se terminent par
  `(not testable)`. Elles se vérifient à la relecture, comme le contenu
  des pages selon `contents.md` et l'apparence par `design.md`.
- Les tests ne testent pas leurs propres fonctions d'aide.
- Aucun linter ni formateur n'est imposé.
