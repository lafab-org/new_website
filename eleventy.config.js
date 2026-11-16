const ATELIERS = [
  ["bois", "Bois"],
  ["métal", "Métal"],
  ["matériaux-souples", "Matériaux souples"],
  ["numérique-électronique", "Numérique et électronique"],
  ["association", "Association"],
];

const byTitle = (a, b) => a.data.title.localeCompare(b.data.title, "fr");

export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/css");
  // A front matter value by its name, for names Nunjucks cannot write
  // as a variable (`rendez-vous`).
  eleventyConfig.addFilter("champ", function (name) {
    return this.ctx[name];
  });
  eleventyConfig.addCollection("pagesAtelier", (api) =>
    api.getFilteredByGlob("src/ateliers/*.md").sort(byTitle));
  // Event pages grouped by atelier, in the order of ATELIERS, without
  // the empty groups.
  eleventyConfig.addCollection("evenementsParAtelier", (api) => {
    const events = api.getFilteredByGlob("src/evenements/*.md").sort(byTitle);
    return ATELIERS.map(([id, titre]) => ({
      titre,
      pages: events.filter((e) => e.data.atelier === id),
    })).filter((g) => g.pages.length > 0);
  });
  return {
    dir: { input: "src", output: "_site", includes: "_includes" },
    markdownTemplateEngine: false,
    htmlTemplateEngine: "njk",
  };
}
