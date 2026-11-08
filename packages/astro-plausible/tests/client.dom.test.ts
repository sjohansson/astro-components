import { afterEach, describe, expect, it, vi } from "vitest";
import { startPlausible, track } from "../src/client";
import { createRelay, DEFAULT_UPSTREAM } from "../src/relay";

describe("startPlausible", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("starts the official tracker pointed at the relay and posts events there", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("ok", { status: 202 }));
    vi.stubGlobal("fetch", fetchMock);
    const customProperties = vi.fn(() => ({ tier: "pro" }));
    const transformRequest = vi.fn((payload: Record<string, unknown>) => ({ ...payload, changed: true }));

    startPlausible({
      domain: "example.com",
      autoCapturePageviews: false,
      captureOnLocalhost: true,
      customProperties,
      transformRequest,
    });
    // A second call is a no-op; the tracker itself allows a single init().
    startPlausible({ domain: "other.example" });
    expect(typeof (window as Window & { plausible?: unknown }).plausible).toBe("function");

    const done = new Promise<void>((resolve) => track("signup", { props: { plan: "pro" }, callback: () => resolve() }));
    await done;

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe("/api/event");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toMatchObject({
      n: "signup",
      d: "example.com",
      p: { plan: "pro", tier: "pro" },
      changed: true,
    });
    expect(customProperties).toHaveBeenCalledWith("signup");

    // The request the real tracker makes must be one the relay accepts, with the props where a rule reads them.
    // This is what a tracker update can break.
    const relay = createRelay({ domain: "example.com", events: { signup: { plan: "^(free|pro)$" } } });
    const forward = relay.forward(init.body, { "user-agent": "test-agent" }, "203.0.113.9");
    expect(forward).not.toBeNull();
    expect(forward?.url).toBe(`${DEFAULT_UPSTREAM}/api/event`);
    expect(forward?.headers).toMatchObject({ "x-forwarded-for": "203.0.113.9", "user-agent": "test-agent" });
    const forwarded = JSON.parse(forward?.body ?? "{}");
    expect(forwarded).toMatchObject({ n: "signup", d: "example.com", p: { plan: "pro" } });
    // The rule keeps only the listed props.
    expect(forwarded.p).not.toHaveProperty("tier");
  });
});
