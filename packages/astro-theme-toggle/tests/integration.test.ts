import { describe, expect, it, vi } from "vitest";
import type { ThemeToggleOptions } from "../src/astro/integration";
import themeToggleIntegration from "../src/astro/integration";

/** Minimal stand-in for Astro's integration logger. */
function fakeLogger() {
  return { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(), label: "test", fork: vi.fn() };
}

/** Run astro:config:setup and report what, if anything, was injected. */
function runSetup(options?: ThemeToggleOptions) {
  const logger = fakeLogger();
  const injectScript = vi.fn();
  // biome-ignore lint/suspicious/noExplicitAny: partial Astro hook context
  (themeToggleIntegration(options).hooks["astro:config:setup"] as any)({ logger, injectScript });
  const script = injectScript.mock.calls[0]?.[1] as string | undefined;
  return { logger, injectScript, script };
}

describe("ThemeToggle Astro Integration", () => {
  it("should export integration function", () => {
    expect(themeToggleIntegration).toBeDefined();
    expect(typeof themeToggleIntegration).toBe("function");
  });

  it("should return valid Astro integration", () => {
    const result = themeToggleIntegration();
    expect(result.name).toBe("@sjohansson/astro-theme-toggle");
    expect(result.hooks).toBeDefined();
    expect(result.hooks["astro:config:setup"]).toBeDefined();
    expect(result.hooks["astro:config:done"]).toBeDefined();
  });

  it("should accept options", () => {
    const result = themeToggleIntegration({ injectScript: true });
    expect(result.name).toBe("@sjohansson/astro-theme-toggle");
  });

  it("should work without options", () => {
    const result = themeToggleIntegration();
    expect(result.name).toBe("@sjohansson/astro-theme-toggle");
  });
});

describe("ThemeToggle Astro Integration hooks", () => {
  it("logs setup and injects nothing by default", () => {
    const { logger, injectScript } = runSetup();
    expect(logger.info).toHaveBeenCalledWith("Setting up Theme Toggle integration");
    expect(injectScript).not.toHaveBeenCalled();
  });

  it("injects the scheme-class FOUC script into head-inline when injectScript is set", () => {
    const { injectScript, script } = runSetup({ injectScript: true });
    expect(injectScript).toHaveBeenCalledTimes(1);
    expect(injectScript.mock.calls[0]?.[0]).toBe("head-inline");
    expect(script).toContain("theme-mode");
    // Inline (default) apply mode replays no data attributes.
    expect(script).not.toContain("theme-attr-name");
  });

  it("injects an attribute-replaying script for applyMode 'attribute'", () => {
    const { script } = runSetup({ injectScript: true, applyMode: "attribute" });
    expect(script).toContain("theme-attr-name");
    expect(script).toContain("data-theme");
  });

  it("injects an attribute-replaying script for applyMode 'both'", () => {
    const { script } = runSetup({ injectScript: true, applyMode: "both" });
    expect(script).toContain("theme-attr-name");
  });

  it("honors a custom attributeName", () => {
    const { script } = runSetup({ injectScript: true, applyMode: "attribute", attributeName: "data-palette" });
    expect(script).toContain("data-palette");
  });

  it("disables companion attributes when attributeCompanions is false", () => {
    const { script } = runSetup({ injectScript: true, applyMode: "attribute", attributeCompanions: false });
    expect(script).toContain("cp=cp===null?false:");
  });

  it("keeps companion attributes on by default", () => {
    const { script } = runSetup({ injectScript: true, applyMode: "attribute" });
    expect(script).toContain("cp=cp===null?true:");
  });

  it("logs the config base on astro:config:done", () => {
    const logger = fakeLogger();
    // biome-ignore lint/suspicious/noExplicitAny: partial Astro hook context
    (themeToggleIntegration().hooks["astro:config:done"] as any)({ logger, config: { base: "/docs" } });
    expect(logger.info).toHaveBeenCalledWith("Theme Toggle integration configured");
    expect(logger.debug).toHaveBeenCalledWith("Config base: /docs");
  });
});
