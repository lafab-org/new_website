# Technique

- Les messages vus par l'utilisateur ne sont pas spécifiés. …
- Les séances viennent de l'API v2 de TiBillet, lue seulement, à la
  construction : les évènements par `GET /api/v2/events/?only_futur=1`,
  les réservations d'un évènement par
  `GET /api/v2/reservations/?event=<identifiant>`, avec l'en-tête
  `Authorization: Api-Key <clé>`.
- L'adresse de TiBillet et la clé sont les variables d'environnement
  `TIBILLET_URL` et `TIBILLET_API_KEY`, lues aussi dans le fichier
  `.env` à la racine, que git ignore.
- `TIBILLET_FICHIER`, variable d'environnement lue aussi dans `.env`,
  désigne un fichier JSON local qui tient lieu de
  TiBillet : les évènements et les réservations, au format des réponses
  de l'API ; la forme qui les réunit est libre.
- Des réservations, la construction ne garde que leur nombre de
  billets : aucune donnée personnelle n'est écrite, ni dans `_site/` ni
  ailleurs.

## Politique de tests et de qualité

  `npm test` n'a pas besoin du réseau. …
- Les tests construisent le site avec `TIBILLET_FICHIER` désignant
  `tests/tibillet.json`, un fichier d'exemple sans donnée personnelle,
  qui sert aussi au développement local.
×   chaque source de page, que ses catégories en sont.
  chaque source de page, que ses catégories en sont. Sur la page de
  l'agenda, il vérifie qu'elle montre le nom de chaque séance du
  fichier d'exemple.
