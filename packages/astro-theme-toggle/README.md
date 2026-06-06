# Astro Theme Toggle

A comprehensive, SSR-friendly theme system built for Astro 6+. Supports multiple theme modes including light, dark, high-contrast variants, and system preference detection. Works with Tailwind CSS 4 or plain CSS and persists user preferences using `localStorage`.

## Features

- 🎨 **5 Theme Modes**: System, Light, Dark, High Contrast Light, High Contrast Dark
- ♿ **Accessible**: Full keyboard navigation and ARIA support
- 🎯 **Type-Safe**: Full TypeScript support with exported types
- 🎨 **CSS Custom Properties**: Easy theming with CSS variables
- 📦 **Lightweight**: No external dependencies
- 🔄 **View Transitions**: Works seamlessly with Astro view transitions
- 🎨 **Theme Preview**: Built-in component to visualize all color tokens
- 🛠️ **Customizable**: Define your own theme configurations

## Installation

```bash
pnpm add @sjohansson/astro-theme-toggle
```

## Components

### ThemeController (Advanced)

The enhanced theme controller with support for multiple theme modes and system preference detection.

#### Basic Usage

```astro
---
import { ThemeController } from '@sjohansson/astro-theme-toggle';
---

<!-- Single icon button, expands on click -->
<ThemeController />
```

#### Expand Direction

The component starts as a single icon button showing the current theme. On click it expands to reveal all theme options as icon buttons.

```astro
<!-- Auto (default): vertical on desktop, horizontal on mobile -->
<ThemeController expandDirection="auto" />

<!-- Always expand vertically (column of buttons above/below) -->
<ThemeController expandDirection="vertical" />

<!-- Always expand horizontally (row of buttons to the side) -->
<ThemeController expandDirection="horizontal" />

<!-- With labels visible when expanded -->
<ThemeController expandDirection="vertical" showLabels={true} />
```

#### Props

| Prop | Type | Description | Default |
|------|------|-------------|---------|
| `class` | `string` | Optional CSS classes | `""` |
| `expandDirection` | `"horizontal" \| "vertical" \| "auto"` | Direction the options panel expands | `"auto"` |
| `sectionsDirection` | `"horizontal" \| "vertical" \| "auto"` | How the Theme/Scheme/Contrast/Color vision sections are arranged | `"auto"` |
| `expandSide` | `"auto" \| "start" \| "end"` | Which side of the trigger the panel opens toward | `"auto"` |
| `showLabels` | `boolean` | Show theme labels next to icons | `false` |
| `labelPosition` | `"auto" \| "below" \| "above" \| "right" \| "left"` | Where labels sit relative to icons | `"auto"` |
| `preset` | `"basic" \| "accessible" \| "full" \| ThemeAxis[]` | Which axis controls to offer (scheme/contrast/variation; legacy `ThemeCategory[]` values are mapped) | `"basic"` |
| `family` | `string` | Restrict to a single family by id (variant-only UI) | — |
| `themes` | `ThemeConfig[]` | Custom theme configurations | Default themes |
| `applyMode` | `"inline" \| "attribute" \| "both"` | How the active theme is reflected on `<html>` | `"inline"` |
| `attributeName` | `string` | Base data-attribute name (coerced to `data-…`) | `"data-theme"` |
| `attributeCompanions` | `boolean` | Also set `-family`/`-scheme`/`-contrast`/`-variation` companions | `true` |

### Data-attribute theming

By default the controller applies the active theme as **inline CSS custom
properties** on `<html>` (`applyMode="inline"`). Set `applyMode="attribute"` (or
`"both"`) to instead/also reflect the theme as **data attributes**, so you can
drive all styling from your own CSS:

```astro
<ThemeController applyMode="attribute" />
```

This sets, on `<html>`, one attribute per axis:

```html
<html
  data-theme="high-contrast-dark"
  data-theme-family="default"
  data-theme-scheme="dark"
  data-theme-contrast="more"
>
```

Then style with whatever granularity you need:

```css
/* exact theme */
[data-theme="high-contrast-dark"] { --my-bg: #000; }

/* any dark scheme */
[data-theme-scheme="dark"] { color-scheme: dark; }

/* any high-contrast theme */
[data-theme-contrast="more"] { --border-width: 2px; }

/* a whole family */
[data-theme-family="kawaii"] { --accent: hotpink; }
```

#### Three orthogonal axes

Theme selection is modelled as three independent axes, each its own attribute,
control, and `ThemeConfig` facet:

| Axis | Attribute | `ThemeConfig` field | Values |
| --- | --- | --- | --- |
| scheme | `data-theme-scheme` | `scheme` | `light` / `dark` |
| contrast | `data-theme-contrast` | `contrast` | `normal` / `more` |
| color-vision | `data-theme-variation` | `variation` | `normal` + e.g. `protanopia` |

Because they're independent, a theme (and the controller) can combine them —
e.g. **high contrast _and_ protanopia at the same time**, which a single
`category` could never express. In attribute mode the attributes simply compose
in your CSS, so the combination needs no hand-authored palette:

```html
<html data-theme-scheme="light" data-theme-contrast="more" data-theme-variation="protanopia">
```

```css
[data-theme-variation="protanopia"] { --accent: #6a5acd; }
[data-theme-contrast="more"][data-theme-variation="protanopia"] {
  /* high-contrast tuning for protanopia, composed from two axes */
}
```

A `ThemeConfig` opts into the non-default end of an axis with the optional
`contrast` / `variation` fields (omit them for normal contrast / normal vision):

```ts
{ id: "seventies-protanopia-light", variation: "protanopia", scheme: "light", /* … */ }
```

Presets gate which axis controls appear (`basic` = scheme; `accessible` =
+ contrast; `full` = + color-vision), and each variation is offered as its own
option — no collapsing. New color-vision types scale in just by adding themes
with a new `variation`; no preset changes needed.

> **Inline-mode note:** in `inline`/`both` mode the component resolves to the
> nearest authored palette and falls back (relaxing color-vision, then contrast)
> when a combination has no concrete theme. Attribute mode has no such limit —
> the axis attributes always reflect your exact selection.

> **Clean slate:** in `attribute` mode the component sets *only* the attributes —
> it does **not** inject any colors. You author the `[data-theme=…]` rules. (In
> `both` mode the inline `--theme-*` variables are also set and take precedence.)

The `theme-*` / `scheme-*` / `family-*` **classes are always set** regardless of
mode, so existing class-based CSS keeps working.

#### Customizing the attribute

```astro
<!-- Custom base name; companions derive from it (data-color-mode-scheme, …) -->
<ThemeController applyMode="attribute" attributeName="data-color-mode" />

<!-- Single combined attribute only, no companions -->
<ThemeController applyMode="attribute" attributeCompanions={false} />
```

A name not starting with `data-` is coerced (`mode` → `data-mode`).

#### Generating a starter stylesheet

If you'd rather not hand-write every rule, `generateThemeStylesheet` turns a set
of theme configs into `[data-theme="id"] { …vars… }` blocks (it is **not**
injected automatically):

```ts
import { defaultThemes, generateThemeStylesheet } from '@sjohansson/astro-theme-toggle';

const css = generateThemeStylesheet(defaultThemes);            // base name 'data-theme'
const custom = generateThemeStylesheet(defaultThemes, 'data-color-mode');
```

### ThemeToggle (Simple)

The original simple light/dark toggle for basic use cases. By default it toggles
the `.dark` class on `<html>`. It supports the same data-attribute opt-in via
`apply-mode`:

```astro
<!-- Default: toggles `.dark` -->
<ThemeToggle />

<!-- Sets data-theme="light|dark" (+ data-theme-scheme), no `.dark` class -->
<theme-toggle apply-mode="attribute"></theme-toggle>

<!-- Both: `.dark` class AND data attribute -->
<theme-toggle apply-mode="both" attribute-name="data-mode"></theme-toggle>
```

| Attribute | Values | Default |
|------|------|---------|
| `apply-mode` | `class` \| `attribute` \| `both` | `class` |
| `attribute-name` | string (coerced to `data-…`) | `data-theme` |
| `attribute-companions` | `true` \| `false` (sets `-scheme`) | `true` |

### As an Astro Integration (Recommended)

Use the integration for automatic setup and configuration:

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import themeToggle from '@sjohansson/astro-theme-toggle/integration';

export default defineConfig({
  integrations: [
    themeToggle({
      // Optional: inject theme initialization script globally
      injectScript: true,
      // Optional: when using data-attribute theming, make the injected FOUC
      // script replay the attribute(s) before first paint. Match these to the
      // component's `applyMode` / `attributeName` / `attributeCompanions`.
      applyMode: 'attribute',
      attributeName: 'data-theme',
      attributeCompanions: true,
    })
  ],
});
```

Then use the component in your pages:

```astro
---
import { ThemeToggle } from '@sjohansson/astro-theme-toggle';
---

<ThemeToggle
  class="rounded-md border border-surface-3 bg-surface-1 px-3 py-2 text-surface-12 hover:bg-surface-2"
/>
```

**Benefits of using the integration:**
- Automatic theme initialization script (eliminates FOUC)
- Better SSR handling
- Configuration validation

### As a Standalone Component

For minimal setup, import and use directly:

```astro
---
import { ThemeToggle } from '@sjohansson/astro-theme-toggle';
---

<ThemeToggle
  class="rounded-md border border-surface-3 bg-surface-1 px-3 py-2"
/>
```

#### Props

| Prop | Type | Description | Default |
|------|------|-------------|---------|
| `class` | `string` | Optional CSS classes | `""` |

### ThemePreview

A documentation component that displays all theme colors and tokens.

```astro
---
import { ThemePreview } from '@sjohansson/astro-theme-toggle';
---

<!-- Show all themes -->
<ThemePreview />

<!-- Show specific theme -->
<ThemePreview theme="dark" />
```

#### Props

| Prop | Type | Description | Default |
|------|------|-------------|---------|
| `class` | `string` | Optional CSS classes | `""` |
| `theme` | `"all" \| ThemeMode` | Theme(s) to display | `"all"` |
| `themes` | `ThemeConfig[]` | Custom theme configurations | Default themes |
## API

### Integration Options

| Option                | Type                                  | Description                                                    | Default       |
| --------------------- | ------------------------------------- | ------------------------------------------------------------- | ------------- |
| `injectScript`        | `boolean`                             | Inject theme initialization script in head                    | `false`       |
| `applyMode`           | `"inline" \| "attribute" \| "both"`   | When `attribute`/`both`, the injected script replays the theme data attribute(s) before paint | `"inline"` |
| `attributeName`       | `string`                              | Base data-attribute name the script replays (match the component) | `"data-theme"` |
| `attributeCompanions` | `boolean`                             | Whether the script sets companion attributes on first visit   | `true`        |

### Preventing FOUC with data attributes

The integration's `injectScript` injects a tiny inline `<head>` script. With
`applyMode: 'attribute'` (or `'both'`) it replays the data attribute(s) before
the page paints. The same script is available directly:

```ts
import { generateThemeInitScript, themeInitScript } from '@sjohansson/astro-theme-toggle';

// scheme-class only (default, backwards compatible)
const basic = themeInitScript;

// also replay data attributes (attribute / both apply modes)
const withAttrs = generateThemeInitScript({
  applyAttribute: true,
  attributeName: 'data-theme',
  companions: true,
});
```

The components persist the last resolved selection to `localStorage` so the
script can replay it without bundling the theme list. Keys written in
attribute/both mode: `theme-attr-name`, `theme-resolved-id`,
`theme-resolved-family`, `theme-resolved-scheme`, `theme-resolved-contrast`,
`theme-resolved-variation`, `theme-attr-companions`. The controller also stores
the raw axis selections `theme-family` / `theme-scheme` / `theme-contrast` /
`theme-variation`, plus a `theme-mode` mirror of the scheme axis for the base
script and `<theme-toggle>` interop.

> **System-mode caveat:** when an axis is following the OS (`scheme` or
> `contrast` set to `system`), the script recomputes that axis live from
> `matchMedia`, so scheme/contrast-based CSS is always correct on first paint.
> The combined `data-theme` id may be one frame stale across an OS preference
> change made while the page was closed; the component corrects it as soon as it
> hydrates.

### Component Props

## Using CSS Custom Properties

The theme system exposes CSS custom properties that you can use in your styles:
## Styling

```css
.my-component {
  /* Backgrounds */
  background: var(--theme-bg-primary);
  
  /* Text colors */
  color: var(--theme-fg-primary);
  
  /* Borders */
  border: 1px solid var(--theme-border-default);
  
  /* Interactive elements */
  button {
    background: var(--theme-interactive-default);
  }
  
  button:hover {
    background: var(--theme-interactive-hover);
  }
  
  /* Semantic colors */
  .success {
    color: var(--theme-success);
  }
}
```

### Available CSS Variables

#### Background Colors
- `--theme-bg-primary` - Primary background
- `--theme-bg-secondary` - Secondary background
- `--theme-bg-tertiary` - Tertiary background

#### Foreground Colors
- `--theme-fg-primary` - Primary text
- `--theme-fg-secondary` - Secondary text
- `--theme-fg-tertiary` - Tertiary text

#### Border Colors
- `--theme-border-default` - Default border
- `--theme-border-hover` - Hover state border
- `--theme-border-focus` - Focus state border

#### Interactive Colors
- `--theme-interactive-default` - Default interactive elements
- `--theme-interactive-hover` - Hover state
- `--theme-interactive-active` - Active state
- `--theme-interactive-disabled` - Disabled state

#### Semantic Colors
- `--theme-success` - Success messages
- `--theme-warning` - Warning messages
- `--theme-error` - Error messages
- `--theme-info` - Info messages

#### Sizing
- `--theme-trigger-size` - Width/height of the trigger button (default `2.5rem`)
- `--theme-trigger-icon-size` - Trigger icon size (default: half of `--theme-trigger-size`, i.e. `1.25rem`). Set the trigger size alone and the icon scales with it, staying centred; override this to tune the icon independently.

```css
/* Shrink the whole trigger — the icon scales and stays centred automatically */
.theme-trigger {
  --theme-trigger-size: 1.75rem;
}
```

## Custom Theme Configuration

You can define your own themes by creating a custom configuration:

```astro
---
import { ThemeController, type ThemeConfig } from '@sjohansson/astro-theme-toggle';

const customThemes: ThemeConfig[] = [
  {
    mode: "light",
    label: "Light Mode",
    description: "My custom light theme",
    colors: {
      background: {
        primary: "#ffffff",
        secondary: "#f5f5f5",
        tertiary: "#e0e0e0",
      },
      foreground: {
        primary: "#000000",
        secondary: "#333333",
        tertiary: "#666666",
      },
      border: {
        default: "#cccccc",
        hover: "#999999",
        focus: "#0066cc",
      },
      interactive: {
        default: "#0066cc",
        hover: "#0052a3",
        active: "#003d7a",
        disabled: "#999999",
      },
      semantic: {
        success: "#00aa00",
        warning: "#ff8800",
        error: "#cc0000",
        info: "#0088cc",
      },
    },
  },
  // Add more themes...
];
---

<ThemeController themes={customThemes} />
```

## TypeScript Support

The package exports TypeScript types for full type safety:

```typescript
import type { 
  ThemeMode,
  ThemeConfig,
  ThemeControllerProps,
  ColorToken 
} from '@sjohansson/astro-theme-toggle';
```

## Accessibility

- Full keyboard navigation support
- ARIA labels and roles
- Focus indicators
- Screen reader friendly
- Respects `prefers-color-scheme` and `prefers-contrast` media queries

## Styling

### Tailwind CSS 4

Works seamlessly with Tailwind CSS 4 utility classes:

```astro
<ThemeController 
  class="rounded-lg shadow-lg border-2"
/>
```

### Custom CSS

Target the built-in selectors for custom styling:

```css
.theme-controller {
  /* Container */
}

.theme-trigger {
  /* The single icon button */
}

.theme-panel {
  /* The expandable options panel */
}

.theme-option-btn {
  /* Individual theme option buttons */
}
```

## Development

```bash
pnpm dev        # Rebuild on changes
pnpm test       # Run package tests
pnpm build      # Emit ESM, types, and copy .astro assets to dist/
pnpm clean      # Remove build output
```

This package is designed to stay self-contained and publish-ready—no cross-package dependencies are required.

## Learn More

- [Integration Guide](../../INTEGRATION_GUIDE.md) - Detailed guide on using as integration vs component
- [Packaging Guide](../../PACKAGING_GUIDE.md) - Architecture and best practices
