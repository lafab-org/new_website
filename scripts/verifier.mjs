// Checks the content of the site already built: reads src/ and _site/,
// without building, and reports every problem together, each with the
// source file of its page and the invariant of docs/model.md it breaks.
// In GitHub Actions, the report goes to the step summary and each problem
// becomes an annotation on its source file; elsewhere, to the terminal.
import { appendFileSync, existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const SRC = "src";
const SITE = "_site";
// Written by the build: the TiBillet events it read without a séance.
const IGNORES = "evenements-ignores.json";

const problemes = [];
// A problem found again, the same link on the same page, is reported once.
const signaler = (fichier, invariant, message) => {
  if (!problemes.some((x) => x.fichier === fichier && x.invariant === invariant && x.message === message)) {
    problemes.push({ fichier, invariant, message });
  }
};

// --- Reading the sources -------------------------------------------------

// Markdown files of src/ under `dir`, outside _includes/ and realisations/,
// as paths relative to src/.
function markdown(dir = "") {
  return readdirSync(join(SRC, dir), { withFileTypes: true }).flatMap((e) => {
    const rel = join(dir, e.name);
    if (e.isDirectory()) return rel === "_includes" || rel === "realisations" ? [] : markdown(rel);
    return rel.endsWith(".md") ? [rel] : [];
  });
}
// The files of the réalisations: the Markdown files directly in realisations/.
const realisations = () => (existsSync(join(SRC, "realisations"))
  ? readdirSync(join(SRC, "realisations"), { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith(".md")).map((e) => join("realisations", e.name))
  : []);

const isEvent = (p) => /^evenements\/[^/]+\.md$/.test(p) && p !== "evenements/index.md";
const isArticle = (p) => /^actualites\/[^/]+\.md$/.test(p);

// The address serving a page, and the built file of an address.
const address = (p) => "/" + p.replace(/\.md$/, "").replace(/(^|\/)index$/, "");
const builtFile = (addr) => join(SITE, addr, "index.html");

const unquote = (v) => v.trim().replace(/^(["'])(.*)\1$/, "$2");
const frontMatterBlock = (p) =>
  readFileSync(join(SRC, p), "utf8").match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? "";

// A scalar of the front matter, as written, unquoted; "" without one.
const frontMatter = (p, key) => {
  const m = frontMatterBlock(p).match(new RegExp(`^${key}:[ \t]*(.*)$`, "m"));
  return m ? unquote(m[1]) : "";
};

// The strings of a front matter list, written inline (`[a, "b"]`) or as
// block items (`- a`); a single value gives a list of one.
const frontMatterList = (p, key) => {
  const m = frontMatterBlock(p).match(new RegExp(`^${key}:[ \t]*(.*)((?:\\r?\\n[ \t]*-.*)*)`, "m"));
  if (!m) return [];
  const inline = m[1].trim();
  if (inline.startsWith("[")) {
    return inline.replace(/^\[|\]$/g, "").split(",").map(unquote).filter((v) => v !== "");
  }
  if (inline !== "") return [unquote(inline)];
  return m[2].split(/\r?\n/).filter((l) => l.trim() !== "").map((l) => unquote(l.replace(/^\s*-/, "")));
};

// The mise en avant of an article, from its front matter block:
// `{ pages, début, fin }`, each as written, or undefined without one.
const miseEnAvant = (p) => {
  const lines = frontMatterBlock(p).split(/\r?\n/);
  const start = lines.findIndex((l) => /^mise-en-avant:/.test(l));
  if (start < 0) return undefined;
  const block = [];
  const inline = lines[start].replace(/^mise-en-avant:/, "").replace(/\s+#.*$/, "").trim();
  if (inline !== "") {
    // A flow mapping, `{ pages: [...], fin: ... }`, read as a block of its
    // entries; any other value leaves the block empty.
    const flow = inline.match(/^\{(.*)\}$/)?.[1] ?? "";
    let depth = 0, entry = "";
    for (const c of flow + ",") {
      if (c === "," && depth === 0) { if (entry.trim()) block.push("  " + entry.trim()); entry = ""; continue; }
      if (c === "[") depth++;
      if (c === "]") depth--;
      entry += c;
    }
  } else {
    for (const l of lines.slice(start + 1)) {
      if (!/^\s/.test(l) && l.trim() !== "") break;
      block.push(l);
    }
  }
  const value = (key) => block.find((l) => new RegExp(`^\\s+${key}:`).test(l))
    ?.replace(/^[^:]*:/, "").replace(/\s+#.*$/, "").trim();
  const listed = value("pages");
  let pages;
  if (listed === undefined) pages = [];
  else if (listed.startsWith("[")) {
    pages = listed.replace(/^\[|\]$/g, "").split(",").map(unquote).filter((v) => v !== "");
  } else if (listed !== "") pages = [unquote(listed)];
  else {
    const i = block.findIndex((l) => /^\s+pages:/.test(l));
    pages = [];
    for (const l of block.slice(i + 1)) {
      const m = l.replace(/\s+#.*$/, "").match(/^\s+-\s*(.*)$/);
      if (!m) break;
      pages.push(unquote(m[1]));
    }
  }
  const date = (key) => (value(key) === undefined ? undefined : unquote(value(key)));
  return { pages, début: date("début"), fin: date("fin") };
};

// A valid day written AAAA-MM-JJ.
const validDay = (s) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s ?? "");
  if (!m) return false;
  const [y, mo, d] = m.slice(1).map(Number);
  const day = new Date(0);
  day.setUTCFullYear(y, mo - 1, d);
  return day.getUTCFullYear() === y && day.getUTCMonth() === mo - 1 && day.getUTCDate() === d;
};

// The day in Paris, AAAA-MM-JJ, when the verifier runs.
const today = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit",
}).format(new Date());

// An article is published unless its mise en avant starts after today.
const published = (p) => {
  const début = miseEnAvant(p)?.début;
  return début === undefined || début <= today;
};

// --- Reading the built pages ---------------------------------------------

const text = (html) => html.replace(/<[^>]*>/g, " ")
  .replace(/&#39;|&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<")
  .replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
const decode = (s) => { try { return decodeURI(s); } catch { return s; } };
const hrefs = (html) =>
  [...html.matchAll(/<a\s[^>]*?href\s*=\s*["']([^"']*)["']/gi)].map((m) => decode(text(m[1])));
const ids = (html) => new Set([...html.matchAll(/\sid\s*=\s*["']([^"']*)["']/gi)].map((m) => m[1]));
// The <img> elements of a built page, with their `src` and `alt`, if any.
const images = (html) => [...html.matchAll(/<img\s[^>]*>/gi)].map((m) => {
  const attr = (name) => m[0].match(new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
  const value = (a) => (a ? text(a[1] ?? a[2] ?? a[3]) : undefined);
  return { src: value(attr("src")), alt: value(attr("alt")) };
});

// --- The checks ----------------------------------------------------------

function verifier() {
  if (!existsSync(SITE)) {
    signaler(SITE, "", "le site n'est pas construit : lancer d'abord `npm run build`.");
    return;
  }
  const categories = JSON.parse(readFileSync(join(SRC, "_data", "categories.json"), "utf8"))
    .map((c) => c.identifiant);
  const toutes = markdown();
  const pages = toutes.filter((p) => !isArticle(p) || published(p));
  const built = {};
  for (const p of pages) {
    const file = builtFile(address(p));
    if (existsSync(file)) built[p] = readFileSync(file, "utf8");
    else {
      signaler(join(SRC, p), "", `la page n'est pas dans ${SITE}/ : reconstruire le site.`);
      built[p] = "";
    }
  }

  for (const p of pages) {
    const source = join(SRC, p);
    // /model/page/titre
    if (frontMatter(p, "title") === "") signaler(source, "/model/page/titre", "le titre est vide.");
    // /model/page/categories
    for (const c of frontMatterList(p, "catégories")) {
      if (!categories.includes(c)) signaler(source, "/model/page/categories", `« ${c} » n'est pas une catégorie du site.`);
    }
  }

  for (const p of pages.filter(isEvent)) {
    const source = join(SRC, p);
    // /model/evenement/renseigne
    for (const key of ["rendez-vous", "horaire", "prix"]) {
      if (frontMatter(p, key) === "") signaler(source, "/model/evenement/renseigne", `\`${key}\` est vide.`);
    }
    // /model/evenement/categorie
    const c = frontMatter(p, "catégorie");
    if (!categories.includes(c)) signaler(source, "/model/evenement/categorie", `la catégorie « ${c} » n'est pas une catégorie du site.`);
  }

  // /model/realisation/categories
  for (const r of realisations()) {
    for (const c of frontMatterList(r, "catégories")) {
      if (!categories.includes(c)) signaler(join(SRC, r), "/model/realisation/categories", `« ${c} » n'est pas une catégorie du site.`);
    }
  }

  for (const p of toutes.filter(isArticle)) {
    const source = join(SRC, p);
    // /model/article/date
    const m = p.split("/")[1].match(/^(\d{4}-\d{2}-\d{2})-/);
    if (!m) signaler(source, "/model/article/date", "le nom de fichier ne commence pas par une date `AAAA-MM-JJ` suivie de `-`.");
    else if (!validDay(m[1])) signaler(source, "/model/article/date", `${m[1]} n'est pas une date valide.`);
    // /model/mise-en-avant/valide
    const mise = miseEnAvant(p);
    if (!mise) continue;
    const invalide = (message) => signaler(source, "/model/mise-en-avant/valide", message);
    if (mise.pages.length === 0) invalide("la mise en avant n'a aucune page.");
    for (const page of mise.pages) {
      if (!["accueil", "agenda"].includes(page)) invalide(`la page « ${page} » n'est ni \`accueil\` ni \`agenda\`.`);
    }
    if (!validDay(mise.fin)) invalide(`la fin « ${mise.fin ?? ""} » n'est pas une date \`AAAA-MM-JJ\` valide.`);
    if (mise.début !== undefined) {
      if (!validDay(mise.début)) invalide(`le début « ${mise.début} » n'est pas une date \`AAAA-MM-JJ\` valide.`);
      else if (validDay(mise.fin) && mise.début > mise.fin) invalide("le début est après la fin.");
    }
  }

  const parAdresse = Object.fromEntries(pages.map((p) => [address(p), built[p]]));
  for (const p of pages) {
    const source = join(SRC, p);
    for (const href of hrefs(built[p])) {
      const [cible, fragment] = href.split("#");
      if (cible === "") {
        // /model/site/fragment
        if (!ids(built[p]).has(fragment)) signaler(source, "/model/site/fragment", `le lien \`${href}\` ne mène à aucun identifiant de la page.`);
      } else if (/^\/(?!\/)/.test(cible)) {
        // /model/site/lien-interne
        const page = parAdresse[cible.replace(/\?.*$/, "").replace(/(.)\/$/, "$1")];
        if (page === undefined) signaler(source, "/model/site/lien-interne", `le lien \`${href}\` ne mène à aucune page du site.`);
        else if (fragment !== undefined && !ids(page).has(fragment)) {
          signaler(source, "/model/site/lien-interne", `le lien \`${href}\` mène à une page sans l'identifiant \`${fragment}\`.`);
        }
      }
      // External links are not checked.
    }
    for (const { src, alt } of images(built[p])) {
      // /model/image/texte
      if (!alt) signaler(source, "/model/image/texte", `l'image \`${src ?? ""}\` n'a pas de texte alternatif.`);
      // /model/site/image
      const interne = src !== undefined && /^\/(?!\/)/.test(src);
      const file = interne ? join(SITE, decode(src)) : "";
      if (!interne || !existsSync(file) || !statSync(file).isFile()) {
        signaler(source, "/model/site/image", `l'image \`${src ?? ""}\` ne mène à aucun fichier du site.`);
      }
    }
  }
}

// --- The report ----------------------------------------------------------

// The TiBillet events the build read without a séance, as the build
// wrote them; none if it wrote no file.
const ignores = () => {
  if (!existsSync(IGNORES)) return [];
  try { return JSON.parse(readFileSync(IGNORES, "utf8")); } catch { return []; }
};
// A start date-time of TiBillet as its day and time in Paris.
const paris = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "Europe/Paris", dateStyle: "full", timeStyle: "short",
});
const debut = (iso) => {
  const d = new Date(iso);
  return iso && !Number.isNaN(d.getTime()) ? paris.format(d) : String(iso ?? "sans date");
};

// Escapes of the workflow commands of GitHub Actions.
const echapper = (s) => s.replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");
const echapperPropriete = (s) => echapper(s).replace(/:/g, "%3A").replace(/,/g, "%2C");

function rapport() {
  const lignes = [];
  lignes.push("## Vérification du contenu", "");
  if (problemes.length === 0) lignes.push("Aucun problème.");
  else {
    lignes.push(`${problemes.length} problème${problemes.length > 1 ? "s" : ""} :`, "");
    for (const { fichier, invariant, message } of problemes) {
      lignes.push(`- \`${fichier}\`${invariant ? ` (${invariant})` : ""} : ${message}`);
    }
  }
  const liste = ignores();
  lignes.push("", "## Évènements TiBillet ignorés", "");
  if (liste.length === 0) lignes.push("Aucun.");
  else for (const e of liste) lignes.push(`- ${e.nom ?? "(sans nom)"}, ${debut(e.debut)}`);
  const texte = lignes.join("\n") + "\n";

  console.log(texte);
  if (process.env.GITHUB_ACTIONS) {
    for (const { fichier, invariant, message } of problemes) {
      const titre = invariant ? `,title=${echapperPropriete(invariant)}` : "";
      console.log(`::error file=${echapperPropriete(fichier)}${titre}::${echapper(message)}`);
    }
    if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, texte);
  }
}

verifier();
rapport();
process.exitCode = problemes.length > 0 ? 1 : 0;
