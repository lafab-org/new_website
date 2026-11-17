# Opérations

## Initial state

et ses autres champs sont lus dans les fichiers de données. …
Il n'a aucune séance.

## Construire le site

× Génère le site web à partir des pages.
Génère le site web à partir des pages et des séances de TiBillet.

× Inputs: aucune.
Inputs, de l'environnement ou du fichier `.env` :
- `TIBILLET_FICHIER: optional string`
- `TIBILLET_URL: optional string`
- `TIBILLET_API_KEY: optional string`

Cases: …
× - [generee] Toujours : le résultat est le site généré sous `_site/`, où
×   chaque page est écrite en HTML, son corps rendu depuis le Markdown ;
×   `index.md` donne `_site/index.html`.
1. [fichier] `TIBILLET_FICHIER` donné, le fichier se lit comme des
   évènements et des réservations de TiBillet : les séances sont lues
   dans ce fichier, sur tous ses évènements.
2. `TIBILLET_FICHIER` donné, le fichier ne se lit pas ainsi : la
   construction échoue, et `_site/` est inchangé (not testable).
3. `TIBILLET_URL` et `TIBILLET_API_KEY` donnés, TiBillet répond sans
   erreur à toutes les requêtes, celle des évènements et celles des
   réservations : les séances sont lues sur TiBillet, sur les
   évènements qu'il donne dont la fin, ou à défaut le début, n'est pas
   passée (not testable).
4. `TIBILLET_URL` et `TIBILLET_API_KEY` donnés, TiBillet ne répond pas
   ou répond une erreur à l'une des requêtes : la construction échoue,
   et `_site/` est inchangé (not testable).
5. Sinon : aucune séance (not testable).

Then:
- [generee] Après les cas 1, 3 et 5 : le résultat est le site généré
  sous `_site/`, où chaque page est écrite en HTML, son corps rendu
  depuis le Markdown ; `index.md` donne `_site/index.html`. Les
  `séances` du site sont les séances lues.
- Un évènement de TiBillet donne une séance quand l'un de ses
  `keywords` est l'identifiant d'une catégorie du site ; les autres sont
  ignorés. Sa séance a, aux dates et heures de Paris :
  - pour nom, son `name` ;
  - pour jour et début, ceux de son `startDate` ;
  - pour fin, l'heure de son `endDate`, s'il en a un le même jour ;
  - pour catégorie, le premier de ses `keywords` dans l'ordre des
    `catégories` du site ;
  - pour évènement, celui dont le nom de fichier de la page, sans
    extension, est le premier de ses `keywords` à en nommer un, s'il y
    en a un ;
  - pour accès, le premier de ses `keywords` qui est l'une des quatre
    valeurs, s'il y en a un ;
  - pour réservation, son `url` ;
  - pour jauge, son `maximumAttendeeCapacity`, s'il est supérieur à 0 ;
  - pour réservées, la somme des `ticketQuantity` des `reservedTicket`
    de ses réservations confirmées ou en attente ;
  - annulée, si son `eventStatus` est
    `https://schema.org/EventCancelled` (not testable).
