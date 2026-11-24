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

La section `<titre>` d'une page est la partie de son corps qui va de
son premier titre de niveau 2 dont le texte affiché est `<titre>`,
compris, au titre de niveau 2 suivant ou à la fin du corps.

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
  - [identifiant] Deux catégories n'ont pas le même.
- `nom: string`, son nom affiché.

Les évènements d'une catégorie sont ceux dont la `catégorie` est son
identifiant.

## Atelier

Une page qui présente un atelier de La Fabrique. Chaque fichier
Markdown directement dans `ateliers/` de `src/` est la page d'un
atelier, avec sa couverture dans `ateliers/photos/`. Son front matter
donne `accroche` et `couverture` sous leurs noms.

- `page: /model/page`, sa page.
- `nom court: string`, son nom dans le menu de l'en-tête.
  - [nom-court] Non vide.
- `accroche: string`, une phrase d'appel.
  - [accroche] Non vide.
- `couverture: optional /model/photo`, la photo qui le représente.

## Évènement

Une page qui présente un évènement, avec ses informations pratiques et
sa couverture et ses illustrations dans `evenements/photos/`. Son front
matter donne `accroche`, `rendez-vous`, `horaire`, `prix`, `catégorie`,
`couverture` et `illustrations` sous leurs noms, une photo par élément
de `illustrations`.

- `page: /model/page`, sa page.
- `accroche: optional string`, une phrase d'appel.
- `rendez-vous: string`, quand il a lieu.
- `horaire: string`, à quelle heure.
- `prix: string`, ce qu'il coûte et à qui il est ouvert.
  - [renseigne] `rendez-vous`, `horaire` et `prix` sont non vides.
- `catégorie: string`, la catégorie dont il relève.
  - [categorie] L'identifiant d'une catégorie du site.
- `couverture: optional /model/photo`, la photo qui le représente.
- `illustrations: list of /model/photo`, des photos de l'activité, dans
  l'ordre où elles sont montrées. Sans le champ, la liste est vide.

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
directement dans `realisations/` de `src/` est une réalisation, et non
une page, avec ses photos dans `realisations/photos/`. Son front matter
donne ses champs sous leurs noms, une photo par élément de `photos`.

- `titre: string`, ce qu'elle est.
- `date: date`, le jour où elle a été présentée.
- `auteur: string`, qui l'a faite.
- `catégories: set of string`, les identifiants des catégories dont
  elle relève.
  - [categories] Chacun est l'identifiant d'une catégorie du site.
  - [une-categorie] Au moins une.
- `photos: list of /model/photo`, dans l'ordre où elles sont montrées.
  - [une-photo] Au moins une.

## Article

Une actualité de La Fabrique. Chaque fichier Markdown directement dans
`actualites/` de `src/` est la page d'un article, avec ses photos dans
`actualites/photos/`. Son front matter donne `résumé`, `couverture` et
`mise-en-avant` sous leurs noms. Le corps de sa page peut montrer des
photos de ce dossier, chacune par son chemin, comme le `fichier` d'une
/model/photo, avec sa description pour texte alternatif (not testable).
Ses photos sont sa couverture et celles que montre son corps.

- `page: /model/page`, sa page.
- `date: date`, le jour de sa publication : la date `AAAA-MM-JJ` par
  laquelle commence son nom de fichier, par exemple
  `2026-11-17-nouveau-site.md`.
  - [date] Le nom de fichier commence par une date `AAAA-MM-JJ` valide,
    suivie de `-`.
- `résumé: optional string`, ce dont il parle, en une ou deux phrases.
- `couverture: optional /model/photo`, la photo qui le représente.
- `mise-en-avant: optional /model/mise-en-avant`, où et quand d'autres
  pages le présentent.

Les articles en avant sur la page d'accueil, ou sur celle de l'agenda,
sont, dans l'ordre des `articles` du site, ceux dont la mise en avant
a `accueil`, ou `agenda`, dans ses `pages`, et dont le `jour` du site
n'est ni avant le `début`, s'il y en a un, ni après la `fin`.

Un article est publié si sa mise en avant, s'il en a une, n'a pas de
`début` après le `jour` du site.

## Mise en avant

La présentation d'un article sur d'autres pages que la sienne, pour un
temps. Le front matter de l'article donne ses champs sous leurs noms.

- `pages: set of one of accueil, agenda`, les pages qui le présentent :
  la page d'accueil, la page de l'agenda.
- `début: optional date`, le premier jour où elles le présentent ; sans
  début, dès qu'il est sur le site.
- `fin: date`, le dernier jour où elles le présentent.
- [valide] `pages` a au moins une page, chacune `accueil` ou `agenda` ;
  `fin` et, s'il y en a un, `début` sont des dates `AAAA-MM-JJ` valides ;
  `début` n'est pas après `fin`.

## Photo

Une photo d'une réalisation, d'un article, d'un atelier ou d'un
évènement, couverture ou illustration.

- `fichier: string`, le chemin du fichier image depuis `src/`, avec un
  `/` initial, par exemple `/realisations/photos/etabli-1.jpg`.
  - [fichier] Un fichier du dossier de photos de sa réalisation, de son
    article, de son atelier ou de son évènement.
- `description: string`, ce que montre la photo.
  - [description] Non vide.

## Bloc

Une partie de la page d'accueil, à sa place dans l'`accueil` du site.

- `type: one of corps, articles-en-avant, ateliers, section, semaine,
  realisations`, ce que le bloc montre.
- `page: optional string`, pour un bloc `section`, l'emplacement sous
  `src/` de la page dont il montre une section, par exemple
  `association.md`.
- `titre: optional string`, pour un bloc `section`, le titre de la
  section qu'il montre.
- [section] Un bloc `section`, et lui seul, a une `page` et un `titre` ;
  `page` est l'emplacement d'une page de `pages` qui n'est pas celle
  d'un article non publié, et qui a la section `titre`, sans lien
  fragment.

## Site

L'état : tout ce dont le site est fait.

- `lieu: string`, l'adresse de La Fabrique, la même pour tous les
  évènements. Elle est dans le fichier `src/_data/site.json`.
- `pages: set of /model/page`, toutes les pages.
  - [lien-interne] Chaque lien interne d'une page désigne une page de
    `pages` qui n'est pas celle d'un article non publié ; s'il a un
    fragment, cette page porte l'identifiant.
  - [fragment] Chaque lien fragment d'une page désigne un identifiant
    de cette page.
  - [image] L'adresse de chaque image d'une page est interne et désigne
    un fichier de `_site/`.
- `catégories: list of /model/categorie`, toutes les catégories, dans
  l'ordre où le site les présente. Elles sont dans le fichier
  `src/_data/categories.json`, qui donne pour chacune son identifiant et
  son nom, dans cet ordre.
- `ateliers: list of /model/atelier`, tous les ateliers, dans l'ordre
  où le site les présente. Le fichier `src/_data/ateliers.json` les
  donne dans cet ordre, chacun par l'adresse de sa page et son nom
  court.
  - [ateliers] Leurs pages sont les pages de `pages` dont le fichier
    Markdown est directement dans `ateliers/`, chacune celle d'un seul
    atelier.
- `evenements: set of /model/evenement`, tous les évènements. Leurs
  pages sont les pages de `pages` dont le fichier est directement dans
  `evenements/`, hors `evenements/index.md`, chacune celle d'un seul
  évènement.
- `réalisations: list of /model/realisation`, toutes les réalisations,
  de la plus récente à la plus ancienne ; l'ordre de deux réalisations
  de même date est libre.
- `articles: list of /model/article`, tous les articles, du plus récent
  au plus ancien ; l'ordre de deux articles de même date est libre.
  Leurs pages sont les pages de `pages` dont le fichier Markdown est
  directement dans `actualites/`, chacune celle d'un seul article.
- `accueil: list of /model/bloc`, les blocs de la page d'accueil, dans
  leur ordre. Le front matter d'`index.md` les donne dans `blocs`,
  chacun avec ses champs sous leurs noms.
  - [blocs] Le front matter d'`index.md` a `blocs`, une liste dont
    chaque élément a pour `type` l'un de ceux d'un bloc.
  - [corps] Au plus un bloc `corps`.
- `jour: date`, le jour de sa construction, à Paris.
- `tirage: list of /model/realisation`, les réalisations que montre un
  bloc `realisations`.
  - [tirage] Trois réalisations distinctes de `réalisations`, ou toutes
    s'il y en a moins de trois.
- `séances: list of /model/seance`, les séances, par jour puis par
  heure de début ; l'ordre de deux séances au même début est libre.

Les séances des 7 prochains jours sont les séances du site dont le
`jour` est le `jour` du site ou l'un des six jours qui le suivent, dans
l'ordre des `séances` du site.
