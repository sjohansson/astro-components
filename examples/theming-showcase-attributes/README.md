# Theme Showcase — Data Attributes

A standalone Astro example that themes a page entirely through **CSS files keyed
on data attributes**, using `@sjohansson/astro-theme-toggle` in `apply-mode="attribute"`.

It is the companion to [`../theming-showcase`](../theming-showcase), which uses
the default **inline CSS custom properties** mode. The two are kept as separate
projects so each shows one approach cleanly.

## The idea

In attribute mode the component is a "clean slate" — it sets data attributes on
`<html>` and injects **no colors of its own**:

```html
<html
  data-theme="high-contrast-dark"
  data-theme-family="default"
  data-theme-scheme="dark"
  data-theme-category="high-contrast"
>
```

All theming lives in your own stylesheets, which react to those attributes:

| File | Role |
| --- | --- |
| [`src/styles/tokens.css`](src/styles/tokens.css) | Baseline `--app-*` palette keyed on `data-theme-scheme` — so **every** theme (including bundled families) gets a sensible palette without enumerating each id. |
| [`src/styles/advanced.css`](src/styles/advanced.css) | Cross-cutting overrides via `data-theme-category`, `data-theme-family`, and exact `data-theme` — the flexibility inline styles can't express. |
| [`src/styles/base.css`](src/styles/base.css) | Page + component styling that consumes only the `--app-*` tokens. |

The component is configured in [`astro.config.mjs`](astro.config.mjs):

```js
themeToggle({
  injectScript: true,        // FOUC: replay attributes before first paint
  applyMode: "attribute",    // set data-theme*, inject no inline colors
  attributeName: "data-theme",
})
```

## Run

From the repo root:

```bash
pnpm install
pnpm --filter theming-showcase-attributes-example dev
```

Or use the helper script:

```powershell
.\scripts\run-theming-showcase-attributes.ps1
```

Then open the printed local URL. Switch families and variants in the controller
(top right) and watch the live `<html>` attribute readout update — the page
restyles itself with no inline styles involved.
