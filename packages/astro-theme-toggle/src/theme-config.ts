import type { ThemeCategory, ThemeColors, ThemeConfig, ThemeFamily, ThemePreset } from "./types";

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
    category: "base",
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
    category: "base",
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
    category: "high-contrast",
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
    category: "high-contrast",
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

// ─── Preset → category mapping ───

const presetCategories: Record<ThemePreset, ThemeCategory[]> = {
  basic: ["base"],
  accessible: ["base", "high-contrast"],
  full: ["base", "high-contrast", "color-blind"],
};

/**
 * Resolve a preset name or category array to a list of categories.
 */
export function resolveCategories(preset: ThemePreset | ThemeCategory[]): ThemeCategory[] {
  if (Array.isArray(preset)) {
    return preset;
  }
  return presetCategories[preset];
}

/**
 * Filter themes by a preset or category list.
 */
export function filterThemesByPreset(themes: ThemeConfig[], preset: ThemePreset | ThemeCategory[]): ThemeConfig[] {
  const categories = resolveCategories(preset);
  return themes.filter((t) => categories.includes(t.category));
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

/**
 * Resolve the best variant within a family based on scheme and category preferences.
 *
 * Priority: exact category+scheme match > same-scheme base > first matching scheme > first variant.
 */
export function resolveVariant(
  family: ThemeFamily,
  scheme: "light" | "dark",
  category: ThemeCategory = "base",
): ThemeConfig {
  const { variants } = family;

  // Exact match: right category and scheme
  const exact = variants.find((v) => v.category === category && v.scheme === scheme);
  if (exact) {
    return exact;
  }

  // Fallback: base category with right scheme
  const baseScheme = variants.find((v) => v.category === "base" && v.scheme === scheme);
  if (baseScheme) {
    return baseScheme;
  }

  // Fallback: any variant with right scheme
  const anyScheme = variants.find((v) => v.scheme === scheme);
  if (anyScheme) {
    return anyScheme;
  }

  // Last resort: first variant (non-null assertion safe — families always have at least one variant)
  return variants[0] as ThemeConfig;
}

// ─── CSS helpers ───

/**
 * Generate CSS custom properties string from a theme configuration.
 */
export function generateThemeCSS(theme: ThemeConfig): string {
  const { colors } = theme;
  const vars: string[] = [
    `  --theme-bg-primary: ${colors.background.primary};`,
    `  --theme-bg-secondary: ${colors.background.secondary};`,
    `  --theme-bg-tertiary: ${colors.background.tertiary};`,
    `  --theme-fg-primary: ${colors.foreground.primary};`,
    `  --theme-fg-secondary: ${colors.foreground.secondary};`,
    `  --theme-fg-tertiary: ${colors.foreground.tertiary};`,
    `  --theme-border-default: ${colors.border.default};`,
    `  --theme-border-hover: ${colors.border.hover};`,
    `  --theme-border-focus: ${colors.border.focus};`,
    `  --theme-interactive-default: ${colors.interactive.default};`,
    `  --theme-interactive-hover: ${colors.interactive.hover};`,
    `  --theme-interactive-active: ${colors.interactive.active};`,
    `  --theme-interactive-disabled: ${colors.interactive.disabled};`,
    `  --theme-success: ${colors.semantic.success};`,
    `  --theme-warning: ${colors.semantic.warning};`,
    `  --theme-error: ${colors.semantic.error};`,
    `  --theme-info: ${colors.semantic.info};`,
  ];
  return vars.join("\n");
}

/**
 * Apply a theme's color tokens as CSS custom properties on an element.
 */
export function applyThemeColors(colors: ThemeColors, element: HTMLElement): void {
  element.style.setProperty("--theme-bg-primary", colors.background.primary);
  element.style.setProperty("--theme-bg-secondary", colors.background.secondary);
  element.style.setProperty("--theme-bg-tertiary", colors.background.tertiary);
  element.style.setProperty("--theme-fg-primary", colors.foreground.primary);
  element.style.setProperty("--theme-fg-secondary", colors.foreground.secondary);
  element.style.setProperty("--theme-fg-tertiary", colors.foreground.tertiary);
  element.style.setProperty("--theme-border-default", colors.border.default);
  element.style.setProperty("--theme-border-hover", colors.border.hover);
  element.style.setProperty("--theme-border-focus", colors.border.focus);
  element.style.setProperty("--theme-interactive-default", colors.interactive.default);
  element.style.setProperty("--theme-interactive-hover", colors.interactive.hover);
  element.style.setProperty("--theme-interactive-active", colors.interactive.active);
  element.style.setProperty("--theme-interactive-disabled", colors.interactive.disabled);
  element.style.setProperty("--theme-success", colors.semantic.success);
  element.style.setProperty("--theme-warning", colors.semantic.warning);
  element.style.setProperty("--theme-error", colors.semantic.error);
  element.style.setProperty("--theme-info", colors.semantic.info);
}
