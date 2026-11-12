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
- Toute page dérive, directement ou indirectement, du gabarit de base
  `src/_includes/base.njk`, qui porte `lang="fr"`, la balise viewport
  et le titre du navigateur, pris dans le `title` de la page.
- Commandes : `npm run build` génère le site ; `npm start` le sert en
  local avec rechargement, sur `http://localhost:8080`.
- Les messages vus par l'utilisateur ne sont pas spécifiés.

## Politique de tests et de qualité

- Outil : `node:test`, dans `tests/`, sans dépendance supplémentaire ;
  `npm test` n'a pas besoin du réseau.
- Les tests construisent le site une fois par `npm run build`, puis
  lisent `_site/` : ni serveur, ni navigateur. Les chemins des pages
  sont vérifiés sur `src/`.
- Chaque page construite est vérifiée : `lang="fr"`, balise viewport,
  titre non vide, et chaque lien interne de son texte mène à une page du
  site. Les liens externes ne sont pas vérifiés.
- Le reste se vérifie à la relecture : le contenu par `contents.md`,
  l'apparence par `design.md`.
- Aucun linter ni formateur n'est imposé.
