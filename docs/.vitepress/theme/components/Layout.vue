<script setup>
import DefaultTheme from "vitepress/theme";
import { onMounted } from "vue";
import { useRouter } from "vitepress";
import mediumZoom from "medium-zoom";
import ColorThemePicker from "./ColorThemePicker.vue";

const { Layout } = DefaultTheme;
const router = useRouter();

// Setup medium zoom with the desired options
const setupMediumZoom = () => {
  mediumZoom("[data-zoomable]", {
    background: "transparent",
  });
};

// Apply medium zoom on load
onMounted(setupMediumZoom);

// Subscribe to route changes to re-apply medium zoom effect
router.onAfterRouteChange = setupMediumZoom;
</script>

<template>
  <Layout>
    <!-- mobile menu counterpart of the color theme picker in NavBarExtra -->
    <template #nav-screen-content-after>
      <div class="nav-screen-color-theme">
        <p class="text">Color theme</p>
        <ColorThemePicker />
      </div>
    </template>
  </Layout>
</template>

<style>
.medium-zoom-overlay {
  backdrop-filter: blur(5rem);
}

.medium-zoom-overlay,
.medium-zoom-image--opened {
  z-index: 999;
}

/* mirrors VPNavScreenAppearance */
.nav-screen-color-theme {
  margin-top: 16px;
  border-radius: 8px;
  padding: 12px 8px 8px;
  background-color: var(--vp-c-bg-soft);
}

.nav-screen-color-theme .text {
  margin: 0 0 4px;
  padding: 0 8px;
  line-height: 24px;
  font-size: 12px;
  font-weight: 500;
  color: var(--vp-c-text-2);
}
</style>
