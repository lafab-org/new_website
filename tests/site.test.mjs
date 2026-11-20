// Tests of the code on the sample content of tests/contenu/: build the
// site once, from the code of the repository and that content, into a
// folder other than _site/, then read its files.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

// The sample content, laid out like the content of src/.
const CONTENU = join("tests", "contenu");
// The sample stand-in for TiBillet the site is built with, a module.
const TIBILLET = join("tests", "tibillet.mjs");
// Where the site is built: a fresh folder, so that no stale file is read.
let SITE;

// The cases of the sample articles, by file under tests/contenu/.
// Not published: its mise en avant starts after the day of the build.
const NOT_PUBLISHED = ["actualites/2020-03-01-article-a-venir.md"];
// In avant on the agenda on the day of the build.
const IN_AVANT_AGENDA = [
  "actualites/2020-02-01-article-en-avant.md",
  "actualites/2020-02-15-article-commence.md",
];
// Pages that show a photo of the sample content: a published article,
// by its cover, and the home page, by the photo of a réalisation.
const PHOTO_PAGES = ["actualites/2020-01-15-article-publie.md", "index.md"];
// The alternative texts of the logo and of the placeholder of a cover.
const LOGO = "La Fabrique - accueil";
const PLACEHOLDER = "Photo à venir";

// Markdown files of the sample content under `dir`, outside
// realisations/, as paths relative to it.
function markdown(dir = "") {
  return readdirSync(join(CONTENU, dir), { withFileTypes: true }).flatMap((e) => {
    const rel = join(dir, e.name);
    if (e.isDirectory()) return rel === "realisations" ? [] : markdown(rel);
    return rel.endsWith(".md") ? [rel] : [];
  });
}
const isArticle = (p) => /^actualites\/[^/]+\.md$/.test(p);
const articles = () => markdown().filter(isArticle);
const published = (p) => !NOT_PUBLISHED.includes(p);

// Address serving a page, and the built file of an address.
const address = (page) => "/" + page.replace(/\.md$/, "").replace(/(^|\/)index$/, "");
const builtFile = (addr) => join(SITE, addr, "index.html");

const frontMatter = (page, key) => {
  const fm = readFileSync(join(CONTENU, page), "utf8").match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const m = fm?.[1].match(new RegExp(`^${key}:\\s*(.*)$`, "m"));
  return m ? m[1].trim().replace(/^(["'])(.*)\1$/, "$2") : "";
};

const text = (html) => html.replace(/<[^>]*>/g, " ")
  .replace(/&#39;|&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<")
  .replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();

const hrefs = (html) =>
  [...html.matchAll(/<a\s[^>]*?href\s*=\s*["']([^"']*)["']/gi)].map((m) => decodeURI(text(m[1])));

// The pages a built page links to, by address.
const linksOf = (addr) => {
  const file = builtFile(addr);
  assert.ok(existsSync(file), `${addr}: not built`);
  return new Set(hrefs(readFileSync(file, "utf8"))
    .map((h) => h.split("#")[0].replace(/\?.*$/, "").replace(/(.)\/$/, "$1")));
};

// The <img> elements of a built page, with their `src` and `alt`, if any.
const images = (html) => [...html.matchAll(/<img\s[^>]*>/gi)].map((m) => {
  const attr = (name) => m[0].match(new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
  const value = (a) => (a ? text(a[1] ?? a[2] ?? a[3]) : undefined);
  return { src: value(attr("src")), alt: value(attr("alt")) };
});

// The built pages: all sample pages but the articles not published.
let all;
const built = {};
before(() => {
  all = markdown().filter((p) => !isArticle(p) || published(p));
  SITE = mkdtempSync(join(tmpdir(), "site-exemple-"));
  execFileSync("npm", ["run", "build"], {
    stdio: "pipe",
    env: { ...process.env, TIBILLET_FICHIER: TIBILLET, CONTENU, SORTIE: SITE },
  });
  // A page not built reads as empty, and is reported by the test of
  // /operations/construire-le-site/generee.
  for (const p of all) {
    const file = builtFile(address(p));
    built[p] = existsSync(file) ? readFileSync(file, "utf8") : "";
  }
});
after(() => { if (SITE) rmSync(SITE, { recursive: true, force: true }); });

test("every page is built as an HTML file, from its Markdown", () => {
  // /operations/construire-le-site/generee
  assert.ok(all.includes("index.md"), "no index.md in the sample content");
  for (const p of all) {
    assert.ok(existsSync(builtFile(address(p))), `${p}: not built`);
    assert.match(built[p], /<html[\s>]/i, `${p}: not HTML`);
    assert.doesNotMatch(built[p], /^\s*#{1,6}\s/m, `${p}: Markdown heading left unrendered`);
  }
});

test("every image a built page shows is an image file of the built site", () => {
  // /operations/construire-le-site/generee
  const found = all.flatMap((p) => images(built[p]).map((i) => [p, i]));
  for (const page of PHOTO_PAGES) {
    assert.ok(found.some(([p, { alt }]) => p === page && alt !== LOGO && alt !== PLACEHOLDER),
      `${page}: no image other than the logo and the placeholder`);
  }
  assert.ok(found.some(([, { alt }]) => alt === LOGO), "no logo shown");
  assert.ok(found.some(([, { alt }]) => alt === PLACEHOLDER), "no placeholder of a cover shown");
  const wrong = found.filter(([, { src }]) => {
    if (src === undefined || !/^\/(?!\/)/.test(src)) return true;
    const file = join(SITE, decodeURI(src.replace(/[?#].*$/, "")));
    return !existsSync(file) || !statSync(file).isFile()
      || !/\.(jpe?g|png|webp|avif|gif|svg)$/i.test(file);
  }).map(([p, { src }]) => `${p}: ${src}`);
  assert.deepEqual(wrong, [], "images that are no image file of the built site");
});

test("every page is in French, with its browser title", () => {
  // /ui/page/francais
  // /ui/page/navigateur
  for (const p of all) {
    assert.match(built[p], /<html[^>]*\blang="fr"/, `${p}: no lang="fr"`);
    const shown = built[p].match(/<title>([^<]*)<\/title>/);
    assert.ok(shown, `${p}: no browser title`);
    const expected = p === "index.md" ? "La Fabrique" : `${frontMatter(p, "title")} - La Fabrique`;
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

test("the agenda shows the name of every séance of the sample module", async () => {
  // /operations/construire-le-site/fichier
  // /ui/page-de-lagenda/seances
  const categories = JSON.parse(readFileSync(join("src", "_data", "categories.json"), "utf8"));
  const identifiers = categories.map((c) => c.identifiant);
  const events = (await import(pathToFileURL(TIBILLET).href)).default.events.results;
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

test("the agenda links to every article in avant on it", () => {
  // /ui/page-de-lagenda/en-avant
  const links = linksOf("/agenda");
  const missing = IN_AVANT_AGENDA.map(address).filter((a) => !links.has(a));
  assert.deepEqual(missing, [], "articles in avant missing from the agenda");
});

test("the news page links to every published article", () => {
  // /ui/page-des-actualites/articles
  const found = articles().filter(published);
  assert.ok(found.length > 1, "fewer than two published articles");
  const links = linksOf("/actualites");
  const missing = found.map(address).filter((a) => !links.has(a));
  assert.deepEqual(missing, [], "articles missing from the news page");
});

test("the page of an article not published is not built", () => {
  // /operations/construire-le-site/non-publie
  for (const p of NOT_PUBLISHED) assert.ok(existsSync(join(CONTENU, p)), `${p}: not in the sample content`);
  assert.ok(existsSync(builtFile("/actualites")), "no news page built");
  const present = NOT_PUBLISHED.map(address).filter((a) => existsSync(builtFile(a)));
  assert.deepEqual(present, [], "pages of articles not published are built");
});
