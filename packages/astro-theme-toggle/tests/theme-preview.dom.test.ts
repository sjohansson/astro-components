import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { registerThemePreview, ThemePreviewElement } from "../src/core/theme-preview";
import { defaultThemes, groupByFamily } from "../src/theme-config";
import { seventiesThemes } from "../src/themes/seventies";

/**
 * DOM behavior tests for <theme-preview>. It renders a static palette grid, so
 * every assertion is against the generated markup.
 */

function mount(attrs: Record<string, string> = {}): HTMLElement {
  const el = document.createElement("theme-preview");
  for (const [k, v] of Object.entries(attrs)) {
    el.setAttribute(k, v);
  }
  document.body.appendChild(el);
  return el;
}

const cardTitles = (el: HTMLElement): string[] =>
  [...el.querySelectorAll(".tp-theme-name")].map((n) => n.textContent?.trim() ?? "");

beforeAll(() => {
  registerThemePreview();
});

beforeEach(() => {
  document.body.innerHTML = "";
  document.getElementById("theme-preview-styles")?.remove();
});

describe("<theme-preview> registration", () => {
  it("defines the custom element", () => {
    expect(customElements.get("theme-preview")).toBe(ThemePreviewElement);
  });

  it("is idempotent", () => {
    expect(() => {
      registerThemePreview();
    }).not.toThrow();
  });

  it("observes its filter attributes", () => {
    expect(ThemePreviewElement.observedAttributes).toEqual(["preset", "family", "theme", "themes"]);
  });
});

describe("<theme-preview> rendering", () => {
  it("renders the preview shell with a title", () => {
    const el = mount();
    expect(el.querySelector(".tp-preview")).not.toBeNull();
    expect(el.querySelector(".tp-preview-title")?.textContent).toBe("Theme Color Palette");
  });

  it("renders one card per default theme", () => {
    const el = mount();
    expect(el.querySelectorAll(".tp-theme-card")).toHaveLength(defaultThemes.length);
  });

  it("renders the four color sections per card", () => {
    const el = mount({ theme: defaultThemes[0]?.id ?? "light" });
    const titles = [...el.querySelectorAll(".tp-section-title")].map((n) => n.textContent);
    expect(titles).toEqual(["Background", "Foreground", "Interactive", "Semantic"]);
  });

  it("renders each swatch with its token name and value", () => {
    const theme = defaultThemes[0];
    const el = mount({ theme: theme?.id ?? "light" });
    const vars = [...el.querySelectorAll(".tp-color-var")].map((n) => n.textContent);
    expect(vars).toContain("--theme-bg-primary");
    expect(vars).toContain("--theme-info");

    const firstSwatch = el.querySelector(".tp-color-swatch") as HTMLElement;
    expect(firstSwatch.getAttribute("style")).toContain(theme?.colors.background.primary ?? "");
  });

  it("injects the stylesheet once", () => {
    mount();
    mount();
    expect(document.querySelectorAll("#theme-preview-styles")).toHaveLength(1);
    expect(document.getElementById("theme-preview-styles")?.textContent).toBe(ThemePreviewElement.styles);
  });
});

describe("<theme-preview> family headers", () => {
  it("shows family headers with a variant count when several families are rendered", () => {
    const el = mount({ themes: JSON.stringify([...defaultThemes, ...seventiesThemes]) });
    const headers = el.querySelectorAll(".tp-family-header");
    expect(headers.length).toBeGreaterThan(1);
    const counts = [...el.querySelectorAll(".tp-family-count")].map((n) => n.textContent);
    for (const count of counts) {
      expect(count).toMatch(/^\d+ variants?$/);
    }
  });

  it("omits family headers when only one family is rendered", () => {
    const el = mount({ themes: JSON.stringify([...defaultThemes, ...seventiesThemes]), family: "seventies" });
    expect(el.querySelectorAll(".tp-family-header")).toHaveLength(0);
  });

  it("prefixes the card title with the family label when headers are hidden", () => {
    const variant = seventiesThemes.find((t) => t.familyLabel);
    const el = mount({ themes: JSON.stringify(seventiesThemes), theme: variant?.id ?? "" });
    expect(cardTitles(el)[0]).toBe(`${variant?.familyLabel} — ${variant?.label}`);
  });

  it("uses the bare label when family headers are shown", () => {
    const el = mount({ themes: JSON.stringify([...defaultThemes, ...seventiesThemes]) });
    expect(cardTitles(el)).toContain(seventiesThemes[0]?.label ?? "");
  });
});

describe("<theme-preview> filtering", () => {
  it("renders the supplied themes JSON instead of the defaults", () => {
    const el = mount({ themes: JSON.stringify(seventiesThemes) });
    expect(el.querySelectorAll(".tp-theme-card")).toHaveLength(seventiesThemes.length);
  });

  it("falls back to the default themes when the JSON is malformed", () => {
    const el = mount({ themes: "{not json" });
    expect(el.querySelectorAll(".tp-theme-card")).toHaveLength(defaultThemes.length);
  });

  it("filters to a single theme by id", () => {
    const target = seventiesThemes[1];
    const el = mount({ themes: JSON.stringify(seventiesThemes), theme: target?.id ?? "" });
    expect(el.querySelectorAll(".tp-theme-card")).toHaveLength(1);
  });

  it("treats theme='all' as no filter", () => {
    const el = mount({ themes: JSON.stringify(seventiesThemes), theme: "all" });
    expect(el.querySelectorAll(".tp-theme-card")).toHaveLength(seventiesThemes.length);
  });

  it("filters by family id", () => {
    // A multi-family list, so the assertion fails if the filter is skipped.
    const all = [...defaultThemes, ...seventiesThemes];
    const family = groupByFamily(all).find((f) => f.id === "seventies");
    const el = mount({ themes: JSON.stringify(all), family: "seventies" });
    expect(family?.variants.length).toBeGreaterThan(0);
    expect(el.querySelectorAll(".tp-theme-card")).toHaveLength(family?.variants.length ?? 0);
    expect(el.querySelectorAll(".tp-theme-card").length).toBeLessThan(all.length);
  });

  it("narrows the rendered themes with the basic preset", () => {
    const all = mount({ themes: JSON.stringify(seventiesThemes) });
    const basic = mount({ themes: JSON.stringify(seventiesThemes), preset: "basic" });
    expect(basic.querySelectorAll(".tp-theme-card").length).toBeLessThan(all.querySelectorAll(".tp-theme-card").length);
  });

  it("renders nothing when the filters match no theme", () => {
    const el = mount({ theme: "no-such-theme" });
    expect(el.querySelectorAll(".tp-theme-card")).toHaveLength(0);
    expect(el.querySelector(".tp-preview")).not.toBeNull();
  });
});

describe("<theme-preview> attribute changes", () => {
  it("re-renders when a filter attribute changes while connected", () => {
    const el = mount({ themes: JSON.stringify(seventiesThemes) });
    expect(el.querySelectorAll(".tp-theme-card").length).toBeGreaterThan(1);

    el.setAttribute("theme", seventiesThemes[0]?.id ?? "");
    expect(el.querySelectorAll(".tp-theme-card")).toHaveLength(1);
  });

  it("does not render while disconnected", () => {
    const el = document.createElement("theme-preview");
    el.setAttribute("preset", "full");
    expect(el.innerHTML).toBe("");
  });
});
