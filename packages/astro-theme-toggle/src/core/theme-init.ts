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
    const mode = localStorage.getItem("theme-mode") || "system";
    if (mode === "system") {
      const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.classList.add(dark ? "scheme-dark" : "scheme-light");
    }
  } catch {
    // localStorage not available (SSR, privacy mode) — fail silently
  }
}

/**
 * Returns the FOUC prevention script as an inline string.
 * Useful for server-side injection into <head>.
 */
export const themeInitScript = `(function(){try{var m=localStorage.getItem('theme-mode')||'system';if(m==='system'){var d=window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.add(d?'scheme-dark':'scheme-light')}}catch(e){}})();`;
