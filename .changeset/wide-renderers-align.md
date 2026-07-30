---
"@sjohansson/astro-reactflow": patch
---

Widen the `@astrojs/react` peer dependency range to `^4.0.0 || ^5.0.0 || ^6.0.0` so the
package installs cleanly alongside the React renderer used by Astro 7 projects.

`@astrojs/react` v6 declares no `astro` peer and exposes the same integration surface this
package relies on — the `astro:config:setup` hook checks for an integration named
`@astrojs/react` and, when absent, resolves the module from the consumer's project root and
calls its default export. That contract is unchanged across v4, v5, and v6 (all three declare
identical `react`/`react-dom`/`@types` peers), so no code changes are required.

Previously, consumers on `@astrojs/react` v6 got an unmet peer dependency warning even though
the integration worked correctly at build and runtime.
