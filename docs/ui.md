# Interface

## Page

Le visiteur ouvre une page à son adresse dans un navigateur, et suit un
lien en cliquant dessus.

- [français] La page est déclarée en français.
- [navigateur] Le titre du navigateur est `<titre> - La Fabrique`, où
  `<titre>` est le `title` de la page, et `La Fabrique` pour la page
  d'accueil.
- [titre] La page a un seul titre principal (`<h1>`) : son `title`.
- L'en-tête /ui/en-tete vient en premier, puis le titre principal,
  puis le corps de la page (not testable).

## En-tête

Commun à toutes les pages, dans cet ordre (not testable) :
- le logo de La Fabrique, en lien vers `/`, avec le texte alternatif
  `La Fabrique - accueil` ;
- le menu principal :
  - `Agenda`, vers `/agenda` ;
  - `Actualités`, vers `/actualites` ;
  - `Réalisations`, vers `/realisations` ;
- le menu des ateliers et de l'association :
  - chaque page des `ateliers` du site, dans leur ordre, sous son nom
    court, vers son adresse ;
  - `L'association`, vers `/association`.

Dans un menu, l'entrée qui mène à la page affichée est mise en
évidence (not testable).

## Page d'accueil

À `/` : la page `index.md`, telle que
/operations/construire-le-site/generee la rend. Ses objectifs éditoriaux
sont dans /contents/page-daccueil.

Entre le titre et le corps, la section /ui/articles-en-avant, pour les
articles en avant sur la page d'accueil (not testable).
- [en-avant] Un lien vers la page de chaque article en avant sur la page
  d'accueil.

## Page de l'association

À `/association` : la page `association.md`, telle que
/operations/construire-le-site/generee la rend. Les objectifs éditoriaux de
la page de l'association sont dans /contents/page-de-lassociation.

Après le corps de la page, avant la section `Les évènements`, la
section /ui/prochaines-seances, pour les séances de la page (not
testable).

## Page d'atelier

À `/ateliers/<nom>` : la page `ateliers/<nom>.md`, telle que
/operations/construire-le-site/generee la rend. Les objectifs éditoriaux des
pages d'atelier sont dans /contents/page-datelier.

Après le corps de la page, avant la section `Les évènements`, la
section /ui/prochaines-seances, pour les séances de la page (not
testable).

## Page d'évènement

À `/evenements/<nom>` : la page `evenements/<nom>.md` d'un évènement,
telle que /operations/construire-le-site/generee la rend. Les objectifs éditoriaux des
pages d'évènement sont dans /contents/page-devenement.

Entre le titre et le corps, la page montre l'accroche de l'évènement,
s'il en a une, puis ses informations pratiques, en liste, dans cet
ordre, chacune son libellé puis sa valeur (not testable) :
- `Rendez-vous`, puis son `rendez-vous` ;
- `Horaire`, puis son `horaire` ;
- `Lieu`, puis le `lieu` du site ;
- `Activité`, puis son `prix`.

Après les informations pratiques, la section /ui/prochaines-seances,
pour les séances de l'évènement (not testable).

## Séance

Montre une séance, dans cet ordre (not testable) :
- son début, puis sa fin si elle en a une ;
- le nom de sa catégorie ;
- son nom, en lien vers la page de son évènement si elle en a un ;
- sa participation, le premier cas qui s'applique :
  1. annulée : `Annulée` ;
  2. accès `libre` : `Accès libre` ;
  3. accès `sur-place` : `Paiement sur place` ;
  4. accès `réservation-gratuite` ou `réservation-payante`, ou sans
     accès : `Réservation gratuite` ou `Réservation payante` selon
     l'accès, rien sans accès ; puis, si elle a une jauge,
     `1 place restante` ou `<n> places restantes`, où `<n>` est le
     nombre de ses places restantes, ou `Complet` si elle est
     complète ; enfin, sauf si elle est complète, un lien vers sa
     réservation : `Réserver` avec un accès, `Voir sur TiBillet` sans
     accès.

## Page de l'agenda

À `/agenda` : la page `agenda.md`, telle que
/operations/construire-le-site/generee la rend. Ses objectifs
éditoriaux sont dans /contents/page-de-lagenda.

Après le corps de la page, dans cet ordre :
- La section /ui/articles-en-avant, pour les articles en avant sur la
  page de l'agenda (not testable).
- [en-avant] Un lien vers la page de chaque article en avant sur la
  page de l'agenda.
- [seances] Le nom de chaque séance du site.
- Les séances sont groupées par jour, chaque jour en sous-titre, ses
  séances sous la forme de /ui/seance, dans l'ordre des `séances` du
  site (not testable).
- Sans séance, le texte `Aucune séance prévue pour l'instant.` (not
  testable).

## Page des réalisations

À `/realisations` : la page `realisations.md`, telle que
/operations/construire-le-site/generee la rend. Ses objectifs
éditoriaux sont dans /contents/page-des-realisations.

Après le corps de la page, chaque réalisation du site, dans l'ordre des
`réalisations` du site, dans cet ordre (not testable) :
- ses photos, dans leur ordre, chacune avec sa description pour texte
  alternatif ;
- `<nombre> photos`, si elle en a plus d'une ;
- son titre, en sous-titre ;
- `Par <auteur> · <date>`, la date en mois et année, par exemple
  `Par Céline · Juin 2023`.

## Page des actualités

À `/actualites` : la page `actualites.md`, telle que
/operations/construire-le-site/generee la rend. Ses objectifs
éditoriaux sont dans /contents/page-des-actualites.

Après le corps de la page :
- [articles] Un lien vers la page de chaque article publié du site.
- Chaque article publié du site, dans l'ordre des `articles` du site,
  dans cet ordre (not testable) :
  - sa couverture, s'il en a une, avec sa description pour texte
    alternatif ;
  - son titre, en sous-titre, en lien vers sa page ;
  - sa date, par exemple `13 janvier 2015` ;
  - son résumé, s'il en a un.
- Sans article publié, le texte `Aucune actualité pour l'instant.` (not
  testable).

## Page d'article

À `/actualites/<dossier>` : la page `actualites/<dossier>/index.md` d'un
article publié, telle que /operations/construire-le-site/generee la rend. Ses
objectifs éditoriaux sont dans /contents/page-darticle.

Entre le titre et le corps, sa date, comme sur
/ui/page-des-actualites, puis sa couverture s'il en a une, avec sa
description pour texte alternatif ; après le corps, un lien
`Toutes les actualités` vers `/actualites` (not testable).

## Articles en avant

Une section, montrée par une page pour une liste d'articles (not
testable) :
- sans article, rien ;
- sinon, chaque article de la liste, dans son ordre, comme sur
  /ui/page-des-actualites.

## Prochaines séances

Une section, montrée par une page pour une liste de séances (not
testable) :
- sans séance, rien ;
- sinon, le sous-titre `Prochaines séances`, puis les cinq premières
  séances de la liste, groupées par jour comme sur /ui/page-de-lagenda,
  puis un lien `Voir l'agenda` vers `/agenda`.
