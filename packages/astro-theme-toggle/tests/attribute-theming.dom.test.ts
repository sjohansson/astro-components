import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { registerThemeController, registerThemeToggle, seventiesThemes } from "../src/core/index";

/**
 * DOM behavior tests for the new data-attribute apply modes. The shared vitest
 * environment is happy-dom (configured at the repo root), so document,
 * localStorage, customElements, and matchMedia are all available.
 */

/**
 * Minimal in-memory Storage. Node 22+ exposes an experimental global
 * `localStorage` that is undefined without `--localstorage-file` and shadows
 * happy-dom's, so we install our own for this realm. The components reference
 * the bare global `localStorage`, which resolves to this once defined.
 */
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

const root = () => document.documentElement;

function resetRoot(): void {
  const el = root();
  for (const attr of [...el.attributes]) {
    if (attr.name.startsWith("data-")) {
      el.removeAttribute(attr.name);
    }
  }
  el.removeAttribute("style");
  el.className = "";
  localStorage.clear();
  document.body.innerHTML = "";
}

function mount(tag: string, attrs: Record<string, string> = {}): HTMLElement {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    el.setAttribute(k, v);
  }
  document.body.appendChild(el);
  return el;
}

beforeAll(() => {
  Object.defineProperty(globalThis, "localStorage", {
    value: new MemoryStorage(),
    configurable: true,
    writable: true,
  });
  registerThemeController();
  registerThemeToggle();
});

beforeEach(() => {
  resetRoot();
});

describe("<theme-controller> apply modes", () => {
  it("default mode sets inline vars + classes but NO data attribute (backwards compat)", () => {
    mount("theme-controller");
    expect(root().dataset.theme).toBeUndefined();
    expect(root().style.getPropertyValue("--theme-bg-primary")).not.toBe("");
    expect(root().classList.contains("scheme-light")).toBe(true);
  });

  it("attribute mode sets data attribute + companions and NO inline vars", () => {
    mount("theme-controller", { "apply-mode": "attribute" });
    expect(root().dataset.theme).toBe("light");
    expect(root().dataset.themeFamily).toBe("default");
    expect(root().dataset.themeScheme).toBe("light");
    expect(root().dataset.themeContrast).toBe("normal");
    expect(root().dataset.themeCategory).toBeUndefined(); // retired
    expect(root().style.getPropertyValue("--theme-bg-primary")).toBe("");
    // classes are still applied in every mode
    expect(root().classList.contains("scheme-light")).toBe(true);
  });

  it("both mode sets the data attribute AND inline vars", () => {
    mount("theme-controller", { "apply-mode": "both" });
    expect(root().dataset.theme).toBe("light");
    expect(root().style.getPropertyValue("--theme-bg-primary")).not.toBe("");
  });

  it("attribute-companions=false sets only the base attribute", () => {
    mount("theme-controller", { "apply-mode": "attribute", "attribute-companions": "false" });
    expect(root().dataset.theme).toBe("light");
    expect(root().dataset.themeScheme).toBeUndefined();
    expect(root().dataset.themeFamily).toBeUndefined();
  });

  it("custom attribute-name is used and coerced to start with data-", () => {
    mount("theme-controller", { "apply-mode": "attribute", "attribute-name": "color" });
    expect(root().dataset.color).toBe("light");
    expect(root().dataset.colorScheme).toBe("light");
  });

  it("switching attribute -> inline removes the data attributes and restores inline vars", () => {
    const el = mount("theme-controller", { "apply-mode": "attribute" });
    expect(root().dataset.theme).toBe("light");

    el.setAttribute("apply-mode", "inline");
    expect(root().dataset.theme).toBeUndefined();
    expect(root().dataset.themeScheme).toBeUndefined();
    expect(root().style.getPropertyValue("--theme-bg-primary")).not.toBe("");
  });

  it("persists FOUC replay keys in attribute mode", () => {
    mount("theme-controller", { "apply-mode": "attribute" });
    expect(localStorage.getItem("theme-attr-name")).toBe("data-theme");
    expect(localStorage.getItem("theme-resolved-id")).toBe("light");
    expect(localStorage.getItem("theme-resolved-scheme")).toBe("light");
    expect(localStorage.getItem("theme-attr-companions")).toBe("1");
  });

  it("drives scheme/contrast/color-vision independently, with combined fallback", () => {
    const el = mount("theme-controller", {
      "apply-mode": "attribute",
      themes: JSON.stringify(seventiesThemes),
      preset: "full",
    }) as HTMLElement & {
      setScheme(v: string): void;
      setContrast(v: string): void;
      setVariation(v: string): void;
    };

    // A specific color-vision variation, no longer collapsed.
    el.setScheme("light");
    el.setVariation("protanopia");
    expect(root().dataset.theme).toBe("seventies-protanopia-light");
    expect(root().dataset.themeVariation).toBe("protanopia");
    expect(root().dataset.themeContrast).toBe("normal");
    expect(root().dataset.themeCategory).toBeUndefined(); // retired
    expect(localStorage.getItem("theme-resolved-variation")).toBe("protanopia");

    // A different color-vision type is reachable (not stuck on protanopia).
    el.setScheme("dark");
    el.setVariation("deuteranopia");
    expect(root().dataset.theme).toBe("seventies-deuteranopia-dark");
    expect(root().dataset.themeVariation).toBe("deuteranopia");

    // Combined high-contrast + color-vision: no concrete hc+protanopia palette
    // exists, so `data-theme` falls back to hc-light, but BOTH axis attributes
    // are set from the control state so a composed CSS selector still matches.
    el.setScheme("light");
    el.setContrast("more");
    el.setVariation("protanopia");
    expect(root().dataset.themeContrast).toBe("more");
    expect(root().dataset.themeVariation).toBe("protanopia");
    expect(root().dataset.theme).toBe("seventies-hc-light");

    // Back to normal clears the variation companion + key.
    el.setContrast("normal");
    el.setVariation("normal");
    expect(root().dataset.themeVariation).toBeUndefined();
    expect(localStorage.getItem("theme-resolved-variation")).toBeNull();
  });
});

describe("<theme-toggle> apply modes", () => {
  it("default mode toggles the .dark class only (backwards compat)", () => {
    localStorage.setItem("theme", "dark");
    mount("theme-toggle");
    expect(root().classList.contains("dark")).toBe(true);
    expect(root().dataset.theme).toBeUndefined();
  });

  it("attribute mode sets data attribute(s) and no .dark class", () => {
    localStorage.setItem("theme", "dark");
    mount("theme-toggle", { "apply-mode": "attribute" });
    expect(root().dataset.theme).toBe("dark");
    expect(root().dataset.themeScheme).toBe("dark");
    expect(root().classList.contains("dark")).toBe(false);
  });

  it("both mode sets the .dark class AND the data attribute", () => {
    localStorage.setItem("theme", "dark");
    mount("theme-toggle", { "apply-mode": "both" });
    expect(root().classList.contains("dark")).toBe(true);
    expect(root().dataset.theme).toBe("dark");
  });

  it("honors a custom attribute name", () => {
    localStorage.setItem("theme", "light");
    mount("theme-toggle", { "apply-mode": "attribute", "attribute-name": "data-mode" });
    expect(root().dataset.mode).toBe("light");
    expect(root().dataset.modeScheme).toBe("light");
  });

  it("strips controller-only companions (family/contrast/variation) it doesn't own", () => {
    // Simulate a prior <theme-controller apply-mode="attribute"> session: stale
    // companion attributes on <html> plus the FOUC replay keys in storage.
    root().setAttribute("data-theme-family", "seventies");
    root().setAttribute("data-theme-contrast", "more");
    root().setAttribute("data-theme-variation", "protanopia");
    localStorage.setItem("theme-resolved-family", "seventies");
    localStorage.setItem("theme-resolved-contrast", "more");
    localStorage.setItem("theme-resolved-variation", "protanopia");
    localStorage.setItem("theme", "light");

    mount("theme-toggle", { "apply-mode": "attribute" });

    // DOM: the toggle keeps only the scheme companion; foreign ones are removed.
    expect(root().dataset.theme).toBe("light");
    expect(root().dataset.themeScheme).toBe("light");
    expect(root().dataset.themeFamily).toBeUndefined();
    expect(root().dataset.themeContrast).toBeUndefined();
    expect(root().dataset.themeVariation).toBeUndefined();

    // Storage: replay keys cleared so the FOUC init script won't replay them.
    expect(localStorage.getItem("theme-resolved-family")).toBeNull();
    expect(localStorage.getItem("theme-resolved-contrast")).toBeNull();
    expect(localStorage.getItem("theme-resolved-variation")).toBeNull();
  });
});

describe("initTheme() attribute replay", () => {
  it("replays persisted attributes onto <html>, keeping variation through replay", async () => {
    const { initTheme } = await import("../src/core/index");
    localStorage.setItem("theme-mode", "dark"); // scheme not 'system' → use stored scheme
    localStorage.setItem("theme-contrast", "more"); // contrast axis not 'system' → use stored
    localStorage.setItem("theme-attr-name", "data-theme");
    localStorage.setItem("theme-resolved-id", "seventies-hc-dark");
    localStorage.setItem("theme-resolved-family", "seventies");
    localStorage.setItem("theme-resolved-scheme", "dark");
    localStorage.setItem("theme-resolved-contrast", "more");
    localStorage.setItem("theme-resolved-variation", "protanopia");
    localStorage.setItem("theme-attr-companions", "1");

    initTheme();

    expect(root().dataset.theme).toBe("seventies-hc-dark");
    expect(root().dataset.themeFamily).toBe("seventies");
    expect(root().dataset.themeScheme).toBe("dark");
    expect(root().dataset.themeContrast).toBe("more");
    expect(root().dataset.themeVariation).toBe("protanopia");
    expect(root().dataset.themeCategory).toBeUndefined();
  });
});
