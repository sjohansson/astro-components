/**
 * Panel markup shared by the element and by server rendering. Rendering the
 * same HTML at build time (`set:html`) means the build time is formatted once,
 * in the time zone you pick, and the element adopts it instead of re-rendering.
 */

export interface VersionNoteFormatOptions {
  /** BCP 47 locale for the build time. Defaults to the runtime's locale. */
  locale?: string | undefined;
  /** IANA time zone for the build time, for example `Australia/Sydney`. Defaults to the runtime's zone. */
  timeZone?: string | undefined;
}

export interface VersionNoteMarkupOptions extends VersionNoteFormatOptions {
  /** Version to show, usually a short commit hash. */
  version: string;
  /** Build time as an ISO 8601 string or a Date. Omit to leave the row out. */
  built?: string | Date | undefined;
  versionLabel?: string | undefined;
  builtLabel?: string | undefined;
  /** Accessible name of the close button. */
  closeLabel?: string | undefined;
  /** Visible text of the close button. */
  closeText?: string | undefined;
  /** Extra classes for the close button, so it can match the site's other buttons. */
  closeClass?: string | undefined;
}

export const DEFAULT_LABELS = {
  version: "version:",
  built: "built:",
  close: "Close version info",
  closeText: "×",
} as const;

export function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/** Formats a build time for display. Returns the input unchanged if it is not a valid date. */
export function formatBuildTime(built: string | Date, options: VersionNoteFormatOptions = {}): string {
  const date = built instanceof Date ? built : new Date(built);
  if (Number.isNaN(date.getTime())) return String(built);
  return date.toLocaleString(options.locale, options.timeZone ? { timeZone: options.timeZone } : undefined);
}

function row(label: string, value: string): string {
  return `<dt class="version-note__label">${escapeHtml(label)}</dt><dd class="version-note__value">${value}</dd>`;
}

/** Inner HTML for `<version-note>`. */
export function versionNoteHTML(options: VersionNoteMarkupOptions): string {
  const closeClass = ["version-note__close", options.closeClass].filter(Boolean).join(" ");
  const rows = [row(options.versionLabel ?? DEFAULT_LABELS.version, `<code>${escapeHtml(options.version)}</code>`)];
  if (options.built !== undefined) {
    const built = options.built instanceof Date ? options.built.toISOString() : options.built;
    const shown = formatBuildTime(options.built, options);
    rows.push(
      row(
        options.builtLabel ?? DEFAULT_LABELS.built,
        `<time datetime="${escapeHtml(built)}">${escapeHtml(shown)}</time>`,
      ),
    );
  }
  return (
    '<div class="version-note">' +
    `<button type="button" class="${escapeHtml(closeClass)}" data-version-note-close aria-label="${escapeHtml(
      options.closeLabel ?? DEFAULT_LABELS.close,
    )}">${escapeHtml(options.closeText ?? DEFAULT_LABELS.closeText)}</button>` +
    `<dl class="version-note__list">${rows.join("")}</dl>` +
    "</div>"
  );
}
