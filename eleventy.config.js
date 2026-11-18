import { cpSync, existsSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { eleventyImageTransformPlugin } from "@11ty/eleventy-img";

// Where eleventy-img writes the reduced copies, kept between builds so
// that a photo already reduced is not reduced again.
const IMAGES_CACHE = ".cache/@11ty/img/";

const byTitle = (a, b) => a.data.title.localeCompare(b.data.title, "fr");

export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/logo.svg");
  eleventyConfig.addPassthroughCopy("src/couverture-a-venir.svg");
  // Each <img> of the built pages becomes a <picture> of reduced copies,
  // served under /img/: written to the cache, then copied into _site/img/
  // after each build (see eleventy.after below).
  eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
    outputDir: IMAGES_CACHE,
    urlPath: "/img/",
    formats: ["webp", "jpeg"],
    // Widths close to what the pages display, at 1x to 3x: the gallery
    // and summary thumbnails (about 13rem wide, or half a phone screen)
    // and the full text width (40rem, or a phone screen).
    widths: [300, 450, 650, 900, 1300],
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
    api.getFilteredByGlob("src/realisations/*.md")
      .sort((a, b) => b.data.date - a.data.date));
  // Three réalisations drawn at random at each build, or all of them if
  // there are fewer.
  eleventyConfig.addCollection("tirage", (api) => {
    const restantes = api.getFilteredByGlob("src/realisations/*.md");
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
    api.getFilteredByGlob("src/actualites/*.md")
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
  const events = (api) => api.getFilteredByGlob("src/evenements/*.md").sort(byTitle);
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
  // The events of the given categories.
  eleventyConfig.addFilter("deCategories", (list, categories) => {
    const ids = asList(categories);
    return (list ?? []).filter((e) => ids.includes(e.data["catégorie"]));
  });
  // The séances of the event whose page is `evenements/<nom>.md`.
  eleventyConfig.addFilter("seancesDe", (list, nom) =>
    (list ?? []).filter((s) => s.evenement === nom));
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
    dir: { input: "src", output: "_site", includes: "_includes" },
    markdownTemplateEngine: false,
    htmlTemplateEngine: "njk",
  };
}
