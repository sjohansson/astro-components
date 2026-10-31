import type { PlausibleConfig } from "@plausible-analytics/tracker";

/** Tracker settings that can be written down as JSON. These go straight to the tracker's `init()`. */
export interface PlausibleOptions {
  /** Your site's domain, as entered in Plausible. */
  domain: string;

  /**
   * Where events go. `/api/event` is the relay from `astro-plausible init` on your own domain. Set the full
   * Plausible URL, `https://plausible.io/api/event`, to skip the relay.
   * @default "/api/event"
   */
  endpoint?: string;

  /**
   * Send a pageview on load and on history navigation.
   * @default true
   */
  autoCapturePageviews?: boolean;

  /**
   * Track `#` paths as separate pages.
   * @default false
   */
  hashBasedRouting?: boolean;

  /**
   * Track clicks on links to other sites.
   * @default false
   */
  outboundLinks?: boolean;

  /**
   * Track file downloads, with Plausible's default file types or the ones given.
   * @default false
   */
  fileDownloads?: boolean | { fileExtensions: string[] };

  /**
   * Track form submissions.
   * @default false
   */
  formSubmissions?: boolean;

  /**
   * Also track on localhost.
   * @default false
   */
  captureOnLocalhost?: boolean;

  /**
   * Log ignored events to the console.
   * @default true
   */
  logging?: boolean;

  /** Custom properties added to every event. */
  customProperties?: Record<string, string | number | boolean>;

  /**
   * Expose the tracker as `window.plausible`. Plausible's installation check looks for it.
   * @default true
   */
  bindToWindow?: boolean;
}

export const DEFAULT_ENDPOINT = "/api/event";

const DOMAIN_PATTERN = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*(\/[\w.-]+)*$/i;
const BOOLEAN_KEYS = [
  "autoCapturePageviews",
  "hashBasedRouting",
  "outboundLinks",
  "formSubmissions",
  "captureOnLocalhost",
  "logging",
  "bindToWindow",
] as const;

function fail(message: string): never {
  throw new Error(`[@sjohansson/astro-plausible] ${message}`);
}

/** Validates the options and returns the config for the tracker's `init()`. Only keys that were set are included. */
export function plausibleConfig(options: PlausibleOptions): PlausibleConfig {
  if (typeof options?.domain !== "string" || options.domain.length > 253 || !DOMAIN_PATTERN.test(options.domain)) {
    fail("domain must be the site domain as entered in Plausible, like example.com.");
  }
  const endpoint = options.endpoint ?? DEFAULT_ENDPOINT;
  if (typeof endpoint !== "string" || endpoint.length === 0) fail("endpoint must be a non-empty string.");

  const config: PlausibleConfig = { domain: options.domain, endpoint };

  for (const key of BOOLEAN_KEYS) {
    const value = options[key];
    if (value === undefined) continue;
    if (typeof value !== "boolean") fail(`${key} must be a boolean.`);
    config[key] = value;
  }
  if (options.fileDownloads !== undefined) {
    const value = options.fileDownloads;
    const custom = typeof value === "object" && value !== null && Array.isArray(value.fileExtensions);
    if (typeof value !== "boolean" && !custom) fail("fileDownloads must be a boolean or { fileExtensions: [...] }.");
    config.fileDownloads = value;
  }
  if (options.customProperties !== undefined) {
    const value = options.customProperties;
    const plain =
      typeof value === "object" &&
      value !== null &&
      !Array.isArray(value) &&
      Object.values(value).every((v) => ["string", "number", "boolean"].includes(typeof v));
    if (!plain) fail("customProperties must be an object of strings, numbers and booleans.");
    config.customProperties = value;
  }
  return config;
}
