# Astro Version Note

A small, framework-agnostic version note component for Astro 5+ documentation sites. Ships minimal styles and no runtime dependencies so it can be published and consumed independently.

## Installation

```bash
pnpm add @sjohansson/astro-version-note
```

## Usage

```astro
---
import { VersionNote } from '@sjohansson/astro-version-note';
---

<VersionNote version="v3.2.0" type="warning">
  This page documents features that changed in v3.2.0.
</VersionNote>
```

### Props

| Prop      | Type                            | Description                      | Default |
| --------- | ------------------------------- | -------------------------------- | ------- |
| version   | `string`                        | Version label to render          | —       |
| type      | `"info" \| "warning" \| "success" \| "error"` | Visual style variant             | `"info"` |
| class     | `string` (optional)             | Extra classes applied to wrapper | `""`    |

The component includes light and dark mode palettes. Override any class if you need to align with your design system.

## Development

```bash
pnpm dev        # Rebuild on changes
pnpm test       # Run package tests
pnpm build      # Emit ESM, types, and copy .astro assets to dist/
pnpm clean      # Remove build output
```

This package stays self-contained—no shared code or cross-package imports—so it remains easy to publish on its own.
