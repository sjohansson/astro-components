/**
 * The relay forwards tracker events from your domain to Umami. It is written against the web standard Request
 * and Response, so it runs anywhere fetch does: an Astro endpoint, Cloudflare, Netlify, Vercel, or through the
 * `swaHandler` adapter, Azure Static Web Apps managed functions.
 *
 * It checks the website id so the endpoint only relays for your sites, puts the visitor's IP and user agent into
 * the payload (otherwise Umami would record the relay's own), caps the body size, and can validate custom events.
 */

/** Per property pattern that an event's data must match. Only the listed properties are forwarded. */
export type RelayRule = Record<string, RegExp | string>;

export interface RelayOptions {
  /** Website id, or ids when one relay serves several sites. Events for other ids are rejected. */
  websiteId: string | string[];

  /**
   * The Umami host. Events are posted to `<upstream>/api/send`. Self-hosted: `https://umami.example.com`.
   * @default "https://gateway.umami.is"
   */
  upstream?: string;

  /**
   * Largest request body accepted, in bytes.
   * @default 16384
   */
  maxBodyLength?: number;

  /**
   * Validation for custom events, by event name. An event with a rule is forwarded only if every listed property
   * is a string matching its pattern, and with only those properties. Events without a rule pass through as is.
   */
  events?: Record<string, RelayRule>;

  /** Called when Umami cannot be reached. */
  onError?: (error: unknown) => void;
}

/** Incoming request headers with lowercased names, as Node and most platforms give them. */
export type RelayHeaders = Record<string, string | string[] | undefined>;

export interface RelayForward {
  url: string;
  body: string;
  headers: Record<string, string>;
}

export interface RelayResult {
  status: number;
  contentType: string;
  body: string;
}

export interface Relay {
  /** Builds the upstream request, or null when the event is not for this relay or not valid. */
  forward(rawBody: unknown, headers: RelayHeaders, clientIp?: string): RelayForward | null;
  /** Sends a forward to Umami. Throws when Umami cannot be reached. */
  send(forward: RelayForward): Promise<RelayResult>;
  /** Handles a web standard request end to end. Pass the visitor IP when the platform gives it to you. */
  handle(request: Request, context?: { clientIp?: string }): Promise<Response>;
}

export const DEFAULT_UPSTREAM = "https://gateway.umami.is";
export const DEFAULT_MAX_BODY_LENGTH = 16 * 1024;

const FORWARDED_HEADERS = ["x-umami-cache", "x-umami-website-id", "x-umami-hostname"];
// Platform headers that carry the visitor IP, most specific first. x-forwarded-for is last because proxies append
// to it and some let the client seed it.
const IP_HEADERS = [
  "x-azure-clientip",
  "x-client-ip",
  "cf-connecting-ip",
  "x-nf-client-connection-ip",
  "x-real-ip",
  "x-forwarded-for",
];

function header(headers: RelayHeaders, name: string): string | undefined {
  const value = headers[name];
  return Array.isArray(value) ? value[0] : value;
}

/** Visitor IP from platform headers, without any port. Undefined when no header carries one. */
export function clientIp(headers: RelayHeaders): string | undefined {
  for (const name of IP_HEADERS) {
    const raw = header(headers, name)?.split(",")[0]?.trim();
    if (!raw) continue;
    const bracketed = raw.match(/^\[(.+)\]:\d+$/);
    if (bracketed) return bracketed[1];
    const ipv4WithPort = raw.match(/^(\d{1,3}(?:\.\d{1,3}){3}):\d+$/);
    return ipv4WithPort ? ipv4WithPort[1] : raw;
  }
  return undefined;
}

function compileRules(events: Record<string, RelayRule> = {}): Map<string, [string, RegExp][]> {
  const compiled = new Map<string, [string, RegExp][]>();
  for (const [name, rule] of Object.entries(events)) {
    const entries = Object.entries(rule).map(([property, pattern]): [string, RegExp] => [
      property,
      pattern instanceof RegExp ? pattern : new RegExp(pattern),
    ]);
    if (entries.length === 0)
      throw new Error(`[@sjohansson/astro-umami] Rule for event "${name}" lists no properties.`);
    compiled.set(name, entries);
  }
  return compiled;
}

/** Applies the rule for an event. Returns the data to forward, or null when the event is not valid. */
function applyRule(rules: [string, RegExp][], data: unknown): Record<string, string> | null {
  const source = data && typeof data === "object" ? (data as Record<string, unknown>) : {};
  const kept: Record<string, string> = {};
  for (const [property, pattern] of rules) {
    const value = source[property];
    if (typeof value !== "string" || !pattern.test(value)) return null;
    kept[property] = value;
  }
  return kept;
}

function headersToRecord(headers: Headers): RelayHeaders {
  const record: RelayHeaders = {};
  headers.forEach((value, name) => {
    record[name.toLowerCase()] = value;
  });
  return record;
}

export function createRelay(options: RelayOptions): Relay {
  const websiteIds = new Set(Array.isArray(options.websiteId) ? options.websiteId : [options.websiteId]);
  if (websiteIds.size === 0 || [...websiteIds].some((id) => typeof id !== "string" || id.length === 0)) {
    throw new Error("[@sjohansson/astro-umami] websiteId is required.");
  }
  const upstream = `${(options.upstream ?? DEFAULT_UPSTREAM).replace(/\/$/, "")}/api/send`;
  const maxBodyLength = options.maxBodyLength ?? DEFAULT_MAX_BODY_LENGTH;
  const rules = compileRules(options.events);

  const relay: Relay = {
    forward(rawBody, headers, ip) {
      if (typeof rawBody !== "string" || rawBody.length === 0 || rawBody.length > maxBodyLength) return null;

      let data: { type?: unknown; payload?: Record<string, unknown> };
      try {
        data = JSON.parse(rawBody);
      } catch {
        return null;
      }
      const payload = data?.payload;
      if (!payload || typeof payload !== "object" || typeof payload["website"] !== "string") return null;
      if (!websiteIds.has(payload["website"])) return null;

      const name = payload["name"];
      if (typeof name === "string" && rules.has(name)) {
        const kept = applyRule(rules.get(name) ?? [], payload["data"]);
        if (!kept) return null;
        payload["data"] = kept;
      }

      // Never trust an ip sent by the browser.
      delete payload["ip"];
      const visitorIp = ip ?? clientIp(headers);
      if (visitorIp) payload["ip"] = visitorIp;

      const userAgent = header(headers, "user-agent");
      if (userAgent) payload["userAgent"] = userAgent;

      const forwardHeaders: Record<string, string> = { "content-type": "application/json" };
      if (userAgent) forwardHeaders["user-agent"] = userAgent;
      for (const headerName of FORWARDED_HEADERS) {
        const value = header(headers, headerName);
        if (value) forwardHeaders[headerName] = value;
      }

      return { url: upstream, body: JSON.stringify(data), headers: forwardHeaders };
    },

    async send(forward) {
      const res = await fetch(forward.url, { method: "POST", headers: forward.headers, body: forward.body });
      return {
        status: res.status,
        contentType: res.headers.get("content-type") ?? "application/json",
        body: await res.text(),
      };
    },

    async handle(request, context = {}) {
      if (request.method !== "POST") return new Response(null, { status: 405, headers: { allow: "POST" } });
      const length = Number(request.headers.get("content-length"));
      if (length > maxBodyLength) return new Response(null, { status: 413 });

      const forward = relay.forward(await request.text(), headersToRecord(request.headers), context.clientIp);
      if (!forward) return new Response(null, { status: 400 });

      try {
        const result = await relay.send(forward);
        return new Response(result.body, {
          status: result.status,
          headers: { "content-type": result.contentType, "cache-control": "no-store" },
        });
      } catch (error) {
        options.onError?.(error);
        return new Response(null, { status: 502 });
      }
    },
  };
  return relay;
}

/** The subset of the Azure Functions v3 context the adapter uses. */
export interface SwaContext {
  log: { warn(message: string): void };
  res?: { status: number; headers?: Record<string, string>; body?: string };
}

export interface SwaRequest {
  rawBody?: unknown;
  headers?: RelayHeaders;
}

/**
 * Adapter for Azure Static Web Apps managed functions (Node, `function.json` model). `astro-umami init` writes a
 * function that uses this.
 */
export function swaHandler(relay: Relay): (context: SwaContext, req: SwaRequest) => Promise<void> {
  return async (context, req) => {
    const forward = relay.forward(req.rawBody, req.headers ?? {});
    if (!forward) {
      context.res = { status: 400 };
      return;
    }
    try {
      const result = await relay.send(forward);
      context.res = {
        status: result.status,
        headers: { "content-type": result.contentType, "cache-control": "no-store" },
        body: result.body,
      };
    } catch (error) {
      context.log.warn(`Umami forward failed: ${error}`);
      context.res = { status: 502 };
    }
  };
}
