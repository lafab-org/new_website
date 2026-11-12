import { cpSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";

export const SRC = "src";

// Lists the Markdown pages of a source folder, as paths relative to it.
export function pages(root) {
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

export function frontMatterTitle(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const t = m && m[1].match(/^title:\s*(.*)$/m);
  return t ? t[1].replace(/^["']|["']$/g, "").trim() : "";
}

// Builds the site with `npm run build` from a copy of src/ plus extra
// pages ({ path: content }); returns the output folder.
export function build(extraPages = {}) {
  const work = mkdtempSync(join(tmpdir(), "fabrique-"));
  const input = join(work, "src");
  cpSync(SRC, input, { recursive: true });
  for (const [path, content] of Object.entries(extraPages)) {
    mkdirSync(dirname(join(input, path)), { recursive: true });
    writeFileSync(join(input, path), content);
  }
  const output = join(work, "_site");
  execFileSync("npm", ["run", "build", "--", `--input=${input}`, `--output=${output}`], {
    stdio: "pipe",
  });
  return output;
}

export function read(output, file) {
  return readFileSync(join(output, file), "utf8");
}

// Invariants of /model, checked on the pages of a source folder.
// /model/page/markdown, /model/page/titre, /model/site/page-accueil
export function checkInvariants(root, assert) {
  const all = pages(root);
  for (const p of all) {
    assert.ok(p.endsWith(".md"), `${p} does not end with .md`);
    const title = frontMatterTitle(readFileSync(join(root, p), "utf8"));
    assert.notEqual(title, "", `${p} has an empty title`);
  }
  assert.ok(all.includes("index.md"), "no page index.md");
}
