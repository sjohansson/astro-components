import type { AstroIntegration } from "astro";
import { generateThemeInitScript, themeInitScript } from "../core/theme-init";

export interface ThemeToggleOptions {
  /**
   * Whether to inject the theme initialization script globally.
   * This prevents FOUC by applying the stored theme before first paint.
   * @default false
   */
  injectScript?: boolean;
  /**
   * Apply mode the injected FOUC script should support. When 'attribute' or
   * 'both', the script also replays the persisted theme data attribute(s)
   * before paint.
   * @default 'inline'
   */
  applyMode?: "inline" | "attribute" | "both";
  /**
   * Base data attribute name used by your components (must match the
   * component's `attributeName`). Only relevant when `applyMode` is
   * 'attribute' or 'both'.
   * @default 'data-theme'
   */
  attributeName?: string;
  /**
   * Whether the injected script sets companion attributes (`-family`/`-scheme`/
   * `-category`) on a first visit, before any preference is persisted.
   * @default true
   */
  attributeCompanions?: boolean;
}

/**
 * Astro integration for the Theme Toggle component.
 *
 * @example
 * ```js
 * // astro.config.mjs
 * import themeToggle from '@sjohansson/astro-theme-toggle/astro/integration';
 *
 * export default defineConfig({
 *   integrations: [themeToggle({ injectScript: true })],
 * });
 * ```
 */
export default function themeToggleIntegration(options: ThemeToggleOptions = {}): AstroIntegration {
  return {
    name: "@sjohansson/astro-theme-toggle",
    hooks: {
      "astro:config:setup": ({ logger, injectScript }) => {
        logger.info("Setting up Theme Toggle integration");

        if (options.injectScript) {
          const applyAttribute = options.applyMode === "attribute" || options.applyMode === "both";
          const script = applyAttribute
            ? generateThemeInitScript({
                applyAttribute: true,
                attributeName: options.attributeName ?? "data-theme",
                companions: options.attributeCompanions !== false,
              })
            : themeInitScript;
          injectScript("head-inline", script);
        }
      },
      "astro:config:done": ({ config, logger }) => {
        logger.info("Theme Toggle integration configured");
        logger.debug(`Config base: ${config.base}`);
      },
    },
  };
}
