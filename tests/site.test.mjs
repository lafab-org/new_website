import { test } from "node:test";
import assert from "node:assert/strict";
import {
  SRC, BASE_LAYOUT, pages, derivesFromBase, checkInvariants, readBuilt, readSource,
} from "./site.mjs";

const HEADING = /<h[1-6][^>]*>\s*Bonjour le monde\s*<\/h[1-6]>/;

test("base layout declares lang, viewport and title", () => {
  const layout = readSource(`_includes/${BASE_LAYOUT}`);
  assert.match(layout, /<html[^>]*\blang="fr"/);
  assert.match(layout, /<meta[^>]*name="viewport"/);
  assert.match(layout, /<title>[^<]*\{\{\s*title\b[^}]*\}\}[^<]*<\/title>/);
});

test("every page derives from the base layout", () => {
  for (const page of pages()) {
    assert.ok(derivesFromBase(SRC, page), `${page} does not derive from ${BASE_LAYOUT}`);
  }
});

test("initial state: only index.md", () => {
  // /operations/initial-state/accueil
  assert.deepEqual(pages(), ["index.md"]);
});

test("invariants of the model", () => {
  // /model/page/markdown
  // /model/page/titre
  // /model/site/page-accueil
  checkInvariants(assert);
});

test("build: index.md gives index.html, body rendered from Markdown", () => {
  // /operations/construire-le-site/generee
  const html = readBuilt("index.html");
  assert.match(html, /<h1[^>]*>/);
  assert.doesNotMatch(html, /^#\s/m);
});

test("home page: browser title", () => {
  // /ui/page-daccueil/titre
  assert.match(readBuilt("index.html"), /<title>\s*La Fabrique\s*<\/title>/);
});

test("home page: main heading", () => {
  // /ui/page-daccueil/titre-principal
  assert.match(readBuilt("index.html"), HEADING);
});

test("home page: welcome line", () => {
  // /ui/page-daccueil/bienvenue
  assert.ok(readBuilt("index.html").includes("Bienvenue à La Fabrique, atelier partagé à Strasbourg."));
});

test("scenario: opening the site", () => {
  // /scenarios/ouvrir-le-site
  const html = readBuilt("index.html");
  assert.match(html, /<html[^>]*\blang="fr"/);
  assert.match(html, HEADING);
});
