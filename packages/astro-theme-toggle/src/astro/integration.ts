import type { AstroIntegration } from "astro";
import { themeInitScript } from "../core/theme-init";

export interface ThemeToggleOptions {
  /**
   * Whether to inject the theme initialization script globally.
   * This prevents FOUC by applying the stored theme before first paint.
   * @default false
   */
  injectScript?: boolean;
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
          injectScript("head-inline", themeInitScript);
        }
      },
      "astro:config:done": ({ config, logger }) => {
        logger.info("Theme Toggle integration configured");
        logger.debug(`Config base: ${config.base}`);
      },
    },
  };
}
