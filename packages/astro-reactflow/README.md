# Astro React Flow

Drop-in React Flow support for Astro 6+. The integration auto-registers `@astrojs/react` and configures the Vite SSR settings React Flow needs, so consumers only have to add a single line to `astro.config.mjs`.

## Installation

```bash
pnpm add @sjohansson/astro-reactflow @astrojs/react @xyflow/react react react-dom
```

> If you already have `@astrojs/react` configured, the integration detects it and skips re-registration.

## Usage

### 1. Register the integration

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import reactFlow from '@sjohansson/astro-reactflow/integration';

export default defineConfig({
  integrations: [reactFlow()],
});
```

That's it — no need to manually add `react()` to your integrations. The React renderer is auto-registered.

### 2. Use the component

```astro
---
import { ReactFlowWrapper } from '@sjohansson/astro-reactflow';

const nodes = [
  { id: '1', position: { x: 0, y: 0 }, data: { label: 'Start' } },
  { id: '2', position: { x: 100, y: 100 }, data: { label: 'End' } },
];
const edges = [{ id: 'e1-2', source: '1', target: '2' }];
---

<ReactFlowWrapper
  client:only="react"
  nodes={nodes}
  edges={edges}
  className="h-96 rounded-xl bg-surface-1"
/>
```

`client:only="react"` is required because React Flow renders to the DOM and has no SSR output.

### Export buttons (optional)

```astro
<ReactFlowWrapper client:only="react" nodes={nodes} edges={edges} enableExport={true} />
```

PNG / SVG download buttons appear in the top-right when `enableExport` is enabled.

## API

### Integration options

| Option              | Type      | Default | Description                                                                                       |
| ------------------- | --------- | ------- | ------------------------------------------------------------------------------------------------- |
| `configureSsr`      | `boolean` | `true`  | Add `@xyflow/react` to Vite's `ssr.noExternal` so React Flow bundles correctly during SSR builds. |
| `autoRegisterReact` | `boolean` | `true`  | Auto-add `@astrojs/react` if it isn't in the consumer's `integrations` array.                     |

If `autoRegisterReact` is disabled and `@astrojs/react` is not present, the integration throws a clear error at config-load time instead of failing later with `NoMatchingRenderer`.

### Component props

| Prop           | Type                  | Description                                                       |
| -------------- | --------------------- | ----------------------------------------------------------------- |
| `nodes`        | `Node[]`              | Nodes to render.                                                  |
| `edges`        | `Edge[]`              | Edges to render.                                                  |
| `className`    | `string` (optional)   | Additional classes applied to the outer wrapper.                  |
| `enableExport` | `boolean` (optional)  | Enable PNG / SVG export buttons (default: `false`).               |

## Styling

- Base styles ship with the package (`styles.css`) and load with the component.
- Upstream React Flow styles are imported automatically from `@xyflow/react/dist/style.css`.

## Development

```bash
pnpm dev    # rebuild on changes
pnpm test   # run package tests
pnpm build  # emit ESM + .d.ts to dist/
pnpm clean  # remove build output
```

All React, React Flow, and `@astrojs/react` deps are peer-based — consumers bring their own versions.
