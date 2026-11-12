import { readdirSync, readFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname, basename } from "node:path";

export const SRC = "src";
export const SITE = "_site";
const INCLUDES = "_includes";

// Files of src/, outside src/_includes/, as paths relative to it.
export function sourceFiles(root = SRC) {
  const found = [];
  const walk = (dir) => {
    for (const entry of readdirSync(join(root, dir), { withFileTypes: true })) {
      const rel = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (rel !== INCLUDES) walk(rel);
      } else found.push(rel);
    }
  };
  if (existsSync(root)) walk("");
  return found.sort();
}

// Pages of the initial state: the Markdown files of src/, outside
// _includes/.
export function pages(root = SRC) {
  return sourceFiles(root).filter((p) => p.endsWith(".md"));
}

// Extensions Eleventy would build as a page.
export const TEMPLATE_EXTENSIONS = [
  ".md", ".njk", ".html", ".liquid", ".11ty.js", ".11ty.cjs", ".11ty.mjs",
];

const FRONT_MATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

export function frontMatterValue(text, key) {
  const fm = text.match(FRONT_MATTER);
  const m = (fm ? fm[1] : "").match(new RegExp(`^${key}:\\s*(.*)$`, "m"));
  return m ? m[1].replace(/^["']|["']$/g, "").trim() : "";
}

export function withoutFrontMatter(text) {
  return text.replace(FRONT_MATTER, "");
}

// Address of a page, from its path under src/.
export function address(page) {
  const noExt = page.replace(/\.md$/, "");
  if (noExt === "index") return "/";
  return "/" + noExt.replace(/\/index$/, "");
}

// Built file serving an address.
export function builtFile(addr) {
  return addr === "/" ? "index.html" : `${addr.slice(1)}/index.html`;
}

export function isInternal(target) {
  return target.startsWith("/") && !target.startsWith("//");
}

// The address a link target designates: no fragment, no query, no
// final "/" except for "/" itself.
export function designated(target) {
  const bare = target.replace(/#.*$/, "").replace(/\?.*$/, "");
  return bare === "/" ? "/" : bare.replace(/\/$/, "");
}

// Internal links that designate no address of `addresses`, from a map
// of page to link targets.
export function brokenLinks(linksByPage, addresses) {
  const known = new Set(addresses);
  const broken = [];
  for (const [page, targets] of Object.entries(linksByPage)) {
    for (const t of targets) {
      if (isInternal(t) && !known.has(designated(t))) broken.push(`${page}: ${t}`);
    }
  }
  return broken;
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
  return readFileSync(join(SITE, file), "utf8");
}

export function readSource(file) {
  return readFileSync(join(SRC, file), "utf8");
}

export function builtPage(page) {
  return readBuilt(builtFile(address(page)));
}

function decode(s) {
  const text = s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");
  try {
    return decodeURI(text);
  } catch {
    return text;
  }
}

// Targets of the <a href> elements of an HTML text.
export function anchors(html) {
  return [...html.matchAll(/<a(?:\s[^>]*?)?\shref\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)]
    .map((m) => decode(m[1] ?? m[2]));
}

// Layout of a page: its front matter, else the nearest directory data
// file (<dir>/<dir>.json or <dir>/<dir>.11tydata.json) up to src/.
function pageLayout(page) {
  const own = frontMatterValue(readSource(page), "layout");
  if (own) return own;
  let dir = dirname(page);
  for (;;) {
    const name = dir === "." ? basename(SRC) : basename(dir);
    for (const file of [`${name}.json`, `${name}.11tydata.json`]) {
      const path = join(SRC, dir === "." ? "" : dir, file);
      if (existsSync(path)) {
        const layout = JSON.parse(readFileSync(path, "utf8")).layout;
        if (layout) return layout;
      }
    }
    if (dir === ".") return "";
    dir = dirname(dir);
  }
}

// Layouts wrapping a page, outermost first.
function layoutChain(page) {
  const chain = [];
  let layout = pageLayout(page);
  while (layout && !chain.includes(layout)) {
    chain.unshift(layout);
    layout = frontMatterValue(readSource(join(INCLUDES, layout)), "layout");
  }
  return chain;
}

const EXPRESSION = /\{\{[\s\S]*?\}\}|\{%[\s\S]*?%\}|\{#[\s\S]*?#\}/;
const CONTENT = /\{\{\s*content\b[^}]*\}\}/;

// The rendered text of a page (its `body`), its layouts' text removed:
// each layout is peeled off at the fixed text just around its content.
export function renderedBody(page) {
  let html = builtPage(page);
  for (const layout of layoutChain(page)) {
    const text = withoutFrontMatter(readSource(join(INCLUDES, layout)));
    const at = text.search(CONTENT);
    if (at < 0) throw new Error(`${layout} has no content`);
    const before = text.slice(0, at).split(EXPRESSION).pop();
    const after = text.slice(at).replace(CONTENT, "").split(EXPRESSION)[0];
    const start = html.indexOf(before);
    const end = after ? html.lastIndexOf(after) : html.length;
    if (start < 0 || end < start + before.length) throw new Error(`${page}: ${layout} not found`);
    html = html.slice(start + before.length, end);
  }
  return html;
}

// Links of a page: those of its rendered body only.
export function pageLinks(page) {
  return anchors(renderedBody(page));
}
