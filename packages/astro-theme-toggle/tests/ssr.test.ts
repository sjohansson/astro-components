// @vitest-environment node
import { describe, expect, it } from "vitest";

describe("server import", () => {
  it("loads every entry without a DOM", async () => {
    expect(typeof HTMLElement).toBe("undefined");
    const core = await import("../src/core/index");
    await import("../src/index");
    for (const element of [core.ThemeToggleElement, core.ThemeControllerElement, core.ThemePreviewElement]) {
      expect(typeof element).toBe("function");
    }
    expect(core.generateThemeInitScript()).toContain("localStorage");
  });
});
