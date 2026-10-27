import type MarkdownIt from "markdown-it";

/**
 * Adds a "success" variant to VitePress custom blocks, usable with both
 * syntaxes, mirroring the built-in tip/warning/danger output:
 *
 *   ::: success Optional title
 *   content
 *   :::
 *
 *   > [!SUCCESS]
 *   > content
 *
 * The rendered markup reuses the `custom-block` class so styling lives in
 * `theme/custom.css` next to the other block colors.
 */
export function successPlugin(md: MarkdownIt): void {
  containerRule(md);
  alertRule(md);
}

const NAME = "success";
const MARKER = ":".charCodeAt(0);
const MIN_MARKERS = 3;

/** `::: success` container, adapted from markdown-it-container. */
function containerRule(md: MarkdownIt): void {
  md.block.ruler.before(
    "fence",
    "success_container",
    (state, startLine, endLine, silent) => {
      let start = state.bMarks[startLine] + state.tShift[startLine];
      let max = state.eMarks[startLine];

      if (state.src.charCodeAt(start) !== MARKER) return false;

      let pos = start + 1;
      while (pos <= max && state.src.charCodeAt(pos) === MARKER) pos++;
      const markerCount = pos - start;
      if (markerCount < MIN_MARKERS) return false;

      const params = state.src.slice(pos, max);
      if (params.trim().split(/\s+/, 1)[0] !== NAME) return false;
      if (silent) return true;

      let nextLine = startLine;
      let autoClosed = false;
      for (;;) {
        nextLine++;
        if (nextLine >= endLine) break;

        start = state.bMarks[nextLine] + state.tShift[nextLine];
        max = state.eMarks[nextLine];
        if (start < max && state.sCount[nextLine] < state.blkIndent) break;
        if (state.src.charCodeAt(start) !== MARKER) continue;
        if (state.sCount[nextLine] - state.blkIndent >= 4) continue;

        pos = start + 1;
        while (pos <= max && state.src.charCodeAt(pos) === MARKER) pos++;
        if (pos - start < markerCount) continue;

        pos = state.skipSpaces(pos);
        if (pos < max) continue;

        autoClosed = true;
        break;
      }

      const oldParent = state.parentType;
      const oldLineMax = state.lineMax;
      // @ts-expect-error custom parent type, as markdown-it-container does
      state.parentType = "container";
      state.lineMax = nextLine;

      const title = params.trim().slice(NAME.length).trim() || "SUCCESS";

      const openToken = state.push("success_open", "div", 1);
      openToken.markup = state.src.slice(start, pos);
      openToken.block = true;
      openToken.info = params;
      openToken.meta = { title };
      openToken.map = [startLine, nextLine];

      state.md.block.tokenize(state, startLine + 1, nextLine);

      const closeToken = state.push("success_close", "div", -1);
      closeToken.block = true;

      state.parentType = oldParent;
      state.lineMax = oldLineMax;
      state.line = nextLine + (autoClosed ? 1 : 0);

      return true;
    },
    { alt: ["paragraph", "reference", "blockquote", "list"] }
  );

  md.renderer.rules.success_open = (tokens, idx) => {
    const title = tokens[idx].meta?.title ?? "SUCCESS";
    return `<div class="success custom-block"><p class="custom-block-title">${md.utils.escapeHtml(
      title
    )}</p>\n`;
  };
  md.renderer.rules.success_close = () => `</div>\n`;
}

/** `> [!SUCCESS]` GitHub-style alert, matching VitePress's own alerts plugin. */
function alertRule(md: MarkdownIt): void {
  const markerRE = /^\[!SUCCESS\]([^\n\r]*)/i;

  md.core.ruler.after("github-alerts", "success-alert", (state) => {
    const tokens = state.tokens;
    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i].type !== "blockquote_open") continue;

      const open = tokens[i];
      let endIndex = i + 1;
      while (
        endIndex < tokens.length &&
        (tokens[endIndex].type !== "blockquote_close" ||
          tokens[endIndex].level !== open.level)
      )
        endIndex++;
      if (endIndex === tokens.length) continue;

      const firstContent = tokens
        .slice(i, endIndex + 1)
        .find((token) => token.type === "inline");
      if (!firstContent) continue;

      const match = firstContent.content.match(markerRE);
      if (!match) continue;

      const title = match[1].trim() || "SUCCESS";
      firstContent.content = firstContent.content.slice(match[0].length).trimStart();

      open.type = "success_alert_open";
      open.tag = "div";
      open.meta = { title };

      const close = tokens[endIndex];
      close.type = "success_alert_close";
      close.tag = "div";
    }
  });

  md.renderer.rules.success_alert_open = (tokens, idx) => {
    const title = tokens[idx].meta?.title ?? "SUCCESS";
    return `<div class="success custom-block github-alert"><p class="custom-block-title">${md.utils.escapeHtml(
      title
    )}</p>\n`;
  };
  md.renderer.rules.success_alert_close = () => `</div>\n`;
}
