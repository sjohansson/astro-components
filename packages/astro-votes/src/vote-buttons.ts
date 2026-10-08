/**
 * <vote-buttons> - like and dislike buttons backed by a static count.
 *
 * Framework-agnostic Web Component, Light DOM. The `up` and `down` attributes
 * hold the counts from the last sync. The visitor's own vote is kept in
 * localStorage and shown on top of those counts until the next sync includes
 * it. Each change is sent through the configured transport and announced with
 * a bubbling `vote-change` event.
 *
 * @example
 * ```html
 * <script type="module">
 *   import { registerVoteButtons } from "@sjohansson/astro-votes";
 *   registerVoteButtons();
 * </script>
 * <vote-buttons item="my-post" up="12" down="3" synced-at="2026-10-08T18:30:00.000Z"></vote-buttons>
 * ```
 */
import { DEFAULT_LABELS, voteButtonsHTML } from "./markup";
import { SSRSafeHTMLElement } from "./ssr-base";
import { getVoteConfig } from "./transport";
import { encodeVote, isValidItem, opsForChange, type VoteOp, type VoteState } from "./wire";

const STYLE_ID = "vote-buttons-styles";
const STORAGE_PREFIX = "votes:";

/** What the browser remembers per item. */
interface StoredVote {
  /** Current vote. */
  v: VoteState;
  /** Vote already included in the synced counts. */
  b: VoteState;
  /** Time of the last change, ms since epoch. */
  t: number;
}

export interface VoteChangeDetail {
  item: string;
  from: VoteState;
  to: VoteState;
  ops: VoteOp[];
}

function isVoteState(value: unknown): value is VoteState {
  return value === "up" || value === "down" || value === null;
}

function readStored(item: string): StoredVote | null {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + item);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredVote>;
    if (!isVoteState(parsed.v) || !isVoteState(parsed.b) || typeof parsed.t !== "number") return null;
    return { v: parsed.v, b: parsed.b, t: parsed.t };
  } catch {
    return null;
  }
}

function writeStored(item: string, vote: StoredVote): void {
  try {
    if (vote.v === null && vote.b === null) localStorage.removeItem(STORAGE_PREFIX + item);
    else localStorage.setItem(STORAGE_PREFIX + item, JSON.stringify(vote));
  } catch {
    // Private mode or blocked storage. The vote still sends, it just is not remembered.
  }
}

function contribution(state: VoteState, side: "up" | "down"): number {
  return state === side ? 1 : 0;
}

export class VoteButtonsElement extends SSRSafeHTMLElement {
  static get observedAttributes(): string[] {
    return ["item", "up", "down", "synced-at", "label-up", "label-down", "group-label"];
  }

  private vote: StoredVote = { v: null, b: null, t: 0 };

  private readonly onClick = (event: Event): void => {
    const target = event.target as Element | null;
    const button = target?.closest<HTMLButtonElement>("button[data-vote]");
    if (!button || !this.contains(button)) return;
    const side = button.dataset["vote"];
    if (side === "up" || side === "down") this.toggle(side);
  };

  // View transitions replace <head>, which drops the injected style tag.
  private readonly onAfterSwap = (): void => {
    ensureStyles();
  };

  connectedCallback(): void {
    ensureStyles();
    this.load();
    this.render();
    this.addEventListener("click", this.onClick);
    document.addEventListener("astro:after-swap", this.onAfterSwap);
  }

  disconnectedCallback(): void {
    this.removeEventListener("click", this.onClick);
    document.removeEventListener("astro:after-swap", this.onAfterSwap);
  }

  attributeChangedCallback(name: string): void {
    if (!this.isConnected) return;
    if (name === "item" || name === "synced-at") this.load();
    if (name.startsWith("label") || name === "group-label") this.querySelector(".vote-buttons")?.remove();
    this.render();
  }

  get item(): string {
    return this.getAttribute("item") ?? "";
  }

  /** The visitor's current vote. */
  get state(): VoteState {
    return this.vote.v;
  }

  /** Counts as shown: synced counts adjusted for the visitor's unsynced vote. */
  get counts(): { up: number; down: number } {
    const { v, b } = this.vote;
    const shown = (side: "up" | "down"): number =>
      Math.max(0, this.baseCount(side) - contribution(b, side) + contribution(v, side));
    return { up: shown("up"), down: shown("down") };
  }

  /** Press a button: votes for that side, or clears the vote if it is already pressed. */
  toggle(side: "up" | "down"): void {
    const item = this.item;
    if (!isValidItem(item)) return;

    const from = this.vote.v;
    const to: VoteState = from === side ? null : side;
    const ops = opsForChange(from, to);
    this.vote = { v: to, b: this.vote.b, t: Date.now() };
    writeStored(item, this.vote);
    this.render();
    this.announce(side);

    const config = getVoteConfig();
    const eventName = this.getAttribute("event-name") || config.eventName;
    for (const op of ops) {
      try {
        config.transport({ item, op, value: encodeVote(item, op), eventName });
      } catch {
        // Analytics failing must not break the buttons.
      }
    }

    this.dispatchEvent(
      new CustomEvent<VoteChangeDetail>("vote-change", {
        bubbles: true,
        composed: true,
        detail: { item, from, to, ops },
      }),
    );
  }

  private baseCount(side: "up" | "down"): number {
    const value = Number(this.getAttribute(side));
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
  }

  private syncedAt(): number {
    const raw = this.getAttribute("synced-at");
    const time = raw ? Date.parse(raw) : Number.NaN;
    return Number.isNaN(time) ? 0 : time;
  }

  private load(): void {
    const item = this.item;
    const stored = isValidItem(item) ? readStored(item) : null;
    if (!stored) {
      this.vote = { v: null, b: null, t: 0 };
      return;
    }
    // Everything sent before the last sync is already in the counts.
    this.vote = stored.t <= this.syncedAt() ? { v: stored.v, b: stored.v, t: stored.t } : stored;
    if (stored.b !== this.vote.b) writeStored(item, this.vote);
  }

  private render(): void {
    const { up, down } = this.counts;
    if (!this.querySelector(".vote-buttons")) {
      this.innerHTML = voteButtonsHTML({
        up,
        down,
        state: this.vote.v,
        labelUp: this.getAttribute("label-up") ?? DEFAULT_LABELS.up,
        labelDown: this.getAttribute("label-down") ?? DEFAULT_LABELS.down,
        groupLabel: this.getAttribute("group-label") ?? DEFAULT_LABELS.group,
      });
    }

    // Update in place so focus stays on the pressed button.
    const enabled = isValidItem(this.item);
    for (const button of this.querySelectorAll<HTMLButtonElement>("button[data-vote]")) {
      const side = button.dataset["vote"];
      button.setAttribute("aria-pressed", String(side === this.vote.v));
      button.disabled = !enabled;
    }
    this.setCount("up", up);
    this.setCount("down", down);
  }

  private setCount(side: "up" | "down", count: number): void {
    const el = this.querySelector(`[data-count="${side}"]`);
    if (el) el.textContent = String(count);
  }

  private announce(side: "up" | "down"): void {
    const status = this.querySelector(".vote-buttons__status");
    const label = this.querySelector(`button[data-vote="${side}"] .vote-buttons__label`)?.textContent ?? side;
    if (status) status.textContent = `${label} ${this.vote.v === side ? "on" : "off"}, ${this.counts[side]}`;
  }

  static readonly styles = `
    :where(vote-buttons) {
      --votes-gap: 0.5rem;
      --votes-fg: currentColor;
      --votes-bg: transparent;
      --votes-border: currentColor;
      --votes-accent: currentColor;
      --votes-accent-fg: Canvas;
      --votes-radius: 999px;
      --votes-focus: currentColor;
      display: inline-block;
    }

    :where(vote-buttons .vote-buttons) {
      display: inline-flex;
      gap: var(--votes-gap);
      align-items: center;
    }

    :where(vote-buttons .vote-buttons__button) {
      display: inline-flex;
      gap: 0.375rem;
      align-items: center;
      min-height: 2.25rem;
      padding: 0.25rem 0.75rem;
      font: inherit;
      color: var(--votes-fg);
      background: var(--votes-bg);
      border: 1px solid var(--votes-border);
      border-radius: var(--votes-radius);
      cursor: pointer;
    }

    :where(vote-buttons .vote-buttons__button[aria-pressed="true"]) {
      color: var(--votes-accent-fg);
      background: var(--votes-accent);
      border-color: var(--votes-accent);
    }

    :where(vote-buttons .vote-buttons__button:focus-visible) {
      outline: 2px solid var(--votes-focus);
      outline-offset: 2px;
    }

    :where(vote-buttons .vote-buttons__button:disabled) {
      cursor: not-allowed;
      opacity: 0.5;
    }

    :where(vote-buttons .vote-buttons__count) {
      font-variant-numeric: tabular-nums;
    }

    :where(vote-buttons .vote-buttons__label, vote-buttons .vote-buttons__status) {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }
  `;
}

function ensureStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = VoteButtonsElement.styles;
  document.head.appendChild(style);
}

export function registerVoteButtons(): void {
  if (!customElements.get("vote-buttons")) {
    customElements.define("vote-buttons", VoteButtonsElement);
  }
}
