// SSR-safe HTMLElement base. On the server (Node) HTMLElement is undefined,
// so importing a module whose top-level `class X extends HTMLElement` is
// evaluated would crash. Subclassing this stub keeps module load safe; the
// real component is only instantiated in the browser via customElements.
export const SSRSafeHTMLElement: typeof HTMLElement =
  typeof HTMLElement === "undefined" ? (class {} as unknown as typeof HTMLElement) : HTMLElement;
