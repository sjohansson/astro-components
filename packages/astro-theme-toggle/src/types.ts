/**
 * Categories that group theme variants for progressive disclosure in the UI.
 * The controller uses these to filter which variants to show based on the preset.
 */
export type ThemeCategory = "base" | "high-contrast" | "color-blind";

/**
 * The underlying color scheme a theme derives from.
 * Used for system preference resolution and fallback behavior.
 */
export type ThemeScheme = "light" | "dark";

/**
 * Preset configurations for the theme controller's variant selector.
 * - 'basic': light/dark/system only
 * - 'accessible': + high contrast themes
 * - 'full': + color blindness variations
 */
export type ThemePreset = "basic" | "accessible" | "full";

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
 * Themes are organized in two dimensions:
 * - **Family**: the brand identity (e.g., 'kawaii', 'seventies', 'less-is-more')
 * - **Variant**: the accessibility/preference adaptation (light, dark, high-contrast, color-blind)
 *
 * The `family` field groups related variants so the controller can offer
 * family-level switching while resolving the variant automatically from
 * OS preferences or user override.
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
  /** Which category this variant belongs to — controls visibility via presets */
  category: ThemeCategory;
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
  /** Show labels next to icons (only visible when expanded) */
  showLabels?: boolean;
  /**
   * Which categories of variants to offer in the selector.
   * - 'basic': base variants only (light/dark + system)
   * - 'accessible': base + high contrast
   * - 'full': all categories including color blindness
   * - ThemeCategory[]: custom selection of categories
   * @default 'basic'
   */
  preset?: ThemePreset | ThemeCategory[];
  /** Custom theme configurations (replaces defaults when provided) */
  themes?: ThemeConfig[];
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
