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

- Outil : le lanceur de tests intégré de Node.js (`node:test`), dans
  `tests/`, sans dépendance supplémentaire.
- `npm test` lance les tests ; il n'a pas besoin du réseau.
- Niveau : chaque test construit le site avec `npm run build`, sur une
  copie de `src/` placée dans un dossier temporaire, puis lit les
  fichiers HTML générés. Il ne démarre aucun serveur et n'ouvre aucun
  navigateur.
- Une page absente de `src/` mais utile à un test (par exemple
  `topic/page.md`) est ajoutée à la copie, jamais à `src/`.
- Les invariants du modèle sont vérifiés par une seule fonction, qui lit
  les pages de `src/` ; elle est appelée à la suite des tests de
  construction.
- Les tests vérifient les fichiers générés (présence, `lang`, titre,
  contenu rendu), pas leur mise en forme exacte ni le CSS.
- Les règles d'apparence de `design.md` ne sont pas testées : elles sont
  vérifiées à l'œil.
- Aucun outil de qualité de code (linter, formateur) n'est imposé.
