// Astro wrapper components

// Re-export everything from core so Astro consumers get full API
export {
  allBundledThemes,
  applyThemeColors,
  clearThemeColors,
  defaultThemes,
  filterThemesByPreset,
  generateThemeCSS,
  generateThemeInitScript,
  generateThemeStylesheet,
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
  type ThemeInitScriptOptions,
  ThemePreviewElement,
  ThemeToggleElement,
  themeInitScript,
} from "../core/index";
// Re-export types
// Deprecated aliases
export type {
  ColorToken,
  ThemeApplyMode,
  ThemeCategory,
  ThemeColors,
  ThemeConfig,
  ThemeControllerProps,
  ThemeFamily,
  ThemeIcon,
  ThemeMode,
  ThemePreset,
  ThemeScheme,
  ToggleApplyMode,
} from "../types";
