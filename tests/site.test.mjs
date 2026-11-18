// Form check of the built site: build once, then read _site/.
import { test, before } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const SRC = "src";
const SITE = "_site";
// The sample stand-in for TiBillet the site is built with, a module.
const TIBILLET = join("tests", "tibillet.mjs");
// Its events, as the module exports them when read by the tests.
const sampleEvents = async () =>
  (await import(pathToFileURL(TIBILLET).href)).default.events.results;

// Markdown files of src/ under `dir`, outside _includes/ and, unless
// `dir` is inside it, outside realisations/, as paths relative to src/.
function markdown(dir = "") {
  return readdirSync(join(SRC, dir), { withFileTypes: true }).flatMap((e) => {
    const rel = join(dir, e.name);
    if (e.isDirectory()) return rel === "_includes" || rel === "realisations" ? [] : markdown(rel);
    return rel.endsWith(".md") ? [rel] : [];
  });
}
const pages = () => markdown();
// The files of the réalisations: the Markdown files under realisations/.
const realisations = () => (existsSync(join(SRC, "realisations")) ? markdown("realisations") : []);

// Address serving a page, and the built file of an address.
const address = (page) => "/" + page.replace(/\.md$/, "").replace(/(^|\/)index$/, "");
const builtFile = (addr) => join(SITE, addr, "index.html");

const frontMatter = (page, key) => {
  const fm = readFileSync(join(SRC, page), "utf8").match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const m = fm?.[1].match(new RegExp(`^${key}:\\s*(.*)$`, "m"));
  return m ? m[1].trim().replace(/^(["'])(.*)\1$/, "$2") : "";
};

const text = (html) => html.replace(/<[^>]*>/g, " ")
  .replace(/&#39;|&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<")
  .replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();

const hrefs = (html) =>
  [...html.matchAll(/<a\s[^>]*?href\s*=\s*["']([^"']*)["']/gi)].map((m) => decodeURI(text(m[1])));
const ids = (html) => new Set([...html.matchAll(/\sid\s*=\s*["']([^"']*)["']/gi)].map((m) => m[1]));
const isEvent = (page) => /^evenements\/[^/]+\.md$/.test(page) && page !== "evenements/index.md";

// The sources of the articles, published or not: actualites/<dossier>/index.md.
const isArticle = (p) => /^actualites\/[^/]+\/index\.md$/.test(p);
const articles = () => pages().filter(isArticle);

// The mise en avant of an article page, from its front matter block:
// `{ pages, début, fin }`, each as written, or undefined without one.
const miseEnAvant = (page) => {
  const fm = readFileSync(join(SRC, page), "utf8").match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? "";
  const lines = fm.split(/\r?\n/);
  const start = lines.findIndex((l) => /^mise-en-avant:/.test(l));
  if (start < 0) return undefined;
  const block = [];
  const inline = lines[start].replace(/^mise-en-avant:/, "").replace(/\s+#.*$/, "").trim();
  if (inline !== "") {
    // A flow mapping, `{ pages: [...], fin: ... }`, read as a block of
    // its entries; any other value leaves the block empty.
    const flow = inline.match(/^\{(.*)\}$/)?.[1] ?? "";
    let depth = 0, entry = "";
    for (const c of flow + ",") {
      if (c === "," && depth === 0) { if (entry.trim()) block.push("  " + entry.trim()); entry = ""; continue; }
      if (c === "[") depth++;
      if (c === "]") depth--;
      entry += c;
    }
  } else {
    for (const l of lines.slice(start + 1)) {
      if (!/^\s/.test(l) && l.trim() !== "") break;
      block.push(l);
    }
  }
  const unquote = (v) => v.trim().replace(/^(["'])(.*)\1$/, "$2");
  const value = (key) => block.find((l) => new RegExp(`^\\s+${key}:`).test(l))?.replace(/^[^:]*:/, "").replace(/\s+#.*$/, "").trim();
  const listed = value("pages");
  let pages;
  if (listed === undefined) pages = [];
  else if (listed.startsWith("[")) {
    pages = listed.replace(/^\[|\]$/g, "").split(",").map(unquote).filter((v) => v !== "");
  } else if (listed !== "") pages = [unquote(listed)];
  else {
    const i = block.findIndex((l) => /^\s+pages:/.test(l));
    pages = [];
    for (const l of block.slice(i + 1)) {
      const m = l.replace(/\s+#.*$/, "").match(/^\s+-\s*(.*)$/);
      if (!m) break;
      pages.push(unquote(m[1]));
    }
  }
  const date = (key) => (value(key) === undefined ? undefined : unquote(value(key)));
  return { pages, début: date("début"), fin: date("fin") };
};

// The day in Paris, AAAA-MM-JJ, when the tests run.
const today = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit",
}).format(new Date());

// An article is published unless its mise en avant starts after today.
const published = (p) => {
  const début = miseEnAvant(p)?.début;
  return début === undefined || début <= today;
};

// The built pages: all pages, but those of the articles not published
// on the day the tests run.
let all;
const built = {};
before(() => {
  all = pages().filter((p) => !isArticle(p) || published(p));
  // Built from an empty _site/, so that no stale file is read.
  rmSync(SITE, { recursive: true, force: true });
  execFileSync("npm", ["run", "build"], {
    stdio: "pipe",
    env: { ...process.env, TIBILLET_FICHIER: TIBILLET },
  });
  for (const p of all) built[p] = readFileSync(builtFile(address(p)), "utf8");
});

test("every page is built as an HTML file, from its Markdown", () => {
  // /operations/construire-le-site/generee
  for (const p of all) {
    assert.match(built[p], /<html[\s>]/i, `${p}: not HTML`);
    assert.doesNotMatch(built[p], /^\s*#{1,6}\s/m, `${p}: Markdown heading left unrendered`);
  }
});

test("every page is in French, with a non-empty title and its browser title", () => {
  // /ui/page/francais
  // /model/page/titre
  // /ui/page/navigateur
  for (const p of all) {
    const title = frontMatter(p, "title");
    assert.match(built[p], /<html[^>]*\blang="fr"/, `${p}: no lang="fr"`);
    assert.notEqual(title, "", `${p}: empty title`);
    const shown = built[p].match(/<title>([^<]*)<\/title>/);
    assert.ok(shown, `${p}: no browser title`);
    const expected = p === "index.md" ? "La Fabrique" : `${title} - La Fabrique`;
    assert.equal(text(shown[1]), expected, `${p}: browser title`);
  }
});

test("every page has a single <h1>, carrying its title", () => {
  // /ui/page/titre
  for (const p of all) {
    const h1s = [...built[p].matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)];
    assert.equal(h1s.length, 1, `${p}: ${h1s.length} <h1>`);
    assert.equal(text(h1s[0][1]), frontMatter(p, "title"), `${p}: <h1> text`);
  }
});

test("every event has its practical information", () => {
  // /model/evenement/renseigne
  const events = all.filter(isEvent);
  assert.ok(events.length > 0, "no event page");
  for (const p of events) {
    for (const key of ["rendez-vous", "horaire", "prix"]) {
      assert.notEqual(frontMatter(p, key), "", `${p}: empty ${key}`);
    }
  }
});

// Identifiers of the categories of the site, from src/_data/categories.json.
const categoryIds = () => {
  const file = join(SRC, "_data", "categories.json");
  assert.ok(existsSync(file), "no src/_data/categories.json");
  const categories = JSON.parse(readFileSync(file, "utf8"));
  assert.ok(Array.isArray(categories), "categories.json is not a list");
  return categories.map((c) => c.identifiant);
};

// The strings of a front matter list, written inline (`[a, "b"]`) or as
// block items (`- a`); a single value gives a list of one.
const frontMatterList = (page, key) => {
  const fm = readFileSync(join(SRC, page), "utf8").match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const m = fm?.[1].match(new RegExp(`^${key}:[ \t]*(.*)((?:\\r?\\n[ \t]*-.*)*)`, "m"));
  if (!m) return [];
  const unquote = (v) => v.trim().replace(/^(["'])(.*)\1$/, "$2");
  const inline = m[1].trim();
  if (inline.startsWith("[")) {
    return inline.replace(/^\[|\]$/g, "").split(",").map(unquote).filter((v) => v !== "");
  }
  if (inline !== "") return [unquote(inline)];
  return m[2].split(/\r?\n/).filter((l) => l.trim() !== "").map((l) => unquote(l.replace(/^\s*-/, "")));
};

test("every event belongs to a category of the site", () => {
  // /model/evenement/categorie
  const identifiers = categoryIds();
  const events = all.filter(isEvent);
  assert.ok(events.length > 0, "no event page");
  for (const p of events) {
    assert.ok(identifiers.includes(frontMatter(p, "catégorie")), `${p}: catégorie`);
  }
});

test("every category a page shows is a category of the site", () => {
  // /model/page/categories
  const identifiers = categoryIds();
  const shown = all.flatMap((p) => frontMatterList(p, "catégories").map((c) => [p, c]));
  assert.ok(shown.length > 0, "no page shows a category");
  for (const [p, c] of shown) {
    assert.ok(identifiers.includes(c), `${p}: catégorie ${c}`);
  }
});

test("every réalisation belongs to categories of the site", () => {
  // /model/realisation/categories
  const identifiers = categoryIds();
  const files = realisations();
  assert.ok(files.length > 0, "no réalisation");
  for (const r of files) {
    for (const c of frontMatterList(r, "catégories")) {
      assert.ok(identifiers.includes(c), `${r}: catégorie ${c}`);
    }
  }
});

// The <img> elements of a built page, with their `src` and `alt`, if any.
const images = (html) => [...html.matchAll(/<img\s[^>]*>/gi)].map((m) => {
  const attr = (name) => m[0].match(new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
  const value = (a) => (a ? text(a[1] ?? a[2] ?? a[3]) : undefined);
  return { src: value(attr("src")), alt: value(attr("alt")) };
});

test("every image has a text alternative and leads to a file of _site/", () => {
  // /model/image/texte
  // /model/site/image
  const found = all.flatMap((p) => images(built[p]).map((i) => [p, i]));
  assert.ok(found.length > 0, "no image on any page");
  const wrong = [];
  for (const [p, { src, alt }] of found) {
    if (!alt) wrong.push(`${p}: ${src}: no text alternative`);
    const internal = src !== undefined && /^\/(?!\/)/.test(src);
    const file = internal ? join(SITE, decodeURI(src)) : "";
    if (!internal || !existsSync(file) || !statSync(file).isFile()) wrong.push(`${p}: ${src}: no file in _site/`);
  }
  assert.deepEqual(wrong, [], "wrong images");
});

test("no dead link: internal links lead to a page, fragments to an id", () => {
  // /model/site/lien-interne
  // /model/site/fragment
  const byAddress = Object.fromEntries(all.map((p) => [address(p), built[p]]));
  const dead = [];
  for (const p of all) {
    for (const href of hrefs(built[p])) {
      const [target, fragment] = href.split("#");
      let page;
      if (target === "") page = built[p];
      else if (/^\/(?!\/)/.test(target)) {
        const addr = target.replace(/\?.*$/, "").replace(/(.)\/$/, "$1");
        page = byAddress[addr];
      } else continue;
      if (!page || (fragment !== undefined && !ids(page).has(fragment))) dead.push(`${p}: ${href}`);
    }
  }
  assert.deepEqual(dead, [], "dead links");
});

test("the agenda shows the name of every séance of the sample module", async () => {
  // /operations/construire-le-site/fichier
  // /ui/page-de-lagenda/seances
  const identifiers = categoryIds();
  const events = await sampleEvents();
  const names = events
    .filter((e) => (e.keywords ?? []).some((k) => identifiers.includes(k)))
    .map((e) => e.name);
  assert.ok(names.length > 0, "no séance in the sample module");
  const file = builtFile("/agenda");
  assert.ok(existsSync(file), "no agenda page built");
  const shown = text(readFileSync(file, "utf8"));
  const missing = names.filter((n) => !shown.includes(n));
  assert.deepEqual(missing, [], "séances missing from the agenda");
});

test("every article folder starts with a valid date, then a hyphen", () => {
  // /model/article/date
  const found = articles();
  for (const p of found) {
    const folder = p.split("/")[1];
    const m = folder.match(/^(\d{4})-(\d{2})-(\d{2})-/);
    assert.ok(m, `${p}: folder does not start with AAAA-MM-JJ-`);
    const [y, mo, d] = m.slice(1).map(Number);
    const day = new Date(0);
    day.setUTCFullYear(y, mo - 1, d);
    const valid = day.getUTCFullYear() === y && day.getUTCMonth() === mo - 1 && day.getUTCDate() === d;
    assert.ok(valid, `${p}: ${m[0].slice(0, -1)} is not a valid date`);
  }
});

test("the news page links to every published article", () => {
  // /ui/page-des-actualites/articles
  const found = articles().filter(published);
  const file = builtFile("/actualites");
  assert.ok(existsSync(file), "no news page built");
  const links = new Set(hrefs(readFileSync(file, "utf8"))
    .map((h) => h.split("#")[0].replace(/\?.*$/, "").replace(/(.)\/$/, "$1")));
  const missing = found.map(address).filter((a) => !links.has(a));
  assert.deepEqual(missing, [], "articles missing from the news page");
});

// A valid day written AAAA-MM-JJ.
const validDay = (s) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s ?? "");
  if (!m) return false;
  const [y, mo, d] = m.slice(1).map(Number);
  const day = new Date(0);
  day.setUTCFullYear(y, mo - 1, d);
  return day.getUTCFullYear() === y && day.getUTCMonth() === mo - 1 && day.getUTCDate() === d;
};

test("every mise en avant is well formed", () => {
  // /model/mise-en-avant/valide
  for (const p of articles()) {
    const m = miseEnAvant(p);
    if (!m) continue;
    assert.ok(m.pages.length > 0, `${p}: no page`);
    for (const page of m.pages) assert.ok(["accueil", "agenda"].includes(page), `${p}: page ${page}`);
    assert.ok(validDay(m.fin), `${p}: fin ${m.fin}`);
    if (m.début !== undefined) {
      assert.ok(validDay(m.début), `${p}: début ${m.début}`);
      assert.ok(m.début <= m.fin, `${p}: début after fin`);
    }
  }
});

test("the page of an article not published is not built", () => {
  // /operations/construire-le-site/non-publie
  const unpublished = articles().filter((p) => !published(p));
  const present = unpublished.map(address).filter((a) => existsSync(builtFile(a)));
  assert.deepEqual(present, [], "pages of articles not published are built");
});

// The addresses of the articles in avant on `page` (accueil or agenda) today.
const enAvant = (page) => articles().filter((p) => {
  const m = miseEnAvant(p);
  return m && m.pages.includes(page) && (m.début === undefined || m.début <= today) && today <= m.fin;
}).map(address);

const linksOf = (addr) => {
  const file = builtFile(addr);
  assert.ok(existsSync(file), `${addr}: not built`);
  return new Set(hrefs(readFileSync(file, "utf8"))
    .map((h) => h.split("#")[0].replace(/\?.*$/, "").replace(/(.)\/$/, "$1")));
};

test("the home page links to every article in avant on it", () => {
  // /ui/page-daccueil/en-avant
  // /operations/construire-le-site/generee
  const links = linksOf("/");
  const missing = enAvant("accueil").filter((a) => !links.has(a));
  assert.deepEqual(missing, [], "articles in avant missing from the home page");
});

test("the agenda links to every article in avant on it", () => {
  // /ui/page-de-lagenda/en-avant
  // /operations/construire-le-site/generee
  const links = linksOf("/agenda");
  const missing = enAvant("agenda").filter((a) => !links.has(a));
  assert.deepEqual(missing, [], "articles in avant missing from the agenda");
});

// The day in Paris, AAAA-MM-JJ, of a date-time.
const parisDay = (iso) => new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit",
}).format(new Date(iso));

// The day `n` days after a day, both AAAA-MM-JJ.
const addDays = (day, n) => {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
};

test("the home page shows the name of every séance of the next 7 days", async () => {
  // /ui/page-daccueil/semaine
  // /operations/construire-le-site/fichier
  // /operations/construire-le-site/generee
  const identifiers = categoryIds();
  const last = addDays(today, 6);
  const names = (await sampleEvents())
    .filter((e) => (e.keywords ?? []).some((k) => identifiers.includes(k)))
    .filter((e) => today <= parisDay(e.startDate) && parisDay(e.startDate) <= last)
    .map((e) => e.name);
  assert.ok(names.length > 1, "fewer than two séances of the sample module in the next 7 days");
  const shown = text(built["index.md"]);
  const missing = names.filter((n) => !shown.includes(n));
  assert.deepEqual(missing, [], "séances of the next 7 days missing from the home page");
});

test("the home page shows three distinct réalisations, or all of them", () => {
  // /model/site/tirage
  // /operations/construire-le-site/generee
  const titles = realisations().map((r) => frontMatter(r, "titre"));
  assert.ok(titles.length > 0, "no réalisation");
  // How many réalisations bear each title.
  const bearing = new Map();
  for (const t of titles) bearing.set(t, (bearing.get(t) ?? 0) + 1);
  // How many times each title is a whole text node of the home page.
  const shown = new Map();
  for (const node of built["index.md"].split(/<[^>]*>/).map(text)) {
    if (bearing.has(node)) shown.set(node, (shown.get(node) ?? 0) + 1);
  }
  const count = [...shown.values()].reduce((a, b) => a + b, 0);
  assert.equal(count, Math.min(3, titles.length), "réalisations shown on the home page");
  for (const [t, n] of shown) {
    assert.ok(n <= bearing.get(t), `${t}: shown ${n} times, borne by ${bearing.get(t)} réalisations`);
  }
});
