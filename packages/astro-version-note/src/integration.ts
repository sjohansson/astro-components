import type { AstroIntegration } from 'astro';

export interface VersionNoteOptions {
  /**
   * Default version to display if not specified per-component
   */
  defaultVersion?: string;

  /**
   * Default type/variant for version notes
   * @default 'info'
   */
  defaultType?: 'info' | 'warning' | 'success' | 'error';
}

/**
 * Astro integration for the Version Note component.
 *
 * This integration provides documentation version notes for Astro sites,
 * perfect for highlighting version-specific features or changes.
 *
 * @example
 * ```js
 * // astro.config.mjs
 * import versionNote from '@sjohansson/astro-version-note/integration';
 *
 * export default defineConfig({
 *   integrations: [
 *     versionNote({
 *       defaultVersion: 'v1.0.0',
 *       defaultType: 'info'
 *     })
 *   ],
 * });
 * ```
 */
export default function versionNoteIntegration(options: VersionNoteOptions = {}): AstroIntegration {
  return {
    name: '@sjohansson/astro-version-note',
    hooks: {
      'astro:config:setup': ({ logger, updateConfig }) => {
        logger.info('Setting up Version Note integration');

        // Store integration options in Astro's public config for runtime access
        updateConfig({
          vite: {
            define: {
              __ASTRO_VERSION_NOTE_CONFIG__: JSON.stringify({
                defaultVersion: options.defaultVersion,
                defaultType: options.defaultType || 'info',
              }),
            },
          },
        });
      },
      'astro:config:done': ({ logger }) => {
        logger.info('Version Note integration configured');
        if (options.defaultVersion) {
          logger.debug(`Default version: ${options.defaultVersion}`);
        }
      },
    },
  };
}
