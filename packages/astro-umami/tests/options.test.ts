import { describe, expect, it } from "vitest";
import { DEFAULT_HOST_URL, umamiConfig } from "../src/options";

const WEBSITE_ID = "930ef364-ec51-4ca5-b5af-2b09ca6a0a21";

describe("umamiConfig", () => {
  it("defaults hostUrl to the site itself and leaves unset keys out", () => {
    expect(umamiConfig({ websiteId: WEBSITE_ID })).toEqual({ websiteId: WEBSITE_ID, hostUrl: DEFAULT_HOST_URL });
  });

  it("passes the tracker settings through", () => {
    expect(
      umamiConfig({
        websiteId: WEBSITE_ID,
        hostUrl: "/stats",
        autoTrack: false,
        domains: ["example.com", "www.example.com"],
        excludeSearch: true,
        excludeHash: true,
        doNotTrack: true,
        tag: "beta",
      }),
    ).toEqual({
      websiteId: WEBSITE_ID,
      hostUrl: "/stats",
      autoTrack: false,
      domains: ["example.com", "www.example.com"],
      excludeSearch: true,
      excludeHash: true,
      doNotTrack: true,
      tag: "beta",
    });
  });

  it("rejects bad values", () => {
    expect(() => umamiConfig({ websiteId: "" })).toThrow(/websiteId/);
    expect(() => umamiConfig({ websiteId: 'x"; alert(1); "' })).toThrow(/websiteId/);
    expect(() => umamiConfig({ websiteId: WEBSITE_ID, autoTrack: "no" as never })).toThrow(/autoTrack/);
    expect(() => umamiConfig({ websiteId: WEBSITE_ID, domains: "example.com" as never })).toThrow(/domains/);
    expect(() => umamiConfig({ websiteId: WEBSITE_ID, hostUrl: "" })).toThrow(/hostUrl/);
    expect(() => umamiConfig({ websiteId: WEBSITE_ID, tag: "has space" })).toThrow(/tag/);
  });
});
