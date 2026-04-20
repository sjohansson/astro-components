import type { ThemeConfig } from "../types";

const family = "kawaii";
const familyLabel = "Kawaii";

/**
 * Kawaii theme family — pastel pink, soft, friendly.
 * Inspired by bubblegum aesthetics, wholesome children's cartoons,
 * and the Japanese "cute culture" design sensibility.
 */
export const kawaiiThemes: ThemeConfig[] = [
  // ── Base ──
  {
    id: "kawaii-light",
    family,
    familyLabel,
    category: "base",
    scheme: "light",
    label: "Light",
    description: "Soft pastel pink — bubblegum and sunshine",
    colors: {
      background: {
        primary: "#fff5f9",
        secondary: "#ffe8f0",
        tertiary: "#ffd6e5",
      },
      foreground: {
        primary: "#4a2040",
        secondary: "#6b3a5c",
        tertiary: "#8c5a7a",
      },
      border: {
        default: "#f0c0d8",
        hover: "#e8a0c0",
        focus: "#e06098",
      },
      interactive: {
        default: "#e8609c",
        hover: "#d44888",
        active: "#c03878",
        disabled: "#d0a8c0",
      },
      semantic: {
        success: "#68c090",
        warning: "#f0c060",
        error: "#e06080",
        info: "#80b0e8",
      },
    },
  },
  {
    id: "kawaii-dark",
    family,
    familyLabel,
    category: "base",
    scheme: "dark",
    label: "Dark",
    description: "Cozy evening pastels — soft and dreamy",
    colors: {
      background: {
        primary: "#2a1520",
        secondary: "#3a2030",
        tertiary: "#4a2840",
      },
      foreground: {
        primary: "#f8e0f0",
        secondary: "#e0c0d8",
        tertiary: "#c8a0c0",
      },
      border: {
        default: "#5a3050",
        hover: "#7a4870",
        focus: "#e06098",
      },
      interactive: {
        default: "#e06098",
        hover: "#e880b0",
        active: "#f0a0c8",
        disabled: "#5a3850",
      },
      semantic: {
        success: "#68c090",
        warning: "#f0c060",
        error: "#e06080",
        info: "#80b0e8",
      },
    },
  },

  // ── High contrast ──
  {
    id: "kawaii-hc-light",
    family,
    familyLabel,
    category: "high-contrast",
    scheme: "light",
    label: "High Contrast Light",
    description: "Bold kawaii — maximum readability with pastel personality",
    colors: {
      background: {
        primary: "#ffffff",
        secondary: "#fff0f5",
        tertiary: "#ffe0ec",
      },
      foreground: {
        primary: "#1a0010",
        secondary: "#2a0820",
        tertiary: "#3a1030",
      },
      border: {
        default: "#800050",
        hover: "#a00068",
        focus: "#cc0080",
      },
      interactive: {
        default: "#c00078",
        hover: "#a00060",
        active: "#800048",
        disabled: "#888888",
      },
      semantic: {
        success: "#007040",
        warning: "#c08800",
        error: "#c00040",
        info: "#0060b0",
      },
    },
  },
  {
    id: "kawaii-hc-dark",
    family,
    familyLabel,
    category: "high-contrast",
    scheme: "dark",
    label: "High Contrast Dark",
    description: "Vivid kawaii on deep background — neon-pastel clarity",
    colors: {
      background: {
        primary: "#0a0008",
        secondary: "#180010",
        tertiary: "#280820",
      },
      foreground: {
        primary: "#ffffff",
        secondary: "#ffe0f0",
        tertiary: "#ffc8e0",
      },
      border: {
        default: "#ff80c0",
        hover: "#ffa0d0",
        focus: "#ffb8e0",
      },
      interactive: {
        default: "#ff70b8",
        hover: "#ff90c8",
        active: "#ffb0d8",
        disabled: "#666666",
      },
      semantic: {
        success: "#00ff80",
        warning: "#ffc800",
        error: "#ff4080",
        info: "#40c0ff",
      },
    },
  },
];
