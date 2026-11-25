// Checks the content of the site already built: reads src/ and _site/,
// without building, and reports every problem together, each with its
// source file and the invariant of docs/model.md it breaks.
// In GitHub Actions, the report goes to the step summary and each problem
// becomes an annotation on its source file; elsewhere, to the terminal.
import { appendFileSync, existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, posix, resolve, sep } from "node:path";

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
const isAtelier = (p) => /^ateliers\/[^/]+\.md$/.test(p);

// The address serving a page, and the built file of an address.
const address = (p) => "/" + p.replace(/\.md$/, "").replace(/(^|\/)index$/, "");
const builtFile = (addr) => join(SITE, addr, "index.html");

// The front matter block of a source file, and its body.
const source = (p) => readFileSync(join(SRC, p), "utf8");
const FRONT_MATTER = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/;
const frontMatterBlock = (p) => source(p).match(FRONT_MATTER)?.[1] ?? "";
const body = (p) => source(p).replace(FRONT_MATTER, "");

// The YAML that front matters use, read without a dependency: block
// mappings and sequences, flow `[…]` and `{…}`, quoted, plain (on one
// line or more) and block (`|`, `>`) scalars, and comments. Scalars stay
// strings, as written; an empty value, `~` or `null` is null.
function yaml(text) {
  const lines = text.split(/\r?\n/).map((raw) => {
    const t = raw.replace(/\t/g, "  ");
    const indent = t.length - t.trimStart().length;
    return { indent, text: t.trim() };
  });
  const blank = (i) => lines[i].text === "" || lines[i].text.startsWith("#");
  const next = (i) => { while (i < lines.length && blank(i)) i++; return i; };
  const isItem = (t) => t === "-" || t.startsWith("- ");
  const withoutComment = (s) => s.replace(/(^|\s)#.*$/, "").trim();
  const KEY = /^("[^"]*"|'[^']*'|[^\s"'[{#-][^:]*?|-[^\s:][^:]*?)\s*:(?:\s+(.*))?$/;
  const isKey = (t) => KEY.test(t);

  // A flow value, or a quoted or plain scalar, from the start of `s`:
  // [value, rest of s].
  const flow = (s, inFlow) => {
    s = s.trimStart();
    if (s[0] === "[" || s[0] === "{") {
      const list = s[0] === "[";
      const close = list ? "]" : "}";
      const value = list ? [] : {};
      s = s.slice(1).trimStart();
      while (s !== "" && s[0] !== close) {
        const avant = s;
        let item;
        [item, s] = flow(s, true);
        s = s.trimStart();
        // `key: value`, in a mapping, or in a list as a mapping of one.
        let v = null;
        const paire = s[0] === ":";
        if (paire) [v, s] = flow(s.slice(1), true);
        if (!list) { if (item !== null) value[item] = v; } else value.push(paire ? { [item ?? ""]: v } : item);
        s = s.trimStart();
        if (s[0] === ",") s = s.slice(1).trimStart();
        // A character that starts no value is skipped.
        else if (s === avant) s = s.slice(1).trimStart();
      }
      return [value, s.slice(1)];
    }
    if (s[0] === '"') {
      const m = s.match(/^"((?:[^"\\]|\\.)*)"/);
      if (m) {
        const v = m[1].replace(/\\(["\\/]|n|t)/g, (_, c) => ({ n: "\n", t: "\t" })[c] ?? c);
        return [v, s.slice(m[0].length)];
      }
    }
    if (s[0] === "'") {
      const m = s.match(/^'((?:[^']|'')*)'/);
      if (m) return [m[1].replace(/''/g, "'"), s.slice(m[0].length)];
    }
    // A plain scalar ends at a comment, and, in a flow, at `,`, `]`, `}`
    // or a `: `.
    const end = inFlow ? s.search(/[,\]}]|:(\s|$)|\s#/) : s.search(/\s#/);
    const v = (end < 0 ? s : s.slice(0, end)).trim();
    return [v === "" || v === "~" || v === "null" ? null : v, end < 0 ? "" : s.slice(end)];
  };

  // The value after `key:` or `-` on line i, whose parent is indented by
  // `indent`: [value, index of the line after it].
  const value = (rest, i, indent, inMapping) => {
    rest = rest.trim();
    let j = i + 1;
    // The lines that continue it: more indented than its parent.
    const continuation = () => {
      const more = [];
      while (j < lines.length && (lines[j].text === "" || lines[j].indent > indent)) more.push(lines[j++]);
      while (more.length && more.at(-1).text === "") more.pop();
      return more;
    };
    if (rest === "" || rest.startsWith("#")) {
      const k = next(j);
      if (k < lines.length && inMapping && lines[k].indent === indent && isItem(lines[k].text)) {
        return block(k, indent);
      }
      if (k >= lines.length || lines[k].indent <= indent) return [null, j];
      if (isItem(lines[k].text) || isKey(lines[k].text)) return block(k, lines[k].indent);
      // A plain or quoted scalar that starts on the next line.
      const more = continuation().filter((l) => l.text !== "" && !l.text.startsWith("#")).map((l) => l.text);
      return [flow(more.join(" "), false)[0], j];
    }
    if (/^[|>][+-]?\d*\s*(#.*)?$/.test(rest)) {
      const more = continuation().map((l) => l.text);
      return [more.join(rest[0] === "|" ? "\n" : " "), j];
    }
    const more = continuation().filter((l) => l.text !== "" && !l.text.startsWith("#")).map((l) => l.text);
    const all = [rest, ...more].join(" ");
    if (rest[0] === "[" || rest[0] === "{" || rest[0] === '"' || rest[0] === "'") return [flow(all, false)[0], j];
    return [flow(withoutComment(rest) === "" ? "" : [withoutComment(rest), ...more.map(withoutComment)].join(" "), false)[0], j];
  };

  // The mapping or sequence whose first line is i, indented by `indent`.
  const block = (i, indent) => {
    if (isItem(lines[i].text)) {
      const list = [];
      while (i < lines.length && lines[i].indent === indent && isItem(lines[i].text)) {
        const item = lines[i].text.slice(1);
        const offset = item.length - item.trimStart().length + 1;
        if (isKey(item.trim())) {
          // `- key: value`: a mapping, indented as its first key.
          lines[i] = { indent: indent + offset, text: item.trim() };
          let v;
          [v, i] = block(i, indent + offset);
          list.push(v);
        } else {
          let v;
          [v, i] = value(item, i, indent, false);
          list.push(v);
        }
        i = next(i);
      }
      return [list, i];
    }
    const map = {};
    while (i < lines.length && lines[i].indent === indent && !isItem(lines[i].text)) {
      const m = lines[i].text.match(KEY);
      if (!m) { i = next(i + 1); continue; }
      const key = flow(m[1], false)[0] ?? "";
      [map[key], i] = value(m[2] ?? "", i, indent, true);
      i = next(i);
    }
    return [map, i];
  };

  const first = next(0);
  if (first >= lines.length) return {};
  const [v] = block(first, lines[first].indent);
  return v && typeof v === "object" && !Array.isArray(v) ? v : {};
}

const parsed = new Map();
// The front matter of a source file, as an object.
const frontMatterData = (p) => {
  if (!parsed.has(p)) {
    let data;
    try { data = yaml(frontMatterBlock(p)); } catch { data = {}; }
    parsed.set(p, data);
  }
  return parsed.get(p);
};
const isObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const asString = (v) => (v == null ? "" : typeof v === "string" ? v : JSON.stringify(v));
// The strings of a list; a single value gives a list of one.
const asList = (v) => (v == null ? [] : [].concat(v)).filter((x) => x != null && x !== "").map(asString);

// A scalar of the front matter, as written; "" without one.
const frontMatter = (p, key) => asString(frontMatterData(p)[key]);
// The strings of a front matter list, or a single value as a list of one.
const frontMatterList = (p, key) => asList(frontMatterData(p)[key]);

// The mise en avant of an article: `{ pages, début, fin }`, each as
// written, or undefined without one.
const miseEnAvant = (p) => {
  const data = frontMatterData(p);
  if (!("mise-en-avant" in data)) return undefined;
  const m = isObject(data["mise-en-avant"]) ? data["mise-en-avant"] : {};
  const date = (key) => (m[key] == null ? undefined : asString(m[key]));
  return { pages: asList(m.pages), début: date("début"), fin: date("fin") };
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

// --- Reading the home page -----------------------------------------------

// The types of a bloc.
const TYPES_BLOC = ["corps", "articles-en-avant", "ateliers", "section", "semaine", "realisations"];

// The text a Markdown heading displays: its inline marks removed.
const texteAffiche = (s) => {
  let t = s.replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1");
  for (let avant = ""; avant !== t;) {
    avant = t;
    t = t.replace(/(\*\*|__|~~|\*|_|`)(?=\S)(.*?\S)\1/g, "$2");
  }
  return t.replace(/\\([!-/:-@[-`{-~])/g, "$1").replace(/\s+/g, " ").trim();
};

// The Markdown of the section `titre` of a body: from its first level-2
// heading displaying `titre`, included, to the next level-2 heading or
// the end; undefined if there is none. Fenced code is not a heading.
const sectionDe = (corps, titre) => {
  const lignes = corps.split(/\r?\n/);
  let cloture = null;
  const titres = [];
  lignes.forEach((l, i) => {
    const f = l.match(/^ {0,3}(`{3,}|~{3,})/);
    if (f) {
      if (cloture === null) cloture = f[1][0];
      else if (f[1][0] === cloture) cloture = null;
      return;
    }
    const h = cloture === null && l.match(/^ {0,3}##(?:[ \t]+(.*?))?(?:[ \t]+#+)?[ \t]*$/);
    if (h) titres.push([i, texteAffiche(h[1] ?? "")]);
  });
  const k = titres.findIndex(([, t]) => t === titre);
  if (k < 0) return undefined;
  return lignes.slice(titres[k][0], titres[k + 1]?.[0] ?? lignes.length).join("\n");
};
// A link of Markdown or HTML to a fragment, `#…`.
const FRAGMENT = /\]\(\s*<?#|^ {0,3}\[[^\]]+\]:\s*<?#|href\s*=\s*["']#/m;

// The images a Markdown body shows, `![alt](src)` or `<img>`, outside
// code, each with its `src` and `alt`.
const imagesMarkdown = (md) => {
  let cloture = null;
  const texte = md.split(/\r?\n/).filter((l) => {
    const f = l.match(/^ {0,3}(`{3,}|~{3,})/);
    if (f && (cloture === null || f[1][0] === cloture)) {
      cloture = cloture === null ? f[1][0] : null;
      return false;
    }
    return cloture === null;
  }).join("\n").replace(/<!--[\s\S]*?-->/g, "").replace(/(?<!`)(`+)(?!`)[^\n]*?(?<!`)\1(?!`)/g, "");
  return [
    ...[...texte.matchAll(/!\[([^\]]*)\]\(\s*(?:<([^>\n]*)>|([^\s)]*))(?:\s+["'(][^)]*)?\)/g)]
      .map((m) => ({ src: decode(m[2] ?? m[3]), alt: m[1].trim() })),
    ...images(texte),
  ];
};

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

  // /model/categorie/identifiant
  const fichierCategories = join(SRC, "_data", "categories.json");
  for (const c of new Set(categories.filter((c, i) => categories.indexOf(c) !== i))) {
    signaler(fichierCategories, "/model/categorie/identifiant", `l'identifiant « ${c} » est celui de plusieurs catégories.`);
  }

  // The ateliers of src/_data/ateliers.json, and the atelier pages.
  const fichierAteliers = join(SRC, "_data", "ateliers.json");
  const ateliers = JSON.parse(readFileSync(fichierAteliers, "utf8"));
  const pagesAtelier = pages.filter(isAtelier);
  for (const a of ateliers) {
    // /model/atelier/nom-court
    if (asString(a.menu).trim() === "") {
      signaler(fichierAteliers, "/model/atelier/nom-court", `l'atelier \`${asString(a.adresse)}\` n'a pas de nom court.`);
    }
    // /model/site/ateliers
    if (!pagesAtelier.some((p) => address(p) === asString(a.adresse).replace(/(.)\/$/, "$1"))) {
      signaler(fichierAteliers, "/model/site/ateliers", `\`${asString(a.adresse)}\` n'est l'adresse d'aucune page de \`ateliers/\`.`);
    }
  }
  for (const p of pagesAtelier) {
    const source = join(SRC, p);
    // /model/site/ateliers
    const n = ateliers.filter((a) => asString(a.adresse).replace(/(.)\/$/, "$1") === address(p)).length;
    if (n !== 1) {
      signaler(source, "/model/site/ateliers", n === 0
        ? `la page n'est l'atelier d'aucune entrée de ${fichierAteliers}.`
        : `la page est l'atelier de ${n} entrées de ${fichierAteliers}.`);
    }
    // /model/atelier/accroche
    if (frontMatter(p, "accroche").trim() === "") signaler(source, "/model/atelier/accroche", "l'accroche est vide.");
  }

  for (const r of realisations()) {
    const source = join(SRC, r);
    // /model/realisation/une-categorie
    if (frontMatterList(r, "catégories").length === 0) signaler(source, "/model/realisation/une-categorie", "la réalisation n'a aucune catégorie.");
    // /model/realisation/une-photo
    const photos = frontMatterData(r).photos;
    if (!Array.isArray(photos) || photos.length === 0) signaler(source, "/model/realisation/une-photo", "la réalisation n'a aucune photo.");
  }

  // The photos of the content, each with its file, the folder of its
  // photos, and its fichier and description: the covers of the ateliers,
  // events and articles, the illustrations of the ateliers and events, the photos of the réalisations, and the images
  // the body of an article shows.
  const photos = [];
  const couverture = (p, dossier) => {
    const c = frontMatterData(p).couverture;
    if (c != null) photos.push({ p, dossier, fichier: asString(c?.fichier), description: asString(c?.description) });
  };
  for (const p of pagesAtelier) {
    couverture(p, "ateliers");
    const liste = frontMatterData(p).illustrations;
    for (const ph of Array.isArray(liste) ? liste : []) {
      photos.push({ p, dossier: "ateliers", fichier: asString(ph?.fichier), description: asString(ph?.description) });
    }
  }
  for (const p of pages.filter(isEvent)) {
    couverture(p, "evenements");
    const liste = frontMatterData(p).illustrations;
    for (const ph of Array.isArray(liste) ? liste : []) {
      photos.push({ p, dossier: "evenements", fichier: asString(ph?.fichier), description: asString(ph?.description) });
    }
  }
  for (const p of toutes.filter(isArticle)) {
    couverture(p, "actualites");
    for (const { src, alt } of imagesMarkdown(body(p))) {
      photos.push({ p, dossier: "actualites", fichier: src ?? "", description: alt ?? "" });
    }
  }
  for (const r of realisations()) {
    const liste = frontMatterData(r).photos;
    for (const ph of Array.isArray(liste) ? liste : []) {
      photos.push({ p: r, dossier: "realisations", fichier: asString(ph?.fichier), description: asString(ph?.description) });
    }
  }
  for (const { p, dossier, fichier, description } of photos) {
    const source = join(SRC, p);
    // /model/photo/fichier
    const chemin = posix.normalize(fichier);
    const file = join(SRC, chemin);
    if (!chemin.startsWith(`/${dossier}/photos/`) || !existsSync(file) || !statSync(file).isFile()) {
      signaler(source, "/model/photo/fichier", `la photo \`${fichier}\` n'est pas un fichier de \`${dossier}/photos/\`.`);
    }
    // /model/photo/description
    if (description.trim() === "") signaler(source, "/model/photo/description", `la photo \`${fichier}\` n'a pas de description.`);
  }

  // The blocs of the home page.
  const accueil = "index.md";
  const sourceAccueil = join(SRC, accueil);
  const blocs = existsSync(sourceAccueil) ? frontMatterData(accueil).blocs : [];
  if (!Array.isArray(blocs)) {
    // /model/site/blocs
    signaler(sourceAccueil, "/model/site/blocs", "le front matter n'a pas de liste `blocs`.");
  } else {
    blocs.forEach((b, i) => {
      const type = isObject(b) ? asString(b.type) : "";
      // /model/site/blocs
      if (!TYPES_BLOC.includes(type)) {
        signaler(sourceAccueil, "/model/site/blocs", `le bloc ${i + 1} a le type « ${type} », qui n'est pas l'un de ${TYPES_BLOC.join(", ")}.`);
        return;
      }
      // /model/bloc/section
      const invalide = (message) => signaler(sourceAccueil, "/model/bloc/section", `le bloc ${i + 1} ${message}`);
      if (type !== "section") {
        if (b.page != null || b.titre != null) {
          signaler(sourceAccueil, "/model/bloc/section", `le bloc ${i + 1}, ${type}, n'a ni page ni titre.`);
        }
        return;
      }
      const page = asString(b.page);
      const titre = asString(b.titre);
      if (page === "" || titre === "") return invalide("demande une page et un titre.");
      // As the build, a path from the root of the repository.
      const chemin = page.replace(/^\.?\/?(src\/)?/, "");
      if (!pages.includes(chemin)) return invalide(`reprend une section de « ${page} », qui n'est pas une page publiée du site.`);
      const section = sectionDe(body(chemin), titre);
      if (section === undefined) return invalide(`reprend la section « ${titre} » de ${chemin}, qui n'a pas de titre de niveau 2 « ${titre} ».`);
      if (FRAGMENT.test(section)) invalide(`reprend la section « ${titre} » de ${chemin}, qui a un lien vers un identifiant (#…).`);
    });
    // /model/site/corps
    if (blocs.filter((b) => isObject(b) && b.type === "corps").length > 1) {
      signaler(sourceAccueil, "/model/site/corps", "il y a plus d'un bloc `corps`.");
    }
  }

  // /model/site/tirage: each list of the tirage on the built home page.
  const espaces = (t) => t.replace(/\s+/g, " ").trim();
  const titres = realisations().map((r) => espaces(frontMatter(r, "titre")));
  const listes = [...(built[accueil] ?? "").matchAll(/<ul\s[^>]*class\s*=\s*["']tirage["'][^>]*>([\s\S]*?)<\/ul>/gi)];
  if (listes.length === 0 && titres.length > 0 && Array.isArray(blocs) && blocs.some((b) => isObject(b) && b.type === "realisations")) {
    signaler(sourceAccueil, "/model/site/tirage", "le bloc `realisations` ne montre aucune réalisation.");
  }
  for (const liste of listes) {
    const montres = [...liste[1].matchAll(/<p\s[^>]*class\s*=\s*["']tirage-titre["'][^>]*>([\s\S]*?)<\/p>/gi)].map((m) => text(m[1]));
    const attendu = Math.min(3, titres.length);
    if (montres.length !== attendu) {
      signaler(sourceAccueil, "/model/site/tirage", `le tirage montre ${montres.length} réalisations au lieu de ${attendu}.`);
    }
    for (const t of new Set(montres)) {
      const fois = montres.filter((x) => x === t).length;
      const disponibles = titres.filter((x) => x === t).length;
      if (fois > disponibles) {
        signaler(sourceAccueil, "/model/site/tirage", disponibles === 0
          ? `le tirage montre « ${t} », qui n'est pas une réalisation.`
          : `le tirage montre « ${t} » ${fois} fois, pour ${disponibles} réalisation${disponibles > 1 ? "s" : ""}.`);
      }
    }
  }

  const parAdresse = Object.fromEntries(pages.map((p) => [address(p), built[p]]));
  for (const p of pages) {
    const source = join(SRC, p);
    // The links of the illustrations, which lead to files, not to pages.
    const galerie = built[p].match(/<ul\s(?:[^>]*\s)?class\s*=\s*["'](?:[^"']*\s)?illustrations(?:\s[^"']*)?["'][\s\S]*?<\/ul>/i)?.[0] ?? "";
    const liensIllustrations = hrefs(galerie);
    for (const href of liensIllustrations) {
      // /model/site/lien-illustration
      const interne = /^\/(?!\/)/.test(href);
      const file = interne ? resolve(SITE, href.split(/[?#]/)[0].slice(1)) : "";
      if (!interne || !file.startsWith(resolve(SITE) + sep) || !existsSync(file) || !statSync(file).isFile()) {
        signaler(source, "/model/site/lien-illustration", `le lien d'illustration \`${href}\` ne mène à aucun fichier du site.`);
      }
    }
    const aVerifier = hrefs(built[p].replace(galerie, ""));
    for (const href of aVerifier) {
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
