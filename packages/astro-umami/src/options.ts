/**
 * Tracker settings. These are the `data-*` attributes of the Umami script tag, as the camelCase keys the tracker
 * reads from `window.umamiConfig` when it is bundled instead of loaded from a tag.
 */
export interface UmamiOptions {
  /** Website id from the Umami dashboard. */
  websiteId: string;

  /**
   * Where events go. The tracker posts to `<hostUrl>/api/send`. `/` sends them to your own domain, where the
   * relay from `astro-umami init` forwards them to Umami.
   * @default "/"
   */
  hostUrl?: string;

  /**
   * Track pageviews and `data-umami-event` clicks automatically.
   * @default true
   */
  autoTrack?: boolean;

  /** Only track on these hostnames. Default is every hostname. */
  domains?: string[];

  /**
   * Leave the query string out of tracked URLs.
   * @default false
   */
  excludeSearch?: boolean;

  /**
   * Leave the hash out of tracked URLs.
   * @default false
   */
  excludeHash?: boolean;

  /**
   * Respect the browser's Do Not Track setting.
   * @default false
   */
  doNotTrack?: boolean;

  /** A tag sent with every event. */
  tag?: string;
}

export const DEFAULT_HOST_URL = "/";

const WEBSITE_ID_PATTERN = /^[\w-]{1,100}$/;
const BOOLEAN_KEYS = ["autoTrack", "excludeSearch", "excludeHash", "doNotTrack"] as const;

function fail(message: string): never {
  throw new Error(`[@sjohansson/astro-umami] ${message}`);
}

/**
 * Validates the options and returns the object the tracker reads from `window.umamiConfig`. Only keys that were
 * set are included, apart from `hostUrl`, which defaults to `/`.
 */
export function umamiConfig(options: UmamiOptions): Record<string, string | boolean | string[]> {
  if (typeof options?.websiteId !== "string" || !WEBSITE_ID_PATTERN.test(options.websiteId)) {
    fail("websiteId must be the website id from your Umami dashboard.");
  }
  const hostUrl = options.hostUrl ?? DEFAULT_HOST_URL;
  if (typeof hostUrl !== "string" || hostUrl.length === 0) fail("hostUrl must be a non-empty string.");

  const config: Record<string, string | boolean | string[]> = { websiteId: options.websiteId, hostUrl };

  for (const key of BOOLEAN_KEYS) {
    const value = options[key];
    if (value === undefined) continue;
    if (typeof value !== "boolean") fail(`${key} must be a boolean.`);
    config[key] = value;
  }
  if (options.domains !== undefined) {
    if (!Array.isArray(options.domains) || !options.domains.every((d) => typeof d === "string" && d.length > 0)) {
      fail("domains must be an array of hostnames.");
    }
    config["domains"] = options.domains;
  }
  if (options.tag !== undefined) {
    if (typeof options.tag !== "string" || !/^[\w.-]{1,50}$/.test(options.tag)) {
      fail("tag must be 1 to 50 letters, digits, '_', '.' or '-'.");
    }
    config["tag"] = options.tag;
  }
  return config;
}
