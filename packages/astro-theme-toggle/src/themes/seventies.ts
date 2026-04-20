import type { ThemeConfig } from "../types";

const family = "seventies";
const familyLabel = "70s Groove";

/**
 * Seventies theme family — earth tones, warmth, and community.
 * Brown, orange, beige, moss green, harvest gold.
 * "Love thy neighbor" energy with organic curves and warm nostalgia.
 *
 * This family includes color-blind variants because the earth-tone palette
 * (greens, oranges, browns) is particularly affected by red-green and
 * blue-yellow color vision deficiencies.
 */
export const seventiesThemes: ThemeConfig[] = [
  // ── Base ──
  {
    id: "seventies-light",
    family,
    familyLabel,
    category: "base",
    scheme: "light",
    label: "Light",
    description: "Warm earth tones — sunshine through macramé curtains",
    colors: {
      background: {
        primary: "#faf4e8",
        secondary: "#f0e8d0",
        tertiary: "#e4d8b8",
      },
      foreground: {
        primary: "#3a2810",
        secondary: "#5a4020",
        tertiary: "#7a6040",
      },
      border: {
        default: "#d0b888",
        hover: "#b89868",
        focus: "#c86820",
      },
      interactive: {
        default: "#c86820",
        hover: "#b05818",
        active: "#984810",
        disabled: "#b8a888",
      },
      semantic: {
        success: "#5a8a40",
        warning: "#d89020",
        error: "#b84020",
        info: "#487098",
      },
    },
  },
  {
    id: "seventies-dark",
    family,
    familyLabel,
    category: "base",
    scheme: "dark",
    label: "Dark",
    description: "Late-night vinyl — wood-paneled warmth",
    colors: {
      background: {
        primary: "#1e1608",
        secondary: "#2a2010",
        tertiary: "#382c18",
      },
      foreground: {
        primary: "#f0e0c0",
        secondary: "#d8c8a0",
        tertiary: "#b8a880",
      },
      border: {
        default: "#4a3820",
        hover: "#685030",
        focus: "#d88030",
      },
      interactive: {
        default: "#d88030",
        hover: "#e09848",
        active: "#e8b060",
        disabled: "#4a3c28",
      },
      semantic: {
        success: "#78a858",
        warning: "#d89828",
        error: "#c85030",
        info: "#6090b0",
      },
    },
  },

  // ── High contrast ──
  {
    id: "seventies-hc-light",
    family,
    familyLabel,
    category: "high-contrast",
    scheme: "light",
    label: "High Contrast Light",
    description: "Bold earth — strong contrast, warm identity",
    colors: {
      background: {
        primary: "#fffff0",
        secondary: "#f8f0d8",
        tertiary: "#f0e4c0",
      },
      foreground: {
        primary: "#1a0c00",
        secondary: "#2a1808",
        tertiary: "#3a2410",
      },
      border: {
        default: "#5a3000",
        hover: "#7a4800",
        focus: "#c05000",
      },
      interactive: {
        default: "#b04800",
        hover: "#903800",
        active: "#702800",
        disabled: "#808080",
      },
      semantic: {
        success: "#306820",
        warning: "#a06800",
        error: "#901800",
        info: "#185888",
      },
    },
  },
  {
    id: "seventies-hc-dark",
    family,
    familyLabel,
    category: "high-contrast",
    scheme: "dark",
    label: "High Contrast Dark",
    description: "Neon-on-brown — 70s revival with full readability",
    colors: {
      background: {
        primary: "#0a0800",
        secondary: "#181208",
        tertiary: "#281c10",
      },
      foreground: {
        primary: "#ffffff",
        secondary: "#f8e8c8",
        tertiary: "#f0d8a8",
      },
      border: {
        default: "#f0a040",
        hover: "#f0b860",
        focus: "#ffc860",
      },
      interactive: {
        default: "#ffa830",
        hover: "#ffc050",
        active: "#ffd870",
        disabled: "#605040",
      },
      semantic: {
        success: "#80ff40",
        warning: "#ffc000",
        error: "#ff5030",
        info: "#50c0ff",
      },
    },
  },

  // ── Color-blind variants ──
  // Protanopia (no red): oranges and browns shift toward distinguishable yellows/blues
  {
    id: "seventies-protanopia-light",
    family,
    familyLabel,
    category: "color-blind",
    scheme: "light",
    label: "Protanopia Light",
    description: "Earth tones adjusted for red-blind vision",
    colors: {
      background: {
        primary: "#faf4e8",
        secondary: "#f0e8d0",
        tertiary: "#e4d8b8",
      },
      foreground: {
        primary: "#2a2810",
        secondary: "#4a4420",
        tertiary: "#6a6440",
      },
      border: {
        default: "#c8b878",
        hover: "#b0a060",
        focus: "#8878c0",
      },
      interactive: {
        default: "#8070b8",
        hover: "#6860a0",
        active: "#585090",
        disabled: "#a8a088",
      },
      semantic: {
        success: "#4878b8",
        warning: "#c8a020",
        error: "#8868c0",
        info: "#4878b8",
      },
    },
  },
  {
    id: "seventies-protanopia-dark",
    family,
    familyLabel,
    category: "color-blind",
    scheme: "dark",
    label: "Protanopia Dark",
    description: "Warm evening palette adjusted for red-blind vision",
    colors: {
      background: {
        primary: "#1a1808",
        secondary: "#282410",
        tertiary: "#383018",
      },
      foreground: {
        primary: "#f0e8c0",
        secondary: "#d0c8a0",
        tertiary: "#b0a880",
      },
      border: {
        default: "#484020",
        hover: "#605830",
        focus: "#9088c0",
      },
      interactive: {
        default: "#9088c0",
        hover: "#a098d0",
        active: "#b0a8e0",
        disabled: "#484028",
      },
      semantic: {
        success: "#5888c0",
        warning: "#c8a028",
        error: "#9878c8",
        info: "#5888c0",
      },
    },
  },

  // Deuteranopia (no green): moss greens shifted to blues, oranges kept distinct
  {
    id: "seventies-deuteranopia-light",
    family,
    familyLabel,
    category: "color-blind",
    scheme: "light",
    label: "Deuteranopia Light",
    description: "Earth tones adjusted for green-blind vision",
    colors: {
      background: {
        primary: "#faf4e8",
        secondary: "#f0e8d0",
        tertiary: "#e4d8b8",
      },
      foreground: {
        primary: "#2a2410",
        secondary: "#4a4020",
        tertiary: "#6a6040",
      },
      border: {
        default: "#c8b878",
        hover: "#b0a060",
        focus: "#c07020",
      },
      interactive: {
        default: "#c07020",
        hover: "#a86018",
        active: "#905010",
        disabled: "#a8a088",
      },
      semantic: {
        success: "#3880c0",
        warning: "#c8a020",
        error: "#c04880",
        info: "#3878b8",
      },
    },
  },
  {
    id: "seventies-deuteranopia-dark",
    family,
    familyLabel,
    category: "color-blind",
    scheme: "dark",
    label: "Deuteranopia Dark",
    description: "Warm evening palette adjusted for green-blind vision",
    colors: {
      background: {
        primary: "#1a1808",
        secondary: "#282410",
        tertiary: "#383018",
      },
      foreground: {
        primary: "#f0e8c0",
        secondary: "#d0c8a0",
        tertiary: "#b0a880",
      },
      border: {
        default: "#484020",
        hover: "#605830",
        focus: "#d88838",
      },
      interactive: {
        default: "#d88838",
        hover: "#e0a050",
        active: "#e8b868",
        disabled: "#484028",
      },
      semantic: {
        success: "#4890d0",
        warning: "#d0a828",
        error: "#d05888",
        info: "#4888c8",
      },
    },
  },

  // Tritanopia (no blue): blue-ish tones shifted to reds/pinks; works well with earth tones
  {
    id: "seventies-tritanopia-light",
    family,
    familyLabel,
    category: "color-blind",
    scheme: "light",
    label: "Tritanopia Light",
    description: "Earth tones adjusted for blue-blind vision",
    colors: {
      background: {
        primary: "#faf4e8",
        secondary: "#f0e8d0",
        tertiary: "#e4d8b8",
      },
      foreground: {
        primary: "#3a2810",
        secondary: "#5a4020",
        tertiary: "#7a6040",
      },
      border: {
        default: "#d0b888",
        hover: "#b89868",
        focus: "#c86820",
      },
      interactive: {
        default: "#c86820",
        hover: "#b05818",
        active: "#984810",
        disabled: "#b8a888",
      },
      semantic: {
        success: "#5a8a40",
        warning: "#d89020",
        error: "#c04030",
        info: "#c07848",
      },
    },
  },
  {
    id: "seventies-tritanopia-dark",
    family,
    familyLabel,
    category: "color-blind",
    scheme: "dark",
    label: "Tritanopia Dark",
    description: "Warm evening palette adjusted for blue-blind vision",
    colors: {
      background: {
        primary: "#1e1608",
        secondary: "#2a2010",
        tertiary: "#382c18",
      },
      foreground: {
        primary: "#f0e0c0",
        secondary: "#d8c8a0",
        tertiary: "#b8a880",
      },
      border: {
        default: "#4a3820",
        hover: "#685030",
        focus: "#d88030",
      },
      interactive: {
        default: "#d88030",
        hover: "#e09848",
        active: "#e8b060",
        disabled: "#4a3c28",
      },
      semantic: {
        success: "#78a858",
        warning: "#d89828",
        error: "#c85840",
        info: "#c88858",
      },
    },
  },

  // Achromatopsia (no color): full grayscale with luminance-based differentiation
  {
    id: "seventies-achromatopsia-light",
    family,
    familyLabel,
    category: "color-blind",
    scheme: "light",
    label: "Achromatopsia Light",
    description: "Earth tones as luminance-only grayscale",
    colors: {
      background: {
        primary: "#f4f0e8",
        secondary: "#e8e4d8",
        tertiary: "#d8d4c8",
      },
      foreground: {
        primary: "#282828",
        secondary: "#484848",
        tertiary: "#686868",
      },
      border: {
        default: "#b8b8b0",
        hover: "#989890",
        focus: "#585850",
      },
      interactive: {
        default: "#505050",
        hover: "#404040",
        active: "#303030",
        disabled: "#a8a8a0",
      },
      semantic: {
        success: "#606060",
        warning: "#888880",
        error: "#404040",
        info: "#707070",
      },
    },
  },
  {
    id: "seventies-achromatopsia-dark",
    family,
    familyLabel,
    category: "color-blind",
    scheme: "dark",
    label: "Achromatopsia Dark",
    description: "Warm grayscale — luminance hierarchy only",
    colors: {
      background: {
        primary: "#181818",
        secondary: "#242420",
        tertiary: "#303028",
      },
      foreground: {
        primary: "#e0e0d8",
        secondary: "#c0c0b8",
        tertiary: "#a0a098",
      },
      border: {
        default: "#404038",
        hover: "#585850",
        focus: "#a0a098",
      },
      interactive: {
        default: "#b0b0a8",
        hover: "#c0c0b8",
        active: "#d0d0c8",
        disabled: "#383830",
      },
      semantic: {
        success: "#a0a098",
        warning: "#808078",
        error: "#c0c0b8",
        info: "#909088",
      },
    },
  },
];
