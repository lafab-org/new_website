const byTitle = (a, b) => a.data.title.localeCompare(b.data.title, "fr");

export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/css");
  // A front matter value by its name, for names Nunjucks cannot write
  // as a variable (`rendez-vous`).
  eleventyConfig.addFilter("champ", function (name) {
    return this.ctx[name];
  });
  // The ateliers of the site, in their order, each with its page, from
  // the data file `ateliers.json`.
  const ateliers = (api) => {
    const pages = api.getAll();
    const list = pages[0]?.data.ateliers ?? [];
    return list
      .map((a) => ({
        id: a.atelier,
        page: pages.find((p) => p.url.replace(/\/$/, "") === a.page),
      }))
      .filter((a) => a.page);
  };
  eleventyConfig.addCollection("pagesAtelier", (api) =>
    ateliers(api)
      .filter((a) => a.page.url.startsWith("/ateliers/"))
      .map((a) => a.page));
  // Event pages grouped by atelier, in the order of the ateliers, without
  // the empty groups.
  eleventyConfig.addCollection("evenementsParAtelier", (api) => {
    const events = api.getFilteredByGlob("src/evenements/*.md").sort(byTitle);
    return ateliers(api).map((a) => ({
      titre: a.page.data.title,
      url: a.page.url,
      pages: events.filter((e) => e.data.atelier === a.id),
    })).filter((g) => g.pages.length > 0);
  });
  return {
    dir: { input: "src", output: "_site", includes: "_includes" },
    markdownTemplateEngine: false,
    htmlTemplateEngine: "njk",
  };
}
