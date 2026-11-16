// Form check of the built site: build once, then read _site/.
import { test, before } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const SRC = "src";
const SITE = "_site";

// Markdown pages of src/, outside _includes/, as paths relative to src/.
function pages(dir = "") {
  return readdirSync(join(SRC, dir), { withFileTypes: true }).flatMap((e) => {
    const rel = join(dir, e.name);
    if (e.isDirectory()) return rel === "_includes" ? [] : pages(rel);
    return rel.endsWith(".md") ? [rel] : [];
  });
}

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

const all = pages();
const built = {};
before(() => {
  execFileSync("npm", ["run", "build"], { stdio: "pipe" });
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

test("every event belongs to an atelier of the site", () => {
  // /model/evenement/atelier
  const file = join(SRC, "_data", "ateliers.json");
  assert.ok(existsSync(file), "no src/_data/ateliers.json");
  const ateliers = JSON.parse(readFileSync(file, "utf8"));
  assert.ok(Array.isArray(ateliers), "ateliers.json is not a list");
  const identifiers = ateliers.map((a) => a.atelier);
  const events = all.filter(isEvent);
  assert.ok(events.length > 0, "no event page");
  for (const p of events) {
    assert.ok(identifiers.includes(frontMatter(p, "atelier")), `${p}: atelier`);
  }
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
