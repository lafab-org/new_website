import { test } from "node:test";
import assert from "node:assert/strict";
import {
  SRC, BASE_LAYOUT, pages, derivesFromBase, checkInvariants, readBuilt, readSource, builtText,
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

test("initial state: the pages described in ui.md, and no other", () => {
  // /operations/initial-state/pages
  assert.deepEqual(pages(), ["ateliers/metallerie.md", "index.md"]);
});

test("invariants of the model", () => {
  // /model/page/markdown
  // /model/page/titre
  // /model/site/page-accueil
  // /model/site/page-metallerie
  checkInvariants(assert);
});

test("build: index.md gives index.html, body rendered from Markdown", () => {
  // /operations/construire-le-site/generee
  const html = readBuilt("index.html");
  assert.match(html, /<h[1-6][^>]*>/);
  assert.doesNotMatch(html, /^#\s/m);
  const atelier = readBuilt("ateliers/metallerie/index.html");
  assert.match(atelier, /<h[1-6][^>]*>/);
  assert.doesNotMatch(atelier, /^#\s/m);
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

test("home page: link to the metallerie", () => {
  // /ui/page-daccueil/lien-metallerie
  assert.match(
    readBuilt("index.html"),
    /<a\s[^>]*href="\/ateliers\/metallerie\/?"[^>]*>\s*La métallerie\s*<\/a>/,
  );
});

const ATELIER = "ateliers/metallerie/index.html";
const text = () => builtText(ATELIER);
const has = (t, ...words) => {
  for (const w of words) assert.ok(t.toLowerCase().includes(w.toLowerCase()), `missing "${w}"`);
};

test("metallerie page: browser title", () => {
  // /ui/page-metallerie/titre
  assert.match(readBuilt(ATELIER), /<title>\s*L(?:'|&#39;)atelier métallerie - La Fabrique\s*<\/title>/);
});

test("metallerie page: main heading", () => {
  // /ui/page-metallerie/titre-principal
  assert.match(readBuilt(ATELIER), /<h1[^>]*>\s*La métallerie\s*<\/h1>/);
});

test("metallerie page: presentation of the T1 bay", () => {
  // /ui/page-metallerie/presentation
  has(text(), "T1");
});

test("metallerie page: spaces in order", () => {
  // /ui/page-metallerie/espaces
  const t = text().toLowerCase();
  let at = t.indexOf("t1");
  for (const w of ["vélo", "soudure", "chaudronnerie", "généraliste", "usinage"]) {
    const next = t.indexOf(w, at);
    assert.ok(next >= 0, `"${w}" missing or out of order`);
    at = next;
  }
});

test("metallerie page: machining space not yet open", () => {
  // /ui/page-metallerie/usinage
  has(text(), "usinage", "pas encore", "tour", "fraiseuse", "perceuse", "bénévoles");
});

test("metallerie page: equipment list", () => {
  // /ui/page-metallerie/materiel
  const items = [...readBuilt(ATELIER).matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)]
    .map((m) => m[1].replace(/<[^>]+>/g, " "))
    .join(" ")
    .replace(/&#39;/g, "'")
    .toLowerCase();
  for (const w of [
    "meuleuse", "visseuse", "perceuse à colonne", "électrode enrobée", "tig",
    "semi-automatique", "scie circulaire", "scie à ruban", "table de soudage",
    "plieuse", "rouleuse", "établis", "étaux",
  ]) {
    assert.ok(items.includes(w), `equipment list lacks "${w}"`);
  }
});

test("metallerie page: invitation to the open evening", () => {
  // /ui/page-metallerie/portes-ouvertes
  has(text(), "jeudi", "19 h", "portes ouvertes");
});

test("metallerie page: user path", () => {
  // /ui/page-metallerie/initiation
  has(text(), "initiation", "électrode enrobée", "TIG", "semi-automatique", "projet", "autonom");
});

test("metallerie page: booking on the agenda, without a link", () => {
  // /ui/page-metallerie/reservation
  has(text(), "vendredi", "samedi", "agenda", "deux fois par mois");
  assert.doesNotMatch(readBuilt(ATELIER), /<a\s[^>]*href="[^"]*agenda/i);
});

test("metallerie page: ways to help", () => {
  // /ui/page-metallerie/benevolat
  has(text(), "jeudi", "conseil d'administration", "contact@lafab.org");
});

test("metallerie page: contact link", () => {
  // /ui/page-metallerie/contact
  assert.match(readBuilt(ATELIER), /<a\s[^>]*href="mailto:contact@lafab\.org"/);
});

test("scenario: visiting the metallerie as a curious visitor", () => {
  // /scenarios/visiter-la-metallerie-en-curieux
  const home = readBuilt("index.html");
  const link = home.match(/<a\s[^>]*href="(\/ateliers\/metallerie\/?)"[^>]*>\s*La métallerie\s*<\/a>/);
  assert.ok(link, "no link La métallerie on /");
  assert.equal(readBuilt(link[1].replace(/^\//, "").replace(/\/?$/, "/index.html")), readBuilt(ATELIER));
  has(text(), "jeudi", "19 h", "portes ouvertes");
});

test("scenario: training at the metallerie", () => {
  // /scenarios/se-former-a-la-metallerie
  const t = text();
  has(t, "électrode enrobée", "TIG", "semi-automatique", "initiation", "agenda");
  assert.match(readBuilt(ATELIER), /<html[^>]*\blang="fr"/);
});

test("scenario: helping at the metallerie", () => {
  // /scenarios/aider-a-la-metallerie
  has(text(), "jeudi", "conseil d'administration", "contact@lafab.org");
});
