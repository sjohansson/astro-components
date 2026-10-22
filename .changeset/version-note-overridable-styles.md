---
"@sjohansson/astro-version-note": minor
---

Make the styles easy to override and stop the panel flashing open before the script runs.

- The integration bundles the styles into every page at build time, so the panel is collapsed with no JavaScript.
  `versionNote({ styles: false })` leaves them out. `registerVersionNote({ injectStyles: false })` does the same without
  the integration.
- The styles sit in a `version-note` cascade layer, so any unlayered site rule wins. Declare `@layer version-note;`
  before `@import "tailwindcss";` and Tailwind utilities win too.
- Reduced motion now sets `--version-note-duration` and `--version-note-line-duration` to `0s` instead of removing the
  transitions, so a site can set them again to animate regardless. New `--version-note-easing` property.
- `versionNoteHTML` takes `closeHTML` for an icon in the close button.
- Exports `VERSION_NOTE_STYLES`.
