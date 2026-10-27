import { onMounted, ref } from "vue";

// Must match the inline script in config.mts, which restores the saved theme
// in <head> before first paint so it never flashes the default one
const STORAGE_KEY = "cyberbook-theme";

const DEFAULT_THEME = "cyberbook";

// Swatches are [background, brand, accent] in dark mode, for the picker preview
export const themes = [
  { id: "cyberbook", label: "CyberBook", swatches: ["#0e1016", "#818cf8", "#38bdf8"] },
  { id: "nord", label: "Nord", swatches: ["#2e3440", "#88c0d0", "#bf616a"] },
  { id: "dracula", label: "Dracula", swatches: ["#282a36", "#bd93f9", "#ff79c6"] },
  { id: "catppuccin", label: "Catppuccin", swatches: ["#1e1e2e", "#cba6f7", "#f38ba8"] },
  { id: "gruvbox", label: "Gruvbox", swatches: ["#282828", "#fabd2f", "#fb4934"] },
  { id: "terminal", label: "Terminal", swatches: ["#050a06", "#3ef07c", "#1c4426"] },
];

// Shared by every picker (navbar flyout and mobile nav screen)
const current = ref(DEFAULT_THEME);

export function useColorTheme() {
  // Read on mount, not during setup, so SSR and hydration render the same markup
  onMounted(() => {
    current.value = document.documentElement.dataset.theme || DEFAULT_THEME;
  });

  function setTheme(id) {
    current.value = id;
    const root = document.documentElement;
    if (id === DEFAULT_THEME) delete root.dataset.theme;
    else root.dataset.theme = id;
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // storage unavailable (private mode...): the theme only lasts for this visit
    }
  }

  return { current, setTheme };
}
