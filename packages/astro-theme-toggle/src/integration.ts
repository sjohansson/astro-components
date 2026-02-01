import type { AstroIntegration } from 'astro';

export interface ThemeToggleOptions {
  /**
   * Whether to inject the theme toggle component script globally
   * @default false
   */
  injectScript?: boolean;
}

/**
 * Astro integration for the Theme Toggle component.
 *
 * This integration provides an easy way to add dark/light theme switching
 * to your Astro site with automatic persistence via localStorage.
 *
 * @example
 * ```js
 * // astro.config.mjs
 * import themeToggle from '@sjohansson/astro-theme-toggle/integration';
 *
 * export default defineConfig({
 *   integrations: [themeToggle()],
 * });
 * ```
 */
export default function themeToggleIntegration(options: ThemeToggleOptions = {}): AstroIntegration {
  return {
    name: '@sjohansson/astro-theme-toggle',
    hooks: {
      'astro:config:setup': ({ logger, injectScript }) => {
        logger.info('Setting up Theme Toggle integration');

        // Optionally inject a global script for theme management
        if (options.injectScript) {
          injectScript(
            'head-inline',
            `
            // Theme initialization script
            (function() {
              const theme = localStorage.getItem('theme') || 
                (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
              document.documentElement.classList.toggle('dark', theme === 'dark');
            })();
            `
          );
        }
      },
      'astro:config:done': ({ config, logger }) => {
        logger.info('Theme Toggle integration configured');
        logger.debug(`Config base: ${config.base}`);
      },
    },
  };
}
