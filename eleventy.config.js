import { eleventyImageTransformPlugin } from "@11ty/eleventy-img";

const byTitle = (a, b) => a.data.title.localeCompare(b.data.title, "fr");

export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/css");
  // Each <img> of the built pages becomes a <picture> of reduced copies,
  // written under _site/img/.
  eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
    formats: ["webp", "jpeg"],
    widths: [400, 800, 1600],
    htmlOptions: {
      imgAttributes: { loading: "lazy", decoding: "async", sizes: "(min-width: 40rem) 36rem, 100vw" },
    },
  });
  // The réalisations, most recent first.
  eleventyConfig.addCollection("realisations", (api) =>
    api.getFilteredByGlob("src/realisations/*/index.md")
      .sort((a, b) => b.data.date - a.data.date));
  // The articles, most recent first.
  eleventyConfig.addCollection("articles", (api) =>
    api.getFilteredByGlob("src/actualites/*/index.md")
      .sort((a, b) => b.data.dateArticle.localeCompare(a.data.dateArticle)));
  // The day of the build, in Paris: `2026-11-17`, taken anew at each
  // build, so that `npm start` left running past midnight follows it.
  const jourParis = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit",
  });
  let jourConstruction;
  eleventyConfig.on("eleventy.before", () => { jourConstruction = jourParis.format(new Date()); });
  // A front matter day, which YAML may read as a Date, as `2026-11-17`.
  const jourIso = (d) => (d instanceof Date ? d.toISOString().slice(0, 10) : String(d));
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
  // The atelier pages, in the order of the addresses of `ateliers.json`.
  eleventyConfig.addCollection("pagesAtelier", (api) => {
    const pages = api.getAll();
    const addresses = pages[0]?.data.ateliers ?? [];
    return addresses
      .map((a) => pages.find((p) => p.url && p.url.replace(/\/$/, "") === a))
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
