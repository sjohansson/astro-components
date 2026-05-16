/**
 * <version-note> — Displays version-specific documentation notes.
 *
 * Framework-agnostic Web Component. Works in any HTML page.
 * Uses Light DOM so styles integrate naturally with the host page
 * and work correctly with class-based dark mode toggling.
 *
 * @example
 * ```html
 * <script type="module">
 *   import { registerVersionNote } from '@sjohansson/astro-version-note';
 *   registerVersionNote();
 * </script>
 * <version-note version="v1.0.0" type="info">
 *   This feature was added in v1.0.0.
 * </version-note>
 * ```
 */
import { SSRSafeHTMLElement } from "./ssr-base";

export class VersionNoteElement extends SSRSafeHTMLElement {
  static get observedAttributes(): string[] {
    return ["version", "type"];
  }

  connectedCallback(): void {
    this.render();
  }

  attributeChangedCallback(): void {
    if (this.isConnected) {
      this.render();
    }
  }

  private get noteType(): string {
    return this.getAttribute("type") || "info";
  }

  private get version(): string {
    return this.getAttribute("version") || "";
  }

  private render(): void {
    this.innerHTML = `
      <div class="version-note version-note--${this.noteType}" role="note">
        <span class="version-note__label">Version ${this.version}</span>
        <div class="version-note__content">
          <slot></slot>
        </div>
      </div>
    `;

    // Inject scoped styles if not already present
    if (!document.getElementById("version-note-styles")) {
      const style = document.createElement("style");
      style.id = "version-note-styles";
      style.textContent = VersionNoteElement.styles;
      document.head.appendChild(style);
    }
  }

  static readonly styles = `
    version-note {
      display: block;
    }

    .version-note {
      padding: 1rem;
      border-radius: 0.5rem;
      margin: 1rem 0;
      border-left: 4px solid;
    }

    .version-note__label {
      font-weight: 600;
      display: block;
      margin-bottom: 0.5rem;
    }

    .version-note__content {
      font-size: 0.875rem;
    }

    .version-note--info {
      background-color: #eff6ff;
      border-color: #3b82f6;
      color: #1e40af;
    }

    .version-note--warning {
      background-color: #fef3c7;
      border-color: #f59e0b;
      color: #92400e;
    }

    .version-note--success {
      background-color: #d1fae5;
      border-color: #10b981;
      color: #065f46;
    }

    .version-note--error {
      background-color: #fee2e2;
      border-color: #ef4444;
      color: #991b1b;
    }

    .dark .version-note--info {
      background-color: #1e3a8a;
      color: #bfdbfe;
    }

    .dark .version-note--warning {
      background-color: #78350f;
      color: #fde68a;
    }

    .dark .version-note--success {
      background-color: #064e3b;
      color: #a7f3d0;
    }

    .dark .version-note--error {
      background-color: #7f1d1d;
      color: #fecaca;
    }
  `;
}

export function registerVersionNote(): void {
  if (!customElements.get("version-note")) {
    customElements.define("version-note", VersionNoteElement);
  }
}
