# Astro React Flow

Drop-in React Flow support for Astro 5+. Ships a thin React wrapper that stays independent from the rest of the monorepo so you can version and publish it on its own.

## Installation

```bash
pnpm add @sjohansson/astro-reactflow @xyflow/react react react-dom
```

## Usage

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

### With Export Feature

To enable diagram export, set the `enableExport` prop to `true`:

```astro
---
import { ReactFlowWrapper } from '@sjohansson/astro-reactflow';

const nodes = [
  { id: '1', position: { x: 0, y: 0 }, data: { label: 'Start' } },
  { id: '2', position: { x: 100, y: 100 }, data: { label: 'End' } }
];
const edges = [{ id: 'e1-2', source: '1', target: '2' }];
---

<ReactFlowWrapper
  client:only="react"
  nodes={nodes}
  edges={edges}
  enableExport={true}
  className="h-96 rounded-xl bg-surface-1"
/>
```

When enabled, two export buttons (PNG and SVG) will appear in the top-right corner of the diagram, allowing users to download the diagram.

### Props

| Prop       | Type                    | Description                                     |
| ---------- | ----------------------- | ----------------------------------------------- |
| `nodes`    | `Node[]`                | Nodes to render.                                |
| `edges`    | `Edge[]`                | Edges to render.                                |
| `className`| `string` (optional)     | Additional classes applied to the outer wrapper |
| `enableExport` | `boolean` (optional) | Enable export buttons for PNG/SVG download (default: `false`) |

### Styling

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
