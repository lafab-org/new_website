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
- `images: set of /model/image`, les éléments `<img>` de la page une
  fois construite, gabarit compris.
- `catégories: set of string`, les identifiants des catégories dont la
  page montre les évènements ; vide si son front matter n'en donne pas.
  - [categories] Chacun est l'identifiant d'une catégorie du site.

Les évènements d'une page sont ceux de ses catégories.
Ses séances sont les séances du site dont la catégorie est l'une de ses
catégories, dans l'ordre des `séances` du site.

L'adresse d'une page est celle qui la sert : `/` pour `index.md`,
`/dossier` pour `dossier/index.md`, `/dossier/nom` pour
`dossier/nom.md`. Un lien est interne si son adresse commence par un
seul `/` ; il désigne une page quand son adresse, sans fragment `#…`,
sans paramètres `?…` et sans `/` final autre que celui de `/`, est
celle de la page. Un lien est un fragment si son adresse commence par
`#`. Le fragment d'un lien, `#…`, désigne un identifiant (`id`) d'une
page construite. L'adresse d'une image est interne si elle commence par
un seul `/` ; elle désigne alors le fichier de `_site/` à ce chemin.

## Image

Une image d'une page construite.

- `adresse: string`, son `src`.
- `texte: string`, son texte alternatif, `alt`.
  - [texte] Non vide.

## Catégorie

Une catégorie d'évènements, selon leur domaine.

- `identifiant: string`, ce que désigne la `catégorie` d'un évènement.
- `nom: string`, son nom affiché.
  - Deux catégories n'ont pas le même identifiant (not testable).

Les évènements d'une catégorie sont ceux dont la `catégorie` est son
identifiant.

## Évènement

Une page qui présente un évènement, avec ses informations pratiques.

- `page: /model/page`, sa page.
- `accroche: optional string`, une phrase d'appel.
- `rendez-vous: string`, quand il a lieu.
- `horaire: string`, à quelle heure.
- `prix: string`, ce qu'il coûte et à qui il est ouvert.
  - [renseigne] `rendez-vous`, `horaire` et `prix` sont non vides.
- `catégorie: string`, la catégorie dont il relève.
  - [categorie] L'identifiant d'une catégorie du site.

Ses séances sont les séances du site dont il est l'évènement, dans
l'ordre des `séances` du site.

## Séance

Une date d'une activité de La Fabrique, lue sur TiBillet.

- `nom: string`, son nom.
- `jour: date`, le jour où elle a lieu, à Paris.
- `début: time`, l'heure où elle commence, à l'heure de Paris.
- `fin: optional time`, l'heure où elle finit, à l'heure de Paris.
- `catégorie: string`, la catégorie dont elle relève.
  - L'identifiant d'une catégorie du site (not testable).
- `évènement: optional /model/evenement`, l'évènement dont elle est une
  date.
- `accès: optional one of libre, sur-place, réservation-gratuite, réservation-payante`,
  comment on y participe : sans réserver, sans réserver en payant sur
  place, sur réservation gratuite, ou payante.
- `réservation: string`, son adresse sur TiBillet.
- `jauge: optional integer`, le nombre de places.
- `réservées: integer`, le nombre de places réservées.
- `annulée: boolean`, vrai si elle n'a plus lieu.

Les places restantes d'une séance qui a une jauge : sa jauge moins ses
places réservées. Elle est complète quand il n'en reste aucune, ou
moins.

## Réalisation

Un objet fait à La Fabrique, montré en photos. Chaque fichier Markdown
du dossier `realisations/` de `src/` est une réalisation, et non une
page : `realisations/<dossier>/index.md`, avec ses photos dans le même
dossier. Son front matter donne ses champs sous leurs noms, une photo
par élément de `photos`.

- `titre: string`, ce qu'elle est.
- `date: date`, le jour où elle a été présentée.
- `auteur: string`, qui l'a faite.
- `catégories: set of string`, les identifiants des catégories dont
  elle relève.
  - [categories] Chacun est l'identifiant d'une catégorie du site.
  - Au moins une (not testable).
- `photos: list of /model/photo`, dans l'ordre où elles sont montrées.
  - Au moins une (not testable).

## Article

Une actualité de La Fabrique. Chaque fichier
`actualites/<dossier>/index.md` de `src/` est la page d'un article, avec
ses photos dans le même dossier. Son front matter donne `résumé` et
`couverture` sous leurs noms. Le corps de sa page peut montrer des
photos de son dossier, chacune par son nom de fichier, avec sa
description pour texte alternatif (not testable).

- `page: /model/page`, sa page.
- `date: date`, le jour de sa publication : la date `AAAA-MM-JJ` par
  laquelle commence le nom de son dossier, par exemple
  `2026-11-17-nouveau-site`.
  - [date] Le nom du dossier commence par une date `AAAA-MM-JJ` valide,
    suivie de `-`.
- `résumé: optional string`, ce dont il parle, en une ou deux phrases.
- `couverture: optional /model/photo`, la photo qui le représente.

## Photo

Une photo d'une réalisation ou d'un article.

- `fichier: string`, le nom du fichier image.
  - Un fichier du dossier de sa réalisation ou de son article (not
    testable).
- `description: string`, ce que montre la photo.
  - Non vide (not testable).

## Site

L'état : tout ce dont le site est fait.

- `lieu: string`, l'adresse de La Fabrique, la même pour tous les
  évènements. Elle est dans le fichier `src/_data/site.json`.
- `pages: set of /model/page`, toutes les pages.
  - [lien-interne] Chaque lien interne d'une page désigne une page de
    `pages` ; s'il a un fragment, cette page porte l'identifiant.
  - [fragment] Chaque lien fragment d'une page désigne un identifiant
    de cette page.
  - [image] L'adresse de chaque image d'une page est interne et désigne
    un fichier de `_site/`.
- `catégories: list of /model/categorie`, toutes les catégories, dans
  l'ordre où le site les présente. Elles sont dans le fichier
  `src/_data/categories.json`, qui donne pour chacune son identifiant et
  son nom, dans cet ordre.
- `ateliers: list of /model/page`, les pages d'atelier, dans l'ordre où
  le site les présente. Le fichier `src/_data/ateliers.json` en donne
  les adresses, dans cet ordre.
  - Ce sont les pages dont le fichier est directement dans `ateliers/`,
    hors `ateliers/index.md`, chacune une fois (not testable).
- `evenements: set of /model/evenement`, tous les évènements. Leurs
  pages sont les pages de `pages` dont le fichier est directement dans
  `evenements/`, hors `evenements/index.md`, chacune celle d'un seul
  évènement.
- `réalisations: list of /model/realisation`, toutes les réalisations,
  de la plus récente à la plus ancienne ; l'ordre de deux réalisations
  de même date est libre.
- `articles: list of /model/article`, tous les articles, du plus récent
  au plus ancien ; l'ordre de deux articles de même date est libre.
  Leurs pages sont les pages de `pages` dont le fichier est
  `actualites/<dossier>/index.md`, chacune celle d'un seul article.
- `séances: list of /model/seance`, les séances, par jour puis par
  heure de début ; l'ordre de deux séances au même début est libre.
