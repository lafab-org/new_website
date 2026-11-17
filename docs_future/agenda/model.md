# Modèle

## Page

Les évènements d'une page sont ceux de ses catégories. …
Ses séances sont les séances du site dont la catégorie est l'une de ses
catégories, dans l'ordre des `séances` du site.

## Évènement

- `catégorie: string`, la catégorie dont il relève. …
  - [categorie] L'identifiant d'une catégorie du site. …

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

## Site

  évènement. …
- `séances: list of /model/seance`, les séances, par jour puis par
  heure de début ; l'ordre de deux séances au même début est libre.
