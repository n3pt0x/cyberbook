<script setup>
// Replaces VitePress's VPNavBarExtra (the "..." flyout, aliased in config.mts)
// to add the color theme picker. Everything else mirrors the upstream component.
import { useData } from "vitepress";
import { useLangs } from "vitepress/dist/client/theme-default/composables/langs.js";
import VPFlyout from "vitepress/dist/client/theme-default/components/VPFlyout.vue";
import VPMenuLink from "vitepress/dist/client/theme-default/components/VPMenuLink.vue";
import VPSocialLinks from "vitepress/dist/client/theme-default/components/VPSocialLinks.vue";
import VPSwitchAppearance from "vitepress/dist/client/theme-default/components/VPSwitchAppearance.vue";
import ColorThemePicker from "./ColorThemePicker.vue";

const { site, theme } = useData();
const { localeLinks, currentLang } = useLangs({ correspondingLink: true });
</script>

<template>
  <VPFlyout class="VPNavBarExtra" label="extra navigation">
    <div v-if="localeLinks.length && currentLang.label" class="group translations">
      <p class="trans-title">{{ currentLang.label }}</p>

      <template v-for="locale in localeLinks" :key="locale.link">
        <VPMenuLink
          :item="locale"
          :external="false"
          :lang="locale.lang"
          :hreflang="locale.lang"
          rel="alternate"
          :dir="locale.dir"
        />
      </template>
    </div>

    <div
      v-if="
        site.appearance &&
        site.appearance !== 'force-dark' &&
        site.appearance !== 'force-auto'
      "
      class="group appearance"
    >
      <div class="item appearance">
        <p class="label">
          {{ theme.darkModeSwitchLabel || "Appearance" }}
        </p>
        <div class="appearance-action">
          <VPSwitchAppearance />
        </div>
      </div>
    </div>

    <div class="group color-theme">
      <div class="item color-theme">
        <p class="label">Color theme</p>
        <ColorThemePicker />
      </div>
    </div>

    <div v-if="theme.socialLinks" class="group">
      <div class="item social-links">
        <VPSocialLinks class="social-links-list" :links="theme.socialLinks" />
      </div>
    </div>
  </VPFlyout>
</template>

<style scoped>
.VPNavBarExtra {
  display: none;
  margin-right: -12px;
}

@media (min-width: 768px) {
  .VPNavBarExtra {
    display: block;
  }
}

/* Unlike upstream, the flyout stays on wide screens for the color theme;
   the appearance switch is already in the navbar there */
@media (min-width: 1280px) {
  .VPNavBarExtra .group.appearance {
    display: none;
  }

  .VPNavBarExtra .group.appearance + .group.color-theme {
    border-top: 0;
    padding-top: 0;
  }
}

.trans-title {
  padding: 0 24px 0 12px;
  line-height: 32px;
  font-size: 14px;
  font-weight: 700;
  color: var(--vp-c-text-1);
}

.item.appearance,
.item.social-links {
  display: flex;
  align-items: center;
  padding: 0 12px;
}

.item.appearance {
  min-width: 176px;
}

.item.color-theme {
  padding: 0 4px;
}

.item.color-theme .label {
  padding: 0 8px;
}

.appearance-action {
  margin-right: -2px;
}

.social-links-list {
  margin: -4px -8px;
}
</style>
