import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { registerThemeController, ThemeControllerElement } from "../src/core/theme-controller";
import { defaultThemes } from "../src/theme-config";
import { seventiesThemes } from "../src/themes/seventies";

/**
 * DOM behavior tests for the <theme-controller> UI: panel open/close, side and
 * direction resolution, option-button wiring, family swatches, and the
 * programmatic API. The apply-mode / data-attribute contract is covered
 * separately in attribute-theming.dom.test.ts.
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

type Controller = HTMLElement & ThemeControllerElement;

const root = () => document.documentElement;
const multiFamilyThemes = JSON.stringify([...defaultThemes, ...seventiesThemes]);

function mount(attrs: Record<string, string> = {}): Controller {
  const el = document.createElement("theme-controller");
  for (const [k, v] of Object.entries(attrs)) {
    el.setAttribute(k, v);
  }
  document.body.appendChild(el);
  return el as Controller;
}

const q = <T extends HTMLElement>(el: HTMLElement, selector: string): T => el.querySelector<T>(selector) as T;
const trigger = (el: HTMLElement) => q<HTMLElement>(el, "[data-theme-trigger]");
const panel = (el: HTMLElement) => q<HTMLElement>(el, ".theme-panel");
const inner = (el: HTMLElement) => q<HTMLElement>(el, ".theme-controller-inner");
const isOpen = (el: HTMLElement) => panel(el).classList.contains("open");

/** Override getBoundingClientRect for the trigger and panel of one controller. */
function stubRects(el: HTMLElement, rects: { trigger: Partial<DOMRect>; panel: Partial<DOMRect> }): void {
  const apply = (target: HTMLElement, rect: Partial<DOMRect>) => {
    target.getBoundingClientRect = () => ({ x: 0, y: 0, toJSON: () => ({}), ...rect }) as DOMRect;
  };
  apply(trigger(el), rects.trigger);
  apply(panel(el), rects.panel);
}

/** A trigger pinned near the viewport end, with a panel too large to fit after it. */
const CLIPPED_END = {
  trigger: { top: 700, bottom: 740, left: 980, right: 1020, width: 40, height: 40 },
  panel: { top: 0, bottom: 300, left: 0, right: 300, width: 300, height: 300 },
};

beforeAll(() => {
  Object.defineProperty(globalThis, "localStorage", {
    value: new MemoryStorage(),
    configurable: true,
    writable: true,
  });
  registerThemeController();
});

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
  document.body.innerHTML = "";
});

describe("<theme-controller> registration", () => {
  it("defines the custom element", () => {
    expect(customElements.get("theme-controller")).toBe(ThemeControllerElement);
  });

  it("is idempotent", () => {
    expect(() => {
      registerThemeController();
    }).not.toThrow();
  });
});

describe("<theme-controller> panel", () => {
  it("renders a closed panel with an unexpanded trigger", () => {
    const el = mount();
    expect(panel(el)).not.toBeNull();
    expect(isOpen(el)).toBe(false);
    expect(trigger(el).getAttribute("aria-expanded")).toBe("false");
  });

  it("opens and closes on trigger clicks", () => {
    const el = mount();
    trigger(el).click();
    expect(isOpen(el)).toBe(true);
    expect(trigger(el).getAttribute("aria-expanded")).toBe("true");

    trigger(el).click();
    expect(isOpen(el)).toBe(false);
    expect(trigger(el).getAttribute("aria-expanded")).toBe("false");
  });

  it("closes on a click outside the element", () => {
    const el = mount();
    trigger(el).click();
    expect(isOpen(el)).toBe(true);

    document.body.click();
    expect(isOpen(el)).toBe(false);
  });

  it("stays open on a click inside the panel", () => {
    const el = mount();
    trigger(el).click();
    panel(el).click();
    expect(isOpen(el)).toBe(true);
  });

  it("ignores an outside click while already closed", () => {
    const el = mount();
    document.body.click();
    expect(isOpen(el)).toBe(false);
    expect(trigger(el).getAttribute("aria-expanded")).toBe("false");
  });
});

describe("<theme-controller> panel side", () => {
  it("opens toward the end by default", () => {
    const el = mount();
    trigger(el).click();
    expect(inner(el).dataset.side).toBe("end");
  });

  it("honors an explicit expand-side", () => {
    const el = mount({ "expand-side": "start" });
    expect(inner(el).dataset.side).toBe("start");
    trigger(el).click();
    expect(inner(el).dataset.side).toBe("start");
  });

  it("flips to the start side when the end would clip (vertical)", () => {
    const el = mount({ "expand-direction": "vertical" });
    // happy-dom never lays out, so feed the measurement explicitly: a trigger
    // pinned near the bottom of the viewport with a tall panel below it.
    stubRects(el, CLIPPED_END);
    trigger(el).click();
    expect(inner(el).dataset.side).toBe("start");
  });

  it("flips to the start side when the end would clip (horizontal)", () => {
    const el = mount({ "expand-direction": "horizontal" });
    stubRects(el, CLIPPED_END);
    trigger(el).click();
    expect(inner(el).dataset.side).toBe("start");
  });
});

describe("<theme-controller> direction and labels", () => {
  it("resolves auto expand-direction from the viewport width", () => {
    const el = mount();
    // happy-dom's default viewport is wider than the 768px breakpoint.
    expect(window.innerWidth).toBeGreaterThan(768);
    expect(inner(el).dataset.direction).toBe("vertical");
  });

  it("honors an explicit expand-direction", () => {
    expect(inner(mount({ "expand-direction": "horizontal" })).dataset.direction).toBe("horizontal");
    expect(inner(mount({ "expand-direction": "vertical" })).dataset.direction).toBe("vertical");
  });

  it("stacks sections vertically for auto sections-direction", () => {
    expect(inner(mount()).dataset.sectionsDirection).toBe("vertical");
    expect(inner(mount({ "sections-direction": "horizontal" })).dataset.sectionsDirection).toBe("horizontal");
  });

  it("derives the label position from the expand direction when auto", () => {
    expect(inner(mount({ "expand-direction": "horizontal" })).dataset.labelPosition).toBe("below");
    expect(inner(mount({ "expand-direction": "vertical" })).dataset.labelPosition).toBe("right");
  });

  it("honors an explicit label-position", () => {
    expect(inner(mount({ "label-position": "above" })).dataset.labelPosition).toBe("above");
    expect(inner(mount({ "label-position": "left" })).dataset.labelPosition).toBe("left");
  });

  it("flags label visibility from the show-labels attribute", () => {
    expect(inner(mount()).hasAttribute("data-show-labels")).toBe(false);
    const labelled = mount({ "show-labels": "" });
    expect(inner(labelled).hasAttribute("data-show-labels")).toBe(true);
    expect(labelled.querySelectorAll(".option-label").length).toBeGreaterThan(0);
  });
});

describe("<theme-controller> resize handling", () => {
  afterEach(() => {
    vi.useRealTimers();
    Object.defineProperty(window, "innerWidth", { value: 1024, configurable: true, writable: true });
  });

  it("re-applies direction on a debounced resize", () => {
    vi.useFakeTimers();
    const el = mount();
    expect(inner(el).dataset.direction).toBe("vertical");

    Object.defineProperty(window, "innerWidth", { value: 500, configurable: true, writable: true });
    window.dispatchEvent(new Event("resize"));
    // Debounced — nothing changes until the timer fires.
    expect(inner(el).dataset.direction).toBe("vertical");

    vi.advanceTimersByTime(100);
    expect(inner(el).dataset.direction).toBe("horizontal");
  });

  it("re-resolves the panel side on resize while open", () => {
    vi.useFakeTimers();
    const el = mount({ "expand-direction": "vertical" });
    trigger(el).click();
    expect(isOpen(el)).toBe(true);

    stubRects(el, CLIPPED_END);
    window.dispatchEvent(new Event("resize"));
    vi.advanceTimersByTime(100);

    expect(inner(el).dataset.side).toBe("start");
  });
});

describe("<theme-controller> option buttons", () => {
  it("renders the scheme axis by default and nothing more", () => {
    const el = mount();
    expect(el.querySelectorAll("[data-scheme-option]")).toHaveLength(3);
    expect(el.querySelectorAll("[data-contrast-option]")).toHaveLength(0);
    expect(el.querySelectorAll("[data-variation-option]")).toHaveLength(0);
  });

  it("adds the contrast axis for the accessible preset", () => {
    const el = mount({ preset: "accessible" });
    expect(el.querySelectorAll("[data-contrast-option]")).toHaveLength(3);
    expect(el.querySelectorAll("[data-variation-option]")).toHaveLength(0);
  });

  it("adds the color-vision axis for the full preset", () => {
    const el = mount({ preset: "full", themes: JSON.stringify(seventiesThemes) });
    const variations = el.querySelectorAll("[data-variation-option]");
    expect(variations.length).toBeGreaterThan(1);
    // 'normal' is always offered alongside the authored variations.
    expect([...variations].map((n) => n.getAttribute("data-variation-option"))).toContain("normal");
  });

  it("selects a scheme when its button is clicked", () => {
    const el = mount();
    q(el, '[data-scheme-option="dark"]').click();
    expect(root().classList.contains("scheme-dark")).toBe(true);
    expect(localStorage.getItem("theme-scheme")).toBe("dark");
  });

  it("selects a contrast when its button is clicked", () => {
    const el = mount({ preset: "accessible" });
    q(el, '[data-contrast-option="more"]').click();
    expect(localStorage.getItem("theme-contrast")).toBe("more");
    expect(root().classList.contains("theme-high-contrast-light")).toBe(true);
  });

  it("selects a color-vision variation when its button is clicked", () => {
    const el = mount({ preset: "full", themes: JSON.stringify(seventiesThemes) });
    q(el, '[data-variation-option="protanopia"]').click();
    expect(localStorage.getItem("theme-variation")).toBe("protanopia");
  });

  it("selects a family when its button is clicked", () => {
    const el = mount({ themes: multiFamilyThemes });
    expect(el.querySelectorAll("[data-family-option]").length).toBeGreaterThan(1);

    q(el, '[data-family-option="seventies"]').click();
    expect(localStorage.getItem("theme-family")).toBe("seventies");
    expect(root().classList.contains("family-seventies")).toBe(true);
  });

  it("leaves the panel open while several axes are adjusted", () => {
    const el = mount({ preset: "accessible" });
    trigger(el).click();
    q(el, '[data-scheme-option="dark"]').click();
    q(el, '[data-contrast-option="more"]').click();
    expect(isOpen(el)).toBe(true);
  });

  it("marks the selected option active and aria-checked", () => {
    const el = mount();
    q(el, '[data-scheme-option="dark"]').click();

    const dark = q(el, '[data-scheme-option="dark"]');
    const light = q(el, '[data-scheme-option="light"]');
    expect(dark.classList.contains("active")).toBe(true);
    expect(dark.getAttribute("aria-checked")).toBe("true");
    expect(light.classList.contains("active")).toBe(false);
    expect(light.getAttribute("aria-checked")).toBe("false");
  });
});

describe("<theme-controller> trigger icon", () => {
  it("shows the system glyph while every axis follows the OS", () => {
    const el = mount();
    expect(q(el, '[data-trigger-icon="system"]').style.display).toBe("block");
    expect(q(el, '[data-trigger-icon="scheme-light"]').style.display).toBe("none");
  });

  it("shows the scheme glyph once a scheme is chosen explicitly", () => {
    const el = mount();
    q(el, '[data-scheme-option="dark"]').click();
    expect(q(el, '[data-trigger-icon="scheme-dark"]').style.display).toBe("block");
    expect(q(el, '[data-trigger-icon="system"]').style.display).toBe("none");
  });
});

describe("<theme-controller> family swatches", () => {
  it("paints each family swatch with a color from the family", () => {
    const el = mount({ themes: multiFamilyThemes });
    for (const fam of el.getFamilies()) {
      const swatch = q(el, `[data-family-swatch="${fam.id}"]`);
      expect(swatch.style.backgroundColor).not.toBe("");
    }
  });

  it("renders no family section for a single family", () => {
    const el = mount({ themes: JSON.stringify(seventiesThemes) });
    expect(el.querySelectorAll("[data-family-option]")).toHaveLength(0);
  });
});

describe("<theme-controller> theme sources", () => {
  it("falls back to the default themes when the themes JSON is malformed", () => {
    const el = mount({ themes: "{not json" });
    expect(el.getThemes()).toHaveLength(defaultThemes.length);
  });

  it("restricts to a single family via the family attribute", () => {
    const el = mount({ themes: multiFamilyThemes, family: "seventies" });
    expect(el.getFamilies()).toHaveLength(1);
    expect(el.getThemes().every((t) => (t.family ?? t.id) === "seventies")).toBe(true);
  });

  it("survives a family attribute that matches nothing", () => {
    const el = mount({ family: "no-such-family" });
    expect(el.getThemes()).toHaveLength(0);
    expect(el.getFamilies()).toHaveLength(0);
    // No palette to resolve — falls back to the 'light' id for classes.
    expect(root().classList.contains("theme-light")).toBe(true);
  });

  it("returns copies from getThemes/getFamilies", () => {
    const el = mount();
    expect(el.getThemes()).not.toBe(el.getThemes());
    expect(el.getFamilies()).not.toBe(el.getFamilies());
  });
});

describe("<theme-controller> restored preferences", () => {
  it("restores a persisted family", () => {
    localStorage.setItem("theme-family", "seventies");
    const el = mount({ themes: multiFamilyThemes });
    expect(q(el, '[data-family-option="seventies"]').classList.contains("active")).toBe(true);
  });

  it("resets a persisted family that is no longer available", () => {
    localStorage.setItem("theme-family", "gone");
    const el = mount({ themes: multiFamilyThemes });
    const active = el.querySelector("[data-family-option].active");
    expect(active?.getAttribute("data-family-option")).toBe(el.getFamilies()[0]?.id);
  });

  it("resets a persisted variation that no theme offers", () => {
    localStorage.setItem("theme-variation", "tritanopia-plus");
    const el = mount({ preset: "full", themes: JSON.stringify(seventiesThemes) });
    expect(q(el, '[data-variation-option="normal"]').classList.contains("active")).toBe(true);
  });

  it("falls back to the legacy theme-mode key for the scheme axis", () => {
    localStorage.setItem("theme-mode", "dark");
    const el = mount();
    expect(q(el, '[data-scheme-option="dark"]').classList.contains("active")).toBe(true);
  });

  it("ignores a stale scheme value that is not a known axis option", () => {
    localStorage.setItem("theme-scheme", "sepia");
    const el = mount();
    expect(q(el, '[data-scheme-option="system"]').classList.contains("active")).toBe(true);
  });
});

describe("<theme-controller> programmatic API", () => {
  it("setFamily switches the active family", () => {
    const el = mount({ themes: multiFamilyThemes });
    el.setFamily("seventies");
    expect(root().classList.contains("family-seventies")).toBe(true);
  });

  it("setScheme switches the scheme axis", () => {
    const el = mount();
    el.setScheme("dark");
    expect(root().classList.contains("scheme-dark")).toBe(true);
    el.setScheme("light");
    expect(root().classList.contains("scheme-light")).toBe(true);
  });

  it("setContrast switches the contrast axis", () => {
    const el = mount({ preset: "accessible" });
    el.setContrast("more");
    expect(root().classList.contains("theme-high-contrast-light")).toBe(true);
  });

  it("setVariation falls back to normal for an empty value", () => {
    const el = mount({ preset: "full", themes: JSON.stringify(seventiesThemes) });
    el.setVariation("protanopia");
    expect(localStorage.getItem("theme-variation")).toBe("protanopia");
    el.setVariation("");
    expect(localStorage.getItem("theme-variation")).toBe("normal");
  });
});

describe("<theme-controller> setVariant (deprecated)", () => {
  const full = () => mount({ preset: "full", themes: JSON.stringify(seventiesThemes) });

  it("maps 'system' onto every axis following the OS", () => {
    full().setVariant("system");
    expect(localStorage.getItem("theme-scheme")).toBe("system");
    expect(localStorage.getItem("theme-contrast")).toBe("system");
    expect(localStorage.getItem("theme-variation")).toBe("normal");
  });

  it("maps a plain scheme key", () => {
    full().setVariant("base-dark");
    expect(localStorage.getItem("theme-scheme")).toBe("dark");
    expect(localStorage.getItem("theme-contrast")).toBe("normal");
    expect(localStorage.getItem("theme-variation")).toBe("normal");
  });

  it("maps the high-contrast key onto the contrast axis", () => {
    full().setVariant("high-contrast-dark");
    expect(localStorage.getItem("theme-scheme")).toBe("dark");
    expect(localStorage.getItem("theme-contrast")).toBe("more");
    expect(localStorage.getItem("theme-variation")).toBe("normal");
  });

  it("maps a color-blind key onto the color-vision axis", () => {
    full().setVariant("color-blind-protanopia-light");
    expect(localStorage.getItem("theme-scheme")).toBe("light");
    expect(localStorage.getItem("theme-contrast")).toBe("normal");
    expect(localStorage.getItem("theme-variation")).toBe("protanopia");
  });

  it("leaves the scheme axis alone for a key with no scheme suffix", () => {
    const el = full();
    el.setScheme("dark");
    el.setVariant("high-contrast");
    expect(localStorage.getItem("theme-scheme")).toBe("dark");
    expect(localStorage.getItem("theme-contrast")).toBe("normal");
  });
});

describe("<theme-controller> lifecycle", () => {
  /**
   * matchMedia stub that honours removeEventListener, so we can observe whether
   * a disconnected controller actually let go of its `change` subscriptions.
   * Each call returns a fresh object, as the real API does.
   */
  function trackedMatchMedia(): {
    listenerCount: () => number;
    setDark: (value: boolean) => void;
    restore: () => void;
  } {
    let dark = false;
    const listeners = new Set<() => void>();
    const original = Object.getOwnPropertyDescriptor(window, "matchMedia");
    Object.defineProperty(window, "matchMedia", {
      value: (query: string) => ({
        matches: query.includes("prefers-color-scheme: dark") ? dark : false,
        media: query,
        addEventListener: (_: string, fn: () => void) => listeners.add(fn),
        removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
      }),
      configurable: true,
      writable: true,
    });
    return {
      listenerCount: () => listeners.size,
      setDark: (value: boolean) => {
        dark = value;
        for (const fn of [...listeners]) {
          fn();
        }
      },
      restore: () => {
        if (original) {
          Object.defineProperty(window, "matchMedia", original);
        }
      },
    };
  }

  it("stops responding to astro:after-swap once disconnected", () => {
    const el = mount();
    el.setScheme("dark");
    el.remove();

    root().className = "";
    document.dispatchEvent(new Event("astro:after-swap"));
    expect(root().classList.contains("scheme-dark")).toBe(false);
  });

  it("stops responding to outside clicks once disconnected", () => {
    const el = mount();
    trigger(el).click();
    const detached = panel(el);
    el.remove();

    document.body.click();
    // The listener is gone, so the (now detached) panel keeps its open state.
    expect(detached.classList.contains("open")).toBe(true);
  });

  it("drops a pending resize callback on disconnect", () => {
    vi.useFakeTimers();
    try {
      const el = mount({ "expand-direction": "auto" });
      window.dispatchEvent(new Event("resize"));
      const detached = inner(el);
      el.remove();

      // A sentinel the debounced applyDirection() would overwrite if it ran.
      detached.setAttribute("data-direction", "sentinel");
      vi.advanceTimersByTime(200);
      expect(detached.getAttribute("data-direction")).toBe("sentinel");
    } finally {
      vi.useRealTimers();
    }
  });

  it("stops responding to resize once disconnected", () => {
    vi.useFakeTimers();
    try {
      const el = mount({ "expand-direction": "auto" });
      const detached = inner(el);
      el.remove();

      detached.setAttribute("data-direction", "sentinel");
      window.dispatchEvent(new Event("resize"));
      vi.advanceTimersByTime(200);
      expect(detached.getAttribute("data-direction")).toBe("sentinel");
    } finally {
      vi.useRealTimers();
    }
  });

  it("releases its system preference listeners on disconnect", () => {
    const media = trackedMatchMedia();
    try {
      const el = mount();
      expect(media.listenerCount()).toBeGreaterThan(0);

      el.remove();
      expect(media.listenerCount()).toBe(0);

      // Nothing left to write the removed controller's selection back onto <html>.
      root().className = "";
      media.setDark(true);
      expect(root().className).toBe("");
    } finally {
      media.restore();
    }
  });

  it("re-renders and re-applies when an observed attribute changes", () => {
    const el = mount();
    expect(el.querySelectorAll("[data-contrast-option]")).toHaveLength(0);

    el.setAttribute("preset", "accessible");
    expect(el.querySelectorAll("[data-contrast-option]")).toHaveLength(3);
  });

  it("re-applies on astro:after-swap while connected", () => {
    const el = mount();
    el.setScheme("dark");
    root().className = "";

    document.dispatchEvent(new Event("astro:after-swap"));
    expect(root().classList.contains("scheme-dark")).toBe(true);
  });
});

describe("<theme-controller> system preference changes", () => {
  /** Install a matchMedia stub whose `change` listeners we can fire by hand. */
  function stubMatchMedia(isDark: () => boolean): { fire: () => void; restore: () => void } {
    const listeners: Array<() => void> = [];
    const original = Object.getOwnPropertyDescriptor(window, "matchMedia");
    Object.defineProperty(window, "matchMedia", {
      value: (query: string) => ({
        matches: query.includes("prefers-color-scheme: dark") ? isDark() : false,
        media: query,
        addEventListener: (_: string, fn: () => void) => listeners.push(fn),
        removeEventListener() {},
      }),
      configurable: true,
      writable: true,
    });
    return {
      fire: () => {
        for (const fn of listeners) {
          fn();
        }
      },
      restore: () => {
        if (original) {
          Object.defineProperty(window, "matchMedia", original);
        }
      },
    };
  }

  it("re-applies when the OS scheme changes while the axis follows the system", () => {
    let systemDark = false;
    const media = stubMatchMedia(() => systemDark);
    try {
      mount();
      expect(root().classList.contains("scheme-light")).toBe(true);

      systemDark = true;
      media.fire();
      expect(root().classList.contains("scheme-dark")).toBe(true);
    } finally {
      media.restore();
    }
  });

  it("ignores OS changes once both system-aware axes are explicit", () => {
    let systemDark = false;
    const media = stubMatchMedia(() => systemDark);
    try {
      const el = mount({ preset: "accessible" });
      el.setScheme("light");
      el.setContrast("normal");

      systemDark = true;
      media.fire();
      expect(root().classList.contains("scheme-light")).toBe(true);
    } finally {
      media.restore();
    }
  });
});

describe("<theme-controller> section rendering", () => {
  it("labels each rendered axis section", () => {
    const el = mount({ preset: "full", themes: multiFamilyThemes });
    const titles = [...el.querySelectorAll(".theme-panel *")]
      .map((n) => n.textContent?.trim() ?? "")
      .filter((t) => ["Theme", "Scheme", "Contrast", "Color vision"].includes(t));
    expect(new Set(titles)).toEqual(new Set(["Theme", "Scheme", "Contrast", "Color vision"]));
  });

  it("separates sections with dividers", () => {
    const el = mount({ preset: "accessible" });
    expect(el.querySelectorAll(".panel-divider").length).toBeGreaterThan(0);
  });

  it("injects the stylesheet once", () => {
    mount();
    mount();
    expect(document.querySelectorAll("#theme-controller-styles")).toHaveLength(1);
  });
});
