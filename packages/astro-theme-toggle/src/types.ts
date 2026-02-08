/**
 * Theme mode options supported by the theme controller
 */
export type ThemeMode = 'system' | 'light' | 'dark' | 'high-contrast-light' | 'high-contrast-dark';

/**
 * Color token definition for a specific theme color
 */
export interface ColorToken {
  /** CSS custom property name (e.g., '--color-bg') */
  name: string;
  /** Hex color value */
  value: string;
  /** Human-readable description */
  description?: string;
}

/**
 * Complete theme configuration with all color tokens
 */
export interface ThemeConfig {
  /** Theme identifier */
  mode: Exclude<ThemeMode, 'system'>;
  /** Display name for the theme */
  label: string;
  /** Theme description */
  description?: string;
  /** Color tokens for this theme */
  colors: {
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
  };
}

/**
 * Configuration for the theme controller component
 */
export interface ThemeControllerProps {
  /** Optional CSS class for styling */
  class?: string;
  /** Position of the theme selector */
  position?: 'inline' | 'dropdown';
  /** Show labels next to icons */
  showLabels?: boolean;
  /** Custom theme configurations (overrides defaults) */
  themes?: ThemeConfig[];
}
