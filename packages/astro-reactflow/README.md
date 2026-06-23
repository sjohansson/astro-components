# Astro React Flow

Drop-in React Flow diagrams for Astro 5, 6, and 7. Ships a feature-complete `ReactFlowWrapper` component — integrated title/description, fullscreen **focus mode**, minimap, background variants, automatic light/dark theming, and optional PNG/SVG export — plus an integration that auto-registers `@astrojs/react` and configures the Vite SSR settings React Flow needs.

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
---

<ReactFlowWrapper
  client:only="react"
  title="Basic Process Flow"
  nodes={[
    { id: '1', type: 'input', label: 'Start', position: { x: 250, y: 0 } },
    { id: '2', label: 'Process Data', position: { x: 250, y: 100 } },
    { id: '3', type: 'output', label: 'Complete', position: { x: 250, y: 200 } },
  ]}
  edges={[
    { id: 'e1-2', source: '1', target: '2', animated: true },
    { id: 'e2-3', source: '2', target: '3' },
  ]}
  description="A simple linear process flow from start to completion."
  showMiniMap={true}
  height={450}
/>
```

`client:only="react"` is required because React Flow renders to the DOM and has no SSR output.

## API

### Integration options

| Option              | Type      | Default | Description                                                                                       |
| ------------------- | --------- | ------- | ------------------------------------------------------------------------------------------------- |
| `configureSsr`      | `boolean` | `true`  | Add `@xyflow/react` to Vite's `ssr.noExternal` so React Flow bundles correctly during SSR builds. |
| `autoRegisterReact` | `boolean` | `true`  | Auto-add `@astrojs/react` if it isn't in the consumer's `integrations` array.                     |

If `autoRegisterReact` is disabled and `@astrojs/react` is not present, the integration throws a clear error at config-load time instead of failing later with `NoMatchingRenderer`.

### Component props

| Prop                 | Type                                       | Default  | Description                                                                 |
| -------------------- | ------------------------------------------ | -------- | --------------------------------------------------------------------------- |
| `nodes`              | `DiagramNode[]`                            | —        | Nodes to render (see shape below).                                          |
| `edges`              | `DiagramEdge[]`                            | —        | Edges to render (see shape below).                                          |
| `title`              | `string`                                   | —        | Title rendered in a header bar above the diagram.                           |
| `description`        | `string`                                   | —        | Description rendered in a footer bar below the diagram.                     |
| `width`              | `number \| string`                         | `"100%"` | Container width. Numbers are px; strings pass through.                       |
| `height`             | `number \| string`                         | `400`    | Container height. Numbers are px; strings pass through.                      |
| `showMiniMap`        | `boolean`                                  | `false`  | Show the minimap (input/output nodes are color-coded).                       |
| `miniMapSize`        | `MiniMapSize`                              | `"md"` (200×150) | Minimap dimensions (see [`MiniMapSize`](#minimapsize) below).        |
| `showControls`       | `boolean`                                  | `true`   | Show the zoom/pan controls.                                                 |
| `backgroundVariant`  | `"dots" \| "lines" \| "cross"`             | `"dots"` | Background pattern.                                                          |
| `allowFocusMode`     | `boolean`                                  | `true`   | Show the expand button that opens fullscreen focus mode (Esc to exit).      |
| `interactive`        | `boolean`                                  | `false`  | Allow dragging, connecting, and selecting nodes/edges.                       |
| `fitView`            | `boolean`                                  | `true`   | Fit the diagram to the viewport on load.                                    |
| `defaultMarkerEnd`   | `"arrow" \| "arrowclosed" \| boolean`      | `false`  | Default arrowhead for all edges.                                            |
| `defaultStrokeWidth` | `number`                                   | `2`      | Default edge stroke width.                                                  |
| `colorMode`          | `"auto" \| "light" \| "dark"`              | `"auto"` | `"auto"` follows the host page's theme; pass `"light"`/`"dark"` to pin it.   |
| `className`          | `string`                                   | —        | Extra classes on the outer wrapper.                                        |
| `style`              | `CSSProperties`                            | —        | Extra inline styles on the outer wrapper.                                  |
| `enableExport`       | `boolean`                                  | `false`  | Show PNG / SVG export buttons.                                             |

#### `DiagramNode`

```ts
interface DiagramNode {
  id: string;
  type?: 'default' | 'input' | 'output' | 'group' | string;
  label: string;                       // hoisted to React Flow's data.label
  position: { x: number; y: number };
  style?: CSSProperties;
  className?: string;
  parentId?: string;
  extent?: 'parent';
}
```

#### `DiagramEdge`

```ts
interface DiagramEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  type?: 'default' | 'straight' | 'step' | 'smoothstep' | 'bezier';   // default: smoothstep
  animated?: boolean;
  style?: CSSProperties;
  markerEnd?: 'arrow' | 'arrowclosed' | boolean;   // overrides defaultMarkerEnd
  strokeWidth?: number;                            // overrides defaultStrokeWidth
}
```

#### `MiniMapSize`

```ts
type MiniMapPreset    = 'sm' | 'md' | 'lg';            // 120×90, 200×150, 320×240 (4:3)
type MiniMapDimension = number | string;               // px number, or a "%" of the pane
type MiniMapSize      = MiniMapPreset | number | { width: MiniMapDimension; height: MiniMapDimension };
```

Pass `miniMapSize` to resize the minimap. Omitting it keeps React Flow's default 200×150, so existing usage is unchanged.

```astro
<ReactFlowWrapper client:only="react" showMiniMap miniMapSize="lg" {...} />          <!-- preset -->
<ReactFlowWrapper client:only="react" showMiniMap miniMapSize={160} {...} />          <!-- width px, 4:3 height -->
<ReactFlowWrapper client:only="react" showMiniMap miniMapSize={{ width: 240, height: 180 }} {...} />  <!-- px -->
<ReactFlowWrapper client:only="react" showMiniMap miniMapSize={{ width: '25%', height: '20%' }} {...} /> <!-- % of pane -->
```

- A **number** sets the width in px; the height follows the default 4:3 ratio.
- A **`"%"` string** is measured against the diagram pane and tracked with a `ResizeObserver`, so the minimap rescales with the container and in focus mode. (React Flow needs numeric dimensions internally, so percentages are converted to px for you.)

## Theming

`colorMode="auto"` (the default) resolves light/dark from the host page and re-evaluates when the theme changes. It checks `<html>` for any of: a `dark` or `scheme-dark` class, `data-theme-scheme="dark"`, or a `data-theme` value containing `"dark"` — falling back to the OS `prefers-color-scheme`. This works out of the box with [`@sjohansson/astro-theme-toggle`](https://www.npmjs.com/package/@sjohansson/astro-theme-toggle), Tailwind's `.dark`, and most attribute-based theme systems. Pass `colorMode="light"` or `colorMode="dark"` to pin it.

The component ships self-contained light/dark styles via overridable CSS custom properties on `.reactflow-wrapper`. Override them to match your site:

| Variable                | Purpose                                  |
| ----------------------- | ---------------------------------------- |
| `--arf-surface`         | Diagram canvas background                |
| `--arf-chrome-surface`  | Title/description/control surfaces       |
| `--arf-text`            | Body text / node text / edge stroke      |
| `--arf-heading`         | Title text                               |
| `--arf-border`          | Borders and node outlines                |
| `--arf-button-hover-bg` | Button hover background                  |
| `--arf-input-accent`    | `input` node border + connection line    |
| `--arf-output-accent`   | `output` node border                     |

```css
/* Map the wrapper onto your own design tokens */
.reactflow-wrapper {
  --arf-surface: var(--my-surface-color);
  --arf-chrome-surface: var(--my-chrome-color);
  --arf-border: var(--my-border-color);
}
```

The resolved mode is also reflected as `data-color-mode="light" | "dark"` on `.reactflow-wrapper`, so you can target it from your own CSS.

## Development

```bash
pnpm dev    # rebuild on changes
pnpm test   # run package tests
pnpm build  # emit ESM + .d.ts to dist/
pnpm clean  # remove build output
```

All React, React Flow, and `@astrojs/react` deps are peer-based — consumers bring their own versions.
