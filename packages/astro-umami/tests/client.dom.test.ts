import { afterEach, describe, expect, it, vi } from "vitest";
import { getUmami, startUmami } from "../src/client";
import { createRelay, DEFAULT_UPSTREAM } from "../src/relay";

const WEBSITE_ID = "930ef364-ec51-4ca5-b5af-2b09ca6a0a21";

describe("startUmami", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("runs the vendored tracker with config from the options and posts to the relay", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("cache-token", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const beforeSend = vi.fn((_type: string, payload: Record<string, unknown>) => ({ ...payload, tagged: true }));
    expect(getUmami()).toBeUndefined();

    startUmami({ websiteId: WEBSITE_ID, hostUrl: "/", autoTrack: false, beforeSend });
    // A second call is a no-op.
    startUmami({ websiteId: "other", hostUrl: "https://elsewhere.example" });

    const umami = getUmami();
    expect(umami).toBeDefined();
    expect((window as Window & { umamiConfig?: Record<string, unknown> }).umamiConfig).toMatchObject({
      websiteId: WEBSITE_ID,
      hostUrl: "/",
      autoTrack: false,
    });

    await umami?.track("signup", { plan: "pro" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe("/api/send");
    expect(init.method).toBe("POST");
    expect(init.headers["x-umami-website-id"]).toBe(WEBSITE_ID);
    const sent = JSON.parse(init.body);
    expect(sent.type).toBe("event");
    expect(sent.payload).toMatchObject({ website: WEBSITE_ID, name: "signup", data: { plan: "pro" }, tagged: true });
    expect(beforeSend).toHaveBeenCalledWith("event", expect.objectContaining({ name: "signup" }));

    // The request the real tracker makes must be one the relay accepts, with the event data where a rule reads it.
    // This is what a tracker update can break.
    const relay = createRelay({ websiteId: WEBSITE_ID, events: { signup: { plan: "^(free|pro)$" } } });
    const forward = relay.forward(init.body, { "user-agent": "test-agent" }, "203.0.113.9");
    expect(forward).not.toBeNull();
    expect(forward?.url).toBe(`${DEFAULT_UPSTREAM}/api/send`);
    expect(JSON.parse(forward?.body ?? "{}").payload).toMatchObject({
      website: WEBSITE_ID,
      name: "signup",
      data: { plan: "pro" },
      ip: "203.0.113.9",
      userAgent: "test-agent",
    });
  });
});
