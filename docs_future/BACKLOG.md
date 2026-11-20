# Backlog

- Suspension de la reconstruction quotidienne : GitHub suspend la tâche planifiée après 60 jours sans activité sur le dépôt ; la réactiver automatiquement, ou passer à une offre payante.
- Photos des ateliers : intégrer aux pages une sélection de photos (redimensionnées, avec texte alternatif) ; les pages métallerie et Répar'Action les recevront.
- Pied de page : adresse, contact et liens utiles sur toutes les pages.
- Ligne éditoriale : relire la page métallerie pour présenter La Fabrique comme un lieu où l'on participe, non comme un service.
- Données structurées des évènements : balisage `schema.org/Event`, récurrence comprise, pour les moteurs de recherche.
- Typographie française : une espace insécable avant `?`, `!`, `:` et `;`, pour qu'aucun de ces signes ne passe seul à la ligne ; `1er` pour le premier jour du mois dans les dates (`1er juin 2020`).
- Voies pour aider : une partie commune aux pages d'atelier et à l'association (venir un jeudi soir, le conseil d'administration, le courriel), à la place de la section répétée dans chaque page.
- Réunions de gestion et AG annuelle : leurs pages d'évènement, dans la catégorie « Vie de l'association ».
- Lien d'une séance vers sa propre page : sur une page d'évènement, le nom de la séance ne renvoie pas à la page elle-même.
- Section « Les évènements » : la décrire dans `ui.md` (pages d'atelier et de l'association), accroche comprise, plutôt que dans `contents.md`.
- Séances à plusieurs catégories : un évènement TiBillet portant plusieurs catégories apparaît sur chacune des pages concernées, pas seulement la première.
- Réalisations sur les pages d'atelier : quelques réalisations de ses catégories, avec un lien vers la page des réalisations.
- Données personnelles des photos : métadonnées, visages et noms d'auteurs des réalisations.
- Pagination de la page des réalisations.
- Reprise des anciennes actualités : les 82 nouvelles de l'ancien site, triées et nettoyées.
- Couverture partagée : un seul gabarit et une seule déclaration Pages CMS pour la couverture des ateliers, des articles et des évènements.
- Séance annulée et lecteurs d'écran : l'annulation n'est dite qu'en fin de carte, après le nom barré ; l'annoncer dès le nom.
- `.gitignore` : ignorer `.playwright-mcp/`, le dossier des captures d'écran de l'outil de navigateur.
- Données d'exemple TiBillet : remplacer `TIBILLET_FICHIER` par une simple activation des données d'exemple, sans citer le chemin du module, et une commande npm dédiée au développement local.
- Favicon : une icône du site pour l'onglet du navigateur, tirée du logo ; aujourd'hui `/favicon.ico` répond 404.
- Échec de construction : `_site/` vraiment inchangé, la copie des fichiers fixes (CSS, logos) comprise ; aujourd'hui elle a lieu avant l'échec.

## Rapports à envoyer

- Pages CMS (https://github.com/pages-cms/pages-cms/issues), à envoyer
  tel quel :

  > **Saving an entry fails with "Cannot read properties of undefined
  > (reading 'match')" when a `date` field sits in an absent optional
  > object**
  >
  > Config: a collection with an optional `object` field (not required)
  > holding a `date` field. Edit an existing entry whose front matter has
  > no value for that object, change any other field, save.
  >
  > Result: `POST /api/<owner>/<repo>/<branch>/files/<path>` returns 500,
  > "Cannot read properties of undefined (reading 'match')".
  >
  > Cause (at 6f4e860): in `app/api/[owner]/[repo]/[branch]/files/[path]/route.ts`,
  > `deepMap` (`lib/schema.ts`) traverses the absent object as `{}` and
  > calls each nested field's write function with `undefined`. The date
  > field's `write` (`fields/core/date/index.ts`) passes it to date-fns
  > `parse`, which throws. `default: ""` on the date field does not help.
  >
  > Suggested fix: return `value` unchanged from the date `write` (and
  > `read`) when it is empty, as the image field does (`if (!value)
  > return null`); or skip absent objects in `deepMap`.
  >
  > Workaround: a `string` field with a `pattern` instead of `date`.
