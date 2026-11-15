# Interface

## Page

Le visiteur ouvre une page à son adresse dans un navigateur, et suit un
lien en cliquant dessus.

- [français] La page est déclarée en français.
- [navigateur] Le titre du navigateur est `<titre> - La Fabrique`, où
  `<titre>` est le `title` de la page, et `La Fabrique` pour la page
  d'accueil.
- [titre] La page commence par son `title`, en titre principal
  (`<h1>`), le seul de la page ; son corps vient ensuite.

## Page d'accueil

À `/` : la page `index.md`, telle que
/operations/construire-le-site/generee la rend. Son contenu est décrit
dans /contents/page-daccueil.

## Page d'atelier

À `/ateliers/<nom>` : la page `ateliers/<nom>.md`, telle que
/operations/construire-le-site/generee la rend. Le contenu de chaque
page d'atelier est décrit dans sa section de `contents.md` :
/contents/page-metallerie.

## Page d'évènement

À `/evenements/<nom>` : la page `evenements/<nom>.md` d'un évènement,
telle que /operations/construire-le-site/generee la rend. Le contenu de
chaque page d'évènement est décrit dans sa section de `contents.md` :
/contents/page-reparaction.

Entre le titre et le corps, la page montre :
- [accroche] l'accroche de l'évènement, s'il en a une ;
- [informations] puis ses informations pratiques, en liste, dans cet
  ordre :
  - `Rendez-vous : <rendez-vous>`
  - `Horaire : <horaire>`
  - `Lieu : <lieu>`
  - `Activité : <prix>`
