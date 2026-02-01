# Astro Version Note

A small, framework-agnostic version note component for Astro 5+ documentation sites. Ships minimal styles and no runtime dependencies so it can be published and consumed independently.

## Installation

```bash
pnpm add @sjohansson/astro-version-note
```

## Usage

### As an Astro Integration (Recommended)

Use the integration for consistent configuration across your site:

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import versionNote from '@sjohansson/astro-version-note/integration';

export default defineConfig({
  integrations: [
    versionNote({
      // Optional: set defaults for all version notes
      defaultVersion: 'v1.0.0',
      defaultType: 'info',
    })
  ],
});
```

Then use the component in your pages:

```astro
---
import { VersionNote } from '@sjohansson/astro-version-note';
---

<VersionNote version="v3.2.0" type="warning">
  This page documents features that changed in v3.2.0.
</VersionNote>
```

**Benefits of using the integration:**
- Global defaults for consistent styling
- Configuration validation
- Runtime configuration access

### As a Standalone Component

For minimal setup, import and use directly:

```astro
---
import { VersionNote } from '@sjohansson/astro-version-note';
---

<VersionNote version="v3.2.0" type="warning">
  This page documents features that changed in v3.2.0.
</VersionNote>
```

## API

### Integration Options

| Option          | Type                                           | Description                      | Default  |
| --------------- | ---------------------------------------------- | -------------------------------- | -------- |
| `defaultVersion`| `string`                                       | Default version for all notes    | —        |
| `defaultType`   | `"info"` \| `"warning"` \| `"success"` \| `"error"` | Default visual variant           | `"info"` |

### Component Props

| Prop      | Type                                           | Description                      | Default |
| --------- | ---------------------------------------------- | -------------------------------- | ------- |
| version   | `string`                                       | Version label to render          | —       |
| type      | `"info"` \| `"warning"` \| `"success"` \| `"error"` | Visual style variant             | `"info"` |
| class     | `string` (optional)                            | Extra classes applied to wrapper | `""`    |

The component includes light and dark mode palettes. Override any class if you need to align with your design system.

## Development

```bash
pnpm dev        # Rebuild on changes
pnpm test       # Run package tests
pnpm build      # Emit ESM, types, and copy .astro assets to dist/
pnpm clean      # Remove build output
```

This package stays self-contained—no shared code or cross-package imports—so it remains easy to publish on its own.

## Learn More

- [Integration Guide](../../INTEGRATION_GUIDE.md) - Detailed guide on using as integration vs component
- [Packaging Guide](../../PACKAGING_GUIDE.md) - Architecture and best practices
