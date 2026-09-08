---
"@sjohansson/astro-reactflow": minor
---

Fix diagrams rendering as an empty box, and expose the stylesheet as a public export.

`<ReactFlowWrapper>` must be used with `client:only="react"`, which keeps it out of Astro's server module graph — and that is where Astro collects each page's CSS from. The stylesheet the component imports was therefore silently dropped from the build. Without `.reactflow-pane { flex: 1 1 auto; min-height: 0 }` the pane collapsed to `0px`, so React Flow rendered its nodes and edges into a zero-height box and the diagram looked empty.

- The integration now injects the React Flow and wrapper stylesheets at `page-ssr`, so the CSS reaches the build. Opt out with `injectStyles: false`.
- Added a `@sjohansson/astro-reactflow/styles.css` export for manual imports. Previously the stylesheet was emitted under a content-hashed name and was not reachable through the `exports` map at all, so there was no way to import it by hand.
- The stylesheet is now built to a stable `dist/styles.css` instead of `dist/assets/styles-<hash>.css`.
