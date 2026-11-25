# Interface

## Page

Le visiteur ouvre une page à son adresse dans un navigateur, et suit un
lien en cliquant dessus.

- [français] La page est déclarée en français.
- [navigateur] Le titre du navigateur est `<titre> - La Fabrique`, où
  `<titre>` est le `title` de la page, et `La Fabrique` pour la page
  d'accueil.
- [icone] La page déclare comme icône `/favicon.svg`, l'icône du site
  /ui/icone-du-site.
- [titre] La page a un seul titre principal (`<h1>`) : son `title`.
- [ordre] L'en-tête /ui/en-tete vient en premier, puis le titre
  principal, puis le corps de la page, ou, pour la page d'accueil, ses
  blocs selon /ui/page-daccueil.

## Icône du site

À `/favicon.svg` et à `/favicon.ico`.

- [favicon] `/favicon.ico` a l'icône en 16 et en 32 pixels.

## En-tête

[en-tete] Commun à toutes les pages, dans cet ordre :
- le logo de La Fabrique, en lien vers `/`, avec le texte alternatif
  `La Fabrique - accueil` ;
- le menu principal :
  - `Actualités`, vers `/actualites` ;
  - `Agenda`, vers `/agenda` ;
  - `Réalisations`, vers `/realisations` ;
- le menu des ateliers et de l'association :
  - chaque atelier du site, dans l'ordre des `ateliers` du site, sous
    son nom court, vers sa page ;
  - `L'association`, vers `/association`.

Dans un menu, l'entrée qui mène à la page affichée est mise en
évidence (not testable).

## Page d'accueil

À `/` : la page `index.md`, telle que
/operations/construire-le-site/generee la rend. Ses objectifs éditoriaux
sont dans /contents/page-daccueil.

[blocs] Après le titre, chaque bloc de l'`accueil` du site, dans son
ordre, selon son type :
- [corps] `corps` : le corps de la page.
- [articles-en-avant] `articles-en-avant` : la section
  /ui/articles-en-avant, pour les articles en avant sur la page
  d'accueil.
- [ateliers] `ateliers` : le sous-titre `Les ateliers`, puis chaque
  atelier du site, dans l'ordre des `ateliers` du site, dans cet ordre :
  - sa couverture, avec sa description pour texte alternatif, ou sans
    couverture l'image de remplacement des couvertures, avec le texte
    alternatif `Photo à venir` ;
  - son nom, le `title` de sa page, en lien vers sa page ;
  - son accroche.
- [section] `section` : la section `<titre>` de sa page, rendue comme
  sur celle-ci, puis un lien `Plus de détails : <title>` vers cette
  page, où `<title>` est son `title`.
- [semaine] `semaine` : le sous-titre `Les 7 prochains jours`, puis :
  - [seances-semaine] Le nom de chaque séance des 7 prochains jours.
  - [jours] Elles sont groupées par jour comme sur /ui/page-de-lagenda.
  - Sans séance des 7 prochains jours, le texte
    `Aucune séance dans les 7 prochains jours.` (not testable).
  - [lien-agenda] Un lien `Tout l'agenda` vers `/agenda`.
- `realisations` :
  - Sans réalisation dans le `tirage`, rien (not testable).
  - [realisations] Sinon, le sous-titre `Des réalisations`, puis :
    - Chaque réalisation du `tirage` du site, dans son ordre : sa
      première photo, avec sa description pour texte alternatif, puis
      son titre.
    - Un lien `Toutes les réalisations` vers `/realisations`.

## Page de l'association

À `/association` : la page `association.md`, telle que
/operations/construire-le-site/generee la rend. Les objectifs éditoriaux de
la page de l'association sont dans /contents/page-de-lassociation.

[ordre] Après le corps de la page, dans cet ordre :
- [lieu] le sous-titre `Où nous trouver`, puis le `lieu` du site ;
- [prochaines-seances] la section /ui/prochaines-seances, pour les
  séances de la page ;
- [evenements] la section `Les évènements` de ses évènements, comme sur
  /ui/page-datelier.

## Page d'atelier

À `/ateliers/<nom>` : la page `ateliers/<nom>.md` d'un atelier, telle que
/operations/construire-le-site/generee la rend. Les objectifs éditoriaux des
pages d'atelier sont dans /contents/page-datelier.

[couverture] Entre le titre et le corps, la page montre la couverture
de l'atelier, s'il en a une, avec sa description pour texte
alternatif.

[ordre] Après le corps de la page, dans cet ordre :
- [illustrations] s'il a des illustrations, le sous-titre
  `L'atelier en images`, puis une galerie qui les montre dans leur
  ordre, chacune avec sa description pour texte alternatif et
  en lien vers une copie agrandie de la photo ; sans illustration, rien ;
- [prochaines-seances] la section /ui/prochaines-seances, pour les
  séances de la page ;
- les évènements de la page :
  - [sans-evenement] Sans évènement de la page, rien.
  - [evenements] Sinon, le sous-titre `Les évènements`, puis chacun des
    évènements de la page, triés par titre : un lien vers sa page, qui
    montre sa couverture, avec sa description pour texte alternatif, ou
    sans couverture l'image de remplacement des couvertures, avec le
    texte alternatif `Photo à venir`, puis son titre, puis son accroche
    s'il en a une.

## Page d'évènement

À `/evenements/<nom>` : la page `evenements/<nom>.md` d'un évènement,
telle que /operations/construire-le-site/generee la rend. Les objectifs éditoriaux des
pages d'évènement sont dans /contents/page-devenement.

[couverture] Entre le titre et le corps, la page montre la couverture
de l'évènement, s'il en a une, avec sa description pour texte
alternatif.

[informations] Puis son accroche, s'il en a une, puis ses informations
pratiques, en liste, dans cet ordre, chacune son libellé puis sa
valeur :
- `Rendez-vous`, puis son `rendez-vous` ;
- `Horaire`, puis son `horaire` ;
- `Lieu`, puis le `lieu` du site ;
- `Activité`, puis son `prix`.

[prochaines-seances] Après les informations pratiques, la section
/ui/prochaines-seances, pour les séances de l'évènement.

[illustrations] Après le corps de la page, s'il a des illustrations,
le sous-titre `Photos`, puis une galerie qui les montre dans leur
ordre, chacune avec sa description pour texte alternatif et en lien
vers une copie agrandie de la photo. Sans illustration, rien.

## Séance

[ordre] Montre une séance, dans cet ordre :
- [couverture] hors d'une page d'évènement, la couverture de son
  évènement, avec sa description pour texte alternatif, ou, sans
  évènement ou sans couverture, l'image de remplacement des
  couvertures, avec le texte alternatif `Photo à venir` ;
- [horaire] son début, puis sa fin si elle en a une ;
- [categorie] le nom de sa catégorie ;
- [nom] son nom, en lien vers la page de son évènement si elle en a un ;
- sa participation, le premier cas qui s'applique :
  1. [annulee] annulée : `Annulée` ;
  2. [libre] accès `libre` : `Accès libre` ;
  3. [sur-place] accès `sur-place` : `Paiement sur place` ;
  4. [reservation] accès `réservation-gratuite` ou
     `réservation-payante`, ou sans accès : `Réservation gratuite` ou
     `Réservation payante` selon l'accès, rien sans accès ; puis, si
     elle a une jauge, `1 place restante` ou `<n> places restantes`,
     où `<n>` est le nombre de ses places restantes, ou `Complet` si
     elle est complète ; enfin, sauf si elle est complète, un lien
     vers sa réservation : `Réserver` avec un accès,
     `Voir sur TiBillet` sans accès.

[nouvel-onglet] Le lien vers la réservation de la séance s'ouvre dans un
nouvel onglet.

## Page de l'agenda

À `/agenda` : la page `agenda.md`, telle que
/operations/construire-le-site/generee la rend. Ses objectifs
éditoriaux sont dans /contents/page-de-lagenda.

[ordre] Après le corps de la page, dans cet ordre :
- [articles-en-avant] La section /ui/articles-en-avant, pour les
  articles en avant sur la page de l'agenda.
- [en-avant] Un lien vers la page de chaque article en avant sur la
  page de l'agenda.
- [seances] Le nom de chaque séance du site.
- [jours] Les séances sont groupées par jour, chaque jour en
  sous-titre, ses séances sous la forme de /ui/seance, dans l'ordre des
  `séances` du site.
- Sans séance, le texte `Aucune séance prévue pour l'instant.` (not
  testable).

## Page des évènements

À `/evenements` : la page `evenements.md`, telle que
/operations/construire-le-site/generee la rend. Ses objectifs
éditoriaux sont dans /contents/page-des-evenements.

[groupes] Après le corps de la page, un groupe par catégorie qui a des
évènements, dans l'ordre des `catégories` du site : le nom de la
catégorie en sous-titre, puis chacun de ses évènements, triés par
titre, comme dans la section `Les évènements` de /ui/page-datelier.

## Page des séances par évènement

À `/seances` : la page `seances.md`, telle que
/operations/construire-le-site/generee la rend. Ses objectifs
éditoriaux sont dans /contents/page-des-seances-par-evenement.

[groupes] Après le corps de la page, dans cet ordre :
- un groupe par catégorie qui a des évènements, dans l'ordre des
  `catégories` du site, son nom en sous-titre ;
- dans chaque groupe, chacun de ses évènements, triés par titre : son
  titre en sous-titre, en lien vers sa page, puis ses séances groupées
  par jour comme sur /ui/page-de-lagenda ; sans séance, le texte
  `Aucune séance prévue pour l'instant.`

## Page des réalisations

À `/realisations` : la page `realisations.md`, telle que
/operations/construire-le-site/generee la rend. Ses objectifs
éditoriaux sont dans /contents/page-des-realisations.

[realisations] Après le corps de la page, chaque réalisation du site,
dans l'ordre des `réalisations` du site, dans cet ordre :
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
- [contenu] Chaque article publié du site, dans l'ordre des `articles`
  du site, dans cet ordre :
  - sa couverture, s'il en a une, avec sa description pour texte
    alternatif ;
  - son titre, en sous-titre, en lien vers sa page ;
  - sa date, par exemple `13 janvier 2015` ;
  - son résumé, s'il en a un.
- Sans article publié, le texte `Aucune actualité pour l'instant.` (not
  testable).

## Page d'article

À `/actualites/<nom>` : la page `actualites/<nom>.md` d'un
article publié, telle que /operations/construire-le-site/generee la rend. Ses
objectifs éditoriaux sont dans /contents/page-darticle.

[ordre] Entre le titre et le corps, sa date, comme sur
/ui/page-des-actualites, puis sa couverture s'il en a une, avec sa
description pour texte alternatif ; après le corps, un lien
`Toutes les actualités` vers `/actualites`.

## Articles en avant

Une section, montrée par une page pour une liste d'articles :
- sans article, rien (not testable) ;
- [articles] sinon, chaque article de la liste, dans son ordre, avec le
  même contenu que sur /ui/page-des-actualites.

## Prochaines séances

Une section, montrée par une page pour une liste de séances :
- [sans-seance] sans séance, rien ;
- [seances] sinon, le sous-titre `Prochaines séances`, puis les cinq
  premières séances de la liste, groupées par jour comme sur
  /ui/page-de-lagenda, puis un lien `Voir l'agenda` vers `/agenda`.
