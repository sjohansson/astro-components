import type { AstroIntegration } from "astro";

/** The client script injected on every page. Exported for tests. */
export const CLIENT_SCRIPT = [
  'import { registerVersionNote } from "@sjohansson/astro-version-note";',
  "registerVersionNote();",
].join("\n");

/**
 * Astro integration for `<version-note>`. Registers the element on every page,
 * so pages need no script of their own.
 *
 * @example
 * ```js
 * // astro.config.mjs
 * import versionNote from "@sjohansson/astro-version-note/integration";
 *
 * export default defineConfig({
 *   integrations: [versionNote()],
 * });
 * ```
 */
export default function versionNoteIntegration(): AstroIntegration {
  return {
    name: "@sjohansson/astro-version-note",
    hooks: {
      "astro:config:setup": ({ injectScript, logger }) => {
        injectScript("page", CLIENT_SCRIPT);
        logger.debug("Version note registered");
      },
    },
  };
}
