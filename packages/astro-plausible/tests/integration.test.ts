import { describe, expect, it, vi } from "vitest";
import plausibleIntegration, { clientScript } from "../src/integration";

function runSetup(integration: ReturnType<typeof plausibleIntegration>, command = "build") {
  const injectScript = vi.fn();
  const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(), label: "test", fork: vi.fn() };
  const setup = integration.hooks["astro:config:setup"];
  if (!setup) throw new Error("setup hook missing");
  setup({ command, injectScript, logger } as unknown as Parameters<typeof setup>[0]);
  return { injectScript, logger };
}

describe("plausible integration", () => {
  it("injects a page script that starts the tracker", () => {
    const { injectScript } = runSetup(plausibleIntegration({ domain: "example.com" }));
    expect(injectScript).toHaveBeenCalledWith("page", clientScript({ domain: "example.com" }));
    expect(clientScript({ domain: "example.com" })).toBe(
      [
        'import { startPlausible } from "@sjohansson/astro-plausible/client";',
        'startPlausible({"domain":"example.com","endpoint":"/api/event"});',
      ].join("\n"),
    );
  });

  it("passes tracker options through", () => {
    const { injectScript } = runSetup(plausibleIntegration({ domain: "example.com", outboundLinks: true }));
    expect(injectScript.mock.calls[0]?.[1]).toContain('"outboundLinks":true');
  });

  it("stays out of dev unless asked", () => {
    const dev = runSetup(plausibleIntegration({ domain: "example.com" }), "dev");
    expect(dev.injectScript).not.toHaveBeenCalled();
    expect(dev.logger.info).toHaveBeenCalledWith(expect.stringContaining("enabled: true"));

    const forced = runSetup(plausibleIntegration({ domain: "example.com", enabled: true }), "dev");
    expect(forced.injectScript).toHaveBeenCalledTimes(1);

    const off = runSetup(plausibleIntegration({ domain: "example.com", enabled: false }), "build");
    expect(off.injectScript).not.toHaveBeenCalled();
  });

  it("rejects bad options at startup", () => {
    expect(() => plausibleIntegration({ domain: "" })).toThrow(/domain/);
    expect(() => plausibleIntegration({ domain: "example.com", enabled: "yes" as never })).toThrow(/enabled/);
  });
});
