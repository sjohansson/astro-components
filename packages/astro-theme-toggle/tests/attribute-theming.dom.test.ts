import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { registerThemeController, registerThemeToggle } from "../src/core/index";

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
    expect(root().getAttribute("data-theme")).toBeNull();
    expect(root().style.getPropertyValue("--theme-bg-primary")).not.toBe("");
    expect(root().classList.contains("scheme-light")).toBe(true);
  });

  it("attribute mode sets data attribute + companions and NO inline vars", () => {
    mount("theme-controller", { "apply-mode": "attribute" });
    expect(root().getAttribute("data-theme")).toBe("light");
    expect(root().getAttribute("data-theme-family")).toBe("default");
    expect(root().getAttribute("data-theme-scheme")).toBe("light");
    expect(root().getAttribute("data-theme-category")).toBe("base");
    expect(root().style.getPropertyValue("--theme-bg-primary")).toBe("");
    // classes are still applied in every mode
    expect(root().classList.contains("scheme-light")).toBe(true);
  });

  it("both mode sets the data attribute AND inline vars", () => {
    mount("theme-controller", { "apply-mode": "both" });
    expect(root().getAttribute("data-theme")).toBe("light");
    expect(root().style.getPropertyValue("--theme-bg-primary")).not.toBe("");
  });

  it("attribute-companions=false sets only the base attribute", () => {
    mount("theme-controller", { "apply-mode": "attribute", "attribute-companions": "false" });
    expect(root().getAttribute("data-theme")).toBe("light");
    expect(root().getAttribute("data-theme-scheme")).toBeNull();
    expect(root().getAttribute("data-theme-family")).toBeNull();
  });

  it("custom attribute-name is used and coerced to start with data-", () => {
    mount("theme-controller", { "apply-mode": "attribute", "attribute-name": "color" });
    expect(root().getAttribute("data-color")).toBe("light");
    expect(root().getAttribute("data-color-scheme")).toBe("light");
  });

  it("switching attribute -> inline removes the data attributes and restores inline vars", () => {
    const el = mount("theme-controller", { "apply-mode": "attribute" });
    expect(root().getAttribute("data-theme")).toBe("light");

    el.setAttribute("apply-mode", "inline");
    expect(root().getAttribute("data-theme")).toBeNull();
    expect(root().getAttribute("data-theme-scheme")).toBeNull();
    expect(root().style.getPropertyValue("--theme-bg-primary")).not.toBe("");
  });

  it("persists FOUC replay keys in attribute mode", () => {
    mount("theme-controller", { "apply-mode": "attribute" });
    expect(localStorage.getItem("theme-attr-name")).toBe("data-theme");
    expect(localStorage.getItem("theme-resolved-id")).toBe("light");
    expect(localStorage.getItem("theme-resolved-scheme")).toBe("light");
    expect(localStorage.getItem("theme-attr-companions")).toBe("1");
  });
});

describe("<theme-toggle> apply modes", () => {
  it("default mode toggles the .dark class only (backwards compat)", () => {
    localStorage.setItem("theme", "dark");
    mount("theme-toggle");
    expect(root().classList.contains("dark")).toBe(true);
    expect(root().getAttribute("data-theme")).toBeNull();
  });

  it("attribute mode sets data attribute(s) and no .dark class", () => {
    localStorage.setItem("theme", "dark");
    mount("theme-toggle", { "apply-mode": "attribute" });
    expect(root().getAttribute("data-theme")).toBe("dark");
    expect(root().getAttribute("data-theme-scheme")).toBe("dark");
    expect(root().classList.contains("dark")).toBe(false);
  });

  it("both mode sets the .dark class AND the data attribute", () => {
    localStorage.setItem("theme", "dark");
    mount("theme-toggle", { "apply-mode": "both" });
    expect(root().classList.contains("dark")).toBe(true);
    expect(root().getAttribute("data-theme")).toBe("dark");
  });

  it("honors a custom attribute name", () => {
    localStorage.setItem("theme", "light");
    mount("theme-toggle", { "apply-mode": "attribute", "attribute-name": "data-mode" });
    expect(root().getAttribute("data-mode")).toBe("light");
    expect(root().getAttribute("data-mode-scheme")).toBe("light");
  });
});

describe("initTheme() attribute replay", () => {
  it("replays persisted attributes onto <html>", async () => {
    const { initTheme } = await import("../src/core/index");
    localStorage.setItem("theme-mode", "dark");
    localStorage.setItem("theme-attr-name", "data-theme");
    localStorage.setItem("theme-resolved-id", "high-contrast-dark");
    localStorage.setItem("theme-resolved-family", "default");
    localStorage.setItem("theme-resolved-scheme", "dark");
    localStorage.setItem("theme-resolved-category", "high-contrast");
    localStorage.setItem("theme-attr-companions", "1");

    initTheme();

    expect(root().getAttribute("data-theme")).toBe("high-contrast-dark");
    expect(root().getAttribute("data-theme-family")).toBe("default");
    expect(root().getAttribute("data-theme-scheme")).toBe("dark");
    expect(root().getAttribute("data-theme-category")).toBe("high-contrast");
  });
});
