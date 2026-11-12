import { test } from "node:test";
import assert from "node:assert/strict";
import { build, read, pages, checkInvariants, SRC } from "./site.mjs";

const HEADING = /<h[1-6][^>]*>\s*Bonjour le monde\s*<\/h[1-6]>/;

test("initial state: only index.md", () => {
  // /operations/initial-state/accueil
  assert.deepEqual(pages(SRC), ["index.md"]);
  checkInvariants(SRC, assert);
});

test("build: index.md gives index.html, in French, titled, rendered", () => {
  // /operations/construire-le-site/generee
  const out = build();
  const html = read(out, "index.html");
  assert.match(html, /<html[^>]*\blang="fr"/);
  assert.match(html, /<title>\s*La Fabrique\s*<\/title>/);
  checkInvariants(SRC, assert);
});

test("build: another page gives <name>/index.html with its own title and rendered body", () => {
  // /operations/construire-le-site/generee
  const out = build({
    "topic/page.md": "---\ntitle: Une page de test\n---\n\n# Titre de test\n\nUn *paragraphe*.\n",
  });
  const html = read(out, "topic/page/index.html");
  assert.match(html, /<html[^>]*\blang="fr"/);
  assert.match(html, /<title>\s*Une page de test\s*<\/title>/);
  assert.match(html, /<h1[^>]*>\s*Titre de test\s*<\/h1>/);
  assert.match(html, /<em>paragraphe<\/em>/);
  assert.match(read(out, "index.html"), HEADING);
});

test("home page: browser title", () => {
  // /ui/page-daccueil/titre
  const html = read(build(), "index.html");
  assert.match(html, /<title>\s*La Fabrique\s*<\/title>/);
});

test("home page: main heading", () => {
  // /ui/page-daccueil/titre-principal
  assert.match(read(build(), "index.html"), HEADING);
});

test("home page: welcome line", () => {
  // /ui/page-daccueil/bienvenue
  const html = read(build(), "index.html");
  assert.ok(html.includes("Bienvenue à La Fabrique, atelier partagé à Strasbourg."));
});

test("scenario: opening the site", () => {
  // /scenarios/ouvrir-le-site
  const html = read(build(), "index.html");
  assert.match(html, /<html[^>]*\blang="fr"/);
  assert.match(html, HEADING);
  assert.ok(html.includes("Bienvenue à La Fabrique"));
});

test("invariants hold for the model", () => {
  // /model/page/markdown
  // /model/page/titre
  // /model/site/page-accueil
  checkInvariants(SRC, assert);
});
