/**
 * The underlying color scheme a theme derives from.
 * Used for system preference resolution and fallback behavior.
 */
export type ThemeScheme = "light" | "dark";

/**
 * Contrast level a theme is tuned for. An orthogonal accessibility axis —
 * independent of scheme and color-vision.
 * - 'normal': standard contrast (the default when omitted)
 * - 'more': enhanced contrast (mirrors the `prefers-contrast: more` media query)
 */
export type ThemeContrast = "normal" | "more";

/**
 * The three independent axes a theme is selected along. Presets enable a
 * progressive subset of these controls in the UI.
 * - 'scheme': light / dark (system-aware)
 * - 'contrast': normal / more (system-aware)
 * - 'variation': color-vision adaptation (normal + e.g. protanopia)
 */
export type ThemeAxis = "scheme" | "contrast" | "variation";

/**
 * Preset configurations for the theme controller. Each preset enables a
 * progressive set of {@link ThemeAxis} controls:
 * - 'basic': scheme only (light/dark/system)
 * - 'accessible': + the contrast control
 * - 'full': + the color-vision control
 */
export type ThemePreset = "basic" | "accessible" | "full";

/**
 * @deprecated Superseded by the orthogonal `contrast` + `variation` axes.
 * Kept for migration: `base` ≈ normal contrast + normal vision,
 * `high-contrast` ≈ `contrast: "more"`, `color-blind` ≈ a `variation`.
 */
export type ThemeCategory = "base" | "high-contrast" | "color-blind";

/**
 * How `<theme-controller>` reflects the active theme on `<html>`.
 * - 'inline': set CSS custom properties inline (current/default behavior)
 * - 'attribute': set data attribute(s) only — no inline custom properties
 * - 'both': set inline custom properties AND data attribute(s)
 *
 * The `theme-*` / `scheme-*` / `family-*` classes are always set regardless of mode.
 */
export type ThemeApplyMode = "inline" | "attribute" | "both";

/**
 * How `<theme-toggle>` reflects the active light/dark theme on `<html>`.
 * - 'class': toggle the `.dark` class (current/default behavior)
 * - 'attribute': set data attribute(s) only — no `.dark` class
 * - 'both': toggle the `.dark` class AND set data attribute(s)
 */
export type ToggleApplyMode = "class" | "attribute" | "both";

/**
 * SVG icon definition for a theme option.
 * Allows custom themes to provide their own icons.
 */
export interface ThemeIcon {
  /** SVG content (inner SVG elements, no wrapping <svg> tag) */
  svg: string;
  /** Accessible label for the icon */
  label?: string;
}

/**
 * Color tokens for a theme. Organized by semantic purpose.
 */
export interface ThemeColors {
  /** Background colors */
  background: {
    primary: string;
    secondary: string;
    tertiary: string;
  };
  /** Foreground/text colors */
  foreground: {
    primary: string;
    secondary: string;
    tertiary: string;
  };
  /** Border colors */
  border: {
    default: string;
    hover: string;
    focus: string;
  };
  /** Interactive element colors */
  interactive: {
    default: string;
    hover: string;
    active: string;
    disabled: string;
  };
  /** Semantic colors */
  semantic: {
    success: string;
    warning: string;
    error: string;
    info: string;
  };
}

/**
 * Complete theme configuration.
 *
 * Themes are organized along a family plus three orthogonal axes:
 * - **Family**: the brand identity (e.g., 'kawaii', 'seventies', 'less-is-more')
 * - **scheme**: light / dark
 * - **contrast**: normal / more (high contrast)
 * - **variation**: color-vision adaptation (normal + e.g. protanopia)
 *
 * The `family` field groups related variants so the controller can offer
 * family-level switching while resolving each axis automatically from OS
 * preferences or user override. The three axes are independent, so a theme can
 * be high-contrast AND color-vision-adjusted at once.
 *
 * Theme IDs are open strings — not a closed union — so consumers can define
 * arbitrary themes without modifying library types.
 */
export interface ThemeConfig {
  /** Unique theme identifier (e.g., 'kawaii-light', 'seventies-hc-dark') */
  id: string;
  /**
   * Theme family this belongs to. All variants of the same brand share a family.
   * When omitted, the theme is treated as its own standalone family.
   * @example 'kawaii', 'seventies', 'less-is-more', 'default'
   */
  family?: string;
  /** Human-readable family display name (e.g., 'Kawaii', '70s Groove') */
  familyLabel?: string;
  /**
   * Contrast level this theme is tuned for. Omit (or 'normal') for standard
   * contrast; 'more' marks a high-contrast variant. Independent of `variation`,
   * so a theme may set both. Surfaced as `data-theme-contrast` and gated by the
   * `accessible`/`full` presets.
   */
  contrast?: ThemeContrast;
  /**
   * Color-vision adaptation this theme is tuned for, when not the normal palette.
   * e.g. `protanopia`, `deuteranopia`, `tritanopia`, `achromatopsia`. Open string
   * so new variations scale without changing library types or presets. Omit for
   * the normal-vision palette. Independent of `contrast`.
   *
   * Surfaced as the `data-theme-variation` companion attribute and offered as a
   * distinct option in the controller's color-vision control (gated by the
   * `full` preset).
   */
  variation?: string;
  /** Base color scheme this derives from — used for system preference fallback */
  scheme: ThemeScheme;
  /** Display name for this specific variant (e.g., 'Light', 'High Contrast Dark') */
  label: string;
  /** Theme/variant description */
  description?: string;
  /** Optional custom icon for this theme */
  icon?: ThemeIcon;
  /** Color tokens for this theme */
  colors: ThemeColors;
}

/**
 * Describes a theme family for the controller UI.
 * Derived at runtime from ThemeConfig[] entries sharing the same `family` value.
 */
export interface ThemeFamily {
  /** Family identifier (matches ThemeConfig.family) */
  id: string;
  /** Display name */
  label: string;
  /** All variants in this family */
  variants: ThemeConfig[];
}

/**
 * Configuration for the theme controller component.
 */
export interface ThemeControllerProps {
  /** Optional CSS class for styling */
  class?: string;
  /**
   * Direction to expand the theme options panel.
   * - 'horizontal': expand left/right as a row of icon buttons
   * - 'vertical': expand up/down as a column of icon buttons
   * - 'auto': vertical on desktop (>768px), horizontal on mobile (<=768px)
   * @default 'auto'
   */
  expandDirection?: "horizontal" | "vertical" | "auto";
  /**
   * When both Theme (family) and Mode (variant) sections are shown, controls
   * whether the two sections sit side-by-side ('horizontal') or stacked
   * ('vertical'). 'auto' stacks them vertically so each section's option row
   * can grow horizontally on its own.
   * @default 'auto'
   */
  sectionsDirection?: "horizontal" | "vertical" | "auto";
  /**
   * Which side of the trigger the panel opens toward.
   * - 'end': right (horizontal expand) or below (vertical expand) — the default direction
   * - 'start': left or above
   * - 'auto': measure available viewport space when the panel opens and flip if needed
   * @default 'auto'
   */
  expandSide?: "auto" | "start" | "end";
  /** Show labels next to icons (only visible when expanded) */
  showLabels?: boolean;
  /**
   * Where the label sits relative to the icon when `showLabels` is enabled.
   * 'auto' = 'below' in horizontal expand, 'right' in vertical expand.
   * @default 'auto'
   */
  labelPosition?: "auto" | "below" | "above" | "right" | "left";
  /**
   * Which axis controls to offer in the selector (progressive disclosure).
   * - 'basic': scheme control only (light/dark + system)
   * - 'accessible': + the contrast control
   * - 'full': + the color-vision control
   * - ThemeAxis[]: a custom set of enabled axes (e.g. `["scheme", "variation"]`).
   *   Legacy `ThemeCategory[]` values are still accepted and mapped.
   * @default 'basic'
   */
  preset?: ThemePreset | ThemeAxis[];
  /** Custom theme configurations (replaces defaults when provided) */
  themes?: ThemeConfig[];
  /**
   * How to reflect the active theme on `<html>`.
   * - 'inline': set CSS custom properties inline (current behavior)
   * - 'attribute': set data attribute(s) only; colors come from your own CSS
   * - 'both': set inline custom properties AND data attribute(s)
   *
   * The `theme-*` / `scheme-*` / `family-*` classes are always set regardless of mode.
   * @default 'inline'
   */
  applyMode?: ThemeApplyMode;
  /**
   * Base data-attribute name reflecting the active theme id (e.g. 'data-theme').
   * If it does not start with 'data-', it is prefixed automatically.
   * Only used when `applyMode` is 'attribute' or 'both'.
   * @default 'data-theme'
   */
  attributeName?: string;
  /**
   * Also set derived companion attributes for family/scheme/contrast/variation
   * (e.g. `data-theme-family`, `data-theme-scheme`, `data-theme-contrast`,
   * `data-theme-variation`).
   * @default true
   */
  attributeCompanions?: boolean;
}

// ─── Deprecated / backwards-compat type aliases ───

/**
 * @deprecated Use `ThemeConfig['id']` (open string) instead. Kept for migration.
 */
export type ThemeMode = string;

/**
 * @deprecated Use `ThemeColors` instead.
 */
export type ColorToken = ThemeColors;
