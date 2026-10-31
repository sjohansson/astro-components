/**
 * Browser side. Starts the official Plausible tracker (the `@plausible-analytics/tracker` package, bundled into the
 * site) pointed at the relay on your own domain.
 */
import { init, type PlausibleConfig, track } from "@plausible-analytics/tracker";
import { type PlausibleOptions, plausibleConfig } from "./options";

export type { CustomProperties, PlausibleEventOptions, PlausibleRequestPayload } from "@plausible-analytics/tracker";
export { track };

export interface PlausibleClientOptions extends Omit<PlausibleOptions, "customProperties"> {
  /** Custom properties for every event, or a function of the event name that returns them. */
  customProperties?: PlausibleConfig["customProperties"];
  /** Change or drop a request before it is sent. Return null to drop it. */
  transformRequest?: PlausibleConfig["transformRequest"];
}

let started = false;

/**
 * Starts the tracker. The first call wins; later calls do nothing, so it is safe in a script that runs on every
 * page. The tracker itself allows a single `init()`.
 */
export function startPlausible(options: PlausibleClientOptions): void {
  if (started || typeof window === "undefined") return;
  started = true;

  const { customProperties, transformRequest, ...rest } = options;
  const config = plausibleConfig(
    typeof customProperties === "function" || customProperties === undefined ? rest : { ...rest, customProperties },
  );
  if (typeof customProperties === "function") config.customProperties = customProperties;
  if (transformRequest) config.transformRequest = transformRequest;
  init(config);
}
