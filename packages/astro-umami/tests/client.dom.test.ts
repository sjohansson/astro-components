import { afterEach, describe, expect, it, vi } from "vitest";
import { getUmami, startUmami } from "../src/client";

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
  });
});
