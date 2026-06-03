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
    const { initTheme, themeInitScript, generateThemeInitScript } = await import("../src/core/index");
    expect(typeof initTheme).toBe("function");
    expect(typeof themeInitScript).toBe("string");
    expect(themeInitScript).toContain("theme-mode");
    expect(typeof generateThemeInitScript).toBe("function");
  });

  it("should export attribute-theming helpers", async () => {
    const { generateThemeStylesheet, clearThemeColors } = await import("../src/core/index");
    expect(typeof generateThemeStylesheet).toBe("function");
    expect(typeof clearThemeColors).toBe("function");
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

  it("should have normal + high-contrast variants on the contrast axis", async () => {
    const { defaultThemes } = await import("../src/theme-config");
    expect(defaultThemes.filter((t) => (t.contrast ?? "normal") === "normal")).toHaveLength(2);
    expect(defaultThemes.filter((t) => t.contrast === "more")).toHaveLength(2);
  });

  it("should have scheme and family on all themes", async () => {
    const { defaultThemes } = await import("../src/theme-config");
    for (const theme of defaultThemes) {
      expect(["light", "dark"]).toContain(theme.scheme);
      expect(theme.family).toBe("default");
    }
  });

  it('should filter by preset "basic" (scheme only)', async () => {
    const { defaultThemes, filterThemesByPreset } = await import("../src/theme-config");
    const basic = filterThemesByPreset(defaultThemes, "basic");
    expect(basic).toHaveLength(2);
    expect(basic.every((t) => (t.contrast ?? "normal") === "normal" && !t.variation)).toBe(true);
  });

  it('should filter by preset "accessible" (adds contrast)', async () => {
    const { defaultThemes, filterThemesByPreset } = await import("../src/theme-config");
    expect(filterThemesByPreset(defaultThemes, "accessible")).toHaveLength(4);
  });

  it("should filter by a custom axis list (legacy category values mapped)", async () => {
    const { defaultThemes, filterThemesByPreset } = await import("../src/theme-config");
    // scheme-only drops the high-contrast variants
    expect(filterThemesByPreset(defaultThemes, ["scheme"])).toHaveLength(2);
    // enabling the contrast axis keeps them
    expect(filterThemesByPreset(defaultThemes, ["contrast"])).toHaveLength(4);
    // legacy "high-contrast" category value is tolerated and maps to the contrast axis
    expect(filterThemesByPreset(defaultThemes, ["high-contrast"] as never)).toHaveLength(4);
  });

  it("should generate valid CSS from theme config", async () => {
    const { defaultThemes, generateThemeCSS } = await import("../src/theme-config");
    const css = generateThemeCSS(defaultThemes[0]);
    expect(css).toContain("--theme-bg-primary");
    expect(css).toContain("--theme-fg-primary");
    expect(css).toContain("--theme-interactive-default");
  });
});

describe("Attribute theming helpers", () => {
  it("generateThemeCSS without a selector returns bare declarations (regression)", async () => {
    const { defaultThemes, generateThemeCSS } = await import("../src/theme-config");
    const css = generateThemeCSS(defaultThemes[0]);
    expect(css).not.toContain("{");
    expect(css.trim().startsWith("--theme-bg-primary")).toBe(true);
  });

  it("generateThemeCSS with a selector wraps the declarations in a rule", async () => {
    const { defaultThemes, generateThemeCSS } = await import("../src/theme-config");
    const css = generateThemeCSS(defaultThemes[0], '[data-theme="light"]');
    expect(css.startsWith('[data-theme="light"] {')).toBe(true);
    expect(css).toContain("--theme-bg-primary");
    expect(css.trimEnd().endsWith("}")).toBe(true);
  });

  it("generateThemeStylesheet emits one rule per theme keyed by id", async () => {
    const { defaultThemes, generateThemeStylesheet } = await import("../src/theme-config");
    const sheet = generateThemeStylesheet(defaultThemes);
    expect(sheet).toContain('[data-theme="light"]');
    expect(sheet).toContain('[data-theme="high-contrast-dark"]');
  });

  it("generateThemeStylesheet honors a custom attribute name", async () => {
    const { defaultThemes, generateThemeStylesheet } = await import("../src/theme-config");
    const sheet = generateThemeStylesheet(defaultThemes, "data-color-mode");
    expect(sheet).toContain('[data-color-mode="light"]');
    expect(sheet).not.toContain('[data-theme="light"]');
  });

  it("generateThemeInitScript() keeps the scheme-class contract", async () => {
    const { generateThemeInitScript } = await import("../src/core/theme-init");
    const script = generateThemeInitScript();
    expect(script).toContain("theme-mode");
    expect(script).not.toContain("theme-attr-name");
  });

  it("generateThemeInitScript({ applyAttribute }) replays the data attribute", async () => {
    const { generateThemeInitScript } = await import("../src/core/theme-init");
    const script = generateThemeInitScript({ applyAttribute: true, attributeName: "data-theme" });
    expect(script).toContain("setAttribute");
    expect(script).toContain("data-theme");
    expect(script).toContain("theme-attr-name");
  });

  it("generateThemeInitScript coerces a non-data attribute name", async () => {
    const { generateThemeInitScript } = await import("../src/core/theme-init");
    const script = generateThemeInitScript({ applyAttribute: true, attributeName: "mode" });
    expect(script).toContain('"data-mode"');
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
    const cb = seventiesThemes.filter((t) => t.variation);
    expect(cb.length).toBeGreaterThan(0);
    const ids = cb.map((t) => t.id);
    expect(ids.some((id) => id.includes("protanopia"))).toBe(true);
    expect(ids.some((id) => id.includes("deuteranopia"))).toBe(true);
    expect(ids.some((id) => id.includes("tritanopia"))).toBe(true);
    expect(ids.some((id) => id.includes("achromatopsia"))).toBe(true);
  });

  it("color-blind variants carry a specific variation; base/high-contrast do not", async () => {
    const { seventiesThemes } = await import("../src/themes/seventies");
    const variations = new Set(seventiesThemes.filter((t) => t.variation).map((t) => t.variation));
    expect(variations).toEqual(new Set(["protanopia", "deuteranopia", "tritanopia", "achromatopsia"]));
    // Only the color-vision variants carry a variation; base + high-contrast don't.
    const nonCvd = seventiesThemes.filter((t) => !t.variation);
    expect(nonCvd).toHaveLength(4); // light, dark, hc-light, hc-dark
  });

  it("each family should have light + dark base variants", async () => {
    const { kawaiiThemes } = await import("../src/themes/kawaii");
    const { lessIsMoreThemes } = await import("../src/themes/less-is-more");
    const { seventiesThemes } = await import("../src/themes/seventies");
    const isBase = (t: { contrast?: string; variation?: string }) =>
      (t.contrast ?? "normal") === "normal" && !t.variation;
    for (const family of [kawaiiThemes, lessIsMoreThemes, seventiesThemes]) {
      expect(family.find((t) => isBase(t) && t.scheme === "light")).toBeDefined();
      expect(family.find((t) => isBase(t) && t.scheme === "dark")).toBeDefined();
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

  it("should resolve the best theme for an axis tuple", async () => {
    const { groupByFamily, resolveTheme } = await import("../src/theme-config");
    const { kawaiiThemes } = await import("../src/themes/kawaii");
    const families = groupByFamily(kawaiiThemes);
    const kawaii = families[0];

    expect(resolveTheme(kawaii, "light", "normal", "normal").id).toBe("kawaii-light");
    expect(resolveTheme(kawaii, "dark", "more", "normal").id).toBe("kawaii-hc-dark");

    // Fallback: kawaii has no color-vision variant → drops to the plain light palette.
    const fallback = resolveTheme(kawaii, "light", "normal", "protanopia");
    expect(fallback.id).toBe("kawaii-light");

    // Fallback relaxes variation before contrast: hc + (missing) protanopia → hc light.
    expect(resolveTheme(kawaii, "light", "more", "protanopia").id).toBe("kawaii-hc-light");
  });
});
