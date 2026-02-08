# Astro Theme Toggle

A lightweight, SSR-friendly theme toggle component built for Astro 5+. Works with Tailwind CSS 4 utility classes or plain CSS and persists the user's preference using `localStorage`.

## Installation

```bash
pnpm add @sjohansson/astro-theme-toggle
```

## Usage

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
  class="rounded-md border border-surface-3 bg-surface-1 px-3 py-2 text-surface-12 hover:bg-surface-2"
/>
```

The component ships with accessible labels, handles system preferences, and re-runs after Astro view transitions via the `astro:after-swap` event.

## API

### Integration Options

| Option         | Type      | Description                               | Default |
| -------------- | --------- | ----------------------------------------- | ------- |
| `injectScript` | `boolean` | Inject theme initialization script in head | `false` |

### Component Props

| Prop   | Type     | Description                               | Default |
| ------ | -------- | ----------------------------------------- | ------- |
| class? | `string` | Optional CSS classes applied to the button | `""`    |

## Styling

- Works seamlessly with Tailwind CSS 4 utility classes via the `class` prop.
- If you are not using Tailwind, you can target the built-in selectors (`.sun-icon`, `.moon-icon`, `.dark`) to theme the control.

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
