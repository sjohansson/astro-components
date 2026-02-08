# Astro Theme Toggle

A comprehensive, SSR-friendly theme system built for Astro 5+. Supports multiple theme modes including light, dark, high-contrast variants, and system preference detection. Works with Tailwind CSS 4 or plain CSS and persists user preferences using `localStorage`.

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

<ThemeController />
```

#### Dropdown Mode (Default)

```astro
<ThemeController 
  position="dropdown"
  class="my-custom-class"
/>
```

#### Inline Mode

```astro
<ThemeController 
  position="inline"
  showLabels={true}
/>
```

#### Props

| Prop | Type | Description | Default |
|------|------|-------------|---------|
| `class` | `string` | Optional CSS classes | `""` |
| `position` | `"inline" \| "dropdown"` | Display mode | `"dropdown"` |
| `showLabels` | `boolean` | Show theme labels (inline mode) | `false` |
| `themes` | `ThemeConfig[]` | Custom theme configurations | Default themes |

### ThemeToggle (Simple)

The original simple light/dark toggle for basic use cases.

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

| Option         | Type      | Description                               | Default |
| -------------- | --------- | ----------------------------------------- | ------- |
| `injectScript` | `boolean` | Inject theme initialization script in head | `false` |

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
  /* Custom styles */
}

.theme-button {
  /* Button styles */
}

.theme-menu {
  /* Menu styles */
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
