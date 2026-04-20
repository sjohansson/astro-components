import { describe, expect, it } from "vitest";

describe("Core exports", () => {
  it("should export Web Component classes", async () => {
    const { ThemeToggleElement, ThemeControllerElement, ThemePreviewElement } = await import("../src/core/index");
    expect(ThemeToggleElement).toBeDefined();
    expect(ThemeControllerElement).toBeDefined();
    expect(ThemePreviewElement).toBeDefined();
  });

  it("should export register functions", async () => {
    const { registerThemeToggle, registerThemeController, registerThemePreview, registerAll } = await import(
      "../src/core/index"
    );
    expect(typeof registerThemeToggle).toBe("function");
    expect(typeof registerThemeController).toBe("function");
    expect(typeof registerThemePreview).toBe("function");
    expect(typeof registerAll).toBe("function");
  });

  it("should export FOUC prevention utilities", async () => {
    const { initTheme, themeInitScript } = await import("../src/core/index");
    expect(typeof initTheme).toBe("function");
    expect(typeof themeInitScript).toBe("string");
    expect(themeInitScript).toContain("theme-mode");
  });
});

describe("Root path exports", () => {
  it("should re-export core utilities from root path", async () => {
    const module = await import("../src/index");
    expect(module.defaultThemes).toBeDefined();
    expect(typeof module.generateThemeCSS).toBe("function");
    expect(typeof module.filterThemesByPreset).toBe("function");
    expect(typeof module.groupByFamily).toBe("function");
    expect(typeof module.registerAll).toBe("function");
  });

  it("should re-export Web Component classes from root path", async () => {
    const module = await import("../src/index");
    expect(module.ThemeToggleElement).toBeDefined();
    expect(module.ThemeControllerElement).toBeDefined();
    expect(module.ThemePreviewElement).toBeDefined();
  });

  it("should re-export register functions from root path", async () => {
    const module = await import("../src/index");
    expect(typeof module.registerThemeToggle).toBe("function");
    expect(typeof module.registerThemeController).toBe("function");
    expect(typeof module.registerThemePreview).toBe("function");
  });
});

describe("Default themes", () => {
  it("should have all required theme IDs", async () => {
    const { defaultThemes } = await import("../src/theme-config");
    const ids = defaultThemes.map((t) => t.id);
    expect(ids).toContain("light");
    expect(ids).toContain("dark");
    expect(ids).toContain("high-contrast-light");
    expect(ids).toContain("high-contrast-dark");
  });

  it("should have correct categories", async () => {
    const { defaultThemes } = await import("../src/theme-config");
    expect(defaultThemes.filter((t) => t.category === "base")).toHaveLength(2);
    expect(defaultThemes.filter((t) => t.category === "high-contrast")).toHaveLength(2);
  });

  it("should have scheme and family on all themes", async () => {
    const { defaultThemes } = await import("../src/theme-config");
    for (const theme of defaultThemes) {
      expect(["light", "dark"]).toContain(theme.scheme);
      expect(theme.family).toBe("default");
    }
  });

  it('should filter by preset "basic"', async () => {
    const { defaultThemes, filterThemesByPreset } = await import("../src/theme-config");
    const basic = filterThemesByPreset(defaultThemes, "basic");
    expect(basic).toHaveLength(2);
    expect(basic.every((t) => t.category === "base")).toBe(true);
  });

  it('should filter by preset "accessible"', async () => {
    const { defaultThemes, filterThemesByPreset } = await import("../src/theme-config");
    expect(filterThemesByPreset(defaultThemes, "accessible")).toHaveLength(4);
  });

  it("should filter by custom category array", async () => {
    const { defaultThemes, filterThemesByPreset } = await import("../src/theme-config");
    const hc = filterThemesByPreset(defaultThemes, ["high-contrast"]);
    expect(hc).toHaveLength(2);
    expect(hc.every((t) => t.category === "high-contrast")).toBe(true);
  });

  it("should generate valid CSS from theme config", async () => {
    const { defaultThemes, generateThemeCSS } = await import("../src/theme-config");
    const css = generateThemeCSS(defaultThemes[0]);
    expect(css).toContain("--theme-bg-primary");
    expect(css).toContain("--theme-fg-primary");
    expect(css).toContain("--theme-interactive-default");
  });
});

describe("Theme families", () => {
  it("should export bundled theme families", async () => {
    const { kawaiiThemes, lessIsMoreThemes, seventiesThemes, allBundledThemes } = await import("../src/themes/index");
    expect(kawaiiThemes.length).toBeGreaterThan(0);
    expect(lessIsMoreThemes.length).toBeGreaterThan(0);
    expect(seventiesThemes.length).toBeGreaterThan(0);
    expect(allBundledThemes.length).toBe(kawaiiThemes.length + lessIsMoreThemes.length + seventiesThemes.length);
  });

  it("kawaii themes should have correct family", async () => {
    const { kawaiiThemes } = await import("../src/themes/kawaii");
    for (const theme of kawaiiThemes) {
      expect(theme.family).toBe("kawaii");
      expect(theme.familyLabel).toBe("Kawaii");
      expect(["light", "dark"]).toContain(theme.scheme);
    }
  });

  it("seventies should include color-blind variants", async () => {
    const { seventiesThemes } = await import("../src/themes/seventies");
    const cb = seventiesThemes.filter((t) => t.category === "color-blind");
    expect(cb.length).toBeGreaterThan(0);
    const ids = cb.map((t) => t.id);
    expect(ids.some((id) => id.includes("protanopia"))).toBe(true);
    expect(ids.some((id) => id.includes("deuteranopia"))).toBe(true);
    expect(ids.some((id) => id.includes("tritanopia"))).toBe(true);
    expect(ids.some((id) => id.includes("achromatopsia"))).toBe(true);
  });

  it("each family should have light + dark base variants", async () => {
    const { kawaiiThemes } = await import("../src/themes/kawaii");
    const { lessIsMoreThemes } = await import("../src/themes/less-is-more");
    const { seventiesThemes } = await import("../src/themes/seventies");
    for (const family of [kawaiiThemes, lessIsMoreThemes, seventiesThemes]) {
      expect(family.find((t) => t.category === "base" && t.scheme === "light")).toBeDefined();
      expect(family.find((t) => t.category === "base" && t.scheme === "dark")).toBeDefined();
    }
  });
});

describe("Family helpers", () => {
  it("should group themes by family", async () => {
    const { groupByFamily, defaultThemes } = await import("../src/theme-config");
    const { allBundledThemes } = await import("../src/themes/index");
    const families = groupByFamily([...defaultThemes, ...allBundledThemes]);
    const ids = families.map((f) => f.id);
    expect(ids).toContain("default");
    expect(ids).toContain("kawaii");
    expect(ids).toContain("less-is-more");
    expect(ids).toContain("seventies");
    expect(families).toHaveLength(4);
  });

  it("should get unique family IDs", async () => {
    const { getFamilyIds } = await import("../src/theme-config");
    const { allBundledThemes } = await import("../src/themes/index");
    const ids = getFamilyIds(allBundledThemes);
    expect(ids).toHaveLength(3);
  });

  it("should resolve best variant for a family", async () => {
    const { groupByFamily, resolveVariant } = await import("../src/theme-config");
    const { kawaiiThemes } = await import("../src/themes/kawaii");
    const families = groupByFamily(kawaiiThemes);
    const kawaii = families[0];

    expect(resolveVariant(kawaii, "light", "base").id).toBe("kawaii-light");
    expect(resolveVariant(kawaii, "dark", "high-contrast").id).toBe("kawaii-hc-dark");

    // Fallback: color-blind not available, should get base
    const fallback = resolveVariant(kawaii, "light", "color-blind");
    expect(fallback.scheme).toBe("light");
  });
});
