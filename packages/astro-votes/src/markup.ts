/**
 * Button markup shared by the element and by server rendering. Rendering the
 * same HTML at build time (`set:html`) avoids a layout shift on load and the
 * element adopts it instead of re-rendering.
 */
import type { VoteState } from "./wire";

export interface VoteMarkupOptions {
  up: number;
  down: number;
  state?: VoteState;
  labelUp?: string;
  labelDown?: string;
  groupLabel?: string;
}

export const DEFAULT_LABELS = { up: "Like", down: "Dislike", group: "Rate this page" } as const;

const PLUS_ICON =
  '<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="M8 3v10M3 8h10"/></svg>';
const MINUS_ICON =
  '<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="M3 8h10"/></svg>';

export function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function button(vote: "up" | "down", label: string, count: number, pressed: boolean): string {
  return (
    `<button type="button" class="vote-buttons__button" data-vote="${vote}" aria-pressed="${pressed}">` +
    (vote === "up" ? PLUS_ICON : MINUS_ICON) +
    `<span class="vote-buttons__label">${escapeHtml(label)}</span>` +
    `<span class="vote-buttons__count" data-count="${vote}">${count}</span>` +
    "</button>"
  );
}

/** Inner HTML for `<vote-buttons>`. */
export function voteButtonsHTML(options: VoteMarkupOptions): string {
  const { up, down, state = null } = options;
  const labelUp = options.labelUp ?? DEFAULT_LABELS.up;
  const labelDown = options.labelDown ?? DEFAULT_LABELS.down;
  const groupLabel = options.groupLabel ?? DEFAULT_LABELS.group;
  return (
    `<div class="vote-buttons" role="group" aria-label="${escapeHtml(groupLabel)}">` +
    button("up", labelUp, up, state === "up") +
    button("down", labelDown, down, state === "down") +
    '<span class="vote-buttons__status" role="status" aria-live="polite"></span>' +
    "</div>"
  );
}
