# Dev43

This project follows the Dev43 process. Before any work, load the
`dev43:core` skill and follow it.

If the `dev43:core` skill is missing, ask the human to install the Dev43
plugin from https://github.com/joris-r/dev43
(marketplace `joris-r/dev43`, plugin `dev43@dev43`).


# Project instructions

For a content-heavy project, the specification includes `docs/contents.md`:

- It gives the editorial objectives of the pages, one section per kind
  of page in `ui.md`, and one per page with objectives or constraints
  of its own, with no tags and no test. A section gives the communication objectives of the page, then the
  editorial constraints on its text, if any. It never describes the
  structure or the text of the page beyond the few strings a constraint
  fixes: the page source in `src/` is the content.
- The content is checked by reading the pages in `src/` against their
  objectives, as `design.md` is checked by eye, never by tests.
- Tests validate the code on the sample content of `tests/contenu/`,
  built outside `_site/`, as `technical.md` describes. A statement of
  `ui.md` or `operations.md` gets a tag only if the tests can observe
  it in the files built from that content, and an invariant of
  `model.md` only if `npm run verifier` can check it; otherwise it
  ends with `(not testable)`. Never add a test of a kind the policy
  does not name, nor a test of a test helper.
- The coverage check of the tests is
  `check.py tests tests scripts/verifier.mjs`: the verifier counts as
  the check of the `model.md` invariants.

A content page that adds no tag (only `ui.md` and `contents.md`) is
planned without a Tests phase (Specification, Implementation): `npm run
verifier` already runs over every page.

## Secrets

- `.env` contient l'adresse et la clé de l'API TiBillet, qui donne
  aussi l'accès en écriture. Ne jamais lire ni afficher ses valeurs
  (ni `Read`, ni `cat`, ni dans un message, un commit, un test ou une
  sortie de commande) ; pour en connaître les variables, masquer les
  valeurs : `sed 's/=.*/=<masqué>/' .env`.
- Le code lit la clé depuis l'environnement, jamais en dur, et elle
  n'apparaît jamais dans `_site/`.

## Processus en arrière-plan

- Pour arrêter un serveur lancé en arrière-plan, ne jamais utiliser
  `pkill -f` ni `pkill` sur un motif de la ligne de commande : le motif
  figure dans la commande de l'outil Bash elle-même, qui se tue. Garder
  le PID du processus au lancement (`$!`), ou chercher le PID par son
  port (`ss -ltnp`), puis `kill <pid>`.
