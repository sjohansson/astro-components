import { afterEach, describe, expect, it, vi } from "vitest";
import { clientIp, createRelay, DEFAULT_UPSTREAM, swaHandler } from "../src/relay";

const DOMAIN = "example.com";
const VOTE_VALUE = "^[A-Za-z0-9._/-]{1,200}:(?:up|down)(?:-undo)?$";

function event(fields: Record<string, unknown> = {}) {
  return JSON.stringify({ n: "pageview", u: "https://example.com/posts", d: DOMAIN, r: null, ...fields });
}

function body(forward: { body: string } | null) {
  return JSON.parse(forward?.body ?? "{}");
}

describe("clientIp", () => {
  it("prefers the platform's own header and strips ports", () => {
    expect(clientIp({ "x-azure-clientip": "203.0.113.5", "x-forwarded-for": "198.51.100.1" })).toBe("203.0.113.5");
    expect(clientIp({ "x-forwarded-for": "203.0.113.5:51234, 10.0.0.1" })).toBe("203.0.113.5");
    expect(clientIp({ "x-forwarded-for": "[2001:db8::1]:443" })).toBe("2001:db8::1");
    expect(clientIp({})).toBeUndefined();
  });
});

describe("createRelay().forward", () => {
  const relay = createRelay({ domain: DOMAIN, events: { vote: { vote: VOTE_VALUE } } });

  it("posts to Plausible with the visitor IP in X-Forwarded-For and the user agent", () => {
    const forward = relay.forward(event(), {
      "x-forwarded-for": "203.0.113.5:51234",
      "user-agent": "Mozilla/5.0 Test",
    });

    expect(forward?.url).toBe(`${DEFAULT_UPSTREAM}/api/event`);
    expect(forward?.headers).toEqual({
      "content-type": "application/json",
      "user-agent": "Mozilla/5.0 Test",
      "x-forwarded-for": "203.0.113.5",
    });
    expect(body(forward)).toEqual({ n: "pageview", u: "https://example.com/posts", d: DOMAIN, r: null });
  });

  it("prefers an IP passed by the caller and sends none when unknown", () => {
    expect(relay.forward(event(), { "x-forwarded-for": "9.9.9.9" }, "203.0.113.9")?.headers["x-forwarded-for"]).toBe(
      "203.0.113.9",
    );
    expect(relay.forward(event(), {})?.headers).not.toHaveProperty("x-forwarded-for");
  });

  it("rejects other domains, events without a name, bad JSON, empty and oversized bodies", () => {
    expect(relay.forward(event({ d: "someone-else.com" }), {})).toBeNull();
    expect(relay.forward(event({ d: undefined }), {})).toBeNull();
    expect(relay.forward(event({ n: "" }), {})).toBeNull();
    expect(relay.forward("[]", {})).toBeNull();
    expect(relay.forward("not json", {})).toBeNull();
    expect(relay.forward("", {})).toBeNull();
    expect(relay.forward("x".repeat(17 * 1024), {})).toBeNull();
    expect(relay.forward(undefined, {})).toBeNull();
  });

  it("forwards an event with a rule with only the listed props", () => {
    const forward = relay.forward(event({ n: "vote", p: { vote: "why-test-things:up-undo", extra: "x" } }), {});
    expect(body(forward).p).toEqual({ vote: "why-test-things:up-undo" });
  });

  it("rejects events that break their rule", () => {
    for (const p of [undefined, {}, { vote: 1 }, { vote: "why-test-things" }, { vote: "x:sideways" }]) {
      expect(relay.forward(event({ n: "vote", p }), {})).toBeNull();
    }
  });

  it("leaves events without a rule alone", () => {
    const forward = relay.forward(event({ n: "signup", p: { plan: "pro" } }), {});
    expect(body(forward).p).toEqual({ plan: "pro" });
  });

  it("accepts RegExp rules, several domains, a custom upstream and body limit", () => {
    const custom = createRelay({
      domain: [DOMAIN, "second.example"],
      upstream: "https://plausible.example.com/",
      maxBodyLength: 200,
      events: { vote: { vote: /^[a-z]+:up$/ } },
    });
    expect(custom.forward(event({ d: "second.example" }), {})?.url).toBe("https://plausible.example.com/api/event");
    expect(custom.forward(event({ n: "vote", p: { vote: "post:up" } }), {})).not.toBeNull();
    expect(custom.forward(event({ n: "vote", p: { vote: "post:down" } }), {})).toBeNull();
    expect(custom.forward(event({ padding: "x".repeat(200) }), {})).toBeNull();
  });

  it("rejects a missing domain or an empty rule", () => {
    expect(() => createRelay({ domain: [] })).toThrow(/domain/);
    expect(() => createRelay({ domain: "" })).toThrow(/domain/);
    expect(() => createRelay({ domain: DOMAIN, events: { vote: {} } })).toThrow(/vote/);
  });
});

describe("createRelay().handle", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function request(init: RequestInit & { body?: string } = {}) {
    return new Request("https://example.com/api/event", { method: "POST", body: event(), ...init });
  }

  it("forwards to Plausible and returns its response", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("ok", { status: 202 }));
    vi.stubGlobal("fetch", fetchMock);
    const relay = createRelay({ domain: DOMAIN });

    const res = await relay.handle(request({ headers: { "x-forwarded-for": "203.0.113.5", "user-agent": "UA" } }));

    expect(fetchMock).toHaveBeenCalledWith(
      `${DEFAULT_UPSTREAM}/api/event`,
      expect.objectContaining({
        method: "POST",
        headers: { "content-type": "application/json", "user-agent": "UA", "x-forwarded-for": "203.0.113.5" },
      }),
    );
    expect(res.status).toBe(202);
    expect(await res.text()).toBe("ok");
    expect(res.headers.get("cache-control")).toBe("no-store");
  });

  it("uses the IP the platform passes in", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("ok"));
    vi.stubGlobal("fetch", fetchMock);
    await createRelay({ domain: DOMAIN }).handle(request(), { clientIp: "203.0.113.77" });
    expect(fetchMock.mock.calls[0]?.[1].headers["x-forwarded-for"]).toBe("203.0.113.77");
  });

  it("answers 405, 413 and 400 without calling Plausible", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const relay = createRelay({ domain: DOMAIN });

    expect((await relay.handle(request({ method: "GET", body: undefined }))).status).toBe(405);
    // The Request constructor drops content-length, so a server-style request stands in for it.
    const oversized = {
      method: "POST",
      headers: new Headers({ "content-length": "99999999" }),
      text: async () => event(),
    } as unknown as Request;
    expect((await relay.handle(oversized)).status).toBe(413);
    expect((await relay.handle(request({ body: "nope" }))).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("answers 502 and reports the error when Plausible is unreachable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    const onError = vi.fn();
    const res = await createRelay({ domain: DOMAIN, onError }).handle(request());
    expect(res.status).toBe(502);
    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });
});

describe("swaHandler", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("forwards to Plausible and returns its response", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response("ok", { status: 202, headers: { "content-type": "text/plain" } }));
    vi.stubGlobal("fetch", fetchMock);
    const handler = swaHandler(createRelay({ domain: DOMAIN }));
    // biome-ignore lint/suspicious/noExplicitAny: partial Functions context
    const context: Record<string, any> = { log: { warn: vi.fn() } };

    await handler(context, { rawBody: event(), headers: { "x-azure-clientip": "203.0.113.5" } });

    expect(fetchMock.mock.calls[0]?.[1].headers["x-forwarded-for"]).toBe("203.0.113.5");
    expect(context.res.status).toBe(202);
    expect(context.res.body).toBe("ok");
    expect(context.res.headers["cache-control"]).toBe("no-store");
  });

  it("returns 400 for an invalid event and 502 when Plausible is unreachable", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("network down"));
    vi.stubGlobal("fetch", fetchMock);
    const handler = swaHandler(createRelay({ domain: DOMAIN }));
    // biome-ignore lint/suspicious/noExplicitAny: partial Functions context
    const context: Record<string, any> = { log: { warn: vi.fn() } };

    await handler(context, { rawBody: "nope", headers: {} });
    expect(context.res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();

    await handler(context, { rawBody: event() });
    expect(context.res.status).toBe(502);
    expect(context.log.warn).toHaveBeenCalledWith(expect.stringContaining("network down"));
  });
});
