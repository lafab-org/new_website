# Modèle

## Lien

Un lien d'une page vers une adresse.

- `target: string`, l'adresse visée.

Un lien est interne si son adresse commence par un seul `/`, externe
sinon.

## Page

Une page du site web, écrite sous forme de fichier source Markdown.

- `path: string`, l'emplacement du fichier sous `src/`, par exemple
  `index.md`.
  - [markdown] Il se termine par `.md`.
- `title: string`, le titre de la page.
  - [titre] Non vide.
- `body: string`, le texte Markdown de la page.
- `links: set of /model/lien`, les éléments `<a href>` du texte
  (`body`) une fois rendu, à l'exclusion du gabarit.

L'adresse d'une page est celle qui la sert : `/` pour `index.md`,
`/dossier` pour `dossier/index.md`, `/dossier/nom` pour
`dossier/nom.md`. Un lien interne désigne une page quand son adresse,
sans fragment `#…`, sans paramètres `?…` et sans `/` final autre que
celui de `/`, est celle de la page.

## Site

L'état : tout ce dont le site est fait.

- `pages: set of /model/page`, toutes les pages.
  - [lien-interne] Chaque lien interne d'une page désigne une page de
    `pages`.
