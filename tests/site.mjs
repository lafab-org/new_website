import { readdirSync, readFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname, basename } from "node:path";

export const SRC = "src";
export const BASE_LAYOUT = "base.njk";

// Markdown pages of src/, as paths relative to it (folders starting
// with "_" hold layouts and data, not pages).
export function pages(root = SRC) {
  const found = [];
  const walk = (dir) => {
    for (const entry of readdirSync(join(root, dir), { withFileTypes: true })) {
      const rel = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!entry.name.startsWith("_")) walk(rel);
      } else if (entry.name.endsWith(".md")) found.push(rel);
    }
  };
  if (existsSync(root)) walk("");
  return found.sort();
}

function frontMatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return m ? m[1] : "";
}

export function frontMatterValue(text, key) {
  const m = frontMatter(text).match(new RegExp(`^${key}:\\s*(.*)$`, "m"));
  return m ? m[1].replace(/^["']|["']$/g, "").trim() : "";
}

// Layout of a page: its front matter, else the nearest directory data
// file (<dir>/<dir>.json or <dir>/<dir>.11tydata.json) up to src/.
function pageLayout(root, page) {
  const own = frontMatterValue(readFileSync(join(root, page), "utf8"), "layout");
  if (own) return own;
  let dir = dirname(page);
  for (;;) {
    const name = dir === "." ? basename(root) : basename(dir);
    for (const file of [`${name}.json`, `${name}.11tydata.json`]) {
      const path = join(root, dir === "." ? "" : dir, file);
      if (existsSync(path)) {
        const layout = JSON.parse(readFileSync(path, "utf8")).layout;
        if (layout) return layout;
      }
    }
    if (dir === ".") return "";
    dir = dirname(dir);
  }
}

// True when the page reaches the base layout through its layout chain.
export function derivesFromBase(root, page) {
  let layout = pageLayout(root, page);
  const seen = new Set();
  while (layout && !seen.has(layout)) {
    if (layout === BASE_LAYOUT) return true;
    seen.add(layout);
    const file = join(root, "_includes", layout);
    if (!existsSync(file)) return false;
    layout = frontMatterValue(readFileSync(file, "utf8"), "layout");
  }
  return false;
}

// Invariants of /model, on the pages of src/.
// /model/page/markdown, /model/page/titre, /model/site/page-accueil,
// /model/site/page-metallerie
export function checkInvariants(assert, root = SRC) {
  const all = pages(root);
  for (const p of all) {
    assert.ok(p.endsWith(".md"), `${p} does not end with .md`);
    const title = frontMatterValue(readFileSync(join(root, p), "utf8"), "title");
    assert.notEqual(title, "", `${p} has an empty title`);
  }
  assert.ok(all.includes("index.md"), "no page index.md");
  assert.ok(all.includes("ateliers/metallerie.md"), "no page ateliers/metallerie.md");
}

// Builds the real site, once, with `npm run build`.
let built = false;
export function build() {
  if (!built) {
    execFileSync("npm", ["run", "build"], { stdio: "pipe" });
    built = true;
  }
}

export function readBuilt(file) {
  build();
  return readFileSync(join("_site", file), "utf8");
}

export function readSource(file) {
  return readFileSync(join(SRC, file), "utf8");
}

// Visible text of a built page: tags removed, entities decoded,
// spaces (non-breaking included) collapsed.
export function builtText(file) {
  return readBuilt(file)
    .replace(/<(script|style)[\s\S]*?<\/\1>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#39;|&apos;|&rsquo;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/[\u00a0\u202f\u2019]/g, (c) => (c === "\u2019" ? "'" : " "))
    .replace(/\s+/g, " ");
}
