import type { AstroIntegration } from "astro";
import { VERSION_NOTE_STYLES } from "./styles";

export interface VersionNoteOptions {
  /**
   * Bundle the default styles into every page at build time. Set to false to bring your own styles instead.
   * @default true
   */
  styles?: boolean;
}

export const STYLES_ID = "virtual:astro-version-note.css";
const RESOLVED_STYLES_ID = `\0${STYLES_ID}`;

/** The client script injected on every page. The styles are bundled or left out, never injected at runtime. */
export const CLIENT_SCRIPT = [
  'import { registerVersionNote } from "@sjohansson/astro-version-note";',
  "registerVersionNote({ injectStyles: false });",
].join("\n");

/**
 * Astro integration for `<version-note>`. Registers the element on every page and bundles its styles, so the panel
 * is styled (and collapsed) before any script runs.
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
export default function versionNoteIntegration(options: VersionNoteOptions = {}): AstroIntegration {
  const styles = options.styles ?? true;

  return {
    name: "@sjohansson/astro-version-note",
    hooks: {
      "astro:config:setup": ({ injectScript, updateConfig, logger }) => {
        if (styles) {
          updateConfig({
            vite: {
              plugins: [
                {
                  name: "astro-version-note-styles",
                  resolveId: (id: string) => (id === STYLES_ID ? RESOLVED_STYLES_ID : undefined),
                  load: (id: string) => (id === RESOLVED_STYLES_ID ? VERSION_NOTE_STYLES : undefined),
                },
              ],
            },
          });
          injectScript("page-ssr", `import "${STYLES_ID}";`);
        }
        injectScript("page", CLIENT_SCRIPT);
        logger.debug(`Version note registered${styles ? " with bundled styles" : " without styles"}`);
      },
    },
  };
}
