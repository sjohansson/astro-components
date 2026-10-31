import { describe, expect, it, vi } from "vitest";
import umamiIntegration, { clientScript } from "../src/integration";

const WEBSITE_ID = "930ef364-ec51-4ca5-b5af-2b09ca6a0a21";

function runSetup(integration: ReturnType<typeof umamiIntegration>, command = "build") {
  const injectScript = vi.fn();
  const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(), label: "test", fork: vi.fn() };
  // biome-ignore lint/suspicious/noExplicitAny: partial Astro hook context
  (integration.hooks["astro:config:setup"] as any)({ command, injectScript, logger });
  return { injectScript, logger };
}

describe("umami integration", () => {
  it("injects a page script that starts the tracker", () => {
    const { injectScript } = runSetup(umamiIntegration({ websiteId: WEBSITE_ID }));
    expect(injectScript).toHaveBeenCalledWith("page", clientScript({ websiteId: WEBSITE_ID }));
    expect(clientScript({ websiteId: WEBSITE_ID })).toBe(
      [
        'import { startUmami } from "@sjohansson/astro-umami/client";',
        `startUmami({"websiteId":"${WEBSITE_ID}","hostUrl":"/"});`,
      ].join("\n"),
    );
  });

  it("passes tracker options through", () => {
    const { injectScript } = runSetup(umamiIntegration({ websiteId: WEBSITE_ID, hostUrl: "/stats", autoTrack: false }));
    expect(injectScript.mock.calls[0]?.[1]).toContain('"hostUrl":"/stats","autoTrack":false');
  });

  it("stays out of dev unless asked", () => {
    const dev = runSetup(umamiIntegration({ websiteId: WEBSITE_ID }), "dev");
    expect(dev.injectScript).not.toHaveBeenCalled();
    expect(dev.logger.info).toHaveBeenCalledWith(expect.stringContaining("enabled: true"));

    const forced = runSetup(umamiIntegration({ websiteId: WEBSITE_ID, enabled: true }), "dev");
    expect(forced.injectScript).toHaveBeenCalledTimes(1);

    const off = runSetup(umamiIntegration({ websiteId: WEBSITE_ID, enabled: false }), "build");
    expect(off.injectScript).not.toHaveBeenCalled();
  });

  it("rejects bad options at startup", () => {
    expect(() => umamiIntegration({ websiteId: "" })).toThrow(/websiteId/);
    // biome-ignore lint/suspicious/noExplicitAny: deliberately invalid option
    expect(() => umamiIntegration({ websiteId: WEBSITE_ID, enabled: "yes" as any })).toThrow(/enabled/);
  });
});
