// The articles: each actualites/<AAAA-MM-JJ>-<nom>.md is the page of one
// article, dated by the start of its file name.
// A front matter day, which YAML may read as a Date, as `2026-11-17`.
const jourIso = (d) => (d instanceof Date ? d.toISOString().slice(0, 10) : String(d));

// Published unless its mise en avant starts after the day of the build.
const publie = (data) => {
  const debut = data["mise-en-avant"]?.["début"];
  return debut == null || jourIso(debut) <= data.jourConstruction;
};

export default {
  layout: "article.njk",
  eleventyComputed: {
    publie,
    // The page of an article not published is not written.
    // Its address keeps the date that starts its file name, which
    // Eleventy would drop from the default one.
    permalink: (data) => (publie(data)
      ? `/actualites/${data.page.inputPath.match(/([^/]+)\.md$/)[1]}/index.html` : false),
    dateArticle: (data) => data.page.inputPath.match(/actualites\/(\d{4}-\d{2}-\d{2})-[^/]*\.md$/)?.[1],
  },
};
