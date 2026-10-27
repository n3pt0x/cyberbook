<script setup>
import { themes, useColorTheme } from "../themes.js";

const { current, setTheme } = useColorTheme();
</script>

<template>
  <ul class="ColorThemePicker">
    <li v-for="t in themes" :key="t.id">
      <button
        type="button"
        class="option"
        :class="{ active: current === t.id }"
        :aria-pressed="current === t.id"
        @click="setTheme(t.id)"
      >
        <span class="preview" :style="{ background: t.swatches[0] }" aria-hidden="true">
          <i :style="{ background: t.swatches[1] }" />
          <i :style="{ background: t.swatches[2] }" />
        </span>
        <span class="name">{{ t.label }}</span>
        <svg class="check" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      </button>
    </li>
  </ul>
</template>

<style scoped>
.ColorThemePicker {
  margin: 0;
  padding: 0;
  list-style: none;
}

.option {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 0 8px;
  border-radius: 6px;
  line-height: 32px;
  font-size: 14px;
  font-weight: 500;
  text-align: left;
  color: var(--vp-c-text-1);
  transition:
    background-color 0.25s,
    color 0.25s;
}

.option:hover {
  background-color: var(--vp-c-default-soft);
}

.option.active {
  color: var(--vp-c-brand-1);
}

/* fixed dark-mode colors, so every theme previews the same way */
.preview {
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 0 5px;
  height: 16px;
  border-radius: 4px;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.12);
}

.preview i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.name {
  flex-grow: 1;
}

.check {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.5;
  stroke-linecap: round;
  stroke-linejoin: round;
  opacity: 0;
}

.option.active .check {
  opacity: 1;
}
</style>
