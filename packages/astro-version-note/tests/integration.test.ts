import { describe, expect, it, vi } from "vitest";
import versionNoteIntegration from "../src/integration";

/** Minimal stand-in for Astro's integration logger. */
function fakeLogger() {
  return { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(), label: "test", fork: vi.fn() };
}

// biome-ignore lint/suspicious/noExplicitAny: hooks are invoked with a minimal stub context
const setup = (integration: ReturnType<typeof versionNoteIntegration>, logger: any): void => {
  // biome-ignore lint/suspicious/noExplicitAny: partial Astro hook context
  (integration.hooks["astro:config:setup"] as any)({ logger });
};

// biome-ignore lint/suspicious/noExplicitAny: hooks are invoked with a minimal stub context
const done = (integration: ReturnType<typeof versionNoteIntegration>, logger: any): void => {
  // biome-ignore lint/suspicious/noExplicitAny: partial Astro hook context
  (integration.hooks["astro:config:done"] as any)({ logger });
};

describe("VersionNote Integration", () => {
  it("should export integration function", () => {
    expect(versionNoteIntegration).toBeDefined();
    expect(typeof versionNoteIntegration).toBe("function");
  });

  it("should return valid Astro integration", () => {
    const result = versionNoteIntegration();

    expect(result).toBeDefined();
    expect(result.name).toBe("@sjohansson/astro-version-note");
    expect(result.hooks).toBeDefined();
    expect(result.hooks["astro:config:setup"]).toBeDefined();
    expect(result.hooks["astro:config:done"]).toBeDefined();
  });

  it("should accept options", () => {
    const result = versionNoteIntegration({
      defaultVersion: "v1.0.0",
      defaultType: "warning",
    });

    expect(result).toBeDefined();
    expect(result.name).toBe("@sjohansson/astro-version-note");
  });

  it("should work without options", () => {
    const result = versionNoteIntegration();

    expect(result).toBeDefined();
    expect(result.name).toBe("@sjohansson/astro-version-note");
  });
});

describe("VersionNote Integration hooks", () => {
  it("logs setup on astro:config:setup", () => {
    const logger = fakeLogger();
    setup(versionNoteIntegration(), logger);
    expect(logger.info).toHaveBeenCalledWith("Setting up Version Note integration");
  });

  it("logs the configured default version", () => {
    const logger = fakeLogger();
    setup(versionNoteIntegration({ defaultVersion: "v1.2.3" }), logger);
    expect(logger.debug).toHaveBeenCalledWith("Default version configured: v1.2.3");
  });

  it("logs the configured default type", () => {
    const logger = fakeLogger();
    setup(versionNoteIntegration({ defaultType: "warning" }), logger);
    expect(logger.debug).toHaveBeenCalledWith("Default type configured: warning");
  });

  it("logs no defaults when none are configured", () => {
    const logger = fakeLogger();
    setup(versionNoteIntegration(), logger);
    expect(logger.debug).not.toHaveBeenCalled();
  });

  it("logs completion on astro:config:done", () => {
    const logger = fakeLogger();
    done(versionNoteIntegration(), logger);
    expect(logger.info).toHaveBeenCalledWith("Version Note integration configured");
  });
});
