/**
 * Transports send vote ops to an analytics provider. The element calls the
 * configured transport once per op. A transport must never throw into the UI;
 * the element guards the call anyway.
 */
import { DEFAULT_EVENT_NAME, DEFAULT_PROPERTY_NAME, type VoteOp } from "./wire";

export interface VoteSend {
  item: string;
  op: VoteOp;
  /** The wire value, `<item>:<op>`. */
  value: string;
  eventName: string;
}

export type VoteTransport = (send: VoteSend) => void;

export type BuiltInTransport = "umami" | "none";

interface UmamiLike {
  track: (eventName: string, data: Record<string, string>) => unknown;
}

/** Sends through the Umami tracker. Does nothing when the tracker is missing or blocked. */
export const umamiTransport: VoteTransport = ({ eventName, value }) => {
  const umami = (globalThis as { umami?: UmamiLike }).umami;
  umami?.track?.(eventName, { [DEFAULT_PROPERTY_NAME]: value });
};

/** Sends nothing. Listen for the `vote-change` event to handle votes yourself. */
export const noTransport: VoteTransport = () => {};

export interface VoteConfig {
  transport: VoteTransport;
  eventName: string;
}

const config: VoteConfig = { transport: umamiTransport, eventName: DEFAULT_EVENT_NAME };

export interface ConfigureVotesOptions {
  transport?: VoteTransport | BuiltInTransport;
  eventName?: string;
}

/** Sets the page-wide transport and event name. Elements can still override the event name. */
export function configureVotes(options: ConfigureVotesOptions): void {
  const { transport, eventName } = options;
  if (transport === "umami") config.transport = umamiTransport;
  else if (transport === "none") config.transport = noTransport;
  else if (typeof transport === "function") config.transport = transport;
  if (eventName) config.eventName = eventName;
}

export function getVoteConfig(): Readonly<VoteConfig> {
  return config;
}
