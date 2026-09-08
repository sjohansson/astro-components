import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { registerThemeToggle, ThemeToggleElement } from "../src/core/theme-toggle";

/**
 * DOM behavior tests for <theme-toggle>: rendering, click toggling, system
 * preference fallback, SPA re-init, and attribute cleanup. The apply-mode
 * contract itself is covered in attribute-theming.dom.test.ts.
 */

/**
 * Minimal in-memory Storage. Node 22+ exposes an experimental global
 * `localStorage` that is undefined without `--localstorage-file` and shadows
 * happy-dom's, so we install our own for this realm.
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

const installStorage = (): void => {
  Object.defineProperty(globalThis, "localStorage", {
    value: new MemoryStorage(),
    configurable: true,
    writable: true,
  });
};

const root = () => document.documentElement;

function mount(attrs: Record<string, string> = {}): HTMLElement {
  const el = document.createElement("theme-toggle");
  for (const [k, v] of Object.entries(attrs)) {
    el.setAttribute(k, v);
  }
  document.body.appendChild(el);
  return el;
}

const button = (el: HTMLElement) => el.querySelector("button") as HTMLButtonElement;
const sunHidden = (el: HTMLElement) => el.querySelector(".sun-icon")?.classList.contains("hidden");
const moonHidden = (el: HTMLElement) => el.querySelector(".moon-icon")?.classList.contains("hidden");

/** Swap in a matchMedia whose result we control, restoring the original after. */
function stubMatchMedia(matches: boolean): () => void {
  const original = Object.getOwnPropertyDescriptor(window, "matchMedia");
  Object.defineProperty(window, "matchMedia", {
    value: (query: string) => ({ matches, media: query, addEventListener() {}, removeEventListener() {} }),
    configurable: true,
    writable: true,
  });
  return () => {
    if (original) {
      Object.defineProperty(window, "matchMedia", original);
    }
  };
}

beforeAll(() => {
  installStorage();
  registerThemeToggle();
});

beforeEach(() => {
  const el = root();
  for (const attr of [...el.attributes]) {
    if (attr.name.startsWith("data-")) {
      el.removeAttribute(attr.name);
    }
  }
  el.className = "";
  localStorage.clear();
  document.body.innerHTML = "";
});

describe("<theme-toggle> registration", () => {
  it("defines the custom element", () => {
    expect(customElements.get("theme-toggle")).toBe(ThemeToggleElement);
  });

  it("is idempotent", () => {
    expect(() => {
      registerThemeToggle();
    }).not.toThrow();
  });

  it("observes its apply-mode attributes", () => {
    expect(ThemeToggleElement.observedAttributes).toEqual(["apply-mode", "attribute-name", "attribute-companions"]);
  });
});

describe("<theme-toggle> rendering", () => {
  it("renders an accessible toggle button with both glyphs", () => {
    const el = mount();
    expect(button(el).getAttribute("aria-label")).toBe("Toggle theme");
    expect(button(el).getAttribute("type")).toBe("button");
    expect(el.querySelector(".sun-icon")).not.toBeNull();
    expect(el.querySelector(".moon-icon")).not.toBeNull();
    expect(el.querySelector(".sr-only")?.textContent).toBe("Toggle theme");
  });

  it("injects the stylesheet once", () => {
    mount();
    mount();
    expect(document.querySelectorAll("#theme-toggle-styles")).toHaveLength(1);
    expect(document.getElementById("theme-toggle-styles")?.textContent).toBe(ThemeToggleElement.styles);
  });
});

describe("<theme-toggle> initial theme", () => {
  it("uses the persisted theme when one is stored", () => {
    localStorage.setItem("theme", "dark");
    const el = mount();
    expect(root().classList.contains("dark")).toBe(true);
    expect(sunHidden(el)).toBe(true);
    expect(moonHidden(el)).toBe(false);
  });

  it("follows the OS dark preference when nothing is stored", () => {
    const restore = stubMatchMedia(true);
    try {
      mount();
      expect(root().classList.contains("dark")).toBe(true);
      expect(localStorage.getItem("theme")).toBe("dark");
    } finally {
      restore();
    }
  });

  it("falls back to light when the OS prefers no dark scheme", () => {
    const restore = stubMatchMedia(false);
    try {
      const el = mount();
      expect(root().classList.contains("dark")).toBe(false);
      expect(localStorage.getItem("theme")).toBe("light");
      expect(sunHidden(el)).toBe(false);
      expect(moonHidden(el)).toBe(true);
    } finally {
      restore();
    }
  });
});

describe("<theme-toggle> clicking", () => {
  it("toggles light to dark and back, persisting each choice", () => {
    localStorage.setItem("theme", "light");
    const el = mount();

    button(el).click();
    expect(root().classList.contains("dark")).toBe(true);
    expect(localStorage.getItem("theme")).toBe("dark");
    expect(sunHidden(el)).toBe(true);

    button(el).click();
    expect(root().classList.contains("dark")).toBe(false);
    expect(localStorage.getItem("theme")).toBe("light");
    expect(moonHidden(el)).toBe(true);
  });

  it("updates the data attribute on each click in attribute mode", () => {
    localStorage.setItem("theme", "light");
    const el = mount({ "apply-mode": "attribute" });
    expect(root().dataset.theme).toBe("light");

    button(el).click();
    expect(root().dataset.theme).toBe("dark");
    expect(root().dataset.themeScheme).toBe("dark");
  });

  it("stops toggling once disconnected", () => {
    localStorage.setItem("theme", "light");
    const el = mount();
    const btn = button(el);
    el.remove();

    btn.click();
    expect(localStorage.getItem("theme")).toBe("light");
  });
});

describe("<theme-toggle> SPA navigation", () => {
  it("re-applies the stored theme on astro:after-swap", () => {
    localStorage.setItem("theme", "dark");
    const el = mount();
    root().className = "";

    document.dispatchEvent(new Event("astro:after-swap"));
    expect(root().classList.contains("dark")).toBe(true);
    expect(sunHidden(el)).toBe(true);
  });

  it("re-binds its glyphs after a swap replaces the inner markup", () => {
    localStorage.setItem("theme", "dark");
    const el = mount();
    // A view transition swaps in fresh markup for the same element.
    el.innerHTML = '<button type="button"><svg class="sun-icon"></svg><svg class="moon-icon"></svg></button>';

    document.dispatchEvent(new Event("astro:after-swap"));
    expect(sunHidden(el)).toBe(true);
    expect(moonHidden(el)).toBe(false);
  });

  it("ignores astro:after-swap once disconnected", () => {
    localStorage.setItem("theme", "dark");
    const el = mount();
    el.remove();
    root().className = "";

    document.dispatchEvent(new Event("astro:after-swap"));
    expect(root().classList.contains("dark")).toBe(false);
  });
});

describe("<theme-toggle> attribute changes", () => {
  it("re-applies when apply-mode changes while connected", () => {
    localStorage.setItem("theme", "dark");
    const el = mount();
    expect(root().dataset.theme).toBeUndefined();

    el.setAttribute("apply-mode", "attribute");
    expect(root().dataset.theme).toBe("dark");
    expect(root().classList.contains("dark")).toBe(false);
  });

  it("cleans up the previous attribute set when attribute-name changes", () => {
    localStorage.setItem("theme", "light");
    const el = mount({ "apply-mode": "attribute", "attribute-name": "data-theme" });
    expect(root().dataset.theme).toBe("light");

    el.setAttribute("attribute-name", "data-mode");
    expect(root().dataset.theme).toBeUndefined();
    expect(root().dataset.themeScheme).toBeUndefined();
    expect(root().dataset.mode).toBe("light");
    expect(root().dataset.modeScheme).toBe("light");
  });

  it("drops the scheme companion when attribute-companions is disabled at runtime", () => {
    localStorage.setItem("theme", "light");
    const el = mount({ "apply-mode": "attribute" });
    expect(root().dataset.themeScheme).toBe("light");

    el.setAttribute("attribute-companions", "false");
    expect(root().dataset.theme).toBe("light");
    expect(root().dataset.themeScheme).toBeUndefined();
    expect(localStorage.getItem("theme-attr-companions")).toBe("0");
  });

  it("removes its data attributes when switching back to class mode", () => {
    localStorage.setItem("theme", "dark");
    const el = mount({ "apply-mode": "attribute" });
    expect(root().dataset.theme).toBe("dark");

    el.setAttribute("apply-mode", "class");
    expect(root().dataset.theme).toBeUndefined();
    expect(root().dataset.themeScheme).toBeUndefined();
    expect(root().classList.contains("dark")).toBe(true);
  });

  it("leaves a consumer-owned data-theme alone in class mode", () => {
    root().setAttribute("data-theme", "consumer-owned");
    localStorage.setItem("theme", "dark");
    mount();
    expect(root().dataset.theme).toBe("consumer-owned");
  });

  it("does not re-apply while disconnected", () => {
    const el = document.createElement("theme-toggle");
    el.setAttribute("apply-mode", "attribute");
    expect(root().dataset.theme).toBeUndefined();
  });
});

describe("<theme-toggle> without localStorage", () => {
  afterEach(() => {
    installStorage();
  });

  it("still renders and applies a theme when storage is unavailable", () => {
    Object.defineProperty(globalThis, "localStorage", { value: undefined, configurable: true, writable: true });
    const restore = stubMatchMedia(true);
    try {
      const el = mount({ "apply-mode": "attribute" });
      expect(button(el)).not.toBeNull();
      expect(root().dataset.theme).toBe("dark");
      expect(root().classList.contains("dark")).toBe(false);
    } finally {
      restore();
    }
  });
});
