# Opérations

## Initial state

Le site est tel que les fichiers de `src/`, hors `_includes/`, sont dans
le dépôt : ses pages sont les fichiers Markdown, front matter compris,
hors ceux des réalisations ; ses réalisations sont lues dans ceux-ci, ses articles,
ses ateliers et ses évènements dans leurs pages ;
ses autres champs sont lus dans les fichiers de données.
Il n'a aucune séance ; son `jour` et son `tirage` sont libres.

## Construire le site

Génère le site web à partir des pages et des séances de TiBillet.

Trigger: `npm run build` ; `npm start` la relance à chaque changement
d'une page ; le déploiement la lance, selon
/technical/hebergement-et-deploiement.

Inputs, de l'environnement ou du fichier `.env` :
- `TIBILLET_FICHIER: optional string`
- `TIBILLET_URL: optional string`
- `TIBILLET_API_KEY: optional string`

Cases:
1. L'`accueil` du site ne respecte pas /model/site/blocs ou
   /model/site/corps, ou
   l'un de ses blocs ne respecte pas /model/bloc/section : la
   construction échoue, et `_site/` est inchangé (not testable).
2. [fichier] `TIBILLET_FICHIER` donné, ce qu'exporte son module se lit
   comme des évènements et des réservations de TiBillet, et chaque
   évènement qui donne une séance a un `name`, un `startDate` et une
   `url` : les séances sont lues dans ce module, sur tous ses
   évènements.
3. `TIBILLET_FICHIER` donné, dans les autres cas : la construction
   échoue, et `_site/` est inchangé (not testable).
4. `TIBILLET_URL` et `TIBILLET_API_KEY` donnés, TiBillet répond sans
   erreur à toutes les requêtes, celle des évènements et celles des
   réservations, et chaque évènement qui donne une séance a un `name`,
   un `startDate` et une `url` : les séances sont lues sur TiBillet,
   sur les évènements qu'il donne dont le `endDate`, ou à défaut le
   `startDate`, n'est pas passé (not testable).
5. `TIBILLET_URL` et `TIBILLET_API_KEY` donnés, dans les autres cas :
   la construction échoue, et `_site/` est inchangé (not testable).
6. Sinon : aucune séance (not testable).

Then:
- [generee] Après les cas 2, 4 et 6 : le résultat est le site généré
  sous `_site/`, où chaque page, hors celles des articles non publiés,
  est écrite en HTML, son corps rendu
  depuis le Markdown, et chaque image que montre une page construite, en
  fichiers image, le logo et l'image de remplacement des couvertures
  compris, et chaque fichier vers lequel mène le lien d'une
  illustration, ainsi que l'icône du site, `favicon.svg` et `favicon.ico` ;
  `index.md` donne `_site/index.html`. Les `séances` du site sont les séances lues, et
  son `jour` celui de la construction, à Paris.
- Après les cas 2, 4 et 6 : le `tirage` du site est tiré au hasard à
  chaque construction, parmi ceux que /model/site/tirage permet (not
  testable).
- [non-publie] Après les cas 2, 4 et 6 : la page d'un article non
  publié n'est pas dans `_site/`. Celles de ses photos qu'aucune page
  construite ne montre n'y sont pas non plus (not testable).
- [seance] Un évènement de TiBillet donne une séance quand l'un de ses
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
    `https://schema.org/EventCancelled`.
