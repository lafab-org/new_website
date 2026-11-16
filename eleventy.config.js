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
  return {
    dir: { input: "src", output: "_site", includes: "_includes" },
    markdownTemplateEngine: false,
    htmlTemplateEngine: "njk",
  };
}
