# Modèle

## Page

Une page du site web, écrite sous forme de fichier source Markdown.

- `path: string`, l'emplacement du fichier sous `src/`, par exemple
  `index.md`.
  - [markdown] Il se termine par `.md`.
- `title: string`, le titre de la page.
  - [titre] Non vide.
- `body: string`, le texte Markdown de la page.

## Site

L'état : tout ce dont le site est fait.

- `pages: set of /model/page`, toutes les pages.
  - [page-accueil] Une page a pour chemin `index.md`.
  - [page-metallerie] Une page a pour chemin `ateliers/metallerie.md`.
