import { beforeEach, describe, expect, it } from "vitest";
import { registerAll } from "../src/core/index";
import { generateThemeInitScript, initTheme } from "../src/core/theme-init";
import { applyThemeColors, clearThemeColors, defaultThemes, generateThemeStylesheet } from "../src/theme-config";

/**
 * Coverage for the standalone helpers: `registerAll`, the FOUC init script and
 * its programmatic twin, and the inline custom-property helpers.
 */

/** Minimal in-memory Storage — see the note in attribute-theming.dom.test.ts. */
class MemoryStorage {
  private store = new Map<string, string>();
  get length(): number {
    return this.store.size;
  }
  clear(): void {
    this.store.clear();
  }
  getItem(key: string): string | null {
    return this.store.has(key) ? (this.store.get(key) as string) : null;
  }
  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  key(index: number): string | null {
    return [...this.store.keys()][index] ?? null;
  }
}

Object.defineProperty(globalThis, "localStorage", {
  value: new MemoryStorage(),
  configurable: true,
  writable: true,
});

const root = () => document.documentElement;

/** Swap in a matchMedia whose result we control, restoring the original after. */
function stubMatchMedia(matches: (query: string) => boolean): () => void {
  const original = Object.getOwnPropertyDescriptor(window, "matchMedia");
  Object.defineProperty(window, "matchMedia", {
    value: (query: string) => ({
      matches: matches(query),
      media: query,
      addEventListener() {},
      removeEventListener() {},
    }),
    configurable: true,
    writable: true,
  });
  return () => {
    if (original) {
      Object.defineProperty(window, "matchMedia", original);
    }
  };
}

beforeEach(() => {
  const el = root();
  for (const attr of [...el.attributes]) {
    if (attr.name.startsWith("data-")) {
      el.removeAttribute(attr.name);
    }
  }
  el.removeAttribute("style");
  el.className = "";
  localStorage.clear();
});

describe("registerAll()", () => {
  it("defines all three custom elements", () => {
    registerAll();
    expect(customElements.get("theme-toggle")).toBeDefined();
    expect(customElements.get("theme-controller")).toBeDefined();
    expect(customElements.get("theme-preview")).toBeDefined();
  });

  it("is idempotent", () => {
    registerAll();
    expect(() => {
      registerAll();
    }).not.toThrow();
  });
});

describe("initTheme()", () => {
  it("adds scheme-dark for system mode when the OS prefers dark", () => {
    const restore = stubMatchMedia((q) => q.includes("prefers-color-scheme: dark"));
    try {
      initTheme();
      expect(root().classList.contains("scheme-dark")).toBe(true);
    } finally {
      restore();
    }
  });

  it("adds scheme-light for system mode when the OS prefers light", () => {
    const restore = stubMatchMedia(() => false);
    try {
      initTheme();
      expect(root().classList.contains("scheme-light")).toBe(true);
    } finally {
      restore();
    }
  });

  it("adds no scheme class when the mode is explicit", () => {
    localStorage.setItem("theme-mode", "dark");
    initTheme();
    expect(root().classList.contains("scheme-dark")).toBe(false);
    expect(root().classList.contains("scheme-light")).toBe(false);
  });

  it("skips the attribute replay when nothing has been persisted", () => {
    initTheme();
    expect(root().dataset.theme).toBeUndefined();
  });

  it("replays only the base attribute when companions are disabled", () => {
    localStorage.setItem("theme-attr-name", "data-theme");
    localStorage.setItem("theme-resolved-id", "seventies-dark");
    localStorage.setItem("theme-resolved-family", "seventies");
    localStorage.setItem("theme-attr-companions", "0");

    initTheme();
    expect(root().dataset.theme).toBe("seventies-dark");
    expect(root().dataset.themeFamily).toBeUndefined();
    expect(root().dataset.themeScheme).toBeUndefined();
  });

  it("derives scheme and contrast from the OS while both axes follow the system", () => {
    localStorage.setItem("theme-attr-name", "data-theme");
    localStorage.setItem("theme-resolved-id", "high-contrast-dark");
    const restore = stubMatchMedia(() => true);
    try {
      initTheme();
      expect(root().dataset.themeScheme).toBe("dark");
      expect(root().dataset.themeContrast).toBe("more");
    } finally {
      restore();
    }
  });

  it("falls back to normal contrast when the OS reports no contrast preference", () => {
    localStorage.setItem("theme-attr-name", "data-theme");
    localStorage.setItem("theme-resolved-id", "light");
    const restore = stubMatchMedia(() => false);
    try {
      initTheme();
      expect(root().dataset.themeScheme).toBe("light");
      expect(root().dataset.themeContrast).toBe("normal");
    } finally {
      restore();
    }
  });

  it("fails silently when storage throws", () => {
    const original = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
    Object.defineProperty(globalThis, "localStorage", {
      value: {
        getItem() {
          throw new Error("blocked");
        },
      },
      configurable: true,
      writable: true,
    });
    try {
      expect(() => {
        initTheme();
      }).not.toThrow();
    } finally {
      if (original) {
        Object.defineProperty(globalThis, "localStorage", original);
      }
    }
  });
});

describe("generateThemeInitScript()", () => {
  it("emits only the scheme-class branch by default", () => {
    const script = generateThemeInitScript();
    expect(script).toContain("theme-mode");
    expect(script).toContain("scheme-dark");
    expect(script).not.toContain("theme-attr-name");
  });

  it("wraps the body so a storage failure cannot break the page", () => {
    expect(generateThemeInitScript()).toMatch(/^\(function\(\)\{try\{.*\}catch\(e\)\{\}\}\)\(\);$/s);
  });

  it("emits the attribute replay when requested", () => {
    const script = generateThemeInitScript({ applyAttribute: true });
    expect(script).toContain("theme-attr-name");
    expect(script).toContain("theme-resolved-variation");
  });

  it("coerces a bare attribute name to a data- attribute", () => {
    expect(generateThemeInitScript({ applyAttribute: true, attributeName: "palette" })).toContain("data-palette");
  });

  it("escapes characters that would break out of an inline script tag", () => {
    const script = generateThemeInitScript({ applyAttribute: true, attributeName: "data-x</script>" });
    expect(script).not.toContain("</script>");
    expect(script).toContain("\\u003C");
  });
});

describe("inline custom-property helpers", () => {
  it("applies and then clears every theme color token", () => {
    const theme = defaultThemes[0];
    if (!theme) {
      throw new Error("expected at least one default theme");
    }
    const el = document.createElement("div");

    applyThemeColors(theme.colors, el);
    expect(el.style.getPropertyValue("--theme-bg-primary")).toBe(theme.colors.background.primary);
    expect(el.style.getPropertyValue("--theme-info")).toBe(theme.colors.semantic.info);

    clearThemeColors(el);
    expect(el.style.getPropertyValue("--theme-bg-primary")).toBe("");
    expect(el.style.getPropertyValue("--theme-info")).toBe("");
  });
});

describe("generateThemeStylesheet()", () => {
  it("emits one attribute-scoped rule per theme", () => {
    const css = generateThemeStylesheet(defaultThemes);
    for (const theme of defaultThemes) {
      expect(css).toContain(`[data-theme="${theme.id}"]`);
    }
    expect(css).toContain("--theme-bg-primary");
  });

  it("honors a custom base attribute name", () => {
    const css = generateThemeStylesheet(defaultThemes, "data-palette");
    expect(css).toContain('[data-palette="');
    expect(css).not.toContain('[data-theme="');
  });
});
