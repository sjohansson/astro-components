# @sjohansson/astro-theme-toggle

## 0.3.3

### Patch Changes

- 5d72a3b: Fix `<theme-controller>` leaking global listeners when it is removed from the DOM.

  `disconnectedCallback` released the `astro:after-swap` and outside-click listeners but left the `window` `resize` listener and both `matchMedia` `change` listeners attached. Under Astro view transitions every navigation swaps the element out, so removed controllers stayed reachable and kept writing their theme classes onto `<html>` — a system scheme change could be applied by a controller that is no longer on the page.

  `disconnectedCallback` now detaches all of them. The `MediaQueryList` objects are retained when subscribing, since `matchMedia()` returns a fresh instance per call and `removeEventListener` on a different one would not detach. `bindEvents` also drops any previous `resize` registration before re-adding, so an attribute change away from `expand-direction="auto"` no longer leaves the listener behind.

## 0.3.2

### Patch Changes

- d626f72: bump dependencies, update examples to Astro 7
- 624201f: Widen the `astro` peer dependency range to `^5.0.0 || ^6.0.0 || ^7.0.0` so the packages install cleanly on Astro 5, 6, and 7. The integrations only use long-stable Astro APIs (`AstroIntegration`, the `astro:config:setup`/`astro:config:done` hooks, `logger`, `updateConfig`, and `vite` config), so no code changes are required.

  `@sjohansson/astro-reactflow` also widens its `@astrojs/react` peer range to `^4.0.0 || ^5.0.0` (v4 supports Astro 5, v5 supports Astro 6/7) so the Astro 5 path is satisfiable.

## 0.3.1

### Patch Changes

- 3a98a97: Fix missing contrast persistence management in theme controller, leading to contrast issues on devices

## 0.3.0

### Minor Changes

- 1c33403: Update Theme toggle trigger icon size approach to better support consumer size controls

## 0.2.0

### Minor Changes

- 3a9b74d: Fix missing color-blind adjusted theme options
- 3a9b74d: Add Theming showcase with attribute configuration and separate css files
- 3a9b74d: Add data-attribute theming for css use

## 0.1.1

### Patch Changes

- 33a8377: Set up a shared Astro-friendly build scaffold, add type-safe stubs for `.astro` files, and refresh package docs to keep each component publish-ready on its own.
