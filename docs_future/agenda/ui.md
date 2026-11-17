# Interface

## Page de l'association

la page de l'association sont dans …

Après le corps de la page, avant la section `Les évènements`, la
section /ui/prochaines-seances, pour les séances de la page (not
testable).

## Page d'atelier

pages d'atelier sont dans …

Après le corps de la page, avant la section `Les évènements`, la
section /ui/prochaines-seances, pour les séances de la page (not
testable).

## Page d'évènement

- `Activité : …

Après les informations pratiques, la section /ui/prochaines-seances,
pour les séances de l'évènement (not testable).

## Séance

Montre une séance, dans cet ordre (not testable) :
- son début, puis sa fin si elle en a une ;
- son nom, en lien vers la page de son évènement si elle en a un ;
- le nom de sa catégorie ;
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

## Prochaines séances

Une section, montrée par une page pour une liste de séances (not
testable) :
- sans séance, rien ;
- sinon, le sous-titre `Prochaines séances`, puis les cinq premières
  séances de la liste, groupées par jour comme sur /ui/page-de-lagenda,
  puis un lien `Voir l'agenda` vers `/agenda`.

## Page de l'agenda

À `/agenda` : la page `agenda.md`, telle que
/operations/construire-le-site/generee la rend. Ses objectifs
éditoriaux sont dans /contents/page-de-lagenda.

Après le corps de la page :
- [seances] Le nom de chaque séance du site.
- Les séances sont groupées par jour, chaque jour en sous-titre, ses
  séances sous la forme de /ui/seance, dans l'ordre des `séances` du
  site (not testable).
- Sans séance, le texte `Aucune séance prévue pour l'instant.` (not
  testable).
