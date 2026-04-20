// Web Components

export {
  applyThemeColors,
  defaultThemes,
  filterThemesByPreset,
  generateThemeCSS,
  getFamilyIds,
  groupByFamily,
  resolveCategories,
  resolveVariant,
} from "../theme-config";
export { allBundledThemes } from "../themes/index";
// Bundled theme families
export { kawaiiThemes } from "../themes/kawaii";
export { lessIsMoreThemes } from "../themes/less-is-more";
export { seventiesThemes } from "../themes/seventies";
// Re-export types and config so core consumers don't need a separate import
export type {
  ThemeCategory,
  ThemeColors,
  ThemeConfig,
  ThemeControllerProps,
  ThemeFamily,
  ThemeIcon,
  ThemePreset,
  ThemeScheme,
} from "../types";
export {
  registerThemeController,
  ThemeControllerElement,
} from "./theme-controller";
// FOUC prevention
export { initTheme, themeInitScript } from "./theme-init";
export { registerThemePreview, ThemePreviewElement } from "./theme-preview";
export { registerThemeToggle, ThemeToggleElement } from "./theme-toggle";

import { registerThemeController } from "./theme-controller";
import { registerThemePreview } from "./theme-preview";
import { registerThemeToggle } from "./theme-toggle";

/**
 * Register all Web Components at once.
 * Call this once in your app entry point.
 *
 * @example
 * ```ts
 * import { registerAll } from '@sjohansson/astro-theme-toggle/core';
 * registerAll();
 * ```
 */
export function registerAll(): void {
  registerThemeToggle();
  registerThemeController();
  registerThemePreview();
}
