# @sjohansson/astro-reactflow

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
