import { fileURLToPath } from "node:url";
import { defineConfig } from "vitepress";
import { generateSidebar } from "vitepress-sidebar";
import { tabsMarkdownPlugin } from "vitepress-plugin-tabs";
import lightbox from "vitepress-plugin-lightbox";
import { successPlugin } from "./markdown/success.mts";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  srcDir: "src",

  title: "📖 CyberBook",
  cleanUrls: true,
  lastUpdated: true,

  ignoreDeadLinks: [/\.sh$/],

  head: [
    [
      "script",
      {},
      // Restores the saved color theme before first paint so it never flashes
      // the default one (same key as theme/themes.js)
      `try{var t=localStorage.getItem("cyberbook-theme");if(t&&t!=="cyberbook")document.documentElement.dataset.theme=t}catch(e){}`,
    ],
  ],

  vite: {
    resolve: {
      alias: [
        {
          // Swaps the navbar "..." flyout for a copy with the color theme picker
          find: /^.*\/VPNavBarExtra\.vue$/,
          replacement: fileURLToPath(
            new URL("./theme/components/NavBarExtra.vue", import.meta.url),
          ),
        },
      ],
    },
  },

  themeConfig: {
    search: {
      provider: "local",
      options: {
        detailedView: true, // display detailed list
      },
    },

    nav: [{ text: "Home", link: "/" }],
    outline: "deep",

    editLink: {
      pattern: "https://github.com/n3pt0x/cyberbook/edit/main/docs/src/:path",
      text: "Edit this page on GitHub",
    },
    lastUpdated: {
      text: "Last updated",
      formatOptions: { dateStyle: "short" }, // date only, no time
    },

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
      md.use(lightbox, {});
      md.use(successPlugin);
    },
  },
});
