import type {
  ThemeAxis,
  ThemeCategory,
  ThemeColors,
  ThemeConfig,
  ThemeContrast,
  ThemeFamily,
  ThemePreset,
  ThemeScheme,
} from "./types";

/**
 * Default theme configurations — a neutral family with no strong brand identity.
 * Suitable as a starting point or fallback.
 */
export const defaultThemes: ThemeConfig[] = [
  // ── Base themes ──
  {
    id: "light",
    family: "default",
    familyLabel: "Default",
    scheme: "light",
    label: "Light",
    description: "Standard light theme with comfortable contrast",
    colors: {
      background: {
        primary: "#ffffff",
        secondary: "#f8f9fa",
        tertiary: "#e9ecef",
      },
      foreground: {
        primary: "#212529",
        secondary: "#495057",
        tertiary: "#6c757d",
      },
      border: {
        default: "#dee2e6",
        hover: "#adb5bd",
        focus: "#0d6efd",
      },
      interactive: {
        default: "#0d6efd",
        hover: "#0b5ed7",
        active: "#0a58ca",
        disabled: "#6c757d",
      },
      semantic: {
        success: "#198754",
        warning: "#ffc107",
        error: "#dc3545",
        info: "#0dcaf0",
      },
    },
  },
  {
    id: "dark",
    family: "default",
    familyLabel: "Default",
    scheme: "dark",
    label: "Dark",
    description: "Standard dark theme with reduced eye strain",
    colors: {
      background: {
        primary: "#212529",
        secondary: "#343a40",
        tertiary: "#495057",
      },
      foreground: {
        primary: "#f8f9fa",
        secondary: "#dee2e6",
        tertiary: "#adb5bd",
      },
      border: {
        default: "#495057",
        hover: "#6c757d",
        focus: "#0d6efd",
      },
      interactive: {
        default: "#0d6efd",
        hover: "#3d8bfd",
        active: "#6ea8fe",
        disabled: "#495057",
      },
      semantic: {
        success: "#198754",
        warning: "#ffc107",
        error: "#dc3545",
        info: "#0dcaf0",
      },
    },
  },

  // ── High contrast themes ──
  {
    id: "high-contrast-light",
    family: "default",
    familyLabel: "Default",
    contrast: "more",
    scheme: "light",
    label: "High Contrast Light",
    description: "Enhanced contrast for better accessibility",
    colors: {
      background: {
        primary: "#ffffff",
        secondary: "#f0f0f0",
        tertiary: "#e0e0e0",
      },
      foreground: {
        primary: "#000000",
        secondary: "#1a1a1a",
        tertiary: "#333333",
      },
      border: {
        default: "#000000",
        hover: "#333333",
        focus: "#0000ff",
      },
      interactive: {
        default: "#0000ff",
        hover: "#0000cc",
        active: "#000099",
        disabled: "#666666",
      },
      semantic: {
        success: "#006600",
        warning: "#ff8800",
        error: "#cc0000",
        info: "#0066cc",
      },
    },
  },
  {
    id: "high-contrast-dark",
    family: "default",
    familyLabel: "Default",
    contrast: "more",
    scheme: "dark",
    label: "High Contrast Dark",
    description: "High contrast dark theme for maximum readability",
    colors: {
      background: {
        primary: "#000000",
        secondary: "#1a1a1a",
        tertiary: "#333333",
      },
      foreground: {
        primary: "#ffffff",
        secondary: "#f0f0f0",
        tertiary: "#cccccc",
      },
      border: {
        default: "#ffffff",
        hover: "#cccccc",
        focus: "#ffff00",
      },
      interactive: {
        default: "#ffff00",
        hover: "#ffff66",
        active: "#ffff99",
        disabled: "#666666",
      },
      semantic: {
        success: "#00ff00",
        warning: "#ffaa00",
        error: "#ff0000",
        info: "#00ffff",
      },
    },
  },
];

// ─── Preset → axis mapping ───

const presetAxes: Record<ThemePreset, ThemeAxis[]> = {
  basic: ["scheme"],
  accessible: ["scheme", "contrast"],
  full: ["scheme", "contrast", "variation"],
};

/** Legacy ThemeCategory → the axis it now corresponds to (for migration). */
const legacyCategoryAxis: Record<ThemeCategory, ThemeAxis | null> = {
  base: null,
  "high-contrast": "contrast",
  "color-blind": "variation",
};

/**
 * Resolve a preset name or explicit axis list to the set of enabled axes.
 * The `scheme` axis is always enabled. Legacy `ThemeCategory[]` values are
 * accepted and mapped for migration (`"high-contrast"` → `contrast`,
 * `"color-blind"` → `variation`).
 */
export function resolveAxes(preset: ThemePreset | Array<ThemeAxis | ThemeCategory>): ThemeAxis[] {
  if (!Array.isArray(preset)) {
    return presetAxes[preset];
  }
  const axes = new Set<ThemeAxis>(["scheme"]);
  for (const entry of preset) {
    if (entry === "scheme" || entry === "contrast" || entry === "variation") {
      axes.add(entry);
    } else {
      const mapped = legacyCategoryAxis[entry as ThemeCategory];
      if (mapped) {
        axes.add(mapped);
      }
    }
  }
  return Array.from(axes);
}

/**
 * Filter themes to those reachable under a preset / axis set: a theme that
 * exercises a disabled axis is dropped (a high-contrast theme needs the
 * `contrast` axis; a color-vision variation needs the `variation` axis).
 *
 * Used by `<theme-preview>` and as a display helper. The controller does NOT
 * filter with this — it resolves across all of a family's variants.
 */
export function filterThemesByPreset(
  themes: ThemeConfig[],
  preset: ThemePreset | Array<ThemeAxis | ThemeCategory>,
): ThemeConfig[] {
  const axes = resolveAxes(preset);
  const contrastOn = axes.includes("contrast");
  const variationOn = axes.includes("variation");
  return themes.filter((t) => {
    if (!contrastOn && (t.contrast ?? "normal") !== "normal") {
      return false;
    }
    if (!variationOn && t.variation) {
      return false;
    }
    return true;
  });
}

// ─── Family helpers ───

/**
 * Group a flat list of theme configs into families.
 * Themes without a `family` field are each treated as their own family.
 */
export function groupByFamily(themes: ThemeConfig[]): ThemeFamily[] {
  const map = new Map<string, ThemeFamily>();

  for (const theme of themes) {
    const familyId = theme.family ?? theme.id;
    const existing = map.get(familyId);
    if (existing) {
      existing.variants.push(theme);
    } else {
      map.set(familyId, {
        id: familyId,
        label: theme.familyLabel ?? theme.label,
        variants: [theme],
      });
    }
  }

  return Array.from(map.values());
}

/**
 * Get all unique family IDs from a set of themes.
 */
export function getFamilyIds(themes: ThemeConfig[]): string[] {
  const seen = new Set<string>();
  for (const theme of themes) {
    seen.add(theme.family ?? theme.id);
  }
  return Array.from(seen);
}

/** A theme's contrast axis value, defaulting to "normal" when unset. */
export function themeContrast(theme: ThemeConfig): ThemeContrast {
  return theme.contrast ?? "normal";
}

/** A theme's color-vision axis value, defaulting to "normal" when unset. */
export function themeVariation(theme: ThemeConfig): string {
  return theme.variation ?? "normal";
}

/**
 * Resolve the best concrete theme within a family for a (scheme, contrast,
 * variation) selection. Not every combination has a hand-authored palette
 * (e.g. high-contrast + a color-vision variation), so this falls back by
 * relaxing the *softer* axes first:
 *
 *   exact → drop variation → drop contrast → drop both → any same scheme → first
 *
 * Contrast is treated as the stronger stated accessibility need, so the
 * color-vision tuning degrades before contrast does. The "drop both" rung
 * (plain scheme palette) always exists because every family ships light + dark
 * base variants.
 */
export function resolveTheme(
  family: ThemeFamily,
  scheme: ThemeScheme,
  contrast: ThemeContrast = "normal",
  variation = "normal",
): ThemeConfig {
  const { variants } = family;
  const match = (c: ThemeContrast, v: string): ThemeConfig | undefined =>
    variants.find((t) => t.scheme === scheme && themeContrast(t) === c && themeVariation(t) === v);
  return (
    match(contrast, variation) ??
    match(contrast, "normal") ??
    match("normal", variation) ??
    match("normal", "normal") ??
    variants.find((t) => t.scheme === scheme) ??
    (variants[0] as ThemeConfig)
  );
}

// ─── CSS helpers ───

/**
 * The CSS custom property names exposed by a theme, paired with a function
 * that reads the matching value from a {@link ThemeColors} object. Single
 * source of truth for `generateThemeCSS`, `applyThemeColors`, and
 * `clearThemeColors` so the list never drifts.
 */
const themeColorVars: ReadonlyArray<[name: string, get: (c: ThemeColors) => string]> = [
  ["--theme-bg-primary", (c) => c.background.primary],
  ["--theme-bg-secondary", (c) => c.background.secondary],
  ["--theme-bg-tertiary", (c) => c.background.tertiary],
  ["--theme-fg-primary", (c) => c.foreground.primary],
  ["--theme-fg-secondary", (c) => c.foreground.secondary],
  ["--theme-fg-tertiary", (c) => c.foreground.tertiary],
  ["--theme-border-default", (c) => c.border.default],
  ["--theme-border-hover", (c) => c.border.hover],
  ["--theme-border-focus", (c) => c.border.focus],
  ["--theme-interactive-default", (c) => c.interactive.default],
  ["--theme-interactive-hover", (c) => c.interactive.hover],
  ["--theme-interactive-active", (c) => c.interactive.active],
  ["--theme-interactive-disabled", (c) => c.interactive.disabled],
  ["--theme-success", (c) => c.semantic.success],
  ["--theme-warning", (c) => c.semantic.warning],
  ["--theme-error", (c) => c.semantic.error],
  ["--theme-info", (c) => c.semantic.info],
];

/**
 * Generate CSS custom properties from a theme configuration.
 *
 * @param theme - The theme to emit variables for.
 * @param selector - Optional CSS selector. When provided, the variables are
 *   wrapped in a rule (e.g. `[data-theme="dark"] { ... }`). When omitted, the
 *   bare indented declarations are returned (suitable for inlining inside an
 *   existing rule such as `:root`).
 */
export function generateThemeCSS(theme: ThemeConfig, selector?: string): string {
  const { colors } = theme;
  const body = themeColorVars.map(([name, get]) => `  ${name}: ${get(colors)};`).join("\n");
  return selector ? `${selector} {\n${body}\n}` : body;
}

/**
 * Generate a full stylesheet of `[attribute="id"] { ...vars... }` rules for a
 * set of themes. Useful with the `attribute` apply mode when you want a
 * ready-made default stylesheet instead of authoring every rule yourself.
 * The component does NOT inject this automatically.
 *
 * @param themes - Themes to emit rules for.
 * @param attributeName - Base data attribute used by the controller (default 'data-theme').
 */
export function generateThemeStylesheet(themes: ThemeConfig[], attributeName = "data-theme"): string {
  return themes.map((t) => generateThemeCSS(t, `[${attributeName}="${t.id}"]`)).join("\n");
}

/**
 * Apply a theme's color tokens as CSS custom properties on an element.
 */
export function applyThemeColors(colors: ThemeColors, element: HTMLElement): void {
  for (const [name, get] of themeColorVars) {
    element.style.setProperty(name, get(colors));
  }
}

/**
 * Remove the theme color custom properties previously set by {@link applyThemeColors}.
 * Used when switching to `attribute` apply mode so stale inline variables don't
 * win over attribute-driven CSS.
 */
export function clearThemeColors(element: HTMLElement): void {
  for (const [name] of themeColorVars) {
    element.style.removeProperty(name);
  }
}
