/**
 * <version-note> - a collapsible panel showing which build a site is running.
 *
 * Framework-agnostic Web Component, Light DOM. It shows a version (usually a
 * short commit hash) and a build time, starts collapsed, and expands when a
 * button whose `aria-controls` names the note's `id` is pressed. The close
 * button inside collapses it again. The `open` attribute holds the state, and
 * each change is announced with a bubbling `version-note-toggle` event.
 *
 * @example
 * ```html
 * <script type="module">
 *   import { registerVersionNote } from "@sjohansson/astro-version-note";
 *   registerVersionNote();
 * </script>
 * <button type="button" aria-controls="site-version" aria-expanded="false">Version</button>
 * <version-note id="site-version" version="f61f9f0" built="2026-10-20T19:00:00.000Z"></version-note>
 * ```
 */
import { versionNoteHTML } from "./markup";
import { SSRSafeHTMLElement } from "./ssr-base";
import { VERSION_NOTE_STYLES } from "./styles";

const STYLE_ID = "version-note-styles";

export interface RegisterVersionNoteOptions {
  /**
   * Inject the default styles with a <style> tag when the first note connects. Turn it off when the styles are
   * bundled at build time (the Astro integration does this) or when you bring your own.
   * @default true
   */
  injectStyles?: boolean;
}

let injectStyles = true;

export interface VersionNoteToggleDetail {
  open: boolean;
}

/** Attributes that change the rendered markup. */
const MARKUP_ATTRIBUTES = [
  "version",
  "built",
  "locale",
  "time-zone",
  "version-label",
  "built-label",
  "close-label",
  "close-text",
  "close-class",
];

export class VersionNoteElement extends SSRSafeHTMLElement {
  static get observedAttributes(): string[] {
    return ["open", ...MARKUP_ATTRIBUTES];
  }

  private readonly onClick = (event: Event): void => {
    const target = event.target as Element | null;
    const close = target?.closest("[data-version-note-close]");
    if (!close || !this.contains(close)) return;
    const hadFocus = this.contains(document.activeElement);
    this.hide();
    if (hadFocus) this.controllers()[0]?.focus();
  };

  private readonly onDocumentClick = (event: Event): void => {
    const target = event.target as Element | null;
    const controller = target?.closest<HTMLElement>("[aria-controls]");
    if (!controller || !this.isControlledBy(controller)) return;
    const hadFocus = document.activeElement === controller;
    this.toggle();
    if (!this.open) return;
    if (hadFocus) this.querySelector<HTMLElement>("[data-version-note-close]")?.focus({ preventScroll: true });
    if (this.hasAttribute("scroll-to-bottom")) {
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });
    }
  };

  // View transitions replace <head>, which drops the injected style tag.
  private readonly onAfterSwap = (): void => {
    ensureStyles();
  };

  connectedCallback(): void {
    ensureStyles();
    this.render();
    this.syncControllers();
    this.addEventListener("click", this.onClick);
    document.addEventListener("click", this.onDocumentClick);
    document.addEventListener("astro:after-swap", this.onAfterSwap);
  }

  disconnectedCallback(): void {
    this.removeEventListener("click", this.onClick);
    document.removeEventListener("click", this.onDocumentClick);
    document.removeEventListener("astro:after-swap", this.onAfterSwap);
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (!this.isConnected || oldValue === newValue) return;
    if (name === "open") {
      this.syncControllers();
      this.dispatchEvent(
        new CustomEvent<VersionNoteToggleDetail>("version-note-toggle", {
          bubbles: true,
          composed: true,
          detail: { open: this.open },
        }),
      );
      return;
    }
    this.querySelector(".version-note")?.remove();
    this.render();
  }

  get open(): boolean {
    return this.hasAttribute("open");
  }

  set open(value: boolean) {
    this.toggleAttribute("open", value);
  }

  show(): void {
    this.open = true;
  }

  hide(): void {
    this.open = false;
  }

  toggle(): void {
    this.open = !this.open;
  }

  private isControlledBy(element: Element): boolean {
    return this.id !== "" && (element.getAttribute("aria-controls") ?? "").split(/\s+/).includes(this.id);
  }

  private controllers(): HTMLElement[] {
    if (this.id === "") return [];
    return [...document.querySelectorAll<HTMLElement>("[aria-controls]")].filter((el) => this.isControlledBy(el));
  }

  private syncControllers(): void {
    for (const controller of this.controllers()) controller.setAttribute("aria-expanded", String(this.open));
  }

  private render(): void {
    // Server-rendered markup is adopted as is.
    if (this.querySelector(".version-note")) return;
    const attr = (name: string): string | undefined => this.getAttribute(name) ?? undefined;
    this.innerHTML = versionNoteHTML({
      version: attr("version") ?? "",
      built: attr("built"),
      locale: attr("locale"),
      timeZone: attr("time-zone"),
      versionLabel: attr("version-label"),
      builtLabel: attr("built-label"),
      closeLabel: attr("close-label"),
      closeText: attr("close-text"),
      closeClass: attr("close-class"),
    });
  }

  static readonly styles = VERSION_NOTE_STYLES;
}

function ensureStyles(): void {
  if (!injectStyles || document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = VersionNoteElement.styles;
  document.head.appendChild(style);
}

export function registerVersionNote(options: RegisterVersionNoteOptions = {}): void {
  injectStyles = options.injectStyles ?? true;
  if (!customElements.get("version-note")) {
    customElements.define("version-note", VersionNoteElement);
  }
}
