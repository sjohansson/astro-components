import { describe, expect, it, vi } from "vitest";
import votesIntegration, { clientScript } from "../src/integration";

function runSetup(integration: ReturnType<typeof votesIntegration>) {
  const injectScript = vi.fn();
  const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(), label: "test", fork: vi.fn() };
  // biome-ignore lint/suspicious/noExplicitAny: partial Astro hook context
  (integration.hooks["astro:config:setup"] as any)({ injectScript, logger });
  return injectScript;
}

describe("votes integration", () => {
  it("injects a page script that configures and registers the element", () => {
    const injectScript = runSetup(votesIntegration());
    expect(injectScript).toHaveBeenCalledWith("page", clientScript());
    expect(clientScript()).toContain('configureVotes({ transport: "umami", eventName: "vote" });');
    expect(clientScript()).toContain("registerVoteButtons();");
  });

  it("passes options through", () => {
    const injectScript = runSetup(votesIntegration({ transport: "none", eventName: "rating" }));
    expect(injectScript.mock.calls[0]?.[1]).toContain('transport: "none", eventName: "rating"');
  });

  it("rejects bad options", () => {
    // biome-ignore lint/suspicious/noExplicitAny: deliberately invalid option
    expect(() => votesIntegration({ transport: "ga" as any })).toThrow(/Unknown transport/);
    expect(() => votesIntegration({ eventName: 'x"; alert(1); "' })).toThrow(/eventName/);
  });
});
