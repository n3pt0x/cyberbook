import { defineConfig } from "vitepress";
import { generateSidebar } from "vitepress-sidebar";
import { tabsMarkdownPlugin } from "vitepress-plugin-tabs";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  srcDir: "src",

  title: "📖 CyberBook",
  cleanUrls: true,

  ignoreDeadLinks: [/\.sh$/],

  themeConfig: {
    search: {
      provider: "local",
      options: {
        detailedView: true, // display detailed list
      },
    },

    nav: [{ text: "Home", link: "/" }],
    outline: "deep",

    sidebar: generateSidebar({
      documentRootPath: "/docs/src",
      collapsed: true,
      useFolderLinkFromIndexFile: true,
      sortMenusOrderNumericallyFromTitle: true,
      hyphenToSpace: true,
      capitalizeFirst: true,
      capitalizeEachWords: true,
      useTitleFromFrontmatter: true,
      useFolderTitleFromIndexFile: true,
    }),
  },

  markdown: {
    config(md) {
      md.use(tabsMarkdownPlugin);
    },
  },
});
