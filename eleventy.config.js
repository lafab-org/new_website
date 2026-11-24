import { cpSync, existsSync, mkdirSync, mkdtempSync, rmSync, statSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { RenderPlugin } from "@11ty/eleventy";
import Image, { eleventyImageTransformPlugin } from "@11ty/eleventy-img";

// Where eleventy-img writes the reduced copies, kept between builds so
// that a photo already reduced is not reduced again.
const IMAGES_CACHE = ".cache/@11ty/img/";

// The content folder and the output folder of the build, from the
// environment only: read here, before a data file loads `.env`.
const CONTENU = process.env.CONTENU;
const SORTIE = process.env.SORTIE || "_site";

// The input folder: src/ itself, or, with CONTENU, a temporary folder
// holding the code of src/ (everything but the Markdown files and the
// photos/ folders) and the content of CONTENU over it. It is under the
// project, which Eleventy needs to apply the directory data files, in
// .cache/, which git ignores.
const estContenu = (chemin) => chemin.endsWith(".md") || chemin.split(sep).includes("photos");
let ENTREE = "src";
if (CONTENU) {
  mkdirSync(".cache", { recursive: true });
  ENTREE = relative(".", mkdtempSync(join(".cache", "entree-")));
  cpSync("src", ENTREE, { recursive: true, filter: (f) => !estContenu(relative("src", f)) });
  cpSync(CONTENU, ENTREE, { recursive: true });
}

// The templates whose file is directly in the folder `dossier` of the input.
const dansDossier = (api, dossier) => api.getAllSorted().filter((p) =>
  p.inputPath.endsWith(".md") && dirname(resolve(p.inputPath)) === resolve(ENTREE, dossier));
// Whether a template is the file `chemin` of the input.
const estFichier = (p, chemin) => resolve(p.inputPath) === resolve(ENTREE, chemin);

const byTitle = (a, b) => a.data.title.localeCompare(b.data.title, "fr");

// The types of the blocks of the home page.
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
  const lignes = corps.split("\n");
  let cloture = null;
  const titres = []; // [index, text] of each level-2 heading
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
  const fin = titres[k + 1]?.[0] ?? lignes.length;
  return lignes.slice(titres[k][0], fin).join("\n").trimEnd() + "\n";
};

export default function (eleventyConfig) {
  eleventyConfig.addPlugin(RenderPlugin);
  for (const f of ["css", "logo.svg", "couverture-a-venir.svg", "favicon.svg", "favicon.ico"]) {
    eleventyConfig.addPassthroughCopy({ [join(ENTREE, f)]: f });
  }
  // The temporary input folder: git ignores it, so Eleventy must not
  // follow .gitignore; it is removed when the build ends, failed or not.
  if (CONTENU) {
    eleventyConfig.setUseGitIgnore(false);
    process.on("exit", () => rmSync(ENTREE, { recursive: true, force: true }));
  }
  // Each <img> of the built pages becomes a <picture> of reduced copies,
  // served under /img/: written to the cache, then copied into _site/img/
  // after each build (see eleventy.after below).
  eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
    outputDir: IMAGES_CACHE,
    urlPath: "/img/",
    formats: ["webp", "jpeg"],
    // Widths close to what the pages display, at 1x to 3x: the event
    // thumbnails of the séances and event lists (about 4rem), the gallery
    // and summary thumbnails (about 13rem wide, or half a phone screen)
    // and the full text width (40rem, or a phone screen).
    widths: [150, 300, 450, 650, 900, 1300],
    htmlOptions: {
      // By default an image spans the text column (main is 40rem wide,
      // with 1rem padding on each side); the templates of thumbnails
      // give their own `sizes`.
      imgAttributes: { loading: "lazy", decoding: "async", sizes: "(min-width: 42rem) 40rem, calc(100vw - 2rem)" },
    },
  });
  // Only the reduced copies the built pages use are copied, so that the
  // photos of a page no longer built are not published.
  eleventyConfig.on("eleventy.after", ({ directories, results }) => {
    if (!existsSync(IMAGES_CACHE)) return;
    const used = new Set(results.flatMap(({ content }) =>
      typeof content === "string" ? [...content.matchAll(/\/img\/([^\s"'?#,]+)/g)].map((m) => m[1]) : []));
    cpSync(IMAGES_CACHE, join(directories.output, "img"), {
      recursive: true,
      filter: (src) => statSync(src).isDirectory() || used.has(relative(IMAGES_CACHE, src)),
    });
  });
  // The day of the build, in Paris: `2026-11-17`, taken anew at each
  // build, so that `npm start` left running past midnight follows it.
  const jourParis = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit",
  });
  let jourConstruction;
  eleventyConfig.on("eleventy.before", () => { jourConstruction = jourParis.format(new Date()); });
  eleventyConfig.addGlobalData("jourConstruction", () => jourConstruction);
  // A front matter day, which YAML may read as a Date, as `2026-11-17`.
  const jourIso = (d) => (d instanceof Date ? d.toISOString().slice(0, 10) : String(d));
  // The réalisations, most recent first.
  eleventyConfig.addCollection("realisations", (api) =>
    dansDossier(api, "realisations")
      .sort((a, b) => b.data.date - a.data.date));
  // Three réalisations drawn at random at each build, or all of them if
  // there are fewer.
  eleventyConfig.addCollection("tirage", (api) => {
    const restantes = dansDossier(api, "realisations");
    const tirage = [];
    while (tirage.length < 3 && restantes.length > 0) {
      tirage.push(...restantes.splice(Math.floor(Math.random() * restantes.length), 1));
    }
    return tirage;
  });
  // The séances of the 7 days that start on the day of the build.
  eleventyConfig.addFilter("septJours", (list) => {
    const [a, m, j] = jourConstruction.split("-").map(Number);
    const dernier = new Date(Date.UTC(a, m - 1, j + 6)).toISOString().slice(0, 10);
    return (list ?? []).filter((s) => jourConstruction <= s.jour && s.jour <= dernier);
  });
  // The published articles, most recent first.
  eleventyConfig.addCollection("articles", (api) =>
    dansDossier(api, "actualites")
      .filter((a) => a.data.publie)
      .sort((a, b) => b.data.dateArticle.localeCompare(a.data.dateArticle)));
  // The articles in avant on `page` (accueil or agenda) on the day of the build.
  eleventyConfig.addFilter("enAvant", (articles, page) => (articles ?? []).filter((a) => {
    const m = a.data["mise-en-avant"];
    if (!m || ![].concat(m.pages ?? []).includes(page)) return false;
    return (m["début"] == null || jourIso(m["début"]) <= jourConstruction) && jourConstruction <= jourIso(m.fin);
  }));
  // A front matter value by its name, for names Nunjucks cannot write
  // as a variable (`rendez-vous`).
  eleventyConfig.addFilter("champ", function (name) {
    return this.ctx[name];
  });
  const events = (api) => dansDossier(api, "evenements").sort(byTitle);
  // A value of the front matter as a list: a single value gives a list of
  // one, none an empty list.
  const asList = (v) => (v == null ? [] : [].concat(v));
  // The atelier pages, in the order of `ateliers.json`.
  eleventyConfig.addCollection("pagesAtelier", (api) => {
    const pages = api.getAll();
    const ateliers = pages[0]?.data.ateliers ?? [];
    return ateliers
      .map((a) => pages.find((p) => p.url && p.url.replace(/\/$/, "") === a.adresse))
      .filter((p) => p);
  });
  // Event pages grouped by category, in the order of `categories.json`,
  // without the empty groups.
  eleventyConfig.addCollection("evenementsParCategorie", (api) => {
    const all = events(api);
    const categories = api.getAll()[0]?.data.categories ?? [];
    return categories.map((c) => ({
      nom: c.nom,
      pages: all.filter((e) => e.data["catégorie"] === c.identifiant),
    })).filter((g) => g.pages.length > 0);
  });
  eleventyConfig.addCollection("evenements", events);
  // The blocks of the home page, from `blocs` in the front matter of
  // index.md, in their order; a `section` block also gets the Markdown of
  // its section and its page. Collections are built before any page is
  // written, so an invalid block fails the build with no page of _site/
  // changed (the passthrough copies are made before).
  eleventyConfig.addCollection("blocsAccueil", (api) => {
    const pages = api.getAll();
    const accueil = pages.find((p) => estFichier(p, "index.md"));
    if (!accueil) return [];
    const erreur = (m) => new Error(`index.md, blocs : ${m}`);
    const blocs = accueil.data.blocs;
    if (!Array.isArray(blocs)) throw erreur("une liste de blocs est attendue.");
    blocs.forEach((b, i) => {
      if (!TYPES_BLOC.includes(b?.type)) {
        throw erreur(`le bloc ${i + 1} a le type « ${b?.type} », qui n'est pas l'un de ${TYPES_BLOC.join(", ")}.`);
      }
      if (b.type !== "section" && (b.page != null || b.titre != null)) {
        throw erreur(`le bloc ${i + 1}, ${b.type}, n'a ni page ni titre.`);
      }
    });
    if (blocs.filter((b) => b.type === "corps").length > 1) throw erreur("il y a plus d'un bloc corps.");
    return blocs.map((b, i) => {
      if (b.type !== "section") return { type: b.type };
      if (typeof b.page !== "string" || typeof b.titre !== "string" || !b.page || !b.titre) {
        throw erreur(`le bloc ${i + 1}, section, demande une page et un titre.`);
      }
      // Pages CMS may store the path from the root of the repository.
      const chemin = b.page.replace(/^\.?\/?(src\/)?/, "");
      const page = pages.find((p) => estFichier(p, chemin));
      if (!page || !page.url || page.data.publie === false) {
        throw erreur(`le bloc ${i + 1} reprend une section de « ${b.page} », qui n'est pas une page publiée du site.`);
      }
      const markdown = sectionDe(page.rawInput ?? page.data.page?.rawInput ?? "", b.titre);
      if (markdown === undefined) {
        throw erreur(`le bloc ${i + 1} reprend la section « ${b.titre} » de ${chemin}, qui n'a pas de titre de niveau 2 « ${b.titre} ».`);
      }
      if (/\]\(\s*<?#|^ {0,3}\[[^\]]+\]:\s*<?#|href\s*=\s*["']#/m.test(markdown)) {
        throw erreur(`la section « ${b.titre} » de ${chemin} a un lien vers une ancre (#…), qui ne mènerait nulle part sur l'accueil.`);
      }
      return {
        type: "section",
        markdown,
        // The template languages of its page, which render it there.
        langages: page.data.templateEngineOverride ?? "md",
        // A copy: rendering it sets its `page` to the home page.
        donnees: { ...page.data },
        adresse: page.url.replace(/(.)\/$/, "$1"),
        titre: page.data.title,
      };
    });
  });
  // The events of the given categories.
  eleventyConfig.addFilter("deCategories", (list, categories) => {
    const ids = asList(categories);
    return (list ?? []).filter((e) => ids.includes(e.data["catégorie"]));
  });
  // The séances of the event whose page is `evenements/<nom>.md`.
  eleventyConfig.addFilter("seancesDe", (list, nom) =>
    (list ?? []).filter((s) => s.evenement === nom));
  // The cover of the event whose page is `evenements/<nom>.md`, if any.
  eleventyConfig.addFilter("couvertureDe", (nom, evenements) =>
    (evenements ?? []).find((e) => e.fileSlug === nom)?.data.couverture);
  // The address of a photo shown large, from its `fichier`: a reduced
  // copy in the cache, copied after the build like those of the pages.
  eleventyConfig.addAsyncFilter("agrandie", async (fichier) => {
    const source = typeof fichier === "string" ? resolve(ENTREE, fichier.replace(/^\/+/, "")) : "";
    if (!source.startsWith(resolve(ENTREE) + sep)) throw new Error(`photo hors du contenu : ${fichier}`);
    const copies = await Image(source, {
      widths: [1300], formats: ["jpeg"], outputDir: IMAGES_CACHE, urlPath: "/img/",
    });
    return copies.jpeg[0].url;
  });
  // The séances of the given categories.
  eleventyConfig.addFilter("deCategoriesSeances", (list, categories) => {
    const ids = asList(categories);
    return (list ?? []).filter((s) => ids.includes(s.categorie));
  });
  // A day `2026-12-03` written out in French: `jeudi 3 décembre 2026`.
  const jour = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
  });
  eleventyConfig.addFilter("jourLong", (d) => {
    const s = jour.format(new Date(`${d}T12:00:00Z`));
    return s.charAt(0).toUpperCase() + s.slice(1);
  });
  // A time `18:00` as `18 h`, `09:30` as `9 h 30`.
  eleventyConfig.addFilter("heure", (h) => {
    const [hh, mm] = h.split(":");
    return `${Number(hh)} h${mm === "00" ? "" : " " + mm}`;
  });
  // A date as its month and year: `Octobre 2019`.
  const moisAnnee = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" });
  eleventyConfig.addFilter("moisAnnee", (d) => {
    const s = moisAnnee.format(new Date(d));
    return s.charAt(0).toUpperCase() + s.slice(1);
  });
  // A day `2015-01-13` as `13 janvier 2015`.
  const jourMoisAnnee = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
  });
  eleventyConfig.addFilter("jourMoisAnnee", (d) => jourMoisAnnee.format(new Date(`${d}T12:00:00Z`)));
  // The name of a category, from its identifier.
  eleventyConfig.addFilter("nomCategorie", (id, categories) =>
    (categories ?? []).find((c) => c.identifiant === id)?.nom ?? id);
  return {
    dir: { input: ENTREE, output: SORTIE, includes: "_includes" },
    markdownTemplateEngine: false,
    htmlTemplateEngine: "njk",
  };
}
