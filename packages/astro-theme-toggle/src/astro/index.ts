// Astro wrapper components

// Re-export everything from core so Astro consumers get full API
export {
  allBundledThemes,
  applyThemeColors,
  defaultThemes,
  filterThemesByPreset,
  generateThemeCSS,
  getFamilyIds,
  groupByFamily,
  initTheme,
  kawaiiThemes,
  lessIsMoreThemes,
  registerAll,
  registerThemeController,
  registerThemePreview,
  registerThemeToggle,
  resolveCategories,
  resolveVariant,
  seventiesThemes,
  ThemeControllerElement,
  ThemePreviewElement,
  ThemeToggleElement,
  themeInitScript,
} from "../core/index";
// Re-export types
// Deprecated aliases
export type {
  ColorToken,
  ThemeCategory,
  ThemeColors,
  ThemeConfig,
  ThemeControllerProps,
  ThemeFamily,
  ThemeIcon,
  ThemeMode,
  ThemePreset,
  ThemeScheme,
} from "../types";
