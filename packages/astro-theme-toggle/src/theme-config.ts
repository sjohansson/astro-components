import type { ThemeConfig } from './types';

/**
 * Default theme configurations with carefully selected color palettes
 */
export const defaultThemes: ThemeConfig[] = [
  {
    mode: 'light',
    label: 'Light',
    description: 'Standard light theme with comfortable contrast',
    colors: {
      background: {
        primary: '#ffffff',
        secondary: '#f8f9fa',
        tertiary: '#e9ecef',
      },
      foreground: {
        primary: '#212529',
        secondary: '#495057',
        tertiary: '#6c757d',
      },
      border: {
        default: '#dee2e6',
        hover: '#adb5bd',
        focus: '#0d6efd',
      },
      interactive: {
        default: '#0d6efd',
        hover: '#0b5ed7',
        active: '#0a58ca',
        disabled: '#6c757d',
      },
      semantic: {
        success: '#198754',
        warning: '#ffc107',
        error: '#dc3545',
        info: '#0dcaf0',
      },
    },
  },
  {
    mode: 'dark',
    label: 'Dark',
    description: 'Standard dark theme with reduced eye strain',
    colors: {
      background: {
        primary: '#212529',
        secondary: '#343a40',
        tertiary: '#495057',
      },
      foreground: {
        primary: '#f8f9fa',
        secondary: '#dee2e6',
        tertiary: '#adb5bd',
      },
      border: {
        default: '#495057',
        hover: '#6c757d',
        focus: '#0d6efd',
      },
      interactive: {
        default: '#0d6efd',
        hover: '#3d8bfd',
        active: '#6ea8fe',
        disabled: '#495057',
      },
      semantic: {
        success: '#198754',
        warning: '#ffc107',
        error: '#dc3545',
        info: '#0dcaf0',
      },
    },
  },
  {
    mode: 'high-contrast-light',
    label: 'High Contrast Light',
    description: 'Enhanced contrast for better accessibility',
    colors: {
      background: {
        primary: '#ffffff',
        secondary: '#f0f0f0',
        tertiary: '#e0e0e0',
      },
      foreground: {
        primary: '#000000',
        secondary: '#1a1a1a',
        tertiary: '#333333',
      },
      border: {
        default: '#000000',
        hover: '#333333',
        focus: '#0000ff',
      },
      interactive: {
        default: '#0000ff',
        hover: '#0000cc',
        active: '#000099',
        disabled: '#666666',
      },
      semantic: {
        success: '#006600',
        warning: '#ff8800',
        error: '#cc0000',
        info: '#0066cc',
      },
    },
  },
  {
    mode: 'high-contrast-dark',
    label: 'High Contrast Dark',
    description: 'High contrast dark theme for maximum readability',
    colors: {
      background: {
        primary: '#000000',
        secondary: '#1a1a1a',
        tertiary: '#333333',
      },
      foreground: {
        primary: '#ffffff',
        secondary: '#f0f0f0',
        tertiary: '#cccccc',
      },
      border: {
        default: '#ffffff',
        hover: '#cccccc',
        focus: '#ffff00',
      },
      interactive: {
        default: '#ffff00',
        hover: '#ffff66',
        active: '#ffff99',
        disabled: '#666666',
      },
      semantic: {
        success: '#00ff00',
        warning: '#ffaa00',
        error: '#ff0000',
        info: '#00ffff',
      },
    },
  },
];

/**
 * Generate CSS custom properties from a theme configuration
 */
export function generateThemeCSS(theme: ThemeConfig): string {
  const cssVars: string[] = [];

  // Background colors
  cssVars.push(`  --theme-bg-primary: ${theme.colors.background.primary};`);
  cssVars.push(`  --theme-bg-secondary: ${theme.colors.background.secondary};`);
  cssVars.push(`  --theme-bg-tertiary: ${theme.colors.background.tertiary};`);

  // Foreground colors
  cssVars.push(`  --theme-fg-primary: ${theme.colors.foreground.primary};`);
  cssVars.push(`  --theme-fg-secondary: ${theme.colors.foreground.secondary};`);
  cssVars.push(`  --theme-fg-tertiary: ${theme.colors.foreground.tertiary};`);

  // Border colors
  cssVars.push(`  --theme-border-default: ${theme.colors.border.default};`);
  cssVars.push(`  --theme-border-hover: ${theme.colors.border.hover};`);
  cssVars.push(`  --theme-border-focus: ${theme.colors.border.focus};`);

  // Interactive colors
  cssVars.push(`  --theme-interactive-default: ${theme.colors.interactive.default};`);
  cssVars.push(`  --theme-interactive-hover: ${theme.colors.interactive.hover};`);
  cssVars.push(`  --theme-interactive-active: ${theme.colors.interactive.active};`);
  cssVars.push(`  --theme-interactive-disabled: ${theme.colors.interactive.disabled};`);

  // Semantic colors
  cssVars.push(`  --theme-success: ${theme.colors.semantic.success};`);
  cssVars.push(`  --theme-warning: ${theme.colors.semantic.warning};`);
  cssVars.push(`  --theme-error: ${theme.colors.semantic.error};`);
  cssVars.push(`  --theme-info: ${theme.colors.semantic.info};`);

  return cssVars.join('\n');
}
