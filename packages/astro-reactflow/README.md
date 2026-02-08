# Astro React Flow

Drop-in React Flow support for Astro 5+. Ships a thin React wrapper that stays independent from the rest of the monorepo so you can version and publish it on its own.

## Installation

```bash
pnpm add @sjohansson/astro-reactflow @xyflow/react react react-dom
```

## Usage

### As an Astro Integration (Recommended)

Use the integration for automatic setup and validation:

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import reactFlow from '@sjohansson/astro-reactflow/integration';

export default defineConfig({
  integrations: [
    react(), // Required
    reactFlow({
      // Optional: configure SSR handling for React Flow
      configureSsr: true,
    })
  ],
});
```

Then use the component in your pages:

```astro
---
import { ReactFlowWrapper } from '@sjohansson/astro-reactflow';

const nodes = [{ id: '1', position: { x: 0, y: 0 }, data: { label: 'Start' } }];
const edges = [];
---

<ReactFlowWrapper
  client:only="react"
  nodes={nodes}
  edges={edges}
  className="h-96 rounded-xl bg-surface-1"
/>
```

**Benefits of using the integration:**
- Automatic detection of missing React integration
- Optimized Vite configuration for React Flow SSR compatibility
- Proper dependency validation

### As a Standalone Component

For minimal setup, ensure you have `@astrojs/react` configured and import directly:

```astro
---
import { ReactFlowWrapper } from '@sjohansson/astro-reactflow';

const nodes = [{ id: '1', position: { x: 0, y: 0 }, data: { label: 'Start' } }];
const edges = [];
---

<ReactFlowWrapper
  client:only="react"
  nodes={nodes}
  edges={edges}
  className="h-96 rounded-xl bg-surface-1"
/>
```

## API

### Integration Options

| Option          | Type      | Description                                   | Default |
| --------------- | --------- | --------------------------------------------- | ------- |
| `configureSsr`  | `boolean` | Configure React Flow for SSR compatibility    | `true`  |

**Note:** React Flow styles are automatically imported by the ReactFlowWrapper component and cannot be disabled via integration options.

### Component Props

| Prop       | Type                    | Description                                     |
| ---------- | ----------------------- | ----------------------------------------------- |
| `nodes`    | `Node[]`                | Nodes to render.                                |
| `edges`    | `Edge[]`                | Edges to render.                                |
| `className`| `string` (optional)     | Additional classes applied to the outer wrapper |

## Styling

- Base styles ship with the package (`styles.css`) to keep the canvas predictable. You can override them with your own classes on the wrapper div.
- The upstream React Flow styles are imported automatically from `@xyflow/react/dist/style.css`.

## Development

```bash
pnpm dev        # Rebuild on changes
pnpm test       # Run package tests
pnpm build      # Emit ESM, types, and copy assets to dist/
pnpm clean      # Remove build output
```

This package deliberately keeps all dependencies peer-based so consumers bring their own React and React Flow versions.

## Learn More

- [Integration Guide](../../INTEGRATION_GUIDE.md) - Detailed guide on using as integration vs component
- [Packaging Guide](../../PACKAGING_GUIDE.md) - Architecture and best practices
