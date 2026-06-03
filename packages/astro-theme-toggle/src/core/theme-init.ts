/**
 * FOUC (Flash of Unstyled Content) prevention script.
 *
 * Call this as early as possible (inline in <head>) to apply the
 * stored theme class before the browser paints. This prevents the
 * flash of the default theme before JS loads.
 *
 * Works standalone — no dependencies on the rest of the library.
 *
 * @example
 * ```html
 * <script>
 *   // Inline in <head> for best results
 *   (function() {
 *     var mode = localStorage.getItem('theme-mode') || 'system';
 *     if (mode === 'system') {
 *       var dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
 *       document.documentElement.classList.add(dark ? 'scheme-dark' : 'scheme-light');
 *     }
 *   })();
 * </script>
 * ```
 *
 * Or import and call programmatically:
 * ```ts
 * import { initTheme } from '@sjohansson/astro-theme-toggle/core';
 * initTheme();
 * ```
 */
export function initTheme(): void {
  try {
    const root = document.documentElement;
    const mode = localStorage.getItem("theme-mode") || "system";
    if (mode === "system") {
      const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.add(dark ? "scheme-dark" : "scheme-light");
    }

    // Replay data attributes persisted by a component running in attribute/both
    // mode, so CSS keyed on them applies before first paint.
    const base = localStorage.getItem("theme-attr-name");
    if (base) {
      const id = localStorage.getItem("theme-resolved-id");
      const family = localStorage.getItem("theme-resolved-family");
      // Scheme & contrast each follow the OS when their axis is "system";
      // otherwise replay the stored resolved value. Variation has no OS signal,
      // so it is always replayed as stored.
      const scheme =
        mode === "system"
          ? window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light"
          : localStorage.getItem("theme-resolved-scheme");
      const rawContrast = localStorage.getItem("theme-contrast") || "system";
      const contrast =
        rawContrast === "system"
          ? window.matchMedia("(prefers-contrast: more)").matches
            ? "more"
            : "normal"
          : localStorage.getItem("theme-resolved-contrast");
      const variation = localStorage.getItem("theme-resolved-variation");
      if (id) {
        root.setAttribute(base, id);
      }
      if (localStorage.getItem("theme-attr-companions") !== "0") {
        if (family) {
          root.setAttribute(`${base}-family`, family);
        }
        if (scheme) {
          root.setAttribute(`${base}-scheme`, scheme);
        }
        if (contrast) {
          root.setAttribute(`${base}-contrast`, contrast);
        }
        if (variation) {
          root.setAttribute(`${base}-variation`, variation);
        }
      }
    }
  } catch {
    // localStorage not available (SSR, privacy mode) — fail silently
  }
}

/** Options for {@link generateThemeInitScript}. */
export interface ThemeInitScriptOptions {
  /**
   * Also replay theme data attribute(s) before paint (for components using the
   * 'attribute' or 'both' apply mode).
   * @default false
   */
  applyAttribute?: boolean;
  /**
   * Fallback base attribute name when none has been persisted yet (first visit).
   * @default 'data-theme'
   */
  attributeName?: string;
  /**
   * Whether to set companion attributes (`-family`/`-scheme`/`-contrast`/
   * `-variation`) when no `theme-attr-companions` preference is persisted yet.
   * @default true
   */
  companions?: boolean;
}

/**
 * Build the FOUC-prevention script as an inline string, suitable for
 * server-side injection into `<head>`.
 *
 * Always applies the `scheme-{light|dark}` class for system mode (the original
 * behavior). When `applyAttribute` is enabled, it also replays the persisted
 * theme data attribute(s); scheme and contrast each fall back to the matching
 * system preference when their axis is following the OS.
 */
export function generateThemeInitScript(options: ThemeInitScriptOptions = {}): string {
  const { applyAttribute = false, attributeName = "data-theme", companions = true } = options;
  const base = attributeName.startsWith("data-") ? attributeName : `data-${attributeName}`;

  // Base script: scheme class for system mode (unchanged contract — must
  // reference 'theme-mode').
  let body = "var m=localStorage.getItem('theme-mode')||'system';";
  body += "var R=document.documentElement;";
  body += "var sysDark=window.matchMedia('(prefers-color-scheme: dark)').matches;";
  body += "if(m==='system'){R.classList.add(sysDark?'scheme-dark':'scheme-light')}";

  if (applyAttribute) {
    body += `var B=localStorage.getItem('theme-attr-name')||${JSON.stringify(base)};`;
    body += "var id=localStorage.getItem('theme-resolved-id');";
    body += "var fa=localStorage.getItem('theme-resolved-family');";
    body += "var rc=localStorage.getItem('theme-contrast')||'system';";
    // Scheme follows OS when theme-mode is 'system'; contrast follows OS when
    // its axis is 'system'; variation has no OS signal so it is replayed as-is.
    body += "var sc=(m==='system')?(sysDark?'dark':'light'):localStorage.getItem('theme-resolved-scheme');";
    body +=
      "var co=(rc==='system')?(window.matchMedia('(prefers-contrast: more)').matches?'more':'normal'):localStorage.getItem('theme-resolved-contrast');";
    body += "var va=localStorage.getItem('theme-resolved-variation');";
    body += "if(id){R.setAttribute(B,id)}";
    body += `var cp=localStorage.getItem('theme-attr-companions');cp=cp===null?${companions ? "true" : "false"}:cp!=='0';`;
    body +=
      "if(cp){if(fa){R.setAttribute(B+'-family',fa)}if(sc){R.setAttribute(B+'-scheme',sc)}if(co){R.setAttribute(B+'-contrast',co)}if(va){R.setAttribute(B+'-variation',va)}}";
  }

  return `(function(){try{${body}}catch(e){}})();`;
}

/**
 * The default FOUC-prevention script (scheme class only), as an inline string.
 * Equivalent to `generateThemeInitScript()`.
 */
export const themeInitScript = generateThemeInitScript();
