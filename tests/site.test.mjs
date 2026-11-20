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
// In avant on the home page on the day of the build.
const IN_AVANT_ACCUEIL = ["actualites/2020-02-10-article-en-avant-accueil.md"];
// Put forward on the home page, but its mise en avant has ended.
const NOT_IN_AVANT_ACCUEIL = ["actualites/2020-01-20-article-fini.md"];

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

const source = (page) => readFileSync(join(CONTENU, page), "utf8")
  .match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
const unquote = (v) => v.trim().replace(/^(["'])(.*)\1$/, "$2");
const frontMatter = (page, key) => {
  const m = source(page)?.[1].match(new RegExp(`^${key}:\\s*(.*)$`, "m"));
  return m ? unquote(m[1]) : "";
};
// The descriptions of the photos a front matter key gives, in order: a
// single photo (`couverture`) or a list of them (`photos`).
const descriptions = (page, key) => {
  const m = source(page)?.[1].match(new RegExp(`^${key}:[ \\t]*\\r?\\n((?:[ \\t]+.*(?:\\r?\\n|$))*)`, "m"));
  return m ? [...m[1].matchAll(/^[ \t-]*description:\s*(.*)$/gm)].map((d) => unquote(d[1])) : [];
};
// The first line of text of the body of a page, if any.
const firstLine = (page) => (source(page)?.[2] ?? "").split(/\r?\n/)
  .map((l) => l.trim()).find((l) => l && !l.startsWith("#"));

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

// The reading order of an HTML fragment: each run of text, and each
// image with its alternative text, with the address of the link it is
// in, if any.
function items(html) {
  const out = [];
  let href;
  for (const m of html.matchAll(/<(\/?)([a-z][a-z0-9]*)\b([^>]*)>|<!--[\s\S]*?-->|([^<]+)/gi)) {
    if (m[4] !== undefined) {
      const t = text(m[4]);
      if (t) out.push({ text: t, href });
      continue;
    }
    if (!m[2]) continue;
    const attr = (name) => {
      const a = m[3].match(new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
      return a ? text(a[1] ?? a[2] ?? a[3]) : undefined;
    };
    const tag = m[2].toLowerCase();
    if (tag === "a") href = m[1] ? undefined : decodeURI(attr("href") ?? "");
    else if (tag === "img" && !m[1]) out.push({ alt: attr("alt"), href });
  }
  return out;
}
// The reading order of a built page, before and after its <h1>.
const beforeTitle = (html) => items(html.split(/<h1\b/i)[0].replace(/^[\s\S]*?<body\b[^>]*>/i, ""));
const afterTitle = (html) => items(html.replace(/^[\s\S]*?<h1\b[^>]*>[\s\S]*?<\/h1>/i, ""));
// Whether `list` holds the items `expected`, in this order, maybe among others.
const holdsInOrder = (list, expected) => {
  let from = 0;
  for (const e of expected) {
    const k = list.findIndex((i, n) => n >= from && Object.keys(e).every((key) => i[key] === e[key]));
    if (k < 0) return false;
    from = k + 1;
  }
  return true;
};

// The day of the build in Paris, and the day `n` days after it, as AAAA-MM-JJ.
const today = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit",
}).format(new Date());
const plusDays = (day, n) => {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
};

// The séances of the sample module, by name and day in Paris.
async function seances() {
  const categories = JSON.parse(readFileSync(join("src", "_data", "categories.json"), "utf8"));
  const identifiers = categories.map((c) => c.identifiant);
  const events = (await import(pathToFileURL(TIBILLET).href)).default.events.results;
  return events.filter((e) => (e.keywords ?? []).some((k) => identifiers.includes(k)))
    .map((e) => ({ name: e.name, day: e.startDate.slice(0, 10) }));
}

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

test("every page shows its header first, then its title, then its body", () => {
  // /ui/page/ordre
  // The header itself is checked by the test of /ui/en-tete/en-tete,
  // on what comes before the <h1>.
  for (const p of all) {
    assert.deepEqual(beforeTitle(built[p])[0], { alt: LOGO, href: "/" }, `${p}: header not first`);
    const line = firstLine(p);
    if (p === "index.md" || !line) continue;
    assert.ok(afterTitle(built[p]).some((i) => i.text?.includes(text(line))), `${p}: body not after the <h1>`);
  }
});

test("every page has the header, with the logo and both menus in order", () => {
  // /ui/en-tete/en-tete
  const ateliers = JSON.parse(readFileSync(join("src", "_data", "ateliers.json"), "utf8"));
  const expected = [
    { alt: LOGO, href: "/" },
    { text: "Agenda", href: "/agenda" },
    { text: "Actualités", href: "/actualites" },
    { text: "Réalisations", href: "/realisations" },
    ...ateliers.map((a) => ({ text: a.menu, href: a.adresse })),
    { text: "L'association", href: "/association" },
  ];
  for (const p of all) assert.ok(holdsInOrder(beforeTitle(built[p]), expected), `${p}: header`);
});

// The blocks of the sample home page, in order, from its front matter.
const blocs = () => [...source("index.md")[1].matchAll(/^\s*-\s+type:\s*(\S+)((?:\r?\n[ \t]+(?!-)\S.*)*)/gm)]
  .map((m) => ({
    type: m[1],
    page: m[2].match(/^\s*page:\s*(.*)$/m)?.[1].trim(),
    titre: m[2].match(/^\s*titre:\s*(.*)$/m)?.[1].trim(),
  }));

// The reading order of the home page after its title, cut into the
// region of each block: from its first item to the first of the next.
function regions() {
  const main = afterTitle(built["index.md"]);
  const start = 0;
  const accueil = new Set(IN_AVANT_ACCUEIL.map(address));
  const first = {
    corps: (i) => i.text === text(firstLine("index.md")),
    "articles-en-avant": (i) => accueil.has(i.href),
    ateliers: (i) => i.text === "Les ateliers",
    section: (i, b) => i.text === b.titre,
    semaine: (i) => i.text === "Les 7 prochains jours",
    realisations: (i) => i.text === "Des réalisations",
  };
  const found = [];
  let from = start;
  for (const b of blocs()) {
    const k = main.findIndex((i, n) => n >= from && first[b.type](i, b));
    assert.ok(k >= 0, `home page: block ${b.type} missing, or out of order`);
    found.push([b, k]);
    from = k + 1;
  }
  return found.map(([b, k], n) => ({ ...b, items: main.slice(k, found[n + 1]?.[1] ?? main.length) }));
}
const region = (type) => regions().find((r) => r.type === type).items;

// The index of the first item at or after `from` that `match` accepts.
const next = (list, from, match, what) => {
  const k = list.findIndex((i, n) => n >= from && match(i));
  assert.ok(k >= 0, `home page: ${what} missing, or out of order`);
  return k;
};

test("the home page shows each of its blocks, in their order, after its title", () => {
  // /ui/page-daccueil/blocs
  // /ui/page-daccueil/corps
  const types = blocs().map((b) => b.type);
  for (const t of ["corps", "articles-en-avant", "ateliers", "section", "semaine", "realisations"]) {
    assert.ok(types.includes(t), `no block ${t} in the sample home page`);
  }
  regions();
});

test("the articles-en-avant block links to every article in avant on the home page, and only them", () => {
  // /ui/page-daccueil/articles-en-avant
  const isArticleLink = (h) => /^\/actualites\/./.test(h ?? "");
  const block = new Set(region("articles-en-avant").map((i) => i.href).filter(isArticleLink));
  assert.deepEqual([...block].sort(), IN_AVANT_ACCUEIL.map(address).sort(), "articles in the block");
  for (const p of NOT_IN_AVANT_ACCUEIL) assert.ok(existsSync(join(CONTENU, p)), `${p}: not in the sample content`);
});

test("the ateliers block shows each atelier in order: cover, name to its page, accroche", () => {
  // /ui/page-daccueil/ateliers
  const ateliers = JSON.parse(readFileSync(join("src", "_data", "ateliers.json"), "utf8"));
  const list = region("ateliers");
  assert.equal(list[0].text, "Les ateliers");
  const covers = [];
  let from = 1;
  for (const a of ateliers) {
    const page = a.adresse.replace(/^\//, "") + ".md";
    const [cover] = descriptions(page, "couverture");
    covers.push(cover);
    const alt = cover ?? PLACEHOLDER;
    from = next(list, from, (i) => i.alt === alt, `${page}: cover "${alt}"`) + 1;
    from = next(list, from, (i) => i.text === frontMatter(page, "title") && i.href === a.adresse,
      `${page}: name in a link to its page`) + 1;
    from = next(list, from, (i) => i.text === frontMatter(page, "accroche"), `${page}: accroche`) + 1;
  }
  assert.ok(covers.some((c) => c) && covers.some((c) => !c), "no atelier with a cover and one without");
});

test("the section block shows the section of its page as there, then a link to it", () => {
  // /ui/page-daccueil/section
  const [b] = blocs().filter((x) => x.type === "section");
  const list = region("section");
  const link = list.at(-1);
  assert.deepEqual(link, { text: `Plus de détails : ${frontMatter(b.page, "title")}`, href: address(b.page) });
  const shown = list.slice(0, -1);
  assert.ok(shown.length > 1, "no content in the section");
  const there = afterTitle(built[b.page]);
  const k = there.findIndex((i) => i.text === b.titre);
  assert.ok(k >= 0, `${b.page}: no section ${b.titre}`);
  assert.deepEqual(shown, there.slice(k, k + shown.length), "section not as on its page");
  // The lines of text of the section, in the Markdown of its page.
  const lines = source(b.page)[2].split(/\r?\n/).map((l) => l.trim());
  const h = lines.findIndex((l) => l === `## ${b.titre}`);
  const end = lines.findIndex((l, n) => n > h && /^##\s/.test(l));
  const body = lines.slice(h + 1, end < 0 ? undefined : end).filter((l) => l);
  assert.ok(body.length > 0, `${b.page}: no text in the section ${b.titre}`);
  const texts = shown.map((i) => i.text);
  assert.deepEqual(body.map(text).filter((l) => !texts.includes(l)), [], "text of the section missing");
  // The section ends at the next level-2 heading of its page.
  assert.ok(end >= 0, `${b.page}: no section after ${b.titre}`);
  const following = lines.slice(end).map((l) => text(l.replace(/^##\s+/, ""))).filter((l) => l);
  assert.deepEqual(following.filter((l) => texts.includes(l)), [], "text of the next section shown");
});

test("the semaine block shows the séances of the next 7 days, then a link to the agenda", async () => {
  // /ui/page-daccueil/semaine
  // /ui/page-daccueil/seances-semaine
  // /ui/page-daccueil/lien-agenda
  const list = region("semaine");
  assert.equal(list[0].text, "Les 7 prochains jours");
  const all = await seances();
  const last = plusDays(today, 6);
  const inWeek = all.filter((s) => s.day >= today && s.day <= last).map((s) => s.name);
  const outside = all.map((s) => s.name).filter((n) => !inWeek.includes(n));
  assert.ok(inWeek.length > 0 && outside.length > 0, "the sample module lacks séances in and out of the 7 days");
  const shown = list.map((i) => i.text);
  assert.deepEqual(inWeek.filter((n) => !shown.includes(n)), [], "séances of the 7 days missing");
  assert.deepEqual(outside.filter((n) => shown.includes(n)), [], "séances outside the 7 days shown");
  const k = list.findIndex((i) => i.text === "Tout l'agenda" && i.href === "/agenda");
  assert.ok(k >= 0, "no link to the agenda");
  assert.ok(inWeek.every((n) => shown.indexOf(n) < k), "link to the agenda before a séance");
});

test("the realisations block shows the first photo then the title of each réalisation drawn, then a link", () => {
  // /ui/page-daccueil/realisations
  const files = readdirSync(join(CONTENU, "realisations")).filter((f) => f.endsWith(".md"))
    .map((f) => join("realisations", f));
  // With three réalisations or fewer, the draw has them all.
  assert.ok(files.length > 1 && files.length <= 3, "the sample needs two or three réalisations");
  const list = region("realisations");
  assert.equal(list[0].text, "Des réalisations");
  const link = list.findIndex((i) => i.text === "Toutes les réalisations" && i.href === "/realisations");
  assert.ok(link >= 0, "no link to the réalisations");
  for (const f of files) {
    const [first, ...others] = descriptions(f, "photos");
    assert.ok(others.length > 0, `${f}: the sample needs several photos`);
    const k = next(list, 1, (i) => i.alt === first, `${f}: first photo`);
    next(list, k + 1, (i) => i.text === frontMatter(f, "titre"), `${f}: title after its photo`);
    assert.ok(list.findIndex((i) => i.text === frontMatter(f, "titre")) < link, `${f}: link before it`);
    for (const o of others) assert.ok(!list.some((i) => i.alt === o), `${f}: photo ${o} shown`);
  }
});

// The address of the page a link designates: without fragment,
// parameters, or final `/` other than that of `/`.
const designated = (href) => href?.split("#")[0].replace(/\?.*$/, "").replace(/(.)\/$/, "$1");
// The values of a front matter key given as a list, in order.
const listOf = (page, key) => {
  const m = source(page)?.[1].match(new RegExp(`^${key}:[ \\t]*\\r?\\n((?:[ \\t]+-.*(?:\\r?\\n|$))*)`, "m"));
  return m ? [...m[1].matchAll(/^[ \t]*-\s*(.*)$/gm)].map((v) => unquote(v[1])) : [];
};
const isEvent = (p) => /^evenements\/[^/]+\.md$/.test(p) && p !== "evenements/index.md";
// The events of a page, sorted by title, from the sample content.
const eventsOf = (page) => {
  const categories = listOf(page, "catégories");
  return markdown("evenements").filter(isEvent)
    .filter((e) => categories.includes(frontMatter(e, "catégorie")))
    .sort((a, b) => frontMatter(a, "title").localeCompare(frontMatter(b, "title"), "fr"));
};
// The items an event shows in a section `Les évènements`, in order, all
// in a link to its page.
const eventItems = (e) => {
  const href = address(e);
  const [cover] = descriptions(e, "couverture");
  const accroche = frontMatter(e, "accroche");
  return [
    { alt: cover ?? PLACEHOLDER, href },
    { text: frontMatter(e, "title"), href },
    ...(accroche ? [{ text: accroche, href }] : []),
  ];
};
// The reading order of a built page after its title, each link by the
// address of the page it designates.
const afterTitleOf = (page) => afterTitle(built[page]).map((i) => ({ ...i, href: designated(i.href) }));
// Checks the section `Les évènements` of a page, after the item `from`
// of its reading order, and returns where it starts.
const checkEvents = (page, list, from) => {
  const events = eventsOf(page);
  const k = list.findIndex((i, n) => n >= from && i.text === "Les évènements");
  assert.ok(k >= 0, `${page}: no section Les évènements after its body`);
  const section = list.slice(k + 1);
  assert.ok(holdsInOrder(section, events.flatMap(eventItems)), `${page}: events, in order of title`);
  const linked = new Set(section.map((i) => i.href).filter((h) => /^\/evenements\/./.test(h ?? "")));
  assert.deepEqual([...linked].sort(), events.map(address).sort(), `${page}: events shown`);
  return k;
};
// The last line of text of the body of a page, if any.
const lastLine = (page) => (source(page)?.[2] ?? "").split(/\r?\n/)
  .map((l) => l.trim()).findLast((l) => l && !l.startsWith("#"));
// The index of the end of the body of a page in its reading order: its
// last line of text, after its first.
const bodyEnd = (page, list) => {
  const first = list.findIndex((i) => i.text === text(firstLine(page)));
  assert.ok(first >= 0, `${page}: no body after its title`);
  const k = list.findIndex((i, n) => n >= first && i.text === text(lastLine(page)));
  assert.ok(k >= 0, `${page}: no end of its body`);
  return k;
};

test("the page of the association shows, after its body, where to find it, then its events", () => {
  // /ui/page-de-lassociation/ordre
  // /ui/page-de-lassociation/lieu
  // /ui/page-de-lassociation/evenements
  const page = "association.md";
  assert.ok(eventsOf(page).length > 0, `${page}: no event in the sample content`);
  const { lieu } = JSON.parse(readFileSync(join("src", "_data", "site.json"), "utf8"));
  const list = afterTitleOf(page);
  const body = bodyEnd(page, list);
  const k = list.findIndex((i, n) => n > body && i.text === "Où nous trouver");
  assert.ok(k >= 0, `${page}: no subtitle Où nous trouver after its body`);
  const l = list.findIndex((i, n) => n > k && i.text === lieu);
  assert.ok(l >= 0, `${page}: no lieu after Où nous trouver`);
  checkEvents(page, list, l + 1);
});

test("the page of an atelier shows its events after its body, sorted by title, or nothing without", () => {
  // /ui/page-datelier/ordre
  // /ui/page-datelier/evenements
  // /ui/page-datelier/sans-evenement
  const ateliers = markdown("ateliers");
  const events = ateliers.map(eventsOf);
  assert.ok(events.some((e) => e.length === 0), "no atelier without an event");
  const many = events.filter((e) => e.length > 1);
  assert.ok(many.some((e) => e.join() !== [...e].sort().join()), "no atelier whose events sort by title otherwise than by file");
  const shown = events.flat();
  assert.ok(shown.some((e) => descriptions(e, "couverture").length) && shown.some((e) => !descriptions(e, "couverture").length),
    "no event of an atelier with a cover and one without");
  assert.ok(shown.some((e) => frontMatter(e, "accroche")) && shown.some((e) => !frontMatter(e, "accroche")),
    "no event of an atelier with an accroche and one without");
  for (const page of ateliers) {
    const list = afterTitleOf(page);
    const body = bodyEnd(page, list);
    if (eventsOf(page).length === 0) {
      assert.ok(!list.some((i) => i.text === "Les évènements"), `${page}: section Les évènements without an event`);
    } else checkEvents(page, list, body + 1);
  }
});
