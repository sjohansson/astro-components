# Astro Theme Toggle

A lightweight, SSR-friendly theme toggle component built for Astro 5+. Works with Tailwind CSS 4 utility classes or plain CSS and persists the user's preference using `localStorage`.

## Installation

```bash
pnpm add @sjohansson/astro-theme-toggle
```

## Usage

```astro
---
import { ThemeToggle } from '@sjohansson/astro-theme-toggle';
---

<ThemeToggle
  class="rounded-md border border-surface-3 bg-surface-1 px-3 py-2 text-surface-12 hover:bg-surface-2"
/>
```

The component ships with accessible labels, handles system preferences, and re-runs after Astro view transitions via the `astro:after-swap` event.

### Props

| Prop   | Type     | Description                               | Default |
| ------ | -------- | ----------------------------------------- | ------- |
| class? | `string` | Optional CSS classes applied to the button | `""`    |

### Styling notes

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
