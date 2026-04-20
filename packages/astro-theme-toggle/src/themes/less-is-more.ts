import type { ThemeConfig } from "../types";

const family = "less-is-more";
const familyLabel = "Less is More";

/**
 * Less-is-More theme family — clean, minimal, stylish.
 * Inspired by Dieter Rams, Swiss design, and modern minimalism.
 * Restrained palette, clear hierarchy, no visual noise.
 */
export const lessIsMoreThemes: ThemeConfig[] = [
  // ── Base ──
  {
    id: "less-is-more-light",
    family,
    familyLabel,
    category: "base",
    scheme: "light",
    label: "Light",
    description: "Clean white space with precise gray hierarchy",
    colors: {
      background: {
        primary: "#fafafa",
        secondary: "#f2f2f2",
        tertiary: "#e8e8e8",
      },
      foreground: {
        primary: "#1a1a1a",
        secondary: "#4a4a4a",
        tertiary: "#7a7a7a",
      },
      border: {
        default: "#d8d8d8",
        hover: "#b0b0b0",
        focus: "#1a1a1a",
      },
      interactive: {
        default: "#1a1a1a",
        hover: "#333333",
        active: "#000000",
        disabled: "#c0c0c0",
      },
      semantic: {
        success: "#2a8a4a",
        warning: "#c89020",
        error: "#c83030",
        info: "#2070b8",
      },
    },
  },
  {
    id: "less-is-more-dark",
    family,
    familyLabel,
    category: "base",
    scheme: "dark",
    label: "Dark",
    description: "Refined dark — quiet elegance, zero clutter",
    colors: {
      background: {
        primary: "#161616",
        secondary: "#1e1e1e",
        tertiary: "#282828",
      },
      foreground: {
        primary: "#e8e8e8",
        secondary: "#b0b0b0",
        tertiary: "#808080",
      },
      border: {
        default: "#333333",
        hover: "#4a4a4a",
        focus: "#e8e8e8",
      },
      interactive: {
        default: "#e8e8e8",
        hover: "#d0d0d0",
        active: "#ffffff",
        disabled: "#404040",
      },
      semantic: {
        success: "#40a860",
        warning: "#d8a030",
        error: "#d84040",
        info: "#4090d0",
      },
    },
  },

  // ── High contrast ──
  {
    id: "less-is-more-hc-light",
    family,
    familyLabel,
    category: "high-contrast",
    scheme: "light",
    label: "High Contrast Light",
    description: "Maximum clarity — pure black on white, nothing wasted",
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
        focus: "#000000",
      },
      interactive: {
        default: "#000000",
        hover: "#1a1a1a",
        active: "#000000",
        disabled: "#808080",
      },
      semantic: {
        success: "#006030",
        warning: "#a07000",
        error: "#a00020",
        info: "#004090",
      },
    },
  },
  {
    id: "less-is-more-hc-dark",
    family,
    familyLabel,
    category: "high-contrast",
    scheme: "dark",
    label: "High Contrast Dark",
    description: "Stark white on black — absolute minimalism",
    colors: {
      background: {
        primary: "#000000",
        secondary: "#0a0a0a",
        tertiary: "#1a1a1a",
      },
      foreground: {
        primary: "#ffffff",
        secondary: "#e0e0e0",
        tertiary: "#c0c0c0",
      },
      border: {
        default: "#ffffff",
        hover: "#d0d0d0",
        focus: "#ffffff",
      },
      interactive: {
        default: "#ffffff",
        hover: "#e0e0e0",
        active: "#ffffff",
        disabled: "#606060",
      },
      semantic: {
        success: "#00ff60",
        warning: "#ffc000",
        error: "#ff3040",
        info: "#40a0ff",
      },
    },
  },
];
