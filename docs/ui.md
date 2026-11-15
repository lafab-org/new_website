# Interface

## Page

Le visiteur ouvre une page à son adresse dans un navigateur, et suit un
lien en cliquant dessus.

- [français] La page est déclarée en français.
- [navigateur] Le titre du navigateur est `<titre> - La Fabrique`, où
  `<titre>` est le `title` de la page, et `La Fabrique` pour la page
  d'accueil.
- [titre] La page a un seul titre principal (`<h1>`) : son `title`.
- Le titre principal vient en premier, puis le corps de la page (not
  testable).

## Page d'accueil

À `/` : la page `index.md`, telle que
/operations/construire-le-site/generee la rend. Son contenu est décrit
dans /contents/page-daccueil.

## Page d'atelier

À `/ateliers/<nom>` : la page `ateliers/<nom>.md`, telle que
/operations/construire-le-site/generee la rend. Le contenu de chaque
page d'atelier est décrit dans sa section de `contents.md` :
/contents/page-metallerie et
/contents/page-menuiserie.

## Page d'évènement

À `/evenements/<nom>` : la page `evenements/<nom>.md` d'un évènement,
telle que /operations/construire-le-site/generee la rend. Le contenu de
chaque page d'évènement est décrit dans sa section de `contents.md` :
/contents/page-reparaction.

Entre le titre et le corps, la page montre l'accroche de l'évènement,
s'il en a une, puis ses informations pratiques, en liste, dans cet
ordre (not testable) :
- `Rendez-vous : <rendez-vous>`
- `Horaire : <horaire>`
- `Lieu : <lieu>`
- `Activité : <prix>`
