/**
 * The relay forwards tracker events from your domain to Plausible. It is written against the web standard Request
 * and Response, so it runs anywhere fetch does: an Astro endpoint, Cloudflare, Netlify, Vercel, or through the
 * `swaHandler` adapter, Azure Static Web Apps managed functions.
 *
 * It checks the domain so the endpoint only relays for your sites, passes the visitor's IP in `X-Forwarded-For`
 * and their user agent (Plausible drops events without a real visitor IP), caps the body size, and can validate
 * custom events.
 */

/** Per property pattern that an event's props must match. Only the listed properties are forwarded. */
export type RelayRule = Record<string, RegExp | string>;

export interface RelayOptions {
  /** Site domain as entered in Plausible, or several when one relay serves several sites. */
  domain: string | string[];

  /**
   * The Plausible host. Events are posted to `<upstream>/api/event`. Self-hosted: `https://plausible.example.com`.
   * @default "https://plausible.io"
   */
  upstream?: string;

  /**
   * Largest request body accepted, in bytes.
   * @default 16384
   */
  maxBodyLength?: number;

  /**
   * Headers to read the visitor IP from, in order, when `handle` or `forward` is not given one. A client can send
   * any header, so list only the ones your platform sets: `["cf-connecting-ip"]` on Cloudflare.
   * @default DEFAULT_IP_HEADERS
   */
  ipHeaders?: string[];

  /**
   * Validation for custom events, by event name. An event with a rule is forwarded only if every listed property
   * is a string matching its pattern, and with only those properties. Events without a rule pass through as is.
   */
  events?: Record<string, RelayRule>;

  /** Called when Plausible cannot be reached. */
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
  /** Sends a forward to Plausible. Throws when Plausible cannot be reached. */
  send(forward: RelayForward): Promise<RelayResult>;
  /** Handles a web standard request end to end. Pass the visitor IP when the platform gives it to you. */
  handle(request: Request, context?: { clientIp?: string }): Promise<Response>;
}

export const DEFAULT_UPSTREAM = "https://plausible.io";
export const DEFAULT_MAX_BODY_LENGTH = 16 * 1024;

/**
 * Platform headers that carry the visitor IP, most specific first. x-forwarded-for is last because proxies append to
 * it and some let the client seed it. The first header present wins, so on a platform that sets only one of these a
 * client can spoof the IP by sending one ranked above it; set `ipHeaders` there.
 */
export const DEFAULT_IP_HEADERS: readonly string[] = [
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
export function clientIp(headers: RelayHeaders, names: readonly string[] = DEFAULT_IP_HEADERS): string | undefined {
  for (const name of names) {
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
      // Drop g and y: they make test() stateful, and the rules are shared across requests.
      pattern instanceof RegExp ? new RegExp(pattern.source, pattern.flags.replace(/[gy]/g, "")) : new RegExp(pattern),
    ]);
    if (entries.length === 0) {
      throw new Error(`[@sjohansson/astro-plausible] Rule for event "${name}" lists no properties.`);
    }
    compiled.set(name, entries);
  }
  return compiled;
}

/** Applies the rule for an event. Returns the props to forward, or null when the event is not valid. */
function applyRule(rules: [string, RegExp][], props: unknown): Record<string, string> | null {
  const source = props && typeof props === "object" ? (props as Record<string, unknown>) : {};
  const kept: Record<string, string> = {};
  for (const [property, pattern] of rules) {
    const value = source[property];
    if (typeof value !== "string" || !pattern.test(value)) return null;
    kept[property] = value;
  }
  return kept;
}

const encoder = new TextEncoder();

/** Reads a request body as text, or returns null as soon as it grows past `limit` bytes. */
async function readBody(request: Request, limit: number): Promise<string | null> {
  if (!request.body) return "";
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let text = "";
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) return text + decoder.decode();
    size += value.byteLength;
    if (size > limit) {
      await reader.cancel();
      return null;
    }
    text += decoder.decode(value, { stream: true });
  }
}

function headersToRecord(headers: Headers): RelayHeaders {
  const record: RelayHeaders = {};
  headers.forEach((value, name) => {
    record[name.toLowerCase()] = value;
  });
  return record;
}

export function createRelay(options: RelayOptions): Relay {
  const domains = new Set(Array.isArray(options.domain) ? options.domain : [options.domain]);
  if (domains.size === 0 || [...domains].some((d) => typeof d !== "string" || d.length === 0)) {
    throw new Error("[@sjohansson/astro-plausible] domain is required.");
  }
  const upstream = `${(options.upstream ?? DEFAULT_UPSTREAM).replace(/\/$/, "")}/api/event`;
  const maxBodyLength = options.maxBodyLength ?? DEFAULT_MAX_BODY_LENGTH;
  const rules = compileRules(options.events);
  const ipHeaders = options.ipHeaders?.map((name) => name.toLowerCase()) ?? DEFAULT_IP_HEADERS;

  const relay: Relay = {
    forward(rawBody, headers, ip) {
      if (typeof rawBody !== "string" || rawBody.length === 0) return null;
      // A UTF-16 code unit is at least one UTF-8 byte, so the length check spares encoding a body that is far too big.
      if (rawBody.length > maxBodyLength || encoder.encode(rawBody).length > maxBodyLength) return null;

      let event: Record<string, unknown>;
      try {
        event = JSON.parse(rawBody);
      } catch {
        return null;
      }
      if (!event || typeof event !== "object" || Array.isArray(event)) return null;
      if (typeof event["d"] !== "string" || !domains.has(event["d"])) return null;
      const name = event["n"];
      if (typeof name !== "string" || name.length === 0) return null;

      if (rules.has(name)) {
        const kept = applyRule(rules.get(name) ?? [], event["p"]);
        if (!kept) return null;
        event["p"] = kept;
      }

      const forwardHeaders: Record<string, string> = { "content-type": "application/json" };
      const userAgent = header(headers, "user-agent");
      if (userAgent) forwardHeaders["user-agent"] = userAgent;
      const visitorIp = ip ?? clientIp(headers, ipHeaders);
      if (visitorIp) forwardHeaders["x-forwarded-for"] = visitorIp;

      return { url: upstream, body: JSON.stringify(event), headers: forwardHeaders };
    },

    async send(forward) {
      const res = await fetch(forward.url, { method: "POST", headers: forward.headers, body: forward.body });
      return {
        status: res.status,
        contentType: res.headers.get("content-type") ?? "text/plain",
        body: await res.text(),
      };
    },

    async handle(request, context = {}) {
      if (request.method !== "POST") return new Response(null, { status: 405, headers: { allow: "POST" } });
      const length = Number(request.headers.get("content-length"));
      if (length > maxBodyLength) return new Response(null, { status: 413 });

      // Content-Length can be missing (chunked) or wrong, so the limit also applies while reading.
      const body = await readBody(request, maxBodyLength);
      if (body === null) return new Response(null, { status: 413 });

      const forward = relay.forward(body, headersToRecord(request.headers), context.clientIp);
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
 * Adapter for Azure Static Web Apps managed functions (Node, `function.json` model). `astro-plausible init` writes
 * a function that uses this.
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
      context.log.warn(`Plausible forward failed: ${error}`);
      context.res = { status: 502 };
    }
  };
}
