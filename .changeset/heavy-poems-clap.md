---
"@sjohansson/astro-theme-toggle": patch
---

Fix `<theme-controller>` leaking global listeners when it is removed from the DOM.

`disconnectedCallback` released the `astro:after-swap` and outside-click listeners but left the `window` `resize` listener and both `matchMedia` `change` listeners attached. Under Astro view transitions every navigation swaps the element out, so removed controllers stayed reachable and kept writing their theme classes onto `<html>` — a system scheme change could be applied by a controller that is no longer on the page.

`disconnectedCallback` now detaches all of them. The `MediaQueryList` objects are retained when subscribing, since `matchMedia()` returns a fresh instance per call and `removeEventListener` on a different one would not detach. `bindEvents` also drops any previous `resize` registration before re-adding, so an attribute change away from `expand-direction="auto"` no longer leaves the listener behind.
