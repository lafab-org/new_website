# Technique

- Un site statique : des fichiers générés à la construction, sans code
  serveur.
- Générateur : Eleventy 3.x, en modules ECMAScript, avec des modèles
  Nunjucks.
- Exécution : une version LTS de Node.js, avec npm.
- Styles : CSS simple, sans étape de construction.
- Organisation : sources dans `src/`, site généré dans `_site/`.
- Une page est un fichier de `src/` : son URL est formée de son dossier
  et de son nom de fichier, sans extension, si bien que deux pages ne
  partagent jamais la même URL : `topic/page.md` est à `/topic/page`,
  `index.md` à `/`.
- Commandes : `npm run build` génère le site ; `npm start` le sert en
  local avec rechargement, sur `http://localhost:8080`.
- Les messages vus par l'utilisateur ne sont pas spécifiés.

## Politique de tests et de qualité

- Un test construit le site et vérifie les fichiers générés.
- `npm test` lance les tests ; il n'a pas besoin du réseau.
