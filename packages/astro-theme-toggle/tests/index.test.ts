import { describe, expect, it, vi } from "vitest";

vi.mock("../src/ThemeToggle.astro", () => ({
  default: () => null,
}));

vi.mock("../src/ThemeController.astro", () => ({
  default: () => null,
}));

vi.mock("../src/ThemePreview.astro", () => ({
  default: () => null,
}));

describe("ThemeToggle Package", () => {
  it("should export ThemeToggle component", async () => {
    const module = await import("../src/index");
    expect(module.ThemeToggle).toBeDefined();
  });

  it("should export ThemeController component", async () => {
    const module = await import("../src/index");
    expect(module.ThemeController).toBeDefined();
  });

  it("should export ThemePreview component", async () => {
    const module = await import("../src/index");
    expect(module.ThemePreview).toBeDefined();
  });

  it("should export defaultThemes", async () => {
    const module = await import("../src/index");
    expect(module.defaultThemes).toBeDefined();
    expect(Array.isArray(module.defaultThemes)).toBe(true);
    expect(module.defaultThemes.length).toBeGreaterThan(0);
  });

  it("should export generateThemeCSS function", async () => {
    const module = await import("../src/index");
    expect(module.generateThemeCSS).toBeDefined();
    expect(typeof module.generateThemeCSS).toBe("function");
  });

  it("should have all required theme modes", async () => {
    const { defaultThemes } = await import("../src/index");
    const modes = defaultThemes.map((t) => t.mode);
    expect(modes).toContain("light");
    expect(modes).toContain("dark");
    expect(modes).toContain("high-contrast-light");
    expect(modes).toContain("high-contrast-dark");
  });

  it("should generate valid CSS from theme config", async () => {
    const { defaultThemes, generateThemeCSS } = await import("../src/index");
    const css = generateThemeCSS(defaultThemes[0]);
    expect(css).toContain("--theme-bg-primary");
    expect(css).toContain("--theme-fg-primary");
    expect(css).toContain("--theme-interactive-default");
    expect(css).toContain("#");
  });
});
