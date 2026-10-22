# @sjohansson/astro-version-note

## 0.4.0

### Minor Changes

- 6cbfbb4: Make the styles easy to override and stop the panel flashing open before the script runs.
  
  - The integration bundles the styles into every page at build time, so the panel is collapsed with no JavaScript.
    `versionNote({ styles: false })` leaves them out. `registerVersionNote({ injectStyles: false })` does the same without
    the integration.
  - The styles sit in a `version-note` cascade layer, so any unlayered site rule wins. Declare `@layer version-note;`
    before `@import "tailwindcss";` and Tailwind utilities win too.
  - Reduced motion now sets `--version-note-duration` and `--version-note-line-duration` to `0s` instead of removing the
    transitions, so a site can set them again to animate regardless. New `--version-note-easing` property.
  - `versionNoteHTML` takes `closeHTML` for an icon in the close button.
  - Exports `VERSION_NOTE_STYLES`.

## 0.3.0

### Minor Changes

- 74f7915: Rebuild `<version-note>` as a collapsible build info panel: version (commit hash) and build time, opened by any button
  whose `aria-controls` names the note's `id`, closed by its own close button. Adds `versionNoteHTML` and `formatBuildTime`
  for server rendering, an `open` attribute with `show()`, `hide()`, and `toggle()`, a `version-note-toggle` event, and
  `--version-note-*` custom properties for styling.
  
  Breaking: the `type` attribute and its info, warning, success, and error callout styles are gone, and the integration
  takes no options. It now registers the element on every page instead of only logging.

## 0.2.1

### Patch Changes

- d626f72: bump dependencies, update examples to Astro 7
- 624201f: Widen the `astro` peer dependency range to `^5.0.0 || ^6.0.0 || ^7.0.0` so the packages install cleanly on Astro 5, 6, and 7. The integrations only use long-stable Astro APIs (`AstroIntegration`, the `astro:config:setup`/`astro:config:done` hooks, `logger`, `updateConfig`, and `vite` config), so no code changes are required.

  `@sjohansson/astro-reactflow` also widens its `@astrojs/react` peer range to `^4.0.0 || ^5.0.0` (v4 supports Astro 5, v5 supports Astro 6/7) so the Astro 5 path is satisfiable.

## 0.2.0

### Minor Changes

- 3a9b74d: Bump dependencies

## 0.1.1

### Patch Changes

- 33a8377: Set up a shared Astro-friendly build scaffold, add type-safe stubs for `.astro` files, and refresh package docs to keep each component publish-ready on its own.
