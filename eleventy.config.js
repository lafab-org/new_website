const byTitle = (a, b) => a.data.title.localeCompare(b.data.title, "fr");

export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/css");
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
      .map((a) => pages.find((p) => p.url.replace(/\/$/, "") === a))
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
  // The name of a category, from its identifier.
  eleventyConfig.addFilter("nomCategorie", (id, categories) =>
    (categories ?? []).find((c) => c.identifiant === id)?.nom ?? id);
  return {
    dir: { input: "src", output: "_site", includes: "_includes" },
    markdownTemplateEngine: false,
    htmlTemplateEngine: "njk",
  };
}
