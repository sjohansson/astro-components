import type { AstroIntegration } from "astro";
import { type PlausibleOptions, plausibleConfig } from "./options";

export interface PlausibleIntegrationOptions extends PlausibleOptions {
  /**
   * Whether to add the tracker to pages. Default is to add it for `astro build` and leave it out of `astro dev`,
   * so local browsing does not show up in the dashboard. Set `true` to track in dev too (with
   * `captureOnLocalhost: true`, or the tracker ignores localhost anyway).
   */
  enabled?: boolean;
}

/** The client script injected on every page. Exported for tests. */
export function clientScript(options: PlausibleOptions): string {
  return [
    'import { startPlausible } from "@sjohansson/astro-plausible/client";',
    `startPlausible(${JSON.stringify(plausibleConfig(options))});`,
  ].join("\n");
}

/**
 * Astro integration. Bundles the Plausible tracker into every page and points it at `endpoint`, which defaults to
 * `/api/event` on the site itself. Pair it with the relay from `astro-plausible init` so events reach Plausible
 * from your own domain.
 *
 * @example
 * ```js
 * // astro.config.mjs
 * import plausible from "@sjohansson/astro-plausible/integration";
 *
 * export default defineConfig({
 *   integrations: [plausible({ domain: "example.com" })],
 * });
 * ```
 */
export default function plausibleIntegration(options: PlausibleIntegrationOptions): AstroIntegration {
  const { enabled, ...tracker } = options ?? {};
  if (enabled !== undefined && typeof enabled !== "boolean") {
    throw new Error("[@sjohansson/astro-plausible] enabled must be a boolean.");
  }
  // Validate now so a bad config fails at startup, not on the first page.
  plausibleConfig(tracker);

  return {
    name: "@sjohansson/astro-plausible",
    hooks: {
      "astro:config:setup": ({ command, injectScript, logger }) => {
        const on = enabled ?? command === "build";
        if (!on) {
          logger.info(`Plausible tracker left out of this ${command}. Set enabled: true to include it.`);
          return;
        }
        injectScript("page", clientScript(tracker));
        logger.debug(`Plausible tracker added, sending to ${tracker.endpoint ?? "/api/event"}`);
      },
    },
  };
}
