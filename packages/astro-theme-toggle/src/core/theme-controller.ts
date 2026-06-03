import { clearThemeColors, defaultThemes, filterThemesByPreset, groupByFamily } from "../theme-config";
import type { ThemeApplyMode, ThemeConfig, ThemeFamily, ThemePreset } from "../types";
import { SSRSafeHTMLElement } from "./ssr-base";

/**
 * <theme-controller> — Multi-theme selector with family and variant support.
 *
 * Framework-agnostic Web Component. Works in any HTML page.
 *
 * @example
 * ```html
 * <theme-controller preset="accessible" show-labels></theme-controller>
 * ```
 *
 * @attr {string} preset - 'basic' | 'accessible' | 'full' (default: 'basic')
 * @attr {string} expand-direction - 'horizontal' | 'vertical' | 'auto' (default: 'auto')
 *   Controls how the option buttons inside each section flow.
 * @attr {string} sections-direction - 'horizontal' | 'vertical' | 'auto' (default: 'auto')
 *   When both Theme (family) and Mode (variant) sections are shown, controls
 *   whether the two sections sit side-by-side ('horizontal') or stacked
 *   ('vertical'). 'auto' stacks them vertically so each section's row can
 *   grow horizontally independently.
 * @attr {string} expand-side - 'auto' | 'start' | 'end' (default: 'auto')
 *   Which side of the trigger the panel opens toward. 'end' = right (horizontal)
 *   or below (vertical); 'start' = left or above. 'auto' picks the side with
 *   the most room when the panel opens.
 * @attr {boolean} show-labels - Show text labels next to icons
 * @attr {string} label-position - 'auto' | 'below' | 'above' | 'right' | 'left'
 *   (default: 'auto'). Where the label sits relative to the icon when
 *   `show-labels` is enabled. 'auto' = 'below' in horizontal expand, 'right'
 *   in vertical expand.
 * @attr {string} themes - JSON string of ThemeConfig[] (filtered by preset)
 * @attr {string} family - Restrict to a single family by id (variant-only UI)
 * @attr {string} apply-mode - 'inline' | 'attribute' | 'both' (default: 'inline').
 *   How the active theme is reflected on <html>: inline CSS custom properties,
 *   data attribute(s), or both. Classes are always set regardless.
 * @attr {string} attribute-name - Base data attribute name (default: 'data-theme').
 *   Coerced to start with 'data-'. Used when apply-mode is 'attribute' or 'both'.
 * @attr {string} attribute-companions - 'false' to disable the derived
 *   data-*-family / data-*-scheme / data-*-category companion attributes
 *   (default: enabled).
 *
 * @cssprop --theme-controller-label-font-size - Label text size (default 0.75rem)
 * @cssprop --theme-controller-label-font-family - Label font family (default inherit)
 * @cssprop --theme-controller-label-font-weight - Label font weight (default 500)
 * @cssprop --theme-controller-label-color - Label text color (default inherit)
 * @cssprop --theme-controller-label-letter-spacing - Label letter spacing (default normal)
 * @cssprop --theme-controller-label-line-height - Label line height (default 1.2)
 */
export class ThemeControllerElement extends SSRSafeHTMLElement {
  private themes: ThemeConfig[] = [];
  private families: ThemeFamily[] = [];
  private hasMultipleFamilies = false;
  private isOpen = false;
  private currentFamily = "";
  private currentVariant = "system";
  private resizeTimer: ReturnType<typeof setTimeout> | undefined;
  /** Last data-attribute base name applied, so we can clean it up if it changes. */
  private lastAttributeName: string | undefined;

  static get observedAttributes(): string[] {
    return [
      "preset",
      "expand-direction",
      "sections-direction",
      "expand-side",
      "show-labels",
      "label-position",
      "themes",
      "family",
      "apply-mode",
      "attribute-name",
      "attribute-companions",
    ];
  }

  connectedCallback(): void {
    this.resolveThemes();
    this.render();
    this.restorePreferences();
    this.applyCurrentSelection();
    this.bindEvents();

    document.addEventListener("astro:after-swap", this.reinit);
  }

  disconnectedCallback(): void {
    document.removeEventListener("astro:after-swap", this.reinit);
    document.removeEventListener("click", this.handleOutsideClick);
    if (this.resizeTimer) {
      clearTimeout(this.resizeTimer);
    }
  }

  attributeChangedCallback(): void {
    if (this.isConnected) {
      this.resolveThemes();
      this.render();
      this.restorePreferences();
      this.applyCurrentSelection();
      this.bindEvents();
    }
  }

  // ── Configuration ──

  private resolveThemes(): void {
    const themesAttr = this.getAttribute("themes");
    let source: ThemeConfig[];
    if (themesAttr) {
      try {
        source = JSON.parse(themesAttr);
      } catch {
        source = defaultThemes;
      }
    } else {
      source = defaultThemes;
    }

    const preset = (this.getAttribute("preset") || "basic") as ThemePreset;
    let filtered = filterThemesByPreset(source, preset);

    const family = this.getAttribute("family");
    if (family) {
      filtered = filtered.filter((t) => (t.family ?? t.id) === family);
    }

    this.themes = filtered;
    this.families = groupByFamily(this.themes);
    this.hasMultipleFamilies = this.families.length > 1;
  }

  private get expandDirection(): string {
    return this.getAttribute("expand-direction") || "auto";
  }

  private get sectionsDirection(): string {
    return this.getAttribute("sections-direction") || "auto";
  }

  private get labelPosition(): string {
    return this.getAttribute("label-position") || "auto";
  }

  private get expandSide(): string {
    return this.getAttribute("expand-side") || "auto";
  }

  private get showLabels(): boolean {
    return this.hasAttribute("show-labels");
  }

  private get applyMode(): ThemeApplyMode {
    const mode = this.getAttribute("apply-mode");
    return mode === "attribute" || mode === "both" ? mode : "inline";
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

  // ── Preferences ──

  private restorePreferences(): void {
    if (this.hasMultipleFamilies) {
      this.currentFamily = localStorage.getItem("theme-family") || this.families[0]?.id || "default";
      if (!this.families.find((f) => f.id === this.currentFamily)) {
        this.currentFamily = this.families[0]?.id || "default";
      }
      this.currentVariant = localStorage.getItem("theme-variant") || "system";
    } else {
      this.currentVariant = localStorage.getItem("theme-mode") || "system";
      this.currentFamily = this.families[0]?.id || "default";
    }
  }

  private storePreferences(): void {
    if (typeof localStorage === "undefined") {
      return;
    }
    localStorage.setItem("theme-family", this.currentFamily);
    localStorage.setItem("theme-variant", this.currentVariant);
    localStorage.setItem("theme-mode", this.currentVariant === "system" ? "system" : this.currentVariant);
  }

  // ── System preference ──

  private getSystemScheme(): "light" | "dark" {
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  private getSystemCategory(): string {
    return window.matchMedia?.("(prefers-contrast: more)").matches ? "high-contrast" : "base";
  }

  // ── Theme resolution ──

  private resolveThemeId(): string {
    const family = this.families.find((f) => f.id === this.currentFamily);
    if (!family) {
      return this.themes[0]?.id ?? "light";
    }

    if (this.currentVariant === "system") {
      const scheme = this.getSystemScheme();
      const category = this.getSystemCategory();
      return (
        family.variants.find((v) => v.category === category && v.scheme === scheme)?.id ??
        family.variants.find((v) => v.category === "base" && v.scheme === scheme)?.id ??
        family.variants.find((v) => v.scheme === scheme)?.id ??
        (family.variants[0] as ThemeConfig).id
      );
    }

    // Variant is "category-scheme" (e.g., "base-light", "high-contrast-dark")
    const lastDash = this.currentVariant.lastIndexOf("-");
    const variantScheme = this.currentVariant.substring(lastDash + 1) as "light" | "dark";
    const variantCategory = this.currentVariant.substring(0, lastDash);

    const match = family.variants.find((v) => v.category === variantCategory && v.scheme === variantScheme);
    if (match) {
      return match.id;
    }

    // Direct ID match (single-family mode)
    const direct = this.themes.find((t) => t.id === this.currentVariant);
    if (direct) {
      return direct.id;
    }

    return (family.variants[0] as ThemeConfig).id;
  }

  // ── Apply ──

  applyCurrentSelection(): void {
    const resolvedId = this.resolveThemeId();
    const root = document.documentElement;
    const themeConfig = this.themes.find((t) => t.id === resolvedId);

    // Theme classes
    for (const t of this.themes) {
      root.classList.remove(`theme-${t.id}`);
    }
    root.classList.add(`theme-${resolvedId}`);

    // Scheme class
    root.classList.remove("scheme-light", "scheme-dark");
    if (themeConfig) {
      root.classList.add(`scheme-${themeConfig.scheme}`);

      // Family class
      for (const fam of this.families) {
        root.classList.remove(`family-${fam.id}`);
      }
      root.classList.add(`family-${themeConfig.family ?? themeConfig.id}`);

      const mode = this.applyMode;

      // CSS custom properties (inline). Cleared in pure attribute mode so stale
      // inline vars don't beat attribute-driven CSS.
      if (mode === "inline" || mode === "both") {
        this.applyColors(themeConfig);
      } else {
        clearThemeColors(root);
      }

      // Data attributes
      if (mode === "attribute" || mode === "both") {
        this.applyDataAttributes(themeConfig, resolvedId);
      } else {
        this.removeDataAttributes();
      }
    }

    // Update trigger icon
    const showIcon = this.currentVariant === "system" ? "system" : resolvedId;
    for (const icon of this.querySelectorAll<HTMLElement>("[data-trigger-icon]")) {
      icon.style.display = icon.getAttribute("data-trigger-icon") === showIcon ? "block" : "none";
    }

    // Active states
    for (const btn of this.querySelectorAll("[data-family-option]")) {
      btn.classList.toggle("active", btn.getAttribute("data-family-option") === this.currentFamily);
    }
    for (const btn of this.querySelectorAll("[data-variant-option]")) {
      btn.classList.toggle("active", btn.getAttribute("data-variant-option") === this.currentVariant);
    }
    for (const btn of this.querySelectorAll("[data-theme-option]")) {
      btn.classList.toggle("active", btn.getAttribute("data-theme-option") === this.currentVariant);
    }

    this.storePreferences();
  }

  private applyColors(config: ThemeConfig): void {
    const { colors } = config;
    const root = document.documentElement;
    root.style.setProperty("--theme-bg-primary", colors.background.primary);
    root.style.setProperty("--theme-bg-secondary", colors.background.secondary);
    root.style.setProperty("--theme-bg-tertiary", colors.background.tertiary);
    root.style.setProperty("--theme-fg-primary", colors.foreground.primary);
    root.style.setProperty("--theme-fg-secondary", colors.foreground.secondary);
    root.style.setProperty("--theme-fg-tertiary", colors.foreground.tertiary);
    root.style.setProperty("--theme-border-default", colors.border.default);
    root.style.setProperty("--theme-border-hover", colors.border.hover);
    root.style.setProperty("--theme-border-focus", colors.border.focus);
    root.style.setProperty("--theme-interactive-default", colors.interactive.default);
    root.style.setProperty("--theme-interactive-hover", colors.interactive.hover);
    root.style.setProperty("--theme-interactive-active", colors.interactive.active);
    root.style.setProperty("--theme-interactive-disabled", colors.interactive.disabled);
    root.style.setProperty("--theme-success", colors.semantic.success);
    root.style.setProperty("--theme-warning", colors.semantic.warning);
    root.style.setProperty("--theme-error", colors.semantic.error);
    root.style.setProperty("--theme-info", colors.semantic.info);
  }

  /**
   * Reflect the active theme as data attribute(s) on <html>. Sets the base
   * attribute to the resolved theme id, plus optional companions for family,
   * scheme, and category. Cleans up a previously-used base name if it changed.
   */
  private applyDataAttributes(config: ThemeConfig, resolvedId: string): void {
    const root = document.documentElement;
    const base = this.attributeName;

    // If the configured name changed at runtime, remove the old attributes first.
    if (this.lastAttributeName && this.lastAttributeName !== base) {
      this.removeAttributeSet(this.lastAttributeName);
    }

    root.setAttribute(base, resolvedId);
    if (this.attributeCompanions) {
      root.setAttribute(`${base}-family`, config.family ?? config.id);
      root.setAttribute(`${base}-scheme`, config.scheme);
      root.setAttribute(`${base}-category`, config.category);
    } else {
      root.removeAttribute(`${base}-family`);
      root.removeAttribute(`${base}-scheme`);
      root.removeAttribute(`${base}-category`);
    }

    this.lastAttributeName = base;
    this.storeAttributeState(base, resolvedId, config);
  }

  /**
   * Remove data attribute(s) this component previously set. No-ops when the
   * component never set any (so default `inline` mode never touches a
   * `data-theme` a consumer may own for unrelated reasons).
   */
  private removeDataAttributes(): void {
    if (!this.lastAttributeName) {
      return;
    }
    this.removeAttributeSet(this.lastAttributeName);
    this.lastAttributeName = undefined;
  }

  /** Remove a base attribute and its three companions. */
  private removeAttributeSet(base: string): void {
    const root = document.documentElement;
    root.removeAttribute(base);
    root.removeAttribute(`${base}-family`);
    root.removeAttribute(`${base}-scheme`);
    root.removeAttribute(`${base}-category`);
  }

  /**
   * Persist the resolved attribute state so the FOUC init script can replay it
   * before paint without needing the theme list. Generic keys, shared with
   * <theme-toggle>.
   */
  private storeAttributeState(base: string, resolvedId: string, config: ThemeConfig): void {
    if (typeof localStorage === "undefined") {
      return;
    }
    localStorage.setItem("theme-attr-name", base);
    localStorage.setItem("theme-resolved-id", resolvedId);
    localStorage.setItem("theme-resolved-family", config.family ?? config.id);
    localStorage.setItem("theme-resolved-scheme", config.scheme);
    localStorage.setItem("theme-resolved-category", config.category);
    localStorage.setItem("theme-attr-companions", this.attributeCompanions ? "1" : "0");
  }

  // ── Panel ──

  private togglePanel(): void {
    this.isOpen = !this.isOpen;
    const panel = this.querySelector(".theme-panel");
    const trigger = this.querySelector("[data-theme-trigger]");
    if (this.isOpen) {
      this.resolveSide();
    }
    panel?.classList.toggle("open", this.isOpen);
    trigger?.setAttribute("aria-expanded", String(this.isOpen));
  }

  /**
   * Decide which side of the trigger the panel should open toward.
   * Honors an explicit `expand-side` attribute; otherwise measures available
   * viewport space along the active axis and flips when the natural side
   * would clip.
   */
  private resolveSide(): void {
    const inner = this.querySelector<HTMLElement>(".theme-controller-inner");
    const trigger = this.querySelector<HTMLElement>("[data-theme-trigger]");
    const panel = this.querySelector<HTMLElement>(".theme-panel");
    if (!inner || !trigger || !panel) {
      return;
    }

    const explicit = this.expandSide;
    let side: "start" | "end";
    if (explicit === "start" || explicit === "end") {
      side = explicit;
    } else {
      const axis = inner.getAttribute("data-direction") === "horizontal" ? "horizontal" : "vertical";
      const triggerRect = trigger.getBoundingClientRect();
      // Panel is visibility:hidden but laid out — measurable.
      const panelRect = panel.getBoundingClientRect();
      const gap = 6; // matches CSS 0.375rem offset
      if (axis === "horizontal") {
        const roomEnd = window.innerWidth - triggerRect.right - gap;
        const roomStart = triggerRect.left - gap;
        side = panelRect.width <= roomEnd || roomEnd >= roomStart ? "end" : "start";
      } else {
        const roomEnd = window.innerHeight - triggerRect.bottom - gap;
        const roomStart = triggerRect.top - gap;
        side = panelRect.height <= roomEnd || roomEnd >= roomStart ? "end" : "start";
      }
    }
    inner.setAttribute("data-side", side);
  }

  private closePanel(): void {
    if (!this.isOpen) {
      return;
    }
    this.isOpen = false;
    this.querySelector(".theme-panel")?.classList.remove("open");
    this.querySelector("[data-theme-trigger]")?.setAttribute("aria-expanded", "false");
  }

  // ── Direction ──

  private applyDirection(): void {
    const dir = this.expandDirection;
    let effective: string;
    if (dir === "horizontal" || dir === "vertical") {
      effective = dir;
    } else {
      effective = window.innerWidth > 768 ? "vertical" : "horizontal";
    }

    const sectionsDir = this.sectionsDirection;
    // 'auto' defaults to stacking sections vertically — keeps each section's
    // option row free to grow horizontally without sections fighting for width.
    const effectiveSections = sectionsDir === "horizontal" || sectionsDir === "vertical" ? sectionsDir : "vertical";

    const labelPos = this.labelPosition;
    let effectiveLabelPos: string;
    if (labelPos === "above" || labelPos === "below" || labelPos === "left" || labelPos === "right") {
      effectiveLabelPos = labelPos;
    } else {
      effectiveLabelPos = effective === "horizontal" ? "below" : "right";
    }

    const explicitSide = this.expandSide;
    const initialSide = explicitSide === "start" ? "start" : "end";

    const inner = this.querySelector<HTMLElement>(".theme-controller-inner");
    if (inner) {
      inner.setAttribute("data-direction", effective);
      inner.setAttribute("data-sections-direction", effectiveSections);
      inner.setAttribute("data-label-position", effectiveLabelPos);
      // Set a baseline side; auto-detection runs again when the panel opens.
      if (!inner.hasAttribute("data-side")) {
        inner.setAttribute("data-side", initialSide);
      }
      if (this.showLabels) {
        inner.setAttribute("data-show-labels", "");
      } else {
        inner.removeAttribute("data-show-labels");
      }
    }
  }

  // ── Events ──

  private bindEvents(): void {
    // Trigger
    this.querySelector("[data-theme-trigger]")?.addEventListener(
      "click",
      () => {
        this.togglePanel();
      },
      { passive: true },
    );

    // Family clicks
    for (const btn of this.querySelectorAll("[data-family-option]")) {
      btn.addEventListener(
        "click",
        () => {
          this.currentFamily = btn.getAttribute("data-family-option") || this.currentFamily;
          this.applyCurrentSelection();
        },
        { passive: true },
      );
    }

    // Variant clicks
    for (const btn of this.querySelectorAll("[data-variant-option]")) {
      btn.addEventListener(
        "click",
        () => {
          this.currentVariant = btn.getAttribute("data-variant-option") || this.currentVariant;
          this.applyCurrentSelection();
        },
        { passive: true },
      );
    }

    // Simple mode theme clicks
    for (const btn of this.querySelectorAll("[data-theme-option]")) {
      btn.addEventListener(
        "click",
        () => {
          this.currentVariant = btn.getAttribute("data-theme-option") || this.currentVariant;
          this.applyCurrentSelection();
          this.closePanel();
        },
        { passive: true },
      );
    }

    // Outside click
    document.addEventListener("click", this.handleOutsideClick);

    // Resize for auto direction and/or auto side detection
    if (this.expandDirection === "auto" || this.expandSide === "auto") {
      window.addEventListener("resize", this.handleResize);
    }

    // System theme changes
    if (window.matchMedia) {
      window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", this.handleSystemChange);
      window.matchMedia("(prefers-contrast: more)").addEventListener("change", this.handleSystemChange);
    }

    // Init direction
    this.applyDirection();

    // Init family swatches
    this.initSwatches();
  }

  private handleOutsideClick = (e: Event): void => {
    if (!this.contains(e.target as Node)) {
      this.closePanel();
    }
  };

  private handleResize = (): void => {
    clearTimeout(this.resizeTimer);
    this.resizeTimer = setTimeout(() => {
      this.applyDirection();
      if (this.isOpen) {
        this.resolveSide();
      }
    }, 100);
  };

  private handleSystemChange = (): void => {
    if (this.currentVariant === "system") {
      this.applyCurrentSelection();
    }
  };

  private reinit = (): void => {
    this.restorePreferences();
    this.applyCurrentSelection();
  };

  private initSwatches(): void {
    for (const fam of this.families) {
      const swatch = this.querySelector<HTMLElement>(`[data-family-swatch="${fam.id}"]`);
      if (!swatch) {
        continue;
      }
      const lightVariant =
        fam.variants.find((v) => v.scheme === "light" && v.category === "base") ??
        fam.variants.find((v) => v.scheme === "light") ??
        (fam.variants[0] as ThemeConfig);
      swatch.style.backgroundColor = lightVariant.colors.interactive.default;
    }
  }

  // ── SVG helpers ──

  private systemIconSvg(): string {
    return `<rect x="2.5" y="3.5" width="15" height="11" rx="1.5" stroke="currentColor" stroke-width="1.5"/>
      <path d="M2.5 7.5h15" stroke="currentColor" stroke-width="1.5"/>
      <path d="M7 16.5h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`;
  }

  private themeIconSvg(theme: ThemeConfig): string {
    let svg = "";
    if (theme.scheme === "light") {
      svg += `<circle cx="10" cy="10" r="4" stroke="currentColor" stroke-width="2"/>
        <path d="M10 2V4M10 16V18M18 10H16M4 10H2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`;
    } else {
      svg += `<path d="M17 12.5A7.5 7.5 0 1 1 7.5 3a6 6 0 0 0 9.5 9.5Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>`;
    }
    if (theme.category === "high-contrast") {
      svg += `<circle cx="10" cy="10" r="7.5" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 2"/>`;
    }
    if (theme.category === "color-blind") {
      svg += `<path d="M3 10c1.5-4 4.5-6 7-6s5.5 2 7 6c-1.5 4-4.5 6-7 6s-5.5-2-7-6z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round" opacity="0.5"/>`;
    }
    return svg;
  }

  private svgWrap(inner: string, attrs = ""): string {
    return `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" ${attrs}>${inner}</svg>`;
  }

  // ── Render ──

  private render(): void {
    const triggerIcons = [
      `<span class="trigger-icon" data-trigger-icon="system">${this.svgWrap(this.systemIconSvg())}</span>`,
      ...this.themes.map(
        (t) => `<span class="trigger-icon" data-trigger-icon="${t.id}">${this.svgWrap(this.themeIconSvg(t))}</span>`,
      ),
    ].join("");

    let panelContent: string;

    if (this.hasMultipleFamilies) {
      // Family selector
      const familyButtons = this.families
        .map(
          (fam) => `<button type="button" class="theme-option-btn family-btn" role="menuitem"
              data-family-option="${fam.id}" aria-label="${fam.label}" title="${fam.label}">
              <span class="option-swatch" data-family-swatch="${fam.id}"></span>
              ${this.showLabels ? `<span class="option-label">${fam.label}</span>` : ""}
            </button>`,
        )
        .join("");

      // Variant selector — unique category+scheme combos
      const seen = new Set<string>();
      const variantButtons = [
        `<button type="button" class="theme-option-btn" role="menuitem"
          data-variant-option="system" aria-label="System" title="Follow system preference">
          ${this.svgWrap(this.systemIconSvg(), 'class="option-icon"')}
          ${this.showLabels ? '<span class="option-label">System</span>' : ""}
        </button>`,
      ];
      for (const theme of this.themes) {
        const key = `${theme.category}-${theme.scheme}`;
        if (seen.has(key)) {
          continue;
        }
        seen.add(key);
        variantButtons.push(
          `<button type="button" class="theme-option-btn" role="menuitem"
            data-variant-option="${key}" aria-label="${theme.label}" title="${theme.label}">
            ${this.svgWrap(this.themeIconSvg(theme), 'class="option-icon"')}
            ${this.showLabels ? `<span class="option-label">${theme.label}</span>` : ""}
          </button>`,
        );
      }

      panelContent = `
        <div class="panel-section family-section">
          <div class="section-label">Theme</div>
          <div class="section-options">${familyButtons}</div>
        </div>
        <div class="panel-divider"></div>
        <div class="panel-section variant-section">
          <div class="section-label">Mode</div>
          <div class="section-options">${variantButtons.join("")}</div>
        </div>
      `;
    } else {
      // Single-family flat list
      const buttons = [
        `<button type="button" class="theme-option-btn" role="menuitem"
          data-theme-option="system" aria-label="System theme" title="System">
          ${this.svgWrap(this.systemIconSvg(), 'class="option-icon"')}
          ${this.showLabels ? '<span class="option-label">System</span>' : ""}
        </button>`,
        ...this.themes.map(
          (t) => `<button type="button" class="theme-option-btn" role="menuitem"
            data-theme-option="${t.id}" aria-label="${t.label}" title="${t.description || t.label}">
            ${this.svgWrap(this.themeIconSvg(t), 'class="option-icon"')}
            ${this.showLabels ? `<span class="option-label">${t.label}</span>` : ""}
          </button>`,
        ),
      ];
      panelContent = buttons.join("");
    }

    this.innerHTML = `
      <div class="theme-controller-inner">
        <button type="button" class="theme-trigger" aria-label="Toggle theme menu" aria-expanded="false" data-theme-trigger>
          ${triggerIcons}
        </button>
        <div class="theme-panel" role="menu" aria-label="Theme selection">
          ${panelContent}
        </div>
      </div>
    `;

    // Inject styles once
    if (!document.getElementById("theme-controller-styles")) {
      const style = document.createElement("style");
      style.id = "theme-controller-styles";
      style.textContent = ThemeControllerElement.styles;
      document.head.appendChild(style);
    }
  }

  // ── Public API for programmatic theming ──

  /** Set the active family by ID. */
  setFamily(familyId: string): void {
    this.currentFamily = familyId;
    this.applyCurrentSelection();
  }

  /** Set the active variant ('system', 'base-light', 'high-contrast-dark', etc). */
  setVariant(variant: string): void {
    this.currentVariant = variant;
    this.applyCurrentSelection();
  }

  /** Get all available theme configs. */
  getThemes(): ThemeConfig[] {
    return [...this.themes];
  }

  /** Get all families. */
  getFamilies(): ThemeFamily[] {
    return [...this.families];
  }

  static readonly styles = `
    theme-controller {
      display: inline-flex;
    }
    .theme-controller-inner {
      position: relative;
      display: inline-flex;
    }
    .theme-trigger {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 2.5rem;
      height: 2.5rem;
      padding: 0;
      border: 1px solid var(--theme-border-default, #dee2e6);
      border-radius: 0.5rem;
      background: var(--theme-bg-primary, #ffffff);
      color: var(--theme-fg-primary, #212529);
      cursor: pointer;
      transition: background 0.2s, border-color 0.2s, box-shadow 0.2s;
      z-index: 2;
      position: relative;
    }
    .theme-trigger:hover {
      background: var(--theme-bg-secondary, #f8f9fa);
      border-color: var(--theme-border-hover, #adb5bd);
    }
    .theme-trigger:focus-visible {
      outline: 2px solid var(--theme-border-focus, #0d6efd);
      outline-offset: 2px;
    }
    .trigger-icon {
      display: none;
      flex-shrink: 0;
      line-height: 0;
    }
    .theme-panel {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      position: absolute;
      z-index: 1;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.2s ease, visibility 0.2s ease, transform 0.2s ease;
      background: var(--theme-bg-primary, #ffffff);
      border: 1px solid var(--theme-border-default, #dee2e6);
      border-radius: 0.5rem;
      padding: 0.375rem;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04);
      width: max-content;
      max-width: calc(100vw - 1rem);
      align-items: stretch;
    }
    .theme-panel.open {
      opacity: 1;
      visibility: visible;
    }
    /* Vertical expand: end = below trigger, start = above trigger */
    [data-direction="vertical"][data-side="end"] .theme-panel {
      top: calc(100% + 0.375rem);
      right: 0;
      transform: translateY(-0.5rem);
    }
    [data-direction="vertical"][data-side="end"] .theme-panel.open {
      transform: translateY(0);
    }
    [data-direction="vertical"][data-side="start"] .theme-panel {
      bottom: calc(100% + 0.375rem);
      right: 0;
      transform: translateY(0.5rem);
    }
    [data-direction="vertical"][data-side="start"] .theme-panel.open {
      transform: translateY(0);
    }
    /* Horizontal expand: end = right of trigger, start = left of trigger */
    [data-direction="horizontal"][data-side="end"] .theme-panel {
      top: 50%;
      left: calc(100% + 0.375rem);
      transform: translateY(-50%) translateX(-0.5rem);
    }
    [data-direction="horizontal"][data-side="end"] .theme-panel.open {
      transform: translateY(-50%) translateX(0);
    }
    [data-direction="horizontal"][data-side="start"] .theme-panel {
      top: 50%;
      right: calc(100% + 0.375rem);
      transform: translateY(-50%) translateX(0.5rem);
    }
    [data-direction="horizontal"][data-side="start"] .theme-panel.open {
      transform: translateY(-50%) translateX(0);
    }
    /* Arrangement of family/mode sections inside the panel */
    [data-sections-direction="vertical"] .theme-panel {
      flex-direction: column;
    }
    [data-sections-direction="horizontal"] .theme-panel {
      flex-direction: row;
      align-items: stretch;
    }
    .panel-section {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      min-width: 0;
    }
    [data-sections-direction="horizontal"] .panel-section {
      flex: 0 1 auto;
    }
    .section-label {
      font-size: 0.625rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--theme-fg-tertiary, #6c757d);
      padding: 0 0.25rem;
    }
    .section-options {
      display: flex;
      gap: 0.25rem;
    }
    /* Option flow follows expand-direction */
    [data-direction="vertical"] .section-options {
      flex-direction: column;
      align-items: stretch;
    }
    [data-direction="horizontal"] .section-options {
      flex-direction: row;
      align-items: stretch;
    }
    /* In simple (single-family) mode, buttons sit directly under .theme-panel */
    [data-direction="vertical"] .theme-panel > .theme-option-btn {
      align-self: stretch;
    }
    .panel-divider {
      background: var(--theme-border-default, #dee2e6);
      flex-shrink: 0;
    }
    [data-sections-direction="vertical"] .panel-divider {
      height: 1px;
      width: auto;
      margin: 0.125rem 0;
    }
    [data-sections-direction="horizontal"] .panel-divider {
      width: 1px;
      height: auto;
      margin: 0 0.125rem;
      align-self: stretch;
    }
    .theme-option-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.375rem;
      min-width: 2.25rem;
      min-height: 2.25rem;
      padding: 0.25rem 0.375rem;
      border: 1px solid transparent;
      border-radius: 0.375rem;
      background: transparent;
      color: var(--theme-fg-primary, #212529);
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s, color 0.15s;
      flex-shrink: 0;
    }
    /* Without labels keep the original compact square shape */
    .theme-controller-inner:not([data-show-labels]) .theme-option-btn {
      width: 2.25rem;
      height: 2.25rem;
      padding: 0;
    }
    /* With labels, let buttons grow to fit text content */
    [data-show-labels] .theme-option-btn {
      width: auto;
      height: auto;
    }
    /* Label position relative to icon */
    [data-show-labels][data-label-position="below"] .theme-option-btn {
      flex-direction: column;
      gap: 0.25rem;
      padding: 0.375rem 0.5rem;
    }
    [data-show-labels][data-label-position="above"] .theme-option-btn {
      flex-direction: column-reverse;
      gap: 0.25rem;
      padding: 0.375rem 0.5rem;
    }
    [data-show-labels][data-label-position="right"] .theme-option-btn {
      flex-direction: row;
      justify-content: flex-start;
      padding: 0.375rem 0.625rem;
    }
    [data-show-labels][data-label-position="left"] .theme-option-btn {
      flex-direction: row-reverse;
      justify-content: flex-start;
      padding: 0.375rem 0.625rem;
    }
    .theme-option-btn:hover {
      background: var(--theme-bg-secondary, #f8f9fa);
      border-color: var(--theme-border-default, #dee2e6);
    }
    .theme-option-btn:focus-visible {
      outline: 2px solid var(--theme-border-focus, #0d6efd);
      outline-offset: 1px;
    }
    .theme-option-btn.active {
      background: var(--theme-interactive-default, #0d6efd);
      color: #ffffff;
      border-color: var(--theme-interactive-default, #0d6efd);
    }
    .theme-option-btn.active:hover {
      background: var(--theme-interactive-hover, #0b5ed7);
      border-color: var(--theme-interactive-hover, #0b5ed7);
    }
    .option-icon {
      flex-shrink: 0;
    }
    .option-label {
      font-size: var(--theme-controller-label-font-size, 0.75rem);
      font-family: var(--theme-controller-label-font-family, inherit);
      font-weight: var(--theme-controller-label-font-weight, 500);
      color: var(--theme-controller-label-color, inherit);
      letter-spacing: var(--theme-controller-label-letter-spacing, normal);
      line-height: var(--theme-controller-label-line-height, 1.2);
      white-space: nowrap;
    }
    .option-swatch {
      width: 1rem;
      height: 1rem;
      border-radius: 50%;
      border: 1.5px solid var(--theme-border-default, #dee2e6);
      flex-shrink: 0;
    }
    .family-btn.active .option-swatch {
      border-color: #ffffff;
    }
  `;
}

export function registerThemeController(): void {
  if (!customElements.get("theme-controller")) {
    customElements.define("theme-controller", ThemeControllerElement);
  }
}
