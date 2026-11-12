export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/css");
  return {
    dir: { input: "src", output: "_site", includes: "_includes" },
    markdownTemplateEngine: false,
    htmlTemplateEngine: "njk",
  };
}
