/**
 * <theme-toggle> — Simple light/dark toggle button.
 *
 * Framework-agnostic Web Component. Works in any HTML page.
 *
 * @example
 * ```html
 * <script type="module" src="@sjohansson/astro-theme-toggle/core"></script>
 * <theme-toggle></theme-toggle>
 * ```
 *
 * @attr {string} apply-mode - 'class' | 'attribute' | 'both' (default: 'class').
 *   How the active light/dark theme is reflected on <html>: the `.dark` class,
 *   a data attribute, or both.
 * @attr {string} attribute-name - Base data attribute name (default: 'data-theme').
 *   Coerced to start with 'data-'. Used when apply-mode is 'attribute' or 'both'.
 * @attr {string} attribute-companions - 'false' to disable the derived
 *   data-*-scheme companion attribute (default: enabled).
 */
import type { ToggleApplyMode } from "../types";
import { SSRSafeHTMLElement } from "./ssr-base";

export class ThemeToggleElement extends SSRSafeHTMLElement {
  private button: HTMLButtonElement | null = null;
  private sunIcon: SVGElement | null = null;
  private moonIcon: SVGElement | null = null;
  /** Last data-attribute base name applied, so we can clean it up if it changes. */
  private lastAttributeName: string | undefined;

  static get observedAttributes(): string[] {
    return ["apply-mode", "attribute-name", "attribute-companions"];
  }

  connectedCallback(): void {
    this.render();
    this.button = this.querySelector("button");
    this.sunIcon = this.querySelector(".sun-icon");
    this.moonIcon = this.querySelector(".moon-icon");
    this.applyTheme(this.getTheme());

    this.button?.addEventListener("click", this.handleClick);
    // Support Astro View Transitions if available
    document.addEventListener("astro:after-swap", this.reinit);
  }

  disconnectedCallback(): void {
    this.button?.removeEventListener("click", this.handleClick);
    document.removeEventListener("astro:after-swap", this.reinit);
  }

  attributeChangedCallback(): void {
    if (this.isConnected) {
      this.applyTheme(this.getTheme());
    }
  }

  private get applyMode(): ToggleApplyMode {
    const mode = this.getAttribute("apply-mode");
    return mode === "attribute" || mode === "both" ? mode : "class";
  }

  /** Base data-attribute name, coerced to start with `data-`. */
  private get attributeName(): string {
    const raw = this.getAttribute("attribute-name") || "data-theme";
    return raw.startsWith("data-") ? raw : `data-${raw}`;
  }

  /** Companions default ON — opt out with `attribute-companions="false"`. */
  private get attributeCompanions(): boolean {
    return this.getAttribute("attribute-companions") !== "false";
  }

  private reinit = (): void => {
    this.button = this.querySelector("button");
    this.sunIcon = this.querySelector(".sun-icon");
    this.moonIcon = this.querySelector(".moon-icon");
    this.applyTheme(this.getTheme());
  };

  private handleClick = (): void => {
    const current = this.getTheme();
    this.applyTheme(current === "dark" ? "light" : "dark");
  };

  private getTheme(): string {
    if (typeof localStorage !== "undefined") {
      const stored = localStorage.getItem("theme");
      if (stored) {
        return stored;
      }
    }
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
    return "light";
  }

  private applyTheme(theme: string): void {
    const root = document.documentElement;
    const isDark = theme === "dark";
    const mode = this.applyMode;

    // `.dark` class — kept for 'class' and 'both' modes.
    if (mode === "class" || mode === "both") {
      root.classList.toggle("dark", isDark);
    } else {
      root.classList.remove("dark");
    }

    // Data attribute(s) — set for 'attribute' and 'both' modes.
    if (mode === "attribute" || mode === "both") {
      this.applyDataAttributes(theme);
    } else {
      this.removeDataAttributes();
    }

    // Icon state is independent of apply mode.
    this.sunIcon?.classList.toggle("hidden", isDark);
    this.moonIcon?.classList.toggle("hidden", !isDark);

    if (typeof localStorage !== "undefined") {
      localStorage.setItem("theme", theme);
    }
  }

  /**
   * Reflect the active light/dark theme as data attribute(s) on <html>.
   * The toggle has no family/category, so the companion is `-scheme` only.
   */
  private applyDataAttributes(theme: string): void {
    const root = document.documentElement;
    const base = this.attributeName;

    if (this.lastAttributeName && this.lastAttributeName !== base) {
      this.removeAttributeSet(this.lastAttributeName);
    }

    root.setAttribute(base, theme);
    if (this.attributeCompanions) {
      root.setAttribute(`${base}-scheme`, theme);
    } else {
      root.removeAttribute(`${base}-scheme`);
    }

    this.lastAttributeName = base;
    this.storeAttributeState(base, theme);
  }

  private removeDataAttributes(): void {
    if (!this.lastAttributeName) {
      return;
    }
    this.removeAttributeSet(this.lastAttributeName);
    this.lastAttributeName = undefined;
  }

  private removeAttributeSet(base: string): void {
    const root = document.documentElement;
    root.removeAttribute(base);
    root.removeAttribute(`${base}-scheme`);
  }

  /**
   * Persist the resolved attribute state so the FOUC init script can replay it
   * before paint. Generic keys, shared with <theme-controller>.
   */
  private storeAttributeState(base: string, theme: string): void {
    if (typeof localStorage === "undefined") {
      return;
    }
    localStorage.setItem("theme-attr-name", base);
    localStorage.setItem("theme-resolved-id", theme);
    localStorage.setItem("theme-resolved-scheme", theme);
    localStorage.setItem("theme-attr-companions", this.attributeCompanions ? "1" : "0");
  }

  private render(): void {
    this.innerHTML = `
      <button type="button" aria-label="Toggle theme">
        <span class="sr-only">Toggle theme</span>
        <svg class="sun-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="10" cy="10" r="4" stroke="currentColor" stroke-width="2"></circle>
          <path d="M10 2V4M10 16V18M18 10H16M4 10H2M15.657 4.343L14.243 5.757M5.757 14.243L4.343 15.657M15.657 15.657L14.243 14.243M5.757 5.757L4.343 4.343" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path>
        </svg>
        <svg class="moon-icon hidden" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M17 12.5A7.5 7.5 0 1 1 7.5 3a6 6 0 0 0 9.5 9.5Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"></path>
        </svg>
      </button>
    `;

    // Inject scoped styles if not already present
    if (!document.getElementById("theme-toggle-styles")) {
      const style = document.createElement("style");
      style.id = "theme-toggle-styles";
      style.textContent = ThemeToggleElement.styles;
      document.head.appendChild(style);
    }
  }

  static readonly styles = `
    theme-toggle button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.5rem;
      border: none;
      background: transparent;
      border-radius: 0.375rem;
      cursor: pointer;
      color: inherit;
      transition: background-color 0.2s;
    }
    theme-toggle button:hover {
      background-color: rgba(0, 0, 0, 0.1);
    }
    .dark theme-toggle button:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }
    theme-toggle .sun-icon,
    theme-toggle .moon-icon {
      width: 1.25rem;
      height: 1.25rem;
    }
    theme-toggle .hidden {
      display: none;
    }
    theme-toggle .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border-width: 0;
    }
  `;
}

export function registerThemeToggle(): void {
  if (!customElements.get("theme-toggle")) {
    customElements.define("theme-toggle", ThemeToggleElement);
  }
}
