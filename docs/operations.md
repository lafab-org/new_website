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
- [generee] Toujours : pour chaque page, une page HTML est écrite sous
  `_site/`, avec `lang="fr"`, le titre de la page comme titre du
  navigateur et son corps rendu depuis le Markdown ; `index.md` donne
  `_site/index.html`, et tout autre `<nom>.md` donne
  `_site/<nom>/index.html`.
