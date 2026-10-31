import { afterEach, describe, expect, it, vi } from "vitest";
import { clientIp, createRelay, DEFAULT_UPSTREAM, type SwaContext, swaHandler } from "../src/relay";

const WEBSITE_ID = "930ef364-ec51-4ca5-b5af-2b09ca6a0a21";
const VOTE_VALUE = "^[A-Za-z0-9._/-]{1,200}:(?:up|down)(?:-undo)?$";

function event(payload: Record<string, unknown> = {}) {
  return JSON.stringify({ type: "event", payload: { website: WEBSITE_ID, url: "/posts", ...payload } });
}

function body(forward: { body: string } | null) {
  return JSON.parse(forward?.body ?? "{}");
}

describe("clientIp", () => {
  it("prefers the platform's own header", () => {
    expect(clientIp({ "x-azure-clientip": "203.0.113.5", "x-forwarded-for": "198.51.100.1" })).toBe("203.0.113.5");
    expect(clientIp({ "cf-connecting-ip": "203.0.113.7", "x-forwarded-for": "198.51.100.1" })).toBe("203.0.113.7");
  });

  it("takes the first x-forwarded-for entry and drops an IPv4 port", () => {
    expect(clientIp({ "x-forwarded-for": "203.0.113.5:51234, 10.0.0.1" })).toBe("203.0.113.5");
  });

  it("handles IPv6 with and without a port, and array headers", () => {
    expect(clientIp({ "x-forwarded-for": "[2001:db8::1]:443" })).toBe("2001:db8::1");
    expect(clientIp({ "x-forwarded-for": ["2001:db8::1", "10.0.0.1"] })).toBe("2001:db8::1");
  });

  it("returns undefined without any IP header", () => {
    expect(clientIp({})).toBeUndefined();
    expect(clientIp({ "x-forwarded-for": " " })).toBeUndefined();
  });

  it("reads only the given headers", () => {
    const spoofed = { "x-azure-clientip": "198.51.100.1", "cf-connecting-ip": "203.0.113.7" };
    expect(clientIp(spoofed, ["cf-connecting-ip"])).toBe("203.0.113.7");
    expect(clientIp({ "x-forwarded-for": "198.51.100.1" }, ["cf-connecting-ip"])).toBeUndefined();
  });
});

describe("createRelay().forward", () => {
  const relay = createRelay({ websiteId: WEBSITE_ID, events: { vote: { vote: VOTE_VALUE } } });

  it("posts to the Umami gateway with the visitor IP and user agent in the payload", () => {
    const forward = relay.forward(event(), {
      "x-forwarded-for": "203.0.113.5:51234",
      "user-agent": "Mozilla/5.0 Test",
      "x-umami-cache": "token",
    });

    expect(forward?.url).toBe(`${DEFAULT_UPSTREAM}/api/send`);
    expect(body(forward).payload).toMatchObject({ ip: "203.0.113.5", userAgent: "Mozilla/5.0 Test", url: "/posts" });
    expect(forward?.headers).toEqual({
      "content-type": "application/json",
      "user-agent": "Mozilla/5.0 Test",
      "x-umami-cache": "token",
    });
  });

  it("prefers an IP passed by the caller and drops one sent by the browser", () => {
    expect(body(relay.forward(event({ ip: "1.2.3.4" }), {})).payload.ip).toBeUndefined();
    expect(
      body(relay.forward(event({ ip: "1.2.3.4" }), { "x-forwarded-for": "9.9.9.9" }, "203.0.113.9")).payload.ip,
    ).toBe("203.0.113.9");
  });

  it("rejects other websites, bad JSON, empty and oversized bodies", () => {
    expect(relay.forward(event({ website: "someone-else" }), {})).toBeNull();
    expect(relay.forward(JSON.stringify({ type: "event" }), {})).toBeNull();
    expect(relay.forward("not json", {})).toBeNull();
    expect(relay.forward("", {})).toBeNull();
    expect(relay.forward("x".repeat(17 * 1024), {})).toBeNull();
    expect(relay.forward(undefined, {})).toBeNull();
    expect(relay.forward(Buffer.from(event()), {})).toBeNull();
  });

  it("forwards an event with a rule with only the listed properties", () => {
    const forward = relay.forward(event({ name: "vote", data: { vote: "why-test-things:up-undo", extra: "x" } }), {});
    expect(body(forward).payload.data).toEqual({ vote: "why-test-things:up-undo" });
  });

  it("rejects events that break their rule", () => {
    for (const data of [
      undefined,
      {},
      { vote: 1 },
      { vote: "why-test-things" },
      { vote: "a b:up" },
      { vote: "x:sideways" },
    ]) {
      expect(relay.forward(event({ name: "vote", data }), {})).toBeNull();
    }
  });

  it("leaves events without a rule alone", () => {
    const forward = relay.forward(event({ name: "button_click", data: { button_text: "Go" } }), {});
    expect(body(forward).payload.data).toEqual({ button_text: "Go" });
  });

  it("accepts RegExp rules, several website ids, a custom upstream and body limit", () => {
    const custom = createRelay({
      websiteId: [WEBSITE_ID, "second"],
      upstream: "https://umami.example.com/",
      maxBodyLength: 200,
      events: { vote: { vote: /^[a-z]+:up$/ } },
    });
    expect(custom.forward(event({ website: "second" }), {})?.url).toBe("https://umami.example.com/api/send");
    expect(custom.forward(event({ name: "vote", data: { vote: "post:up" } }), {})).not.toBeNull();
    expect(custom.forward(event({ name: "vote", data: { vote: "post:down" } }), {})).toBeNull();
    expect(custom.forward(event({ padding: "x".repeat(200) }), {})).toBeNull();
  });

  it("ignores the g and y flags, which would make RegExp rules stateful", () => {
    for (const pattern of [/^post:up$/g, /^post:up$/y]) {
      const flagged = createRelay({ websiteId: WEBSITE_ID, events: { vote: { vote: pattern } } });
      for (let i = 0; i < 3; i++) {
        expect(flagged.forward(event({ name: "vote", data: { vote: "post:up" } }), {})).not.toBeNull();
      }
    }
  });

  it("measures the body limit in UTF-8 bytes", () => {
    const limited = createRelay({ websiteId: WEBSITE_ID, maxBodyLength: 400 });
    expect(limited.forward(event({ title: "a".repeat(200) }), {})).not.toBeNull();
    expect(limited.forward(event({ title: "文".repeat(200) }), {})).toBeNull();
  });

  it("reads the visitor IP only from the configured headers", () => {
    const relay = createRelay({ websiteId: WEBSITE_ID, ipHeaders: ["CF-Connecting-IP"] });
    const headers = { "x-azure-clientip": "198.51.100.1", "cf-connecting-ip": "203.0.113.7" };
    expect(body(relay.forward(event(), headers)).payload.ip).toBe("203.0.113.7");
  });

  it("rejects a missing website id or an empty rule", () => {
    expect(() => createRelay({ websiteId: [] })).toThrow(/websiteId/);
    expect(() => createRelay({ websiteId: "" })).toThrow(/websiteId/);
    expect(() => createRelay({ websiteId: WEBSITE_ID, events: { vote: {} } })).toThrow(/vote/);
  });
});

describe("createRelay().handle", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function request(init: RequestInit & { body?: string } = {}) {
    return new Request("https://example.com/api/send", { method: "POST", body: event(), ...init });
  }

  it("forwards to Umami and returns its response", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{"cache":"abc"}', { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const relay = createRelay({ websiteId: WEBSITE_ID });

    const res = await relay.handle(request({ headers: { "x-forwarded-for": "203.0.113.5", "user-agent": "UA" } }));

    expect(fetchMock).toHaveBeenCalledWith(`${DEFAULT_UPSTREAM}/api/send`, expect.objectContaining({ method: "POST" }));
    const sent = JSON.parse(fetchMock.mock.calls[0]?.[1].body);
    expect(sent.payload).toMatchObject({ ip: "203.0.113.5", userAgent: "UA" });
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('{"cache":"abc"}');
    expect(res.headers.get("cache-control")).toBe("no-store");
  });

  it("uses the IP the platform passes in", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("ok"));
    vi.stubGlobal("fetch", fetchMock);
    await createRelay({ websiteId: WEBSITE_ID }).handle(request(), { clientIp: "203.0.113.77" });
    expect(JSON.parse(fetchMock.mock.calls[0]?.[1].body).payload.ip).toBe("203.0.113.77");
  });

  it("answers 405, 413 and 400 without calling Umami", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const relay = createRelay({ websiteId: WEBSITE_ID });

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

  it("answers 413 for a body over the limit without a content-length, and stops reading", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    let pulled = 0;
    const endless = new ReadableStream<Uint8Array>({
      pull(controller) {
        pulled++;
        controller.enqueue(new Uint8Array(512).fill(0x20));
      },
    });
    const chunked = new Request("https://example.com/api/send", {
      method: "POST",
      body: endless,
      duplex: "half",
    } as RequestInit);

    const res = await createRelay({ websiteId: WEBSITE_ID, maxBodyLength: 1024 }).handle(chunked);

    expect(res.status).toBe(413);
    expect(pulled).toBeLessThan(5);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("answers 502 and reports the error when Umami is unreachable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    const onError = vi.fn();
    const res = await createRelay({ websiteId: WEBSITE_ID, onError }).handle(request());
    expect(res.status).toBe(502);
    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });
});

describe("swaHandler", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("forwards to Umami and returns its response", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response('{"cache":"abc"}', { status: 200, headers: { "content-type": "application/json" } }),
      );
    vi.stubGlobal("fetch", fetchMock);
    const handler = swaHandler(createRelay({ websiteId: WEBSITE_ID }));
    const context: SwaContext = { log: { warn: vi.fn() } };

    await handler(context, { rawBody: event(), headers: { "x-azure-clientip": "203.0.113.5" } });

    expect(JSON.parse(fetchMock.mock.calls[0]?.[1].body).payload.ip).toBe("203.0.113.5");
    expect(context.res?.status).toBe(200);
    expect(context.res?.body).toBe('{"cache":"abc"}');
    expect(context.res?.headers?.["cache-control"]).toBe("no-store");
  });

  it("returns 400 for an invalid event and 502 when Umami is unreachable", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("network down"));
    vi.stubGlobal("fetch", fetchMock);
    const handler = swaHandler(createRelay({ websiteId: WEBSITE_ID }));
    const context: SwaContext = { log: { warn: vi.fn() } };

    await handler(context, { rawBody: "nope", headers: {} });
    expect(context.res?.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();

    await handler(context, { rawBody: event() });
    expect(context.res?.status).toBe(502);
    expect(context.log.warn).toHaveBeenCalledWith(expect.stringContaining("network down"));
  });
});
