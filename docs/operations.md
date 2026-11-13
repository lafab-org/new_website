# Opérations

## Initial state

Les pages sont les fichiers Markdown de `src/`, hors `_includes/`, tels
qu'ils sont dans le dépôt.

## Construire le site

Génère le site web à partir des pages.

Trigger: `npm run build` ; `npm start` la relance à chaque changement
d'une page.

Inputs: aucune.

Cases:
- [generee] Toujours : le résultat est le site généré sous `_site/`, où
  chaque page est écrite en HTML, son corps rendu depuis le Markdown ;
  `index.md` donne `_site/index.html`.
