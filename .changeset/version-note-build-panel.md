---
"@sjohansson/astro-version-note": minor
---

Rebuild `<version-note>` as a collapsible build info panel: version (commit hash) and build time, opened by any button
whose `aria-controls` names the note's `id`, closed by its own close button. Adds `versionNoteHTML` and `formatBuildTime`
for server rendering, an `open` attribute with `show()`, `hide()`, and `toggle()`, a `version-note-toggle` event, and
`--version-note-*` custom properties for styling.

Breaking: the `type` attribute and its info, warning, success, and error callout styles are gone, and the integration
takes no options. It now registers the element on every page instead of only logging.
