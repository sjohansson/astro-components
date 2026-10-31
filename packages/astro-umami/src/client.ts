/**
 * Browser side. Starts the vendored Umami tracker with config from a function call instead of script tag
 * attributes, so the tracker ships inside the site's own bundle.
 */
import runTracker from "../vendor/umami.js?fn";
import { type UmamiOptions, umamiConfig } from "./options";

/** Umami's `beforeSend` hook. Return the payload to send, or a falsy value to drop the event. */
export type UmamiBeforeSend = (
  type: string,
  payload: Record<string, unknown>,
) => Record<string, unknown> | null | undefined | Promise<Record<string, unknown> | null | undefined>;

export interface UmamiClientOptions extends UmamiOptions {
  /** Called before each event is sent. */
  beforeSend?: UmamiBeforeSend;
}

/** The `window.umami` object the tracker creates. */
export interface Umami {
  track: (...args: unknown[]) => Promise<unknown>;
  identify: (...args: unknown[]) => Promise<unknown>;
}

type UmamiWindow = Window & { umami?: Umami; umamiConfig?: Record<string, unknown> };

let started = false;

/**
 * Starts the tracker. The first call wins; later calls do nothing, so it is safe in a script that runs on every
 * page. Anything already on `window.umamiConfig` is kept, so a page can set `beforeSend` itself before this runs.
 */
export function startUmami(options: UmamiClientOptions): void {
  if (started || typeof window === "undefined") return;
  started = true;

  const { beforeSend, ...tracker } = options;
  const w = window as UmamiWindow;
  w.umamiConfig = { ...umamiConfig(tracker), ...(beforeSend ? { beforeSend } : {}), ...w.umamiConfig };
  runTracker();
}

/** The tracker, once `startUmami` has run. Undefined before that and on the server. */
export function getUmami(): Umami | undefined {
  return typeof window === "undefined" ? undefined : (window as UmamiWindow).umami;
}
