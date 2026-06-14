---
"@sjohansson/astro-reactflow": minor
---

Add a `miniMapSize` prop to `ReactFlowWrapper` for sizing the minimap. Accepts a named preset (`"sm"` | `"md"` | `"lg"`), a single number (width in px; height follows the default 4:3 ratio), or an explicit `{ width, height }` where each value is pixels (`number`) or a percentage of the diagram pane (`string`, e.g. `"25%"`). Percentage sizes are converted to px and tracked with a `ResizeObserver`, so they follow container and focus-mode resizes. Omitting the prop keeps React Flow's default 200×150 minimap, so existing usage is unchanged.
