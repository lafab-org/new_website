# Technique

- Un site statique : des fichiers générés à la construction, sans code
  serveur.
- Générateur : Eleventy 3.x, en modules ECMAScript, avec des modèles
  Nunjucks.
- Exécution : une version LTS de Node.js, avec npm.
- Styles : CSS simple, sans étape de construction.
- Organisation : sources dans `src/`, site généré dans `_site/`.
- Une page est un fichier de `src/` : son URL est formée de son dossier
  et de son nom de fichier, sans extension. `index.md` est écrit dans
  `_site/index.html` et sert `/` ; `topic/page.md` est écrit dans
  `_site/topic/page/index.html` et sert `/topic/page`.
- Les pages sont mises en page par des gabarits Nunjucks, dans
  `src/_includes/`. Le gabarit de base porte la balise viewport.
- Les informations communes du site sont dans le répertoire `src/_data`
- Commandes : `npm run build` génère le site ; `npm start` le sert en
  local avec rechargement, sur `http://localhost:8080`.
- Les messages vus par l'utilisateur ne sont pas spécifiés.

## Politique de tests et de qualité

- Outil : `node:test`, dans `tests/`, sans dépendance supplémentaire ;
  `npm test` n'a pas besoin du réseau.
- Les tests sont un contrôle de forme du site construit. Ils le
  construisent une fois par `npm run build`, puis lisent `_site/` : ni
  serveur, ni navigateur, et sans lire les gabarits. Les pages sont
  énumérées sur `src/`, chacune lue dans son fichier de `_site/`.
- Le contrôle de forme vérifie, sur chaque page construite : la langue,
  un titre non vide, le titre du navigateur, un seul `<h1>` portant le
  titre, et que chaque lien interne mène à une page du site, qui porte
  l'identifiant visé par son fragment s'il en a un ; un fragment seul
  mène à un identifiant de sa page. Les liens morts sont rapportés tous
  ensemble, chacun avec sa page. Les liens externes ne sont pas
  vérifiés. Sur chaque source
  d'évènement, il vérifie que les informations pratiques sont
  renseignées.
- Une affirmation de la spécification porte une étiquette seulement si
  le contrôle de forme peut la vérifier ; les autres se terminent par
  `(not testable)`. Elles se vérifient à la relecture, comme le contenu
  des pages selon `contents.md` et l'apparence par `design.md`.
- Les tests ne testent pas leurs propres fonctions d'aide.
- Aucun linter ni formateur n'est imposé.
