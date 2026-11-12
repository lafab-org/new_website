import { test } from "node:test";
import assert from "node:assert/strict";
import {
  sourceFiles, pages, TEMPLATE_EXTENSIONS, frontMatterValue, address, builtFile,
  isInternal, designated, readBuilt, readSource, pageLinks, anchors,
} from "./site.mjs";

// Invariants of /model, on the pages of the initial state.
function checkInvariants() {
  const all = pages();
  const addresses = new Set(all.map(address));
  // /model/page/markdown: no other file of src/ is built as a page.
  for (const f of sourceFiles()) {
    const template = TEMPLATE_EXTENSIONS.some((ext) => f.endsWith(ext));
    assert.ok(!template || f.endsWith(".md"), `${f} would be a page not ending with .md`);
  }
  for (const p of all) {
    // /model/page/titre
    assert.notEqual(frontMatterValue(readSource(p), "title"), "", `${p} has an empty title`);
    // /model/site/lien-interne
    for (const t of pageLinks(p).filter(isInternal)) {
      assert.ok(addresses.has(designated(t)), `${p}: link ${t} leads to no page`);
    }
  }
}

test("invariants of the model", () => {
  // /model/page/markdown
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
  assert.equal(address("index.md"), "/");
  assert.equal(address("ateliers/index.md"), "/ateliers");
  assert.equal(address("ateliers/metallerie.md"), "/ateliers/metallerie");
});

test("build: every page is written under _site/ as HTML from its Markdown", () => {
  // /operations/construire-le-site/generee
  assert.ok(readBuilt("index.html"));
  for (const p of pages()) {
    const html = readBuilt(builtFile(address(p)));
    assert.match(html, /<html[\s>]/i, `${p}: not HTML`);
    assert.doesNotMatch(html, /^#{1,6}\s/m, `${p}: Markdown heading left unrendered`);
  }
  checkInvariants();
});

test("every built page declares lang, viewport and a non-empty title", () => {
  // /model/page/titre
  for (const p of pages()) {
    const html = readBuilt(builtFile(address(p)));
    assert.match(html, /<html[^>]*\blang="fr"/, `${p}: no lang="fr"`);
    assert.match(html, /<meta[^>]*name="viewport"/, `${p}: no viewport`);
    assert.match(html, /<title>\s*\S[^<]*<\/title>/, `${p}: empty title`);
  }
});

test("scenario: opening the site", () => {
  // /scenarios/ouvrir-le-site
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
  assert.deepEqual(anchors('<a class="x" href="/a#b">x</a> <a href=\'mailto:m\'>'), ["/a#b", "mailto:m"]);
});
