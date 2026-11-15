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
  attached to its kind of page in `ui.md`, with no tags and no test. A section gives the
  communication objectives of the page, then its structure as a
  hierarchical list, with notes where they matter.
- This content is checked by reviewing the pages, as `design.md` is checked
  by eye, never by tests.
- Tests are the form check of the built site that `technical.md`
  describes. A statement about a page gets a tag only if that check
  can verify it on `_site/`; otherwise it ends with `(not testable)`.
  Never add a test of a kind the policy does not name, nor a test of a
  test helper.

A content page that adds no tag (only `ui.md` and `contents.md`) is
planned without a Tests phase (Specification, Implementation): the
existing tests already run over every page.
