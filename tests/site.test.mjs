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
// in, if any, and the `target` of that link, if it has one; a run of
// text in a heading below <h1> is marked `heading`.
function items(html) {
  const out = [];
  let href;
  let target;
  let heading = false;
  for (const m of html.matchAll(/<(\/?)([a-z][a-z0-9]*)\b([^>]*)>|<!--[\s\S]*?-->|([^<]+)/gi)) {
    if (m[4] !== undefined) {
      const t = text(m[4]);
      if (t) out.push({ text: t, href, ...(target ? { target } : {}), ...(heading ? { heading } : {}) });
      continue;
    }
    if (!m[2]) continue;
    const attr = (name) => {
      const a = m[3].match(new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
      return a ? text(a[1] ?? a[2] ?? a[3]) : undefined;
    };
    const tag = m[2].toLowerCase();
    if (/^h[2-6]$/.test(tag)) heading = !m[1];
    if (tag === "a") {
      href = m[1] ? undefined : decodeURI(attr("href") ?? "");
      target = m[1] ? undefined : attr("target");
    } else if (tag === "img" && !m[1]) out.push({ alt: attr("alt"), href, ...(target ? { target } : {}) });
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

// The day (AAAA-MM-JJ), hour and minute of a date-time, in Paris.
const paris = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", hourCycle: "h23",
});
const inParis = (iso) => {
  const p = Object.fromEntries(paris.formatToParts(new Date(iso)).map((x) => [x.type, x.value]));
  return { day: `${p.year}-${p.month}-${p.day}`, hour: Number(p.hour), minute: Number(p.minute) };
};
const ACCES = ["libre", "sur-place", "réservation-gratuite", "réservation-payante"];
const RESERVED = ["https://schema.org/ReservationConfirmed", "https://schema.org/ReservationPending"];
// The sample module, as TiBillet would answer.
const tibillet = async () => (await import(pathToFileURL(TIBILLET).href)).default;

// The séances the sample module gives, in the order of the séances of the
// site: by day, then by start. Each with its name, day, start, end if any,
// category (identifier and name), event (its page under tests/contenu/)
// if any, access if any, reservation address, places left if it has a
// jauge, and whether it is cancelled.
async function seances() {
  const categories = JSON.parse(readFileSync(join("src", "_data", "categories.json"), "utf8"));
  const { events, reservations } = await tibillet();
  const eventFiles = markdown("evenements").filter(isEvent);
  return events.results.flatMap((e) => {
    const keywords = e.keywords ?? [];
    const category = categories.find((c) => keywords.includes(c.identifiant));
    if (!category) return [];
    const start = inParis(e.startDate);
    const end = e.endDate ? inParis(e.endDate) : undefined;
    const event = keywords.map((k) => `evenements/${k}.md`).find((f) => eventFiles.includes(f));
    const jauge = e.maximumAttendeeCapacity > 0 ? e.maximumAttendeeCapacity : undefined;
    const reserved = (reservations[e.identifier]?.results ?? [])
      .filter((r) => RESERVED.includes(r.reservationStatus))
      .flatMap((r) => r.reservedTicket ?? []).reduce((n, t) => n + t.ticketQuantity, 0);
    return [{
      name: e.name, day: start.day, start,
      end: end?.day === start.day ? end : undefined,
      category: category.identifiant, categoryName: category.nom,
      event, access: keywords.find((k) => ACCES.includes(k)), url: e.url,
      left: jauge === undefined ? undefined : jauge - reserved,
      cancelled: e.eventStatus === "https://schema.org/EventCancelled",
    }];
  }).sort((a, b) => (a.day + String(a.start.hour).padStart(2, "0") + String(a.start.minute).padStart(2, "0"))
    .localeCompare(b.day + String(b.start.hour).padStart(2, "0") + String(b.start.minute).padStart(2, "0")));
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

test("every page declares /favicon.svg as its icon", () => {
  // /ui/page/icone
  for (const p of all) {
    // The value of an attribute of a tag, quoted or not.
    const attr = (tag, name) => tag.match(new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'>]+))`, "i"))
      ?.slice(1).find((v) => v !== undefined);
    const icons = [...built[p].matchAll(/<link\s[^>]*>/gi)].map((m) => m[0])
      .filter((l) => (attr(l, "rel") ?? "").toLowerCase().split(/\s+/).includes("icon"))
      .map((l) => attr(l, "href"));
    assert.ok(icons.includes("/favicon.svg"), `${p}: no icon /favicon.svg declared`);
  }
});

test("the site icon is built as favicon.svg and favicon.ico", () => {
  // /operations/construire-le-site/generee
  const svg = join(SITE, "favicon.svg");
  assert.ok(existsSync(svg) && statSync(svg).isFile(), "no favicon.svg");
  assert.match(readFileSync(svg, "utf8"), /<svg[\s>]/, "favicon.svg is no SVG");
  const ico = join(SITE, "favicon.ico");
  assert.ok(existsSync(ico) && statSync(ico).isFile(), "no favicon.ico");
});

test("favicon.ico holds the icon in 16 and in 32 pixels", () => {
  // /ui/icone-du-site/favicon
  const ico = join(SITE, "favicon.ico");
  assert.ok(existsSync(ico), "no favicon.ico");
  const b = readFileSync(ico);
  assert.ok(b.length >= 6 && b.readUInt16LE(0) === 0 && b.readUInt16LE(2) === 1, "favicon.ico is no ICO file");
  const sizes = Array.from({ length: b.readUInt16LE(4) }, (_, i) => 6 + 16 * i)
    .filter((o) => o + 16 <= b.length)
    .map((o) => `${b[o] || 256}x${b[o + 1] || 256}`);
  assert.ok(sizes.includes("16x16"), `no 16x16 image in favicon.ico: ${sizes}`);
  assert.ok(sizes.includes("32x32"), `no 32x32 image in favicon.ico: ${sizes}`);
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
    { text: "Actualités", href: "/actualites" },
    { text: "Agenda", href: "/agenda" },
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
  assert.ok(files.some((f) => descriptions(f, "photos").length > 1), "no réalisation with several photos");
  for (const f of files) {
    const [first, ...others] = descriptions(f, "photos");
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


// The names of all the séances of the sample module.
const seanceNames = async () => (await seances()).map((s) => s.name);
// Checks that `list` groups the séances `expected` by day, each day under
// a subtitle showing its day of the month, in their order, and returns
// each séance with its items. Outside an event page, a séance starts
// with an image; on one, the sample has at most one séance a day.
function checkDays(where, list, expected, all, eventPage = false) {
  const days = [...new Set(expected.map((s) => s.day))];
  const heads = list.flatMap((i, n) => (i.heading && !all.includes(i.text) ? [n] : []));
  assert.equal(heads.length, days.length, `${where}: one subtitle per day`);
  assert.deepEqual(list.slice(0, heads[0]).filter((i) => all.includes(i.text)), [], `${where}: séance before the first day`);
  return days.flatMap((day, j) => {
    const dayNumber = Number(day.slice(8));
    assert.match(list[heads[j]].text, new RegExp(`(?<!\\d)0?${dayNumber}(?!\\d)`), `${where}: subtitle of ${day}`);
    const region = list.slice(heads[j] + 1, heads[j + 1] ?? list.length);
    const ofDay = expected.filter((s) => s.day === day);
    assert.deepEqual(region.filter((i) => all.includes(i.text)).map((i) => i.text), ofDay.map((s) => s.name),
      `${where}: séances of ${day}, in order`);
    if (eventPage) {
      assert.equal(ofDay.length, 1, `${where}: the sample has one séance a day on an event page`);
      return [{ seance: ofDay[0], items: region }];
    }
    assert.ok(region[0]?.alt !== undefined, `${where}: séance of ${day} not starting with an image`);
    const starts = region.flatMap((i, n) => (i.alt !== undefined ? [n] : []));
    assert.equal(starts.length, ofDay.length, `${where}: one image per séance on ${day}`);
    return ofDay.map((seance, n) => ({ seance, items: region.slice(starts[n], starts[n + 1]) }));
  });
}
// Checks the section Prochaines séances of a page, after the item `from`
// of its reading order, for the séances `expected`; returns where it
// starts and where it ends, at its link to the agenda.
function checkNext(where, list, from, expected, all, eventPage = false) {
  const k = list.findIndex((i, n) => n >= from && i.text === "Prochaines séances");
  assert.ok(k >= 0, `${where}: no section Prochaines séances`);
  const end = list.findIndex((i, n) => n > k && i.text === "Voir l'agenda" && i.href === "/agenda");
  assert.ok(end >= 0, `${where}: no link Voir l'agenda after Prochaines séances`);
  checkDays(where, list.slice(k + 1, end), expected.slice(0, 5), all, eventPage);
  return [k, end];
}
// The séances of a page that shows those of its catégories.
const seancesOf = (page, all) => all.filter((s) => listOf(page, "catégories").includes(s.category));

test("the page of the association shows, after its body, where to find it, its next séances, then its events", async () => {
  // /ui/page-de-lassociation/ordre
  // /ui/page-de-lassociation/lieu
  // /ui/page-de-lassociation/prochaines-seances
  // /ui/page-de-lassociation/evenements
  const page = "association.md";
  assert.ok(eventsOf(page).length > 0, `${page}: no event in the sample content`);
  const all = await seances();
  const mine = seancesOf(page, all);
  assert.ok(mine.length > 0, `${page}: no séance in the sample module`);
  const { lieu } = JSON.parse(readFileSync(join("src", "_data", "site.json"), "utf8"));
  const list = afterTitleOf(page);
  const body = bodyEnd(page, list);
  const k = list.findIndex((i, n) => n > body && i.text === "Où nous trouver");
  assert.ok(k >= 0, `${page}: no subtitle Où nous trouver after its body`);
  const l = list.findIndex((i, n) => n > k && i.text === lieu);
  assert.ok(l >= 0, `${page}: no lieu after Où nous trouver`);
  const [, end] = checkNext(page, list, l + 1, mine, all.map((s) => s.name));
  checkEvents(page, list, end + 1);
});

test("the page of an atelier shows its next séances after its body, then its events, sorted by title, or nothing without", async () => {
  // /ui/page-datelier/ordre
  // /ui/page-datelier/prochaines-seances
  // /ui/page-datelier/evenements
  // /ui/page-datelier/sans-evenement
  // /ui/prochaines-seances/seances
  const ateliers = markdown("ateliers");
  const all = await seances();
  const names = all.map((s) => s.name);
  assert.ok(ateliers.every((p) => seancesOf(p, all).length > 0), "an atelier without séance in the sample module");
  assert.ok(ateliers.some((p) => seancesOf(p, all).length > 5), "no atelier with more than five séances");
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
    const [, end] = checkNext(page, list, body + 1, seancesOf(page, all), names);
    if (eventsOf(page).length === 0) {
      assert.ok(!list.some((i) => i.text === "Les évènements"), `${page}: section Les évènements without an event`);
    } else checkEvents(page, list, end + 1);
  }
});


// The reading order of the agenda after its articles in avant: its séances.
const agendaSeances = () => {
  const list = afterTitleOf("agenda.md");
  const avant = new Set(IN_AVANT_AGENDA.map(address));
  const last = list.findLastIndex((i) => avant.has(i.href));
  assert.ok(last >= 0, "agenda: no article in avant");
  return { list, last };
};

test("the agenda shows its articles in avant, then its séances grouped by day, in their order", async () => {
  // /ui/page-de-lagenda/ordre
  // /ui/page-de-lagenda/jours
  const all = await seances();
  const names = all.map((s) => s.name);
  assert.ok(new Set(all.map((s) => s.day)).size < all.length, "no day with several séances in the sample module");
  const { list, last } = agendaSeances();
  assert.ok(list.slice(0, last + 1).every((i) => !names.includes(i.text)), "agenda: séance before an article in avant");
  checkDays("agenda", list.slice(last + 1), all, names);
});

test("the home page groups the séances of the next 7 days by day", async () => {
  // /ui/page-daccueil/jours
  const all = await seances();
  const last = plusDays(today, 6);
  const inWeek = all.filter((s) => s.day >= today && s.day <= last);
  assert.ok(new Set(inWeek.map((s) => s.day)).size < inWeek.length, "no day with several séances in the 7 days");
  const list = region("semaine");
  const link = list.findIndex((i) => i.text === "Tout l'agenda" && i.href === "/agenda");
  assert.ok(link > 0, "home page: no link to the agenda in the semaine block");
  checkDays("home page", list.slice(1, link), inWeek, all.map((s) => s.name));
});

// Whether `shown` holds the strings `expected`, in this order.
const textsInOrder = (shown, expected) => {
  let from = 0;
  for (const e of expected) {
    const k = shown.indexOf(e, from);
    if (k < 0) return false;
    from = k + e.length;
  }
  return true;
};
// The numbers a time shows, without zeros: `9:30` and `9 h 30` give
// [9, 30], `14:00` and `14 h` give [14].
const timeNumbers = (...times) => times.flatMap((t) => [t.hour, t.minute]).filter((n) => n !== 0);

// Checks how a séance shows, from its items, outside an event page.
function checkSeance(where, items, s) {
  const at = `${where}: ${s.name}`;
  const k = items.findIndex((i) => i.text === s.name);
  const cover = s.event ? descriptions(s.event, "couverture")[0] : undefined;
  assert.equal(items[0].alt, cover ?? PLACEHOLDER, `${at}: cover`);
  const head = items.slice(1, k).filter((i) => i.text).map((i) => i.text).join(" ");
  assert.ok(head.endsWith(s.categoryName), `${at}: name of its category before its name`);
  const time = head.slice(0, -s.categoryName.length);
  const numbers = (time.match(/\d+/g) ?? []).map(Number).filter((n) => n !== 0);
  assert.deepEqual(numbers, timeNumbers(s.start, ...(s.end ? [s.end] : [])), `${at}: start, then end`);
  assert.equal(items[k].href, s.event ? address(s.event) : undefined, `${at}: link of its name`);
  const after = items.slice(k + 1);
  const shown = after.filter((i) => i.text).map((i) => i.text).join(" ");
  const link = (label) => {
    const l = after.find((i) => i.text === label && i.href === designated(s.url));
    assert.ok(l, `${at}: link ${label} to its reservation`);
    assert.equal(l.target, "_blank", `${at}: link ${label} in a new tab`);
  };
  // The texts of the other cases of the participation, and its links.
  const others = (...but) => ["Annulée", "Accès libre", "Paiement sur place", "Réservation gratuite",
    "Réservation payante", "place restante", "places restantes", "Complet"].filter((t) => !but.includes(t));
  const noLink = () => assert.ok(!after.some((i) => i.text === "Réserver" || i.text === "Voir sur TiBillet"),
    `${at}: link to its reservation`);
  const only = (label) => {
    assert.ok(shown.includes(label), `${at}: ${label}`);
    for (const t of others(label)) assert.ok(!shown.includes(t), `${at}: ${t} with ${label}`);
    noLink();
  };
  if (s.cancelled) return only("Annulée");
  if (s.access === "libre") return only("Accès libre");
  if (s.access === "sur-place") return only("Paiement sur place");
  const label = { "réservation-gratuite": "Réservation gratuite", "réservation-payante": "Réservation payante" }[s.access];
  if (!label) {
    assert.ok(!/Réservation (gratuite|payante)/.test(shown), `${at}: kind of reservation without an access`);
  }
  const full = s.left !== undefined && s.left <= 0;
  if (s.left === undefined) {
    for (const t of ["place restante", "places restantes", "Complet"]) assert.ok(!shown.includes(t), `${at}: ${t} without a jauge`);
  }
  if (full) noLink();
  const places = s.left === undefined ? [] : [full ? "Complet" : s.left === 1 ? "1 place restante" : `${s.left} places restantes`];
  const linkText = label ? "Réserver" : "Voir sur TiBillet";
  assert.ok(textsInOrder(shown, [...(label ? [label] : []), ...places, ...(full ? [] : [linkText])]),
    `${at}: participation`);
  if (!full) link(linkText);
}

test("each séance of the agenda shows its cover, times, category, name and participation, as TiBillet gives it", async () => {
  // /operations/construire-le-site/seance
  // /ui/seance/ordre
  // /ui/seance/couverture
  // /ui/seance/horaire
  // /ui/seance/categorie
  // /ui/seance/nom
  // /ui/seance/annulee
  // /ui/seance/libre
  // /ui/seance/sur-place
  // /ui/seance/reservation
  // /ui/seance/nouvel-onglet
  const { events } = await tibillet();
  const categories = JSON.parse(readFileSync(join("src", "_data", "categories.json"), "utf8")).map((c) => c.identifiant);
  const all = await seances();
  const names = all.map((s) => s.name);
  // The sample module has the cases the séances need.
  const kw = events.results.map((e) => e.keywords ?? []);
  const ignored = events.results.filter((e, n) => !kw[n].some((k) => categories.includes(k)));
  assert.ok(ignored.length > 0, "no event without a category");
  assert.ok(kw.some((k) => {
    const c = k.filter((x) => categories.includes(x));
    return c.length > 1 && categories.indexOf(c[0]) > categories.indexOf(c[1]);
  }), "no event whose categories come in another order than the site's");
  assert.ok(kw.some((k) => k.filter((x) => ACCES.includes(x)).length > 1), "no event with two accesses");
  assert.ok(kw.some((k) => k.filter((x) => isEvent(`evenements/${x}.md`) && existsSync(join(CONTENU, `evenements/${x}.md`))).length > 1),
    "no event naming two event pages");
  const has = (f, what) => assert.ok(all.some(f), `no séance ${what}`);
  has((s) => s.event && descriptions(s.event, "couverture").length, "of an event with a cover");
  has((s) => s.event && !descriptions(s.event, "couverture").length, "of an event without a cover");
  has((s) => !s.event, "without an event");
  has((s) => s.end, "with an end");
  has((s) => !s.end, "without an end");
  has((s) => s.start.minute !== 0, "starting at a time with minutes");
  has((s) => s.cancelled, "cancelled");
  for (const a of ACCES) has((s) => !s.cancelled && s.access === a, `with access ${a}`);
  has((s) => !s.cancelled && !s.access, "without access");
  has((s) => s.access?.startsWith("réservation") && s.left === undefined, "on reservation without a jauge");
  has((s) => s.left === 1, "with one place left");
  has((s) => s.left > 1, "with several places left");
  has((s) => s.left <= 0, "full");
  assert.ok(events.results.some((e) => e.endDate && inParis(e.endDate).day !== inParis(e.startDate).day),
    "no event ending another day");
  const { list, last } = agendaSeances();
  for (const e of ignored) assert.ok(!list.some((i) => i.text === e.name), `agenda: ignored event ${e.name} shown`);
  for (const { seance, items } of checkDays("agenda", list.slice(last + 1), all, names)) {
    checkSeance("agenda", items, seance);
  }
});

test("an event page shows its cover, its accroche, its practical information, then its next séances", async () => {
  // /ui/page-devenement/couverture
  // /ui/page-devenement/informations
  // /ui/page-devenement/prochaines-seances
  // /ui/prochaines-seances/sans-seance
  // /ui/seance/couverture
  const { lieu } = JSON.parse(readFileSync(join("src", "_data", "site.json"), "utf8"));
  const all = await seances();
  const names = all.map((s) => s.name);
  const pages = markdown("evenements").filter(isEvent);
  const covers = pages.map((p) => descriptions(p, "couverture").length > 0);
  assert.ok(covers.includes(true) && covers.includes(false), "no event with a cover and one without");
  assert.ok(pages.some((p) => frontMatter(p, "accroche")) && pages.some((p) => !frontMatter(p, "accroche")),
    "no event with an accroche and one without");
  const counts = pages.map((p) => all.filter((s) => s.event === p).length);
  assert.ok(counts.includes(0) && counts.some((c) => c > 0), "no event with séances and one without");
  for (const page of pages) {
    const list = afterTitleOf(page);
    const body = list.findIndex((i) => i.text === text(firstLine(page)));
    assert.ok(body >= 0, `${page}: no body after its title`);
    const [cover] = descriptions(page, "couverture");
    if (!cover) assert.ok(!list.slice(0, body).some((i) => i.alt !== undefined), `${page}: image without a cover`);
    const accroche = frontMatter(page, "accroche");
    const infos = [
      ["Rendez-vous", frontMatter(page, "rendez-vous")],
      ["Horaire", frontMatter(page, "horaire")],
      ["Lieu", lieu],
      ["Activité", frontMatter(page, "prix")],
    ];
    const expected = [
      ...(cover ? [{ alt: cover }] : []),
      ...(accroche ? [{ text: accroche }] : []),
      ...infos.flat().map((t) => ({ text: t })),
    ];
    assert.ok(holdsInOrder(list.slice(0, body), expected), `${page}: cover, accroche, then practical information`);
    const html = built[page];
    for (const [label] of infos) {
      assert.match(html, new RegExp(`<li\\b[^>]*>(?:(?!</li>)[\\s\\S])*${label}`), `${page}: ${label} not in a list`);
    }
    const prix = list.findIndex((i) => i.text === infos[3][1]);
    const mine = all.filter((s) => s.event === page);
    if (mine.length === 0) {
      assert.ok(!list.some((i) => i.text === "Prochaines séances"), `${page}: section Prochaines séances without a séance`);
    } else {
      const [k, end] = checkNext(page, list, prix + 1, mine, names, true);
      // /ui/seance/couverture: no cover in a séance on an event page.
      assert.ok(!list.slice(k, end).some((i) => i.alt !== undefined), `${page}: image in a séance`);
    }
  }
});

// The `fichier` of each photo a front matter key lists, in order.
const listFiles = (page, key) => {
  const m = source(page)?.[1].match(new RegExp(`^${key}:[ \\t]*\\r?\\n((?:[ \\t]+.*(?:\\r?\\n|$))*)`, "m"));
  return m ? [...m[1].matchAll(/^[ \t-]*fichier:\s*(.*)$/gm)].map((d) => unquote(d[1])) : [];
};
test("an event page shows its illustrations after its body, each in a link to its photo, or nothing without", () => {
  // /ui/page-devenement/illustrations
  const pages = markdown("evenements").filter(isEvent);
  const counts = pages.map((p) => descriptions(p, "illustrations").length);
  assert.ok(counts.some((n) => n > 1) && counts.includes(0), "no event with several illustrations and one without");
  for (const page of pages) {
    const list = afterTitleOf(page);
    const body = list.findIndex((i) => i.text === text(firstLine(page)));
    assert.ok(body >= 0, `${page}: no body after its title`);
    const shown = list.slice(body).filter((i) => i.alt !== undefined);
    const expected = descriptions(page, "illustrations");
    assert.deepEqual(shown.map((i) => i.alt), expected, `${page}: illustrations after its body, in order`);
    const files = listFiles(page, "illustrations");
    const targets = shown.map((i) => {
      // The link may be relative: resolve it against the address of the page.
      const file = join(SITE, new URL(i.href ?? "", `http://x${address(page)}/`).pathname);
      assert.ok(i.href && existsSync(file) && statSync(file).isFile(),
        `${page}: the link of illustration ${i.alt} is not a file of the site`);
      return file;
    });
    // Two different photos are not the same link.
    assert.equal(new Set(targets).size, new Set(files).size, `${page}: illustrations of different photos link to the same file`);
  }
});

test("the events page shows a group per category with events, in order, each with its events sorted by title", () => {
  // /ui/page-des-evenements/groupes
  const categories = JSON.parse(readFileSync(join("src", "_data", "categories.json"), "utf8"));
  const events = markdown("evenements").filter(isEvent);
  const of = (c) => events.filter((e) => frontMatter(e, "catégorie") === c.identifiant)
    .sort((a, b) => frontMatter(a, "title").localeCompare(frontMatter(b, "title"), "fr"));
  const groups = categories.filter((c) => of(c).length > 0);
  assert.ok(groups.length > 1 && groups.length < categories.length, "the sample needs several categories with events, and one without");
  assert.ok(groups.some((c) => of(c).join() !== events.filter((e) => of(c).includes(e)).join()),
    "no category whose events sort by title otherwise than by file");
  const list = afterTitleOf("evenements.md");
  for (const c of categories.filter((x) => !groups.includes(x))) {
    assert.ok(!list.some((i) => i.text === c.nom), `events page: category ${c.nom} without event shown`);
  }
  const heads = [];
  for (const c of groups) {
    const k = list.findIndex((i, n) => n > (heads.at(-1) ?? -1) && i.text === c.nom);
    assert.ok(k >= 0, `events page: group ${c.nom} missing, or out of order`);
    heads.push(k);
  }
  groups.forEach((c, n) => {
    const group = list.slice(heads[n] + 1, heads[n + 1] ?? list.length);
    assert.ok(holdsInOrder(group, of(c).flatMap(eventItems)), `events page: events of ${c.nom}, in order of title`);
    const linked = new Set(group.map((i) => i.href).filter((h) => /^\/evenements\/./.test(h ?? "")));
    assert.deepEqual([...linked].sort(), of(c).map(address).sort(), `events page: events of ${c.nom}`);
  });
});

test("the séances page shows, per category with events, each event sorted by title with its séances by day, or a text without", async () => {
  // /ui/page-des-seances-par-evenement/groupes
  const categories = JSON.parse(readFileSync(join("src", "_data", "categories.json"), "utf8"));
  const all = await seances();
  const names = all.map((s) => s.name);
  const events = markdown("evenements").filter(isEvent);
  const of = (c) => events.filter((e) => frontMatter(e, "catégorie") === c.identifiant)
    .sort((a, b) => frontMatter(a, "title").localeCompare(frontMatter(b, "title"), "fr"));
  const groups = categories.filter((c) => of(c).length > 0);
  assert.ok(groups.length < categories.length, "no category without event");
  const counts = events.map((e) => all.filter((s) => s.event === e).length);
  assert.ok(counts.includes(0) && counts.some((n) => n > 0), "no event with séances and one without");
  assert.ok(events.some((e) => new Set(all.filter((s) => s.event === e).map((s) => s.day)).size > 1),
    "no event with séances on several days");
  const list = afterTitleOf("seances.md");
  for (const c of categories.filter((x) => !groups.includes(x))) {
    assert.ok(!list.some((i) => i.text === c.nom), `séances page: category ${c.nom} without event shown`);
  }
  // Each category name, then each of its events, in order.
  const marks = [];
  for (const c of groups) {
    const k = list.findIndex((i, n) => n > (marks.at(-1)?.k ?? -1) && i.text === c.nom);
    assert.ok(k >= 0, `séances page: group ${c.nom} missing, or out of order`);
    marks.push({ k });
    for (const e of of(c)) {
      const t = list.findIndex((i, n) => n > marks.at(-1).k && i.text === frontMatter(e, "title") && i.href === address(e));
      assert.ok(t >= 0, `séances page: ${e} missing in ${c.nom}, or out of order`);
      marks.push({ k: t, e });
    }
  }
  marks.forEach(({ k, e }, n) => {
    if (!e) return;
    const region = list.slice(k + 1, marks[n + 1]?.k ?? list.length);
    const mine = all.filter((s) => s.event === e);
    if (mine.length === 0) {
      assert.ok(region.some((i) => i.text === "Aucune séance prévue pour l'instant."), `séances page: ${e}: no text without séance`);
    } else checkDays(`séances page: ${e}`, region, mine, names);
  });
});

// The names of the months, in French.
const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août",
  "septembre", "octobre", "novembre", "décembre"];
// The date (AAAA-MM-JJ) of an article, from its file name.
const articleDate = (p) => p.match(/^actualites\/(\d{4}-\d{2}-\d{2})-/)[1];
// Whether a text shows the day `day` (AAAA-MM-JJ) as `13 janvier 2015`.
const showsDay = (t, day) => {
  const [y, m, d] = day.split("-").map(Number);
  return new RegExp(`^0?${d}(er)? ${MONTHS[m - 1]} ${y}$`, "i").test(t ?? "");
};
// Articles sorted from the most recent to the oldest.
const byDate = (pages) => [...pages].sort((a, b) => articleDate(b).localeCompare(articleDate(a)));
// Checks that `list`, from the item `from`, shows the articles `pages`
// in this order, each with its cover if any, its title as a subtitle in
// a link to its page, its date, then its résumé if any; returns the
// index of the last item of the last article.
function checkArticles(where, list, from, pages) {
  let end = from - 1;
  pages.forEach((p) => {
    const at = `${where}: ${p}`;
    const href = address(p);
    const title = list.findIndex((i, k) => k > end && i.text === frontMatter(p, "title") && i.href === href);
    assert.ok(title >= 0, `${at}: title in a link to its page, missing or out of order`);
    assert.ok(list[title].heading, `${at}: title not a subtitle`);
    const [cover] = descriptions(p, "couverture");
    const before = list.slice(end + 1, title).filter((i) => i.alt !== undefined).map((i) => i.alt);
    assert.deepEqual(before, cover ? [cover] : [], `${at}: cover before its title`);
    const date = title + 1 + list.slice(title + 1).findIndex((i) => i.text);
    assert.ok(showsDay(list[date].text, articleDate(p)), `${at}: date after its title`);
    const resume = frontMatter(p, "résumé");
    if (resume) {
      assert.equal(list.slice(date + 1).find((i) => i.text)?.text, resume, `${at}: résumé after its date`);
      end = date + 1 + list.slice(date + 1).findIndex((i) => i.text === resume);
    } else end = date;
  });
  return end;
}
// The reading order of a page after its body, or after its title if it
// has no body.
const afterBody = (page) => {
  const list = afterTitleOf(page);
  return { list, from: firstLine(page) ? bodyEnd(page, list) + 1 : 0 };
};

test("the news page shows each published article, most recent first: cover, title to its page, date, résumé", () => {
  // /ui/page-des-actualites/contenu
  const pages = byDate(articles().filter(published));
  assert.equal(new Set(pages.map(articleDate)).size, pages.length, "two published articles of the same date");
  assert.ok(pages.some((p) => descriptions(p, "couverture").length) && pages.some((p) => !descriptions(p, "couverture").length),
    "no published article with a cover and one without");
  assert.ok(pages.some((p) => frontMatter(p, "résumé")) && pages.some((p) => !frontMatter(p, "résumé")),
    "no published article with a résumé and one without");
  const { list, from } = afterBody("actualites.md");
  checkArticles("news page", list, from, pages);
});

test("the page of an article shows its date then its cover before its body, and a link to the news after it", () => {
  // /ui/page-darticle/ordre
  const pages = articles().filter(published);
  for (const p of pages) {
    const list = afterTitleOf(p);
    const body = list.findIndex((i) => i.text === text(firstLine(p)));
    assert.ok(body >= 0, `${p}: no body after its title`);
    const date = list.findIndex((i) => i.text);
    assert.ok(date < body && showsDay(list[date].text, articleDate(p)), `${p}: date before its body`);
    const [cover] = descriptions(p, "couverture");
    const images = list.slice(0, body).filter((i) => i.alt !== undefined);
    assert.deepEqual(images.map((i) => i.alt), cover ? [cover] : [], `${p}: cover before its body`);
    if (cover) assert.ok(list.findIndex((i) => i.alt === cover) > date, `${p}: cover before its date`);
    const end = bodyEnd(p, list);
    assert.ok(list.some((i, n) => n > end && i.text === "Toutes les actualités" && i.href === "/actualites"),
      `${p}: no link Toutes les actualités after its body`);
  }
});

test("the agenda and the home page show their articles in avant, in order, as on the news page", () => {
  // /ui/articles-en-avant/articles
  // /ui/page-de-lagenda/articles-en-avant
  const agenda = byDate(IN_AVANT_AGENDA);
  assert.ok(agenda.length > 1, "fewer than two articles in avant on the agenda");
  assert.ok(agenda.some((p) => descriptions(p, "couverture").length && frontMatter(p, "résumé")),
    "no article in avant with a cover and a résumé");
  const { list, from } = afterBody("agenda.md");
  checkArticles("agenda", list, from, agenda);
  const linked = new Set(list.map((i) => i.href).filter((h) => /^\/actualites\/./.test(h ?? "")));
  assert.deepEqual([...linked].sort(), agenda.map(address).sort(), "agenda: articles shown");
  const home = afterBody("index.md");
  checkArticles("home page", home.list, home.from, byDate(IN_AVANT_ACCUEIL));
});

test("the réalisations page shows each réalisation, most recent first: photos, their number, title, author and month", () => {
  // /ui/page-des-realisations/realisations
  const files = readdirSync(join(CONTENU, "realisations")).filter((f) => f.endsWith(".md"))
    .map((f) => join("realisations", f))
    .sort((a, b) => frontMatter(b, "date").localeCompare(frontMatter(a, "date")));
  assert.equal(new Set(files.map((f) => frontMatter(f, "date"))).size, files.length, "two réalisations of the same date");
  const counts = files.map((f) => descriptions(f, "photos").length);
  assert.ok(counts.includes(1) && counts.some((c) => c > 1), "no réalisation with one photo and one with several");
  const { list, from } = afterBody("realisations.md");
  let k = from;
  files.forEach((f, n) => {
    const photos = descriptions(f, "photos");
    const start = list.findIndex((i, j) => j >= k && i.alt === photos[0]);
    assert.ok(start >= 0, `${f}: first photo missing, or out of order`);
    const stop = files[n + 1] ? list.findIndex((i, j) => j > start && i.alt === descriptions(files[n + 1], "photos")[0]) : list.length;
    assert.ok(stop > start, `${f}: next réalisation missing, or out of order`);
    const region = list.slice(start, stop);
    const title = region.findIndex((i) => i.text === frontMatter(f, "titre"));
    assert.ok(title >= 0 && region[title].heading, `${f}: title as a subtitle`);
    assert.deepEqual(region.slice(0, title).filter((i) => i.alt !== undefined).map((i) => i.alt), photos, `${f}: photos, in order`);
    const count = region.slice(0, title).filter((i) => i.text).map((i) => i.text);
    assert.deepEqual(count, photos.length > 1 ? [`${photos.length} photos`] : [], `${f}: number of photos`);
    const [y, m] = frontMatter(f, "date").split("-").map(Number);
    const credit = region.slice(title + 1).filter((i) => i.text).map((i) => i.text).join(" ").replace(/\s+/g, " ");
    const escape = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    assert.match(credit, new RegExp(`^Par ${escape(frontMatter(f, "auteur"))} · ${MONTHS[m - 1]} ${y}`, "i"), `${f}: author and month`);
    k = stop;
  });
});
