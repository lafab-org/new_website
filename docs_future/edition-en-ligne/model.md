# Modèle

## Atelier

× Une page qui présente un atelier de La Fabrique. Chaque fichier
× `ateliers/<dossier>/index.md` de `src/` est la page d'un atelier, avec
× sa couverture dans le même dossier. Son front matter donne `accroche` et
Une page qui présente un atelier de La Fabrique. Chaque fichier
Markdown directement dans `ateliers/` de `src/` est la page d'un
atelier, avec sa couverture dans `ateliers/photos/`. Son front matter
donne `accroche` et
`couverture` sous leurs noms.…

## Réalisation

× Un objet fait à La Fabrique, montré en photos. Chaque fichier Markdown
× du dossier `realisations/` de `src/` est une réalisation, et non une
× page : `realisations/<dossier>/index.md`, avec ses photos dans le même
× dossier. Son front matter donne ses champs sous leurs noms, une photo
Un objet fait à La Fabrique, montré en photos. Chaque fichier Markdown
directement dans `realisations/` de `src/` est une réalisation, et non
une page, avec ses photos dans `realisations/photos/`. Son front matter
donne ses champs sous leurs noms, une photo
par élément de `photos`.…

## Article

× Une actualité de La Fabrique. Chaque fichier
× `actualites/<dossier>/index.md` de `src/` est la page d'un article, avec
× ses photos dans le même dossier. Son front matter donne `résumé`,
× `couverture` et `mise-en-avant` sous leurs noms. Le corps de sa page peut montrer des
× photos de son dossier, chacune par son nom de fichier, avec sa
Une actualité de La Fabrique. Chaque fichier Markdown directement dans
`actualites/` de `src/` est la page d'un article, avec ses photos dans
`actualites/photos/`. Son front matter donne `résumé`, `couverture` et
`mise-en-avant` sous leurs noms. Le corps de sa page peut montrer des
photos de ce dossier, chacune par son chemin, comme le `fichier` d'une
/model/photo, avec sa
description pour texte alternatif (not testable).…
Ses photos sont sa couverture et celles que montre son corps.

× - `date: date`, le jour de sa publication : la date `AAAA-MM-JJ` par
×   laquelle commence le nom de son dossier, par exemple
×   `2026-11-17-nouveau-site`.
×   - [date] Le nom du dossier commence par une date `AAAA-MM-JJ` valide,
- `date: date`, le jour de sa publication : la date `AAAA-MM-JJ` par
  laquelle commence son nom de fichier, par exemple
  `2026-11-17-nouveau-site.md`.
  - [date] Le nom de fichier commence par une date `AAAA-MM-JJ` valide,
    suivie de `-`.…

## Photo

× - `fichier: string`, le nom du fichier image.
×   - Un fichier du dossier de sa réalisation, de son article ou de son
×     atelier (not testable).
- `fichier: string`, le chemin du fichier image depuis `src/`, avec un
  `/` initial, par exemple `/realisations/photos/etabli-1.jpg`.
  - Un fichier du dossier de photos de sa réalisation, de son article ou
    de son atelier (not testable).

## Site

×   - Leurs pages sont les pages de `pages` dont le fichier est
×     `ateliers/<dossier>/index.md`, chacune celle d'un seul atelier (not
×     testable).
  - Leurs pages sont les pages de `pages` dont le fichier Markdown est
    directement dans `ateliers/`, chacune celle d'un seul atelier (not
    testable).
×   Leurs pages sont les pages de `pages` dont le fichier est
×   `actualites/<dossier>/index.md`, chacune celle d'un seul article.
  Leurs pages sont les pages de `pages` dont le fichier Markdown est
  directement dans `actualites/`, chacune celle d'un seul article.
