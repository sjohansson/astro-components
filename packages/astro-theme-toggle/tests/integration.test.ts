import { describe, expect, it } from "vitest";
import themeToggleIntegration from "../src/astro/integration";

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
