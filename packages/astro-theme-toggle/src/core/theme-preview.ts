import { defaultThemes, filterThemesByPreset, groupByFamily } from "../theme-config";
import type { ThemeConfig, ThemePreset } from "../types";

/**
 * <theme-preview> — Renders a color palette grid for all theme tokens.
 *
 * Framework-agnostic Web Component. Generates static HTML — no interactivity.
 *
 * @attr {string} preset - 'basic' | 'accessible' | 'full'
 * @attr {string} family - Filter to a specific family ID
 * @attr {string} theme - Filter to a specific theme ID, or 'all'
 * @attr {string} themes - JSON string of ThemeConfig[] (overrides defaults)
 */
export class ThemePreviewElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["preset", "family", "theme", "themes"];
  }

  connectedCallback(): void {
    this.render();
  }

  attributeChangedCallback(): void {
    if (this.isConnected) {
      this.render();
    }
  }

  private resolveThemes(): ThemeConfig[] {
    const themesAttr = this.getAttribute("themes");
    let themes: ThemeConfig[];
    if (themesAttr) {
      try {
        themes = JSON.parse(themesAttr);
      } catch {
        themes = defaultThemes;
      }
    } else {
      themes = [...defaultThemes];
    }

    const preset = this.getAttribute("preset");
    if (preset) {
      themes = filterThemesByPreset(themes, preset as ThemePreset);
    }

    const family = this.getAttribute("family");
    if (family) {
      themes = themes.filter((t) => (t.family ?? t.id) === family);
    }

    const themeFilter = this.getAttribute("theme");
    if (themeFilter && themeFilter !== "all") {
      themes = themes.filter((t) => t.id === themeFilter);
    }

    return themes;
  }

  private renderColorItem(name: string, varName: string, value: string): string {
    return `
      <div class="tp-color-item">
        <div class="tp-color-swatch" style="background-color: ${value}"></div>
        <div class="tp-color-info">
          <span class="tp-color-name">${name}</span>
          <code class="tp-color-var">${varName}</code>
          <span class="tp-color-value">${value}</span>
        </div>
      </div>
    `;
  }

  private renderThemeCard(config: ThemeConfig, showFamily: boolean): string {
    const title = showFamily
      ? config.label
      : config.familyLabel
        ? `${config.familyLabel} — ${config.label}`
        : config.label;

    return `
      <div class="tp-theme-card">
        <div class="tp-theme-header">
          <h3 class="tp-theme-name">${title}</h3>
          ${config.description ? `<p class="tp-theme-desc">${config.description}</p>` : ""}
        </div>
        <div class="tp-color-section">
          <h4 class="tp-section-title">Background</h4>
          <div class="tp-color-grid">
            ${this.renderColorItem("Primary", "--theme-bg-primary", config.colors.background.primary)}
            ${this.renderColorItem("Secondary", "--theme-bg-secondary", config.colors.background.secondary)}
            ${this.renderColorItem("Tertiary", "--theme-bg-tertiary", config.colors.background.tertiary)}
          </div>
        </div>
        <div class="tp-color-section">
          <h4 class="tp-section-title">Foreground</h4>
          <div class="tp-color-grid">
            ${this.renderColorItem("Primary", "--theme-fg-primary", config.colors.foreground.primary)}
            ${this.renderColorItem("Secondary", "--theme-fg-secondary", config.colors.foreground.secondary)}
            ${this.renderColorItem("Tertiary", "--theme-fg-tertiary", config.colors.foreground.tertiary)}
          </div>
        </div>
        <div class="tp-color-section">
          <h4 class="tp-section-title">Interactive</h4>
          <div class="tp-color-grid">
            ${this.renderColorItem("Default", "--theme-interactive-default", config.colors.interactive.default)}
            ${this.renderColorItem("Hover", "--theme-interactive-hover", config.colors.interactive.hover)}
          </div>
        </div>
        <div class="tp-color-section">
          <h4 class="tp-section-title">Semantic</h4>
          <div class="tp-color-grid">
            ${this.renderColorItem("Success", "--theme-success", config.colors.semantic.success)}
            ${this.renderColorItem("Warning", "--theme-warning", config.colors.semantic.warning)}
            ${this.renderColorItem("Error", "--theme-error", config.colors.semantic.error)}
            ${this.renderColorItem("Info", "--theme-info", config.colors.semantic.info)}
          </div>
        </div>
      </div>
    `;
  }

  private render(): void {
    const themes = this.resolveThemes();
    const families = groupByFamily(themes);
    const showFamilyHeaders = families.length > 1;

    const html = families
      .map(
        (fam) => `
        <div class="tp-family-group">
          ${
            showFamilyHeaders
              ? `<div class="tp-family-header">
                  <h3 class="tp-family-name">${fam.label}</h3>
                  <span class="tp-family-count">${fam.variants.length} variant${fam.variants.length !== 1 ? "s" : ""}</span>
                </div>`
              : ""
          }
          <div class="tp-theme-grid">
            ${fam.variants.map((v) => this.renderThemeCard(v, showFamilyHeaders)).join("")}
          </div>
        </div>
      `,
      )
      .join("");

    this.innerHTML = `
      <div class="tp-preview">
        <h2 class="tp-preview-title">Theme Color Palette</h2>
        <p class="tp-preview-desc">
          Preview of color tokens across theme families and variants.
          These colors are available as CSS custom properties in your application.
        </p>
        ${html}
      </div>
    `;

    if (!document.getElementById("theme-preview-styles")) {
      const style = document.createElement("style");
      style.id = "theme-preview-styles";
      style.textContent = ThemePreviewElement.styles;
      document.head.appendChild(style);
    }
  }

  static readonly styles = `
    theme-preview { display: block; }
    .tp-preview { padding: 2rem; background: #ffffff; border-radius: 0.5rem; }
    .tp-preview-title { font-size: 1.875rem; font-weight: 700; margin-bottom: 0.5rem; color: #212529; }
    .tp-preview-desc { font-size: 1rem; color: #6c757d; margin-bottom: 2rem; }
    .tp-family-group { margin-bottom: 2.5rem; }
    .tp-family-group:last-child { margin-bottom: 0; }
    .tp-family-header { display: flex; align-items: baseline; gap: 0.75rem; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 2px solid #dee2e6; }
    .tp-family-name { font-size: 1.5rem; font-weight: 700; color: #212529; margin: 0; }
    .tp-family-count { font-size: 0.875rem; color: #6c757d; }
    .tp-theme-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 2rem; }
    .tp-theme-card { border: 1px solid #dee2e6; border-radius: 0.5rem; padding: 1.5rem; background: #f8f9fa; }
    .tp-theme-header { margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 2px solid #dee2e6; }
    .tp-theme-name { font-size: 1.25rem; font-weight: 600; margin-bottom: 0.25rem; color: #212529; }
    .tp-theme-desc { font-size: 0.875rem; color: #6c757d; margin: 0; }
    .tp-color-section { margin-bottom: 1.5rem; }
    .tp-color-section:last-child { margin-bottom: 0; }
    .tp-section-title { font-size: 0.875rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #495057; margin-bottom: 0.75rem; }
    .tp-color-grid { display: grid; gap: 0.75rem; }
    .tp-color-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; background: #ffffff; border: 1px solid #dee2e6; border-radius: 0.375rem; }
    .tp-color-swatch { width: 3rem; height: 3rem; border-radius: 0.25rem; border: 1px solid rgba(0,0,0,0.1); flex-shrink: 0; }
    .tp-color-info { display: flex; flex-direction: column; gap: 0.125rem; min-width: 0; }
    .tp-color-name { font-size: 0.875rem; font-weight: 500; color: #212529; }
    .tp-color-var { font-size: 0.75rem; font-family: "Courier New", monospace; color: #0d6efd; background: #e7f3ff; padding: 0.125rem 0.375rem; border-radius: 0.25rem; align-self: flex-start; }
    .tp-color-value { font-size: 0.75rem; font-family: "Courier New", monospace; color: #6c757d; }
  `;
}

export function registerThemePreview(): void {
  if (!customElements.get("theme-preview")) {
    customElements.define("theme-preview", ThemePreviewElement);
  }
}
