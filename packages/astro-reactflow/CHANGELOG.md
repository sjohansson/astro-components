# @sjohansson/astro-reactflow

## 0.4.1

### Patch Changes

- d626f72: bump dependencies, update examples to Astro 7
- 624201f: Widen the `astro` peer dependency range to `^5.0.0 || ^6.0.0 || ^7.0.0` so the packages install cleanly on Astro 5, 6, and 7. The integrations only use long-stable Astro APIs (`AstroIntegration`, the `astro:config:setup`/`astro:config:done` hooks, `logger`, `updateConfig`, and `vite` config), so no code changes are required.

  `@sjohansson/astro-reactflow` also widens its `@astrojs/react` peer range to `^4.0.0 || ^5.0.0` (v4 supports Astro 5, v5 supports Astro 6/7) so the Astro 5 path is satisfiable.

## 0.4.0

### Minor Changes

- d037816: Add a `miniMapSize` prop to `ReactFlowWrapper` for sizing the minimap. Accepts a named preset (`"sm"` | `"md"` | `"lg"`), a single number (width in px; height follows the default 4:3 ratio), or an explicit `{ width, height }` where each value is pixels (`number`) or a percentage of the diagram pane (`string`, e.g. `"25%"`). Percentage sizes are converted to px and tracked with a `ResizeObserver`, so they follow container and focus-mode resizes. Omitting the prop keeps React Flow's default 200×150 minimap, so existing usage is unchanged.

## 0.3.0

### Minor Changes

- 107844d: Feature uplift for `ReactFlowWrapper`, bringing it to parity with a richer reference diagram component.

  **Breaking:** `nodes`/`edges` now use a friendly shape. Nodes take a top-level `label` (hoisted to `data.label`) instead of `data: { label }`, and edges accept `markerEnd`/`strokeWidth` shorthands. Migrate `{ id, position, data: { label } }` to `{ id, label, position }`.

  New features:
  - Integrated `title` (header bar) and `description` (footer bar).
  - Fullscreen **focus mode** with an expand button, Esc-to-exit, and viewport save/restore (`allowFocusMode`, default on).
  - Minimap with color-coded input/output nodes (`showMiniMap`).
  - Background variants `dots` | `lines` | `cross` (`backgroundVariant`).
  - `showControls`, `interactive`, and `fitView` toggles.
  - Per-edge and diagram-level arrowheads and stroke width (`defaultMarkerEnd`, `defaultStrokeWidth`).
  - Automatic light/dark theming via `colorMode="auto"` (follows the sibling theme-toggle, Tailwind `.dark`, `data-theme`, and `prefers-color-scheme`), with `colorMode="light"|"dark"` override.
  - Self-contained, overridable styling through `--arf-*` CSS custom properties.

  The PNG/SVG export feature is retained as opt-in `enableExport` and now follows the resolved light/dark background.

## 0.2.0

### Minor Changes

- 3a9b74d: Add export feature

## 0.1.1

### Patch Changes

- 33a8377: Set up a shared Astro-friendly build scaffold, add type-safe stubs for `.astro` files, and refresh package docs to keep each component publish-ready on its own.
