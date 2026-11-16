# Modèle

## Page

Une page du site web, écrite sous forme de fichier source Markdown.

- `path: string`, l'emplacement du fichier sous `src/`, par exemple
  `index.md`.
- `title: string`, le titre de la page.
  - [titre] Non vide.
- `body: string`, le texte Markdown de la page.
- `links: set of string`, les adresses des éléments `<a href>` de la
  page une fois construite, gabarit compris.

L'adresse d'une page est celle qui la sert : `/` pour `index.md`,
`/dossier` pour `dossier/index.md`, `/dossier/nom` pour
`dossier/nom.md`. Un lien est interne si son adresse commence par un
seul `/` ; il désigne une page quand son adresse, sans fragment `#…`,
sans paramètres `?…` et sans `/` final autre que celui de `/`, est
celle de la page. Un lien est un fragment si son adresse commence par
`#`. Le fragment d'un lien, `#…`, désigne un identifiant (`id`) d'une
page construite.

## Évènement

Une page qui présente un évènement, avec ses informations pratiques.

- `page: /model/page`, sa page.
- `accroche: optional string`, une phrase d'appel.
- `rendez-vous: string`, quand il a lieu.
- `horaire: string`, à quelle heure.
- `prix: string`, ce qu'il coûte et à qui il est ouvert.
  - [renseigne] `rendez-vous`, `horaire` et `prix` sont non vides.
- `atelier: string`, l'atelier dont il relève, ou l'association.
  - [atelier] L'une des valeurs `bois`, `métal`, `matériaux-souples`,
    `numérique-électronique` ou `association`.

## Site

L'état : tout ce dont le site est fait.

- `lieu: string`, l'adresse de La Fabrique, la même pour tous les
  évènements. Elle est dans le fichier `src/_data/site.json`.
- `pages: set of /model/page`, toutes les pages.
  - [lien-interne] Chaque lien interne d'une page désigne une page de
    `pages` ; s'il a un fragment, cette page porte l'identifiant.
  - [fragment] Chaque lien fragment d'une page désigne un identifiant
    de cette page.
- `evenements: set of /model/evenement`, tous les évènements. Leurs
  pages sont les pages de `pages` dont le fichier est directement dans
  `evenements/`, hors `evenements/index.md`, chacune celle d'un seul
  évènement.
