import type { AstroIntegration } from "astro";

export interface VersionNoteOptions {
  /**
   * Default version to display if not specified per-component
   */
  defaultVersion?: string;

  /**
   * Default type/variant for version notes
   * @default 'info'
   */
  defaultType?: "info" | "warning" | "success" | "error";
}

/**
 * Astro integration for the Version Note component.
 *
 * This integration provides documentation version notes for Astro sites,
 * perfect for highlighting version-specific features or changes.
 *
 * Note: The default values configured in this integration are informational only.
 * Component props must be explicitly provided when using the VersionNote component.
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
    name: "@sjohansson/astro-version-note",
    hooks: {
      "astro:config:setup": ({ logger }) => {
        logger.info("Setting up Version Note integration");
        if (options.defaultVersion) {
          logger.debug(`Default version configured: ${options.defaultVersion}`);
        }
        if (options.defaultType) {
          logger.debug(`Default type configured: ${options.defaultType}`);
        }
      },
      "astro:config:done": ({ logger }) => {
        logger.info("Version Note integration configured");
      },
    },
  };
}
