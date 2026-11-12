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

- Outil : le lanceur de tests intégré de Node.js (`node:test`), dans
  `tests/`, sans dépendance supplémentaire.
- `npm test` lance les tests ; il n'a pas besoin du réseau.
- Le gabarit de base est vérifié une fois : il déclare `lang="fr"`, la
  balise viewport et le titre.
- Chaque page de `src/` est vérifiée pour dériver du gabarit de base.
- Une seule construction, par `npm run build`, de la vraie `src/` ; les
  tests lisent ensuite les fichiers générés. Aucun serveur, aucun
  navigateur.
- Les invariants du modèle sont vérifiés directement sur les pages de
  `src/`.
- Les règles d'apparence de `design.md` ne sont pas testées : elles sont
  vérifiées à l'œil.
- Aucun outil de qualité de code (linter, formateur) n'est imposé.
