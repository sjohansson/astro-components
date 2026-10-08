import type { AstroIntegration } from "astro";
import type { BuiltInTransport } from "./transport";
import { DEFAULT_EVENT_NAME } from "./wire";

export interface VotesOptions {
  /**
   * Where votes are sent. `none` sends nothing; listen for `vote-change` and
   * call `configureVotes()` yourself for any other provider.
   * @default "umami"
   */
  transport?: BuiltInTransport;

  /**
   * Analytics event name. Must match `--event` for `astro-votes-sync`.
   * @default "vote"
   */
  eventName?: string;
}

/** The client script injected on every page. Exported for tests. */
export function clientScript(options: VotesOptions = {}): string {
  const transport = options.transport ?? "umami";
  const eventName = options.eventName ?? DEFAULT_EVENT_NAME;
  return [
    'import { configureVotes, registerVoteButtons } from "@sjohansson/astro-votes";',
    `configureVotes({ transport: ${JSON.stringify(transport)}, eventName: ${JSON.stringify(eventName)} });`,
    "registerVoteButtons();",
  ].join("\n");
}

/**
 * Astro integration for `<vote-buttons>`. Registers the element on every page
 * and sets the transport, so pages need no script of their own.
 *
 * @example
 * ```js
 * // astro.config.mjs
 * import votes from "@sjohansson/astro-votes/integration";
 *
 * export default defineConfig({
 *   integrations: [votes({ transport: "umami" })],
 * });
 * ```
 */
export default function votesIntegration(options: VotesOptions = {}): AstroIntegration {
  const transport = options.transport ?? "umami";
  if (transport !== "umami" && transport !== "none") {
    throw new Error(`[@sjohansson/astro-votes] Unknown transport "${String(transport)}". Use "umami" or "none".`);
  }
  if (options.eventName !== undefined && !/^[\w.-]{1,50}$/.test(options.eventName)) {
    throw new Error("[@sjohansson/astro-votes] eventName must be 1 to 50 letters, digits, '_', '.' or '-'.");
  }

  return {
    name: "@sjohansson/astro-votes",
    hooks: {
      "astro:config:setup": ({ injectScript, logger }) => {
        injectScript("page", clientScript(options));
        logger.debug(`Vote buttons registered with the ${transport} transport`);
      },
    },
  };
}
