import { describe, expect, it } from "vitest";
import { DEFAULT_ENDPOINT, plausibleConfig } from "../src/options";

describe("plausibleConfig", () => {
  it("defaults the endpoint to the relay on the site and leaves unset keys out", () => {
    expect(plausibleConfig({ domain: "example.com" })).toEqual({ domain: "example.com", endpoint: DEFAULT_ENDPOINT });
  });

  it("passes the tracker settings through", () => {
    const options = {
      domain: "example.com/docs",
      endpoint: "/stats/api/event",
      autoCapturePageviews: false,
      hashBasedRouting: true,
      outboundLinks: true,
      fileDownloads: { fileExtensions: ["pdf"] },
      formSubmissions: true,
      captureOnLocalhost: true,
      logging: false,
      customProperties: { tier: "pro", beta: true, build: 42 },
      bindToWindow: false,
    };
    expect(plausibleConfig(options)).toEqual(options);
    expect(plausibleConfig({ domain: "example.com", fileDownloads: true }).fileDownloads).toBe(true);
  });

  it("rejects bad values", () => {
    expect(() => plausibleConfig({ domain: "" })).toThrow(/domain/);
    expect(() => plausibleConfig({ domain: "https://example.com" })).toThrow(/domain/);
    expect(() => plausibleConfig({ domain: 'x"; alert(1); "' })).toThrow(/domain/);
    expect(() => plausibleConfig({ domain: "example.com", endpoint: "" })).toThrow(/endpoint/);
    // biome-ignore lint/suspicious/noExplicitAny: deliberately invalid option
    expect(() => plausibleConfig({ domain: "example.com", outboundLinks: "yes" as any })).toThrow(/outboundLinks/);
    // biome-ignore lint/suspicious/noExplicitAny: deliberately invalid option
    expect(() => plausibleConfig({ domain: "example.com", fileDownloads: ["pdf"] as any })).toThrow(/fileDownloads/);
    // biome-ignore lint/suspicious/noExplicitAny: deliberately invalid option
    expect(() => plausibleConfig({ domain: "example.com", customProperties: { nested: {} } as any })).toThrow(
      /customProperties/,
    );
  });
});
