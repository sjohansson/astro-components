---
"@sjohansson/astro-reactflow": patch
---

Widen the `@astrojs/react` peer dependency range to `^4.0.0 || ^5.0.0 || ^6.0.0 || ^7.0.0` so the
package installs cleanly alongside `@astrojs/react` v7.

The integration only relies on `@astrojs/react` registering under the name `@astrojs/react` and
exposing a default export that returns an Astro integration when called with no arguments. v7 keeps
that contract. Its breaking change, removing the `babel` option in favour of Vite's Rolldown/Oxc
pipeline, does not affect this package because auto-registration never passes options.

Previously, consumers on `@astrojs/react` v7 got an unmet peer dependency warning from
`pnpm peers check` even though the integration worked.
