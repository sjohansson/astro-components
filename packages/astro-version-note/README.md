# Astro Version Note

A collapsible panel that shows which build a site is running: the version (usually a short commit hash) and when it was
built. It sits collapsed in a footer until someone presses its toggle, so you can check what is deployed without it
getting in readers' way.

Framework-agnostic Web Component (`<version-note>`, Light DOM) for Astro 5, 6, and 7. No runtime dependencies.

## Installation

```bash
pnpm add @sjohansson/astro-version-note
```

## Usage

Register the element and bundle its styles on every page with the integration:

```js
// astro.config.mjs
import { defineConfig } from "astro/config";
import versionNote from "@sjohansson/astro-version-note/integration";

export default defineConfig({
  integrations: [versionNote()],
});
```

Render the panel at build time and point a toggle button at it with `aria-controls`:

```astro
---
import { versionNoteHTML } from "@sjohansson/astro-version-note";

const commit = import.meta.env.PUBLIC_COMMIT ?? "dev";
const built = new Date().toISOString();
---

<footer>
  <version-note
    id="site-version"
    set:html={versionNoteHTML({ version: commit, built, locale: "en-AU", timeZone: "Australia/Sydney" })}
  />
  <button type="button" aria-controls="site-version" aria-expanded="false" aria-label="Show version info">v</button>
</footer>
```

Rendering with `versionNoteHTML` formats the build time once, in the zone you choose, and the element adopts that markup.
Without it the element renders from its attributes and formats the time in the visitor's locale and zone.

The toggle is yours: any button, any text or icon. The package only looks for `aria-controls`.

Without the integration, register it yourself. The element then injects its styles with a `<style>` tag when the first
note connects, so the panel shows unstyled until the script runs:

```astro
<script>
  import { registerVersionNote } from "@sjohansson/astro-version-note";
  registerVersionNote(); // or registerVersionNote({ injectStyles: false }) to bring your own
</script>
```

## Behaviour

- Starts collapsed. Any element with `aria-controls` naming the note's `id` toggles it, and gets `aria-expanded` kept in
  step. The close button inside collapses it.
- Focus moves to the close button when the toggle had focus, and back to the toggle on close.
- `open` reflects the state. Each change fires a bubbling `version-note-toggle` event with `detail.open`.
- While collapsed the panel is `visibility: hidden`, so its close button is out of the tab order.
- With `scroll-to-bottom`, opening scrolls the page to the end. Useful when the note lives in a footer.
- Honours `prefers-reduced-motion`: the durations drop to `0s`. See [Styling](#styling) to opt out.

## API

### Element attributes

| Attribute          | Description                                     | Default              |
| ------------------ | ----------------------------------------------- | -------------------- |
| `id`               | Needed for toggle buttons to find the note      | none                 |
| `open`             | Expanded when present                           | absent               |
| `version`          | Version to show                                 | `""`                 |
| `built`            | Build time, ISO 8601. Leave out to drop the row | none                 |
| `locale`           | Locale for the build time                       | runtime locale       |
| `time-zone`        | IANA time zone for the build time               | runtime zone         |
| `version-label`    | Label before the version                        | `version:`           |
| `built-label`      | Label before the build time                     | `built:`             |
| `close-label`      | Accessible name of the close button             | `Close version info` |
| `close-text`       | Visible text of the close button                | `×`                  |
| `close-class`      | Extra classes on the close button               | none                 |
| `scroll-to-bottom` | Scroll the page to the end when opened          | absent               |

The markup attributes are only read when the element renders its own markup. Server-rendered markup is kept as is.

### Element properties and methods

`open` (boolean, read and write), `show()`, `hide()`, `toggle()`.

### Exports

| Export                         | Description                                                          |
| ------------------------------ | -------------------------------------------------------------------- |
| `versionNoteHTML(options)`     | Inner HTML for `<version-note>`. Options mirror the attributes above |
| `formatBuildTime(built, opts)` | The date formatting `versionNoteHTML` uses                           |
| `registerVersionNote(opts)`    | Defines `<version-note>`. `opts.injectStyles` (default `true`)       |
| `VersionNoteElement`           | The element class                                                    |
| `DEFAULT_LABELS`               | Default label text                                                   |
| `VERSION_NOTE_STYLES`          | The default stylesheet as a string                                   |

`versionNoteHTML` options: `version` (required), `built` (string or Date), `locale`, `timeZone`, `versionLabel`,
`builtLabel`, `closeLabel`, `closeText`, `closeClass`, and `closeHTML` (trusted HTML for the close button, such as an
icon; wins over `closeText`).

### Integration options

| Option   | Description                                                              | Default |
| -------- | ------------------------------------------------------------------------ | ------- |
| `styles` | Bundle the default styles into every page. `false` leaves styling to you | `true`  |

### Styling

The default styles sit in the `version-note` cascade layer and inside `:where()`, so any unlayered rule on your site
wins over them. With Tailwind 4, declare the layer before Tailwind so utilities win too:

```css
@layer version-note;
@import "tailwindcss";
```

Tune it with custom properties on `version-note`:

| Property                       | Default                          |
| ------------------------------ | -------------------------------- |
| `--version-note-duration`      | `0.5s`, `0s` with reduced motion |
| `--version-note-line-duration` | `0.4s`, `0s` with reduced motion |
| `--version-note-easing`        | `cubic-bezier(0.4, 0, 0.2, 1)`   |
| `--version-note-max-height`    | `8rem`                           |
| `--version-note-gap`           | `1.25rem`                        |
| `--version-note-font-size`     | `0.625rem`                       |
| `--version-note-line-color`    | `currentColor`                   |
| `--version-note-line-size`     | `1px`                            |

Setting a duration on `version-note` replaces the reduced-motion `0s` as well. To change the speed and still honour
reduced motion, set it inside `@media (prefers-reduced-motion: no-preference)`. To animate for everyone:

```css
version-note {
  --version-note-duration: 0.5s;
  --version-note-line-duration: 0.4s;
}
```

Classes: `.version-note` (panel), `.version-note__close`, `.version-note__list` (a `<dl>`), `.version-note__label`,
`.version-note__value`. To replace the styles entirely, pass `styles: false` to the integration (or
`injectStyles: false` to `registerVersionNote`) and write your own against `version-note`, `version-note[open]`, and
those classes.

## Development

```bash
pnpm dev        # Rebuild on changes
pnpm test       # Run package tests
pnpm build      # Emit ESM and types to dist/
pnpm clean      # Remove build output
```

This package stays self-contained, with no shared code or cross-package imports, so it can be published on its own.
