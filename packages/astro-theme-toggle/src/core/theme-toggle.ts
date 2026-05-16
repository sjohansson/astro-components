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
 */
import { SSRSafeHTMLElement } from "./ssr-base";

export class ThemeToggleElement extends SSRSafeHTMLElement {
  private button: HTMLButtonElement | null = null;
  private sunIcon: SVGElement | null = null;
  private moonIcon: SVGElement | null = null;

  static get observedAttributes(): string[] {
    return [];
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
    if (theme === "dark") {
      root.classList.add("dark");
      this.sunIcon?.classList.add("hidden");
      this.moonIcon?.classList.remove("hidden");
    } else {
      root.classList.remove("dark");
      this.sunIcon?.classList.remove("hidden");
      this.moonIcon?.classList.add("hidden");
    }
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("theme", theme);
    }
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
