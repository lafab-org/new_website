# Opérations

## Initial state

- [accueil] Le site ne contient que la page `index.md`, telle que
  /ui/page-daccueil la décrit.

## Construire le site

Génère le site web à partir des pages.

Trigger: `npm run build` ; `npm start` la relance à chaque changement
d'une page.

Inputs: aucune.

Cases:
- [generee] Toujours : chaque page est écrite sous `_site/` en HTML,
  son corps rendu depuis le Markdown ; `index.md` donne
  `_site/index.html`.
