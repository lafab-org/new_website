import { readdirSync, readFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

export const SRC = "src";
export const SITE = "_site";

// Files of src/ outside folders starting with "_", as paths relative
// to it.
export function sourceFiles(root = SRC) {
  const found = [];
  const walk = (dir) => {
    for (const entry of readdirSync(join(root, dir), { withFileTypes: true })) {
      const rel = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!entry.name.startsWith("_")) walk(rel);
      } else found.push(rel);
    }
  };
  if (existsSync(root)) walk("");
  return found.sort();
}

// Pages of the initial state: the Markdown files of src/, outside
// _includes/ (and any other "_" folder).
export function pages(root = SRC) {
  return sourceFiles(root).filter((p) => p.endsWith(".md"));
}

// Extensions Eleventy would build as a page.
export const TEMPLATE_EXTENSIONS = [
  ".md", ".njk", ".html", ".liquid", ".11ty.js", ".11ty.cjs", ".11ty.mjs",
  ".hbs", ".mustache", ".ejs", ".haml", ".pug", ".webc",
];

export function frontMatterValue(text, key) {
  const fm = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const m = (fm ? fm[1] : "").match(new RegExp(`^${key}:\\s*(.*)$`, "m"));
  return m ? m[1].replace(/^["']|["']$/g, "").trim() : "";
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
  return bare === "/" ? "/" : bare.replace(/\/+$/, "") || "/";
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

const decode = (s) =>
  s.replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"');

// Targets of the <a href> elements of an HTML text.
export function anchors(html) {
  return [...html.matchAll(/<a\s[^>]*?\bhref\s*=\s*("([^"]*)"|'([^']*)')/gi)]
    .map((m) => decode(m[2] ?? m[3]));
}

// Text of every layout of src/_includes/, to tell its links apart.
function layoutsText(root = SRC) {
  const dir = join(root, "_includes");
  if (!existsSync(dir)) return "";
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((e) => e.isFile())
    .map((e) => readFileSync(join(e.parentPath ?? e.path, e.name), "utf8"))
    .join("\n");
}

// Links of a built page, the layouts' own links excluded.
export function pageLinks(page) {
  const layouts = anchors(layoutsText());
  return anchors(readBuilt(builtFile(address(page)))).filter((t) => !layouts.includes(t));
}
