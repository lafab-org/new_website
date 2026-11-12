# Dev43

This project follows the Dev43 process. Before any work, load the
`dev43:core` skill and follow it.

If the `dev43:core` skill is missing, ask the human to install the Dev43
plugin from https://github.com/joris-r/dev43
(marketplace `joris-r/dev43`, plugin `dev43@dev43`).


# Project instructions

For a content-heavy project, the specification includes `docs/contents.md`
besides the usual documents:

- It describes the editorial content of each page, one section per page,
  named as in `ui.md`, with no tags and no test. A section gives the
  communication objectives of the page, then its structure as a
  hierarchical list, with notes where they matter.
- This content is checked by reviewing the pages, as `design.md` is checked
  by eye, never by tests.
- Tests cover only what can be checked mechanically: the model, links
  included (every internal link leads to a page), and the build.
