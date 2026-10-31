import type { AstroIntegration } from "astro";
import { type UmamiOptions, umamiConfig } from "./options";

export interface UmamiIntegrationOptions extends UmamiOptions {
  /**
   * Whether to add the tracker to pages. Default is to add it for `astro build` and leave it out of `astro dev`,
   * so local browsing does not show up in the dashboard. Set `true` to track in dev too.
   */
  enabled?: boolean;
}

/** The client script injected on every page. Exported for tests. */
export function clientScript(options: UmamiOptions): string {
  return [
    'import { startUmami } from "@sjohansson/astro-umami/client";',
    `startUmami(${JSON.stringify(umamiConfig(options))});`,
  ].join("\n");
}

/**
 * Astro integration. Bundles the Umami tracker into every page and points it at `hostUrl`, which defaults to the
 * site itself. Pair it with the relay from `astro-umami init` so events reach Umami from your own domain.
 *
 * @example
 * ```js
 * // astro.config.mjs
 * import umami from "@sjohansson/astro-umami/integration";
 *
 * export default defineConfig({
 *   integrations: [umami({ websiteId: "930ef364-ec51-4ca5-b5af-2b09ca6a0a21" })],
 * });
 * ```
 */
export default function umamiIntegration(options: UmamiIntegrationOptions): AstroIntegration {
  const { enabled, ...tracker } = options ?? {};
  if (enabled !== undefined && typeof enabled !== "boolean") {
    throw new Error("[@sjohansson/astro-umami] enabled must be a boolean.");
  }
  // Validate now so a bad config fails at startup, not on the first page.
  umamiConfig(tracker);

  return {
    name: "@sjohansson/astro-umami",
    hooks: {
      "astro:config:setup": ({ command, injectScript, logger }) => {
        const on = enabled ?? command === "build";
        if (!on) {
          logger.info(`Umami tracker left out of this ${command}. Set enabled: true to include it.`);
          return;
        }
        injectScript("page", clientScript(tracker));
        logger.debug(`Umami tracker added, sending to ${tracker.hostUrl ?? "/"}`);
      },
    },
  };
}
