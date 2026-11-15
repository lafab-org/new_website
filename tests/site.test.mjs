import { test } from "node:test";
import assert from "node:assert/strict";
import {
  sourceFiles, pages, TEMPLATE_EXTENSIONS, frontMatterValue, withoutFrontMatter, address,
  builtFile, builtPage, isInternal, linkKind, designated, brokenLinks, readBuilt, readSource,
  renderedBody, pageLinks, anchors, events, EVENT_FIELDS, textOf,
} from "./site.mjs";

// Invariants of /model, on the pages of the initial state.
function checkInvariants() {
  const all = pages();
  // /model/page/markdown: no other file of src/ is built as a page.
  for (const f of sourceFiles()) {
    const template = TEMPLATE_EXTENSIONS.some((ext) => f.endsWith(ext));
    assert.ok(!template || f.endsWith(".md"), `${f} would be a page not ending with .md`);
  }
  // /model/page/titre
  for (const p of all) {
    assert.notEqual(frontMatterValue(readSource(p), "title"), "", `${p} has an empty title`);
  }
  // /model/page/sans-titre-principal
  for (const p of all) {
    const body = withoutFrontMatter(readSource(p));
    assert.doesNotMatch(body, /^ {0,3}#(\s|$)/m, `${p}: level-1 heading in body`);
    assert.doesNotMatch(body, /\S.*\r?\n {0,3}=+\s*$/m, `${p}: level-1 heading in body`);
  }
  // /model/evenement/renseigne
  for (const p of events(all)) {
    for (const [key] of EVENT_FIELDS) {
      assert.notEqual(frontMatterValue(readSource(p), key), "", `${p}: empty ${key}`);
    }
  }
  // /model/lien/forme
  for (const p of all) {
    for (const t of pageLinks(p)) assert.notEqual(linkKind(t), null, `${p}: link ${t} of no kind`);
  }
  // /model/site/lien-interne
  const links = Object.fromEntries(all.map((p) => [p, pageLinks(p)]));
  assert.deepEqual(brokenLinks(links, all.map(address)), [], "internal links leading to no page");
}

test("invariants of the model", () => {
  // /model/page/markdown
  // /model/page/sans-titre-principal
  // /model/evenement/renseigne
  // /model/lien/forme
  // /model/page/titre
  // /model/site/lien-interne
  checkInvariants();
});

test("internal links and the page they designate", () => {
  // /model/site/lien-interne (definitions of /model/lien and /model/page)
  assert.ok(isInternal("/"));
  assert.ok(isInternal("/ateliers/metallerie"));
  assert.ok(!isInternal("//example.org/x"));
  assert.ok(!isInternal("mailto:contact@lafab.org"));
  assert.ok(!isInternal("https://example.org/"));
  assert.ok(!isInternal("ateliers/metallerie"));
  assert.ok(!isInternal("#ancre"));
  assert.equal(designated("/"), "/");
  assert.equal(designated("/#haut"), "/");
  assert.equal(designated("/?a=1"), "/");
  assert.equal(designated("/ateliers/metallerie"), "/ateliers/metallerie");
  assert.equal(designated("/ateliers/metallerie/"), "/ateliers/metallerie");
  assert.equal(designated("/ateliers/metallerie#materiel"), "/ateliers/metallerie");
  assert.equal(designated("/ateliers/metallerie/?x=1#y"), "/ateliers/metallerie");
  assert.equal(designated("/ateliers/metallerie//"), "/ateliers/metallerie/");
  assert.equal(address("index.md"), "/");
  assert.equal(address("ateliers/index.md"), "/ateliers");
  assert.equal(address("ateliers/metallerie.md"), "/ateliers/metallerie");
});

test("kinds of links: internal, fragment, external, or none", () => {
  // /model/lien/forme (definition of the kinds in /model/lien)
  const kinds = {
    "/": "internal",
    "/ateliers/metallerie#x": "internal",
    "#": "fragment",
    "#horaires": "fragment",
    "//ailleurs.org/x": "external",
    "https://ailleurs.org/": "external",
    "mailto:contact@lafab.org": "external",
    "tel:+33388000000": "external",
    "a+b.c-9:x": "external",
    "ateliers/metallerie": null,
    "./metallerie": null,
    "../index": null,
    "?a=1": null,
    "": null,
    "9http://x": null,
    "+a:x": null,
    "mail to:x": null,
  };
  for (const [target, kind] of Object.entries(kinds)) {
    assert.equal(linkKind(target), kind, `kind of ${JSON.stringify(target)}`);
  }
});

test("broken internal links are found, external ones ignored", () => {
  // /model/site/lien-interne
  const addresses = ["/", "/ateliers/metallerie"];
  assert.deepEqual(
    brokenLinks(
      {
        "index.md": [
          "/ateliers/metallerie#x", "/", "mailto:m", "https://ailleurs.org/x", "//ailleurs.org/x",
          "/ateliers/metallerie.html", "/nulle-part", "/ateliers",
        ],
        "ateliers/metallerie.md": ["/ateliers/metallerie//"],
      },
      addresses,
    ),
    [
      "index.md: /ateliers/metallerie.html",
      "index.md: /nulle-part",
      "index.md: /ateliers",
      "ateliers/metallerie.md: /ateliers/metallerie//",
    ],
  );
});

test("build: every page is written under _site/ as HTML from its Markdown", () => {
  // /operations/construire-le-site/generee
  for (const p of pages()) {
    const html = builtPage(p);
    assert.match(html, /<html[\s>]/i, `${p}: not HTML`);
    const body = renderedBody(p);
    assert.doesNotMatch(body, /^\s*#{1,6}\s/m, `${p}: Markdown heading left unrendered`);
    const source = withoutFrontMatter(readSource(p));
    if (/^#{1,6}\s/m.test(source)) assert.match(body, /<h[1-6][^>]*>/, `${p}: no HTML heading`);
    if (source.trim() !== "") assert.notEqual(body.trim(), "", `${p}: empty body`);
  }
  checkInvariants();
});

test("every built page declares French, viewport and its browser title", () => {
  // /ui/page/francais
  // /ui/page/navigateur
  for (const p of pages()) {
    const html = builtPage(p);
    assert.match(html, /<html[^>]*\blang="fr"/, `${p}: no lang="fr"`);
    assert.match(html, /<meta[^>]*name="viewport"/, `${p}: no viewport`);
    const shown = html.match(/<title>([^<]*)<\/title>/);
    assert.ok(shown, `${p}: no browser title`);
    const expected = p === "index.md"
      ? "La Fabrique"
      : `${frontMatterValue(readSource(p), "title")} - La Fabrique`;
    assert.equal(unescape(shown[1]).trim(), expected, `${p}: browser title`);
  }
});

test("every built page starts with its title as its only <h1>, then its body", () => {
  // /ui/page/titre
  for (const p of pages()) {
    const html = builtPage(p);
    const h1s = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)];
    assert.equal(h1s.length, 1, `${p}: ${h1s.length} <h1>`);
    assert.equal(textOf(h1s[0][1]), frontMatterValue(readSource(p), "title"), `${p}: <h1> text`);
    const main = html.slice(html.search(/<body[\s>]/i));
    assert.equal(textOf(main.slice(0, main.indexOf(h1s[0][0]))), "", `${p}: text before the <h1>`);
    const body = renderedBody(p);
    assert.ok(html.indexOf(body) > html.indexOf(h1s[0][0]), `${p}: body before the <h1>`);
  }
});

test("events are the pages directly in evenements/, except its index", () => {
  // /model/site/pages-evenements
  assert.deepEqual(
    events([
      "index.md", "evenements/index.md", "evenements/repar-action.md", "evenements/a/b.md",
      "ateliers/metallerie.md", "evenements/autre.md",
    ]),
    ["evenements/repar-action.md", "evenements/autre.md"],
  );
  assert.ok(events(pages()).includes("evenements/repar-action.md"));
  checkInvariants();
});

test("an event page shows its catchphrase then its practical information, between title and body", () => {
  // /ui/page-devenement/accroche
  // /ui/page-devenement/informations
  const list = events(pages());
  assert.ok(list.length > 0, "no event page");
  for (const p of list) {
    const source = readSource(p);
    const html = builtPage(p);
    const h1 = html.match(/<h1[^>]*>[\s\S]*?<\/h1>/i);
    assert.ok(h1, `${p}: no <h1>`);
    const from = html.indexOf(h1[0]) + h1[0].length;
    const between = html.slice(from, html.indexOf(renderedBody(p), from));
    const accroche = frontMatterValue(source, "accroche");
    const info = EVENT_FIELDS.map(([key, label]) => `${label} : ${frontMatterValue(source, key)}`);
    const expected = [accroche, ...info].filter((t) => t !== "").join(" ");
    assert.equal(textOf(between), expected, `${p}: text between title and body`);
    const items = [...between.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map((m) => textOf(m[1]));
    assert.deepEqual(items, info, `${p}: practical information list`);
  }
});

function unescape(s) {
  return s.replace(/&#39;|&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">").replace(/&amp;/g, "&");
}

test("scenario: opening the site", () => {
  // /scenarios/ouvrir-le-site
  // /ui/page/francais
  const home = readBuilt("index.html");
  assert.match(home, /<html[^>]*\blang="fr"/);
  const internal = pageLinks("index.md").filter(isInternal);
  assert.ok(internal.length > 0, "no internal link on /");
  const target = designated(internal[0]);
  assert.ok(pages().map(address).includes(target), `${internal[0]} leads to no page`);
  assert.match(readBuilt(builtFile(target)), /<html[\s>]/i);
});

test("anchors: targets of the <a href> elements", () => {
  // /model/page
  assert.deepEqual(
    anchors(
      '<a class="x" href="/a#b">x</a> <a href=\'mailto:m\'> <a data-href="/no" href="/ok"> ' +
        '<a href="/ateliers/menuiserie-%C3%A9b%C3%A9nisterie?a=1&amp;b=2"> <link href="/css">',
    ),
    ["/a#b", "mailto:m", "/ok", "/ateliers/menuiserie-ébénisterie?a=1&b=2"],
  );
});
