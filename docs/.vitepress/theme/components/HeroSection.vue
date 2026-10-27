<template>
  <section class="cv-hero">
    <div class="cv-hero-content">
      <span class="cv-pill"><i class="cv-dot"></i> Offensive security knowledge base</span>

      <h1>
        <span class="cv-book">📖</span> Cyber<span class="cv-grad">Book</span
        ><span class="cv-cursor">_</span>
      </h1>

      <p class="cv-tagline">
        <span>Cheatsheets</span><b>·</b><span>Notebook</span><b>·</b><span>Playbook</span>
      </p>

      <p class="cv-lead">
        Commands, payloads and methodology organised by attack surface - built to be
        skimmed in the middle of an engagement.
      </p>

      <div class="cv-cta">
        <a class="cv-btn cv-btn-primary" href="#sections">Browse sections</a>
        <a class="cv-btn cv-btn-ghost" href="/pentest-basics/tips">Start with the basics</a>
      </div>

      <p class="cv-hint">
        Search anywhere with <kbd>Ctrl</kbd> <kbd>K</kbd>
      </p>

      <div class="cv-term" role="img" aria-label="Terminal summary of the site content">
        <div class="cv-term-bar">
          <i></i><i></i><i></i>
          <span>operator@cyberbook: ~</span>
        </div>
        <div class="cv-term-body">
          <div class="cv-line" style="--d: 0.4s">
            <span class="cv-ps">$</span>
            <span class="cv-type" style="--n: 8">./stats</span>
          </div>
          <div class="cv-line cv-out" style="--d: 1.2s">
            <span class="cv-ok">[+]</span> {{ stats.sections }} sections
            <span class="cv-ok">[+]</span> {{ stats.pages }} pages
          </div>
          <div class="cv-line" style="--d: 1.8s">
            <span class="cv-ps">$</span> <span class="cv-caret"></span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from "vue";
import { data } from "../data/sections.data.mts";

const stats = computed(() => {
  const list = Object.values(data);
  return {
    sections: list.length,
    pages: list.reduce((sum, s) => sum + s.pages, 0),
  };
});
</script>

<style scoped>
.cv-hero {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  /* full-bleed, and pulled up under the (transparent) navbar so both blend */
  margin: calc(-1 * var(--vp-nav-height)) var(--vp-offset, calc(50% - 50vw)) 0;
  padding: calc(72px + var(--vp-nav-height)) 24px 56px;
  text-align: center;
}

/* dotted grid, fading out towards the bottom */
.cv-hero::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -2;
  background-image: radial-gradient(
    color-mix(in srgb, var(--vp-c-text-1) 22%, transparent) 1px,
    transparent 1.3px
  );
  background-size: 26px 26px;
  -webkit-mask-image: radial-gradient(ellipse 75% 85% at 50% 0%, #000 25%, transparent 75%);
  mask-image: radial-gradient(ellipse 75% 85% at 50% 0%, #000 25%, transparent 75%);
}

/* colored glows */
.cv-hero::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  background:
    radial-gradient(ellipse 34% 50% at 26% 0%, rgba(220, 38, 38, 0.2), transparent 70%),
    radial-gradient(ellipse 30% 45% at 76% 4%, rgba(249, 115, 22, 0.14), transparent 70%),
    radial-gradient(ellipse 30% 35% at 50% 88%, rgba(168, 85, 247, 0.08), transparent 70%);
  -webkit-mask-image: radial-gradient(ellipse 90% 100% at 50% 35%, #000 35%, transparent 100%);
  mask-image: radial-gradient(ellipse 90% 100% at 50% 35%, #000 35%, transparent 100%);
  animation: cv-breathe 9s ease-in-out infinite alternate;
}

.cv-hero-content {
  max-width: 720px;
  margin: 0 auto;
}

.cv-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 5px 14px;
  font-family: var(--vp-font-family-mono);
  font-size: 12.5px;
  color: var(--vp-c-text-2);
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, #ef4444 35%, transparent);
  background: color-mix(in srgb, #ef4444 8%, transparent);
}

.cv-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #ef4444;
  box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.6);
  animation: cv-ping 2s infinite;
}

h1 {
  margin: 22px 0 10px;
  padding: 0;
  font-size: clamp(2.6rem, 8vw, 4.6rem);
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.03em;
}

.cv-book {
  display: inline-block;
  animation: cv-float 4s ease-in-out infinite;
}

.cv-grad {
  background: linear-gradient(120deg, #ef4444 0%, #f97316 55%, #fbbf24 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.cv-cursor {
  margin-left: 2px;
  color: #ef4444;
  -webkit-text-fill-color: #ef4444;
  animation: cv-blink 1.1s steps(1) infinite;
}

.cv-tagline {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
  justify-content: center;
  margin: 0 0 14px;
  font-size: 1.25rem;
  font-weight: 500;
  color: var(--vp-c-text-1);
}

.cv-tagline b {
  font-weight: 400;
  color: #ef4444;
  opacity: 0.8;
}

.cv-lead {
  max-width: 560px;
  margin: 0 auto 28px;
  line-height: 1.65;
  color: var(--vp-c-text-2);
}

.cv-cta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
}

.cv-btn {
  display: inline-block;
  padding: 10px 24px;
  font-size: 15px;
  font-weight: 600;
  text-decoration: none;
  border-radius: 999px;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    background-color 0.2s ease,
    border-color 0.2s ease;
}

.cv-btn:hover {
  text-decoration: none;
  transform: translateY(-2px);
}

.cv-btn-primary {
  color: #fff;
  background: linear-gradient(135deg, #dc2626, #f97316);
  box-shadow: 0 8px 24px -8px rgba(220, 38, 38, 0.7);
}

.cv-btn-primary:hover {
  color: #fff;
  box-shadow: 0 12px 30px -8px rgba(220, 38, 38, 0.9);
}

.cv-btn-ghost {
  color: var(--vp-c-text-1);
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
}

.cv-btn-ghost:hover {
  color: var(--vp-c-text-1);
  border-color: #ef4444;
}

.cv-hint {
  margin: 18px 0 0;
  font-size: 13px;
  color: var(--vp-c-text-3);
}

kbd {
  padding: 1px 7px;
  font-family: var(--vp-font-family-mono);
  font-size: 11.5px;
  border-radius: 6px;
  border: 1px solid var(--vp-c-divider);
  border-bottom-width: 2px;
  background: var(--vp-c-bg-soft);
}

/* ---------- fake terminal ---------- */
.cv-term {
  max-width: 520px;
  margin: 44px auto 0;
  overflow: hidden;
  text-align: left;
  border-radius: 14px;
  border: 1px solid var(--vp-c-divider);
  background: #0d0d10;
  box-shadow:
    0 30px 60px -30px rgba(0, 0, 0, 0.6),
    0 0 60px -20px rgba(220, 38, 38, 0.35);
}

.cv-term-bar {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 10px 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  background: rgba(255, 255, 255, 0.04);
}

.cv-term-bar i {
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: #ff5f57;
}
.cv-term-bar i:nth-child(2) {
  background: #febc2e;
}
.cv-term-bar i:nth-child(3) {
  background: #28c840;
}

.cv-term-bar span {
  margin-left: 8px;
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
  color: #8b8b93;
}

.cv-term-body {
  padding: 16px 18px 18px;
  font-family: var(--vp-font-family-mono);
  font-size: 13.5px;
  line-height: 1.9;
  color: #d4d4d8;
}

.cv-line {
  opacity: 0;
  animation: cv-show 0.01s linear forwards;
  animation-delay: var(--d);
}

.cv-ps {
  color: #ef4444;
  margin-right: 6px;
}

.cv-out {
  color: #a1a1aa;
}

.cv-ok {
  color: #22c55e;
  margin-left: 6px;
}
.cv-ok:first-child {
  margin-left: 0;
}

.cv-type {
  display: inline-block;
  width: 0;
  overflow: hidden;
  vertical-align: bottom;
  white-space: nowrap;
  animation: cv-typing 0.6s steps(var(--n)) forwards;
  animation-delay: var(--d);
}

.cv-caret {
  display: inline-block;
  width: 8px;
  height: 1.05em;
  vertical-align: text-bottom;
  background: #d4d4d8;
  animation: cv-blink 1s steps(1) infinite;
}

@keyframes cv-typing {
  to {
    width: calc(var(--n) * 1ch);
  }
}
@keyframes cv-show {
  to {
    opacity: 1;
  }
}
@keyframes cv-blink {
  50% {
    opacity: 0;
  }
}
@keyframes cv-float {
  50% {
    transform: translateY(-6px) rotate(-4deg);
  }
}
@keyframes cv-breathe {
  to {
    opacity: 0.65;
    transform: scale(1.04);
  }
}
@keyframes cv-ping {
  70% {
    box-shadow: 0 0 0 8px rgba(239, 68, 68, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .cv-hero::after,
  .cv-book,
  .cv-dot,
  .cv-cursor,
  .cv-caret {
    animation: none;
  }
  .cv-line {
    opacity: 1;
    animation: none;
  }
  .cv-type {
    width: calc(var(--n) * 1ch);
    animation: none;
  }
}
</style>
