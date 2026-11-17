// The articles: each actualites/<AAAA-MM-JJ>-<nom>/index.md is the page
// of one article, dated by the start of its folder name.
export default {
  layout: "article.njk",
  eleventyComputed: {
    dateArticle: (data) => data.page.inputPath.match(/actualites\/(\d{4}-\d{2}-\d{2})-[^/]*\/index\.md$/)?.[1],
  },
};
