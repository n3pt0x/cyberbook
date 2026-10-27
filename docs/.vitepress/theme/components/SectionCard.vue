<script setup>
import { computed } from "vue";
import { withBase } from "vitepress";

const props = defineProps({
  title: String,
  description: String,
  href: String,
  // inner markup of a 24x24 stroke SVG
  icon: String,
  accent: { type: String, default: "var(--vp-c-brand-1)" },
  // subsections ({ label, link }), shown as shortcuts
  children: { type: Array, default: () => [] },
  pages: { type: Number, default: 0 },
  // position in the grid, drives the staggered entrance
  index: { type: Number, default: 0 },
});

const MAX_SHORTCUTS = 4;

const shortcuts = computed(() => props.children.slice(0, MAX_SHORTCUTS));
const hidden = computed(() => props.children.length - shortcuts.value.length);

// Feeds the cursor position to the CSS spotlight
function track(event) {
  const rect = event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty("--x", `${event.clientX - rect.left}px`);
  event.currentTarget.style.setProperty("--y", `${event.clientY - rect.top}px`);
}
</script>

<template>
  <article
    class="card"
    :style="{ '--accent': accent, '--i': index }"
    @pointermove="track"
  >
    <div class="card-head">
      <span class="card-icon" aria-hidden="true">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.75"
          stroke-linecap="round"
          stroke-linejoin="round"
          v-html="icon"
        />
      </span>
      <span v-if="pages" class="card-count">
        {{ pages }} {{ pages > 1 ? "pages" : "page" }}
      </span>
    </div>

    <h3 class="card-title">
      <a :href="withBase(href)" class="card-link">{{ title }}</a>
      <span class="card-arrow" aria-hidden="true">→</span>
    </h3>
    <p class="card-desc">{{ description }}</p>

    <ul v-if="shortcuts.length" class="card-pages">
      <li v-for="child in shortcuts" :key="child.link">
        <a :href="withBase(child.link)">{{ child.label }}</a>
      </li>
      <li v-if="hidden > 0">
        <a :href="withBase(href)" :title="`${hidden} more`">+{{ hidden }}</a>
      </li>
    </ul>
  </article>
</template>

<style scoped>
.card {
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 24px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 18px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  text-decoration: none;
  overflow: hidden;
  transition: border-color 0.25s, transform 0.25s;
  animation: card-rise 0.6s cubic-bezier(0.2, 0.7, 0.2, 1) backwards;
  animation-delay: calc(var(--i) * 60ms + 150ms);
}

/* spotlight following the cursor */
.card::before {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(
    360px circle at var(--x, 50%) var(--y, 0%),
    color-mix(in srgb, var(--accent) 16%, transparent),
    transparent 70%
  );
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none;
}

.card:hover {
  border-color: color-mix(in srgb, var(--accent) 55%, var(--vp-c-divider));
  transform: translateY(-3px);
}

.card:hover::before {
  opacity: 1;
}

/* the title link is stretched over the whole card */
.card-link {
  font-weight: inherit;
  color: var(--vp-c-text-1);
  text-decoration: none;
}

.card-link:hover {
  color: var(--vp-c-text-1);
  text-decoration: none;
}

.card-link::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 1;
  border-radius: inherit;
}

.card-link:focus-visible {
  outline: none;
}

.card:has(.card-link:focus-visible) {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-icon {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: color-mix(in srgb, var(--accent) 14%, transparent);
  color: var(--accent);
}

.card-icon svg {
  width: 22px;
  height: 22px;
}

.card-count {
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
  color: var(--vp-c-text-3);
}

.card-title {
  /* .vp-doc headings are position: relative, which would confine the
     stretched link to the title instead of the whole card */
  position: static;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 20px 0 0;
  padding: 0;
  border: 0;
  font-size: 20px;
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: -0.01em;
}

/* hidden by default, slides in next to the title on hover */
.card-arrow {
  color: var(--accent);
  opacity: 0;
  transform: translateX(-6px);
  transition: opacity 0.25s, transform 0.25s;
}

.card:hover .card-arrow {
  opacity: 1;
  transform: none;
}

.card-desc {
  flex: 1;
  margin: 8px 0 0;
  font-size: 14px;
  line-height: 1.6;
  color: var(--vp-c-text-2);
}

/* shortcuts sit above the stretched link so they stay clickable */
.card-pages {
  position: relative;
  z-index: 2;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 20px 0 0;
  padding: 0;
  list-style: none;
}

.card-pages li {
  margin: 0;
}

.card-pages a {
  display: block;
  padding: 2px 9px;
  border: 1px solid color-mix(in srgb, var(--accent) 22%, transparent);
  border-radius: 999px;
  background: color-mix(in srgb, var(--accent) 10%, transparent);
  font-family: var(--vp-font-family-mono);
  font-size: 11.5px;
  font-weight: 400;
  line-height: 1.7;
  color: color-mix(in srgb, var(--accent) 75%, var(--vp-c-text-1));
  text-decoration: none;
  transition: background-color 0.2s, border-color 0.2s;
}

.card-pages a:hover {
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 20%, transparent);
  color: color-mix(in srgb, var(--accent) 75%, var(--vp-c-text-1));
  text-decoration: none;
}

@keyframes card-rise {
  from {
    opacity: 0;
    transform: translateY(18px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .card {
    animation: none;
    transition: none;
  }
  .card::before,
  .card-arrow {
    transition: none;
  }
}
</style>
