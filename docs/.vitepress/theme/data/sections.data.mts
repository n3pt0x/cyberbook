import { createContentLoader } from "vitepress";

export interface SubsectionInfo {
  label: string;
  pages: number;
  link: string;
}

export interface SectionInfo {
  pages: number;
  link: string;
  children: SubsectionInfo[];
}

declare const data: Record<string, SectionInfo>;
export { data };

const depth = (u: string) => u.split("/").filter(Boolean).length;

// Groups URLs by their path segment at position `level` (1 = section, 2 = subsection)
function groupBy(urls: string[], level: number) {
  const groups: Record<string, string[]> = {};
  for (const url of urls) {
    const key = url.split("/")[level];
    if (key) (groups[key] ??= []).push(url);
  }
  return groups;
}

// Folder's `index.md` when it exists, else its shallowest page (alphabetical)
function entryOf(prefix: string, urls: string[]) {
  const list = [...urls].sort((a, b) => depth(a) - depth(b) || a.localeCompare(b));
  return list.includes(`${prefix}/`) ? `${prefix}/` : list[0];
}

// For each root folder of `docs/src/`: page count, card link, and its direct
// children (subfolders or root pages) used as shortcuts on the home cards.
// Only URLs are kept - no content.
export default createContentLoader("**/*.md", {
  transform(raw) {
    const result: Record<string, SectionInfo> = {};
    for (const [slug, urls] of Object.entries(groupBy(raw.map((p) => p.url), 1))) {
      const children = Object.entries(groupBy(urls, 2))
        .map(([child, list]) => ({
          label: child.replace(/-/g, " "),
          pages: list.length,
          link: entryOf(`/${slug}/${child}`, list),
        }))
        .sort((a, b) => b.pages - a.pages || a.label.localeCompare(b.label));

      result[slug] = {
        pages: urls.length,
        link: entryOf(`/${slug}`, urls),
        children,
      };
    }
    return result;
  },
});
