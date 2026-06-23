# Astro Components

> **Single source of truth** for all AI coding agents — Claude Code, GitHub Copilot,
> Copilot Workspace, and GitHub agent session runners.

A pnpm monorepo of framework-agnostic Web Component libraries designed for use in
Astro 5, 6, or 7 sites. Each package builds to pure ESM JavaScript — no `.astro` files are
distributed.

## Project Layout

```text
packages/
  astro-reactflow/       # React Flow diagram integration (@sjohansson/astro-reactflow)
  astro-theme-toggle/    # Theme toggle Web Components    (@sjohansson/astro-theme-toggle)
  astro-version-note/    # Version note Web Component     (@sjohansson/astro-version-note)
examples/
  basic-usage/           # Example Astro site using all packages
  theming-showcase/      # Theme toggle showcase
.changeset/              # Changesets config (versioning & publishing)
.github/workflows/       # CI/CD (GitHub Actions)
tsdown.package.config.ts # Shared tsdown build factory
vitest.config.ts         # Shared test config
tsconfig.json            # Root TypeScript config (all packages extend this)
biome.json               # Linter & formatter config
```

## Tech Stack

| Tool            | Version   | Purpose                               |
| --------------- | --------- | ------------------------------------- |
| Node.js         | >=22      | Consumer support (22, 24, 25)         |
| Node.js (dev)   | 24        | Local development (pinned in `.node-version`) |
| pnpm            | 10.x      | Package manager (corepack-managed)    |
| TypeScript      | 6.x       | Type checking & declaration emit      |
| Astro           | 5, 6, or 7 | Peer dependency for integrations (dev-pinned to 6) |
| tsdown          | 0.22.x    | Build (ESM bundles + .d.ts, Rolldown) |
| Vite            | 8.x       | Dev server & test infrastructure      |
| Vitest          | 4.x       | Test runner (happy-dom environment)   |
| Biome           | 2.x       | Linting & formatting (no eslint/prettier) |
| Changesets      | 2.x       | Versioning & npm publishing           |

## Packages

### `@sjohansson/astro-reactflow`

React Flow diagram wrapper for Astro. Ships a React component (`ReactFlowWrapper`)
and an optional Astro integration for SSR configuration.

- **Component type:** React (requires `@astrojs/react`, used with `client:only="react"`)
- **Peer deps:** `astro ^5 || ^6 || ^7`, `@astrojs/react ^4 || ^5`, `react ^19`, `react-dom ^19`, `@xyflow/react ^12`
- **Exports:** `.` (component), `./integration` (Astro integration)

### `@sjohansson/astro-theme-toggle`

Framework-agnostic theme system built on Web Components. Provides a toggle button,
a multi-theme controller, and a preview palette — all as custom elements.

- **Component type:** Web Components (custom elements, Light DOM)
- **Peer deps:** `astro ^5 || ^6 || ^7` (optional)
- **Exports:** `.` (all), `./core` (Web Components only), `./astro` (re-exports + integration), `./integration`, `./themes`, `./themes/*`
- **SPA nav:** `astro:after-swap` listeners with proper cleanup in `disconnectedCallback`

### `@sjohansson/astro-version-note`

Simple version callout badge for documentation sites. Renders as `<version-note>` custom element.

- **Component type:** Web Component (custom element, Light DOM)
- **Peer deps:** `astro ^5 || ^6 || ^7`
- **Exports:** `.` (component + register fn), `./integration` (Astro integration)
- **Attributes:** `version`, `type` (`info` | `warning` | `success` | `error`)

## Build & Test Commands

All commands run from the **repo root**:

```bash
# Install dependencies
pnpm install

# Build all packages (ESM + .d.ts)
pnpm build

# Run tests (vitest, all packages)
pnpm test
pnpm test --run          # single run, no watch

# Type check (tsc --noEmit)
pnpm typecheck

# Lint & format (biome)
pnpm lint                # check
pnpm lint:fix            # auto-fix
pnpm format              # format only

# Full check (lint + typecheck + test)
pnpm check

# Dev mode (watch all packages)
pnpm dev

# Versioning & publishing
pnpm changeset           # create a changeset
pnpm changeset:version   # bump versions
pnpm changeset:publish   # build + publish to npm
```

## Architecture & Conventions

### Distribution

- Packages build to **pure JavaScript** (ESM only, ES2022 target).
- No `.astro` files in `dist/` — components are Web Components or React components.
- Each package uses `tsdown` (Rolldown-based) via the shared factory in `tsdown.package.config.ts`.
- CSS files are emitted to `dist/assets/` with content hashing (Rolldown asset pipeline).
- `"astro"` is always externalized; package-specific externals are configured per package.

### Web Components

- Use **Light DOM** (not Shadow DOM) so styles integrate with the host page and
  class-based dark mode (`.dark`) works without `:host-context`.
- Inject styles once via a `<style>` tag with a unique ID check.
- Follow this pattern: `connectedCallback` renders, `disconnectedCallback` cleans up
  event listeners, `attributeChangedCallback` re-renders when connected.
- For SPA navigation support, listen for `astro:after-swap` in `connectedCallback`
  and remove the listener in `disconnectedCallback`.
- Export both the element class and a `register*()` function per component.

### TypeScript

- Root `tsconfig.json` is the single base config; packages extend it.
- Strict mode is fully enabled (all strict flags on).
- `"ignoreDeprecations": "5.0"` is set in the root tsconfig for forward-compat with
  the TypeScript deprecation timeline.
- `verbatimModuleSyntax: true` — use `import type` for type-only imports.

### Code Style

- **Biome** is the only linter and formatter — do not use eslint or prettier.
- Double quotes, 2-space indent, 120-char line width, LF line endings.
- Imports are auto-organized by Biome (`organizeImports: "on"`).
- Do not bypass or suppress existing Biome rules.

### Testing

- **Vitest** with **happy-dom** environment — tests live in `packages/*/tests/`.
- Pattern: `packages/**/tests/**/*.{test,spec}.{js,ts,jsx,tsx}`.
- Web Component tests import from `../src/` and verify exports, static properties,
  and class structure. DOM behavior tested via happy-dom.
- No mocks for `.astro` files — all components are now pure JS.

### Node & Engine Policy

- Published packages declare `engines.node: ">=22"` for consumer compatibility
  (Node 22, 24, 25).
- Root workspace declares `engines.node: ">=24"` (dev only).
- `.node-version` pins Node 24 for local tooling (nvm, fnm, mise).

## CI/CD

GitHub Actions (`.github/workflows/`):

- **ci.yml** — runs on push/PR to `main`:
  - `lint` job: Biome check + TypeScript typecheck (Node 24)
  - `test` job: Vitest run + coverage upload to Codecov (Node 24)
  - `build` job: Build all packages, verify `dist/` directories exist (Node 24)
- **release.yml** — runs on push to `main`:
  - Changesets action: creates release PRs or publishes to npm (Node 24)

All CI jobs use `pnpm/action-setup@v4` + `actions/setup-node@v4` with
`pnpm install --frozen-lockfile`.

## Do Not

- Do **not** distribute `.astro` files in packages — build to JS.
- Do **not** use Shadow DOM for Web Components (Light DOM only, for dark mode compat).
- Do **not** use npm, yarn, eslint, prettier, jest, webpack, or tsup.
- Do **not** add dependencies without necessity — these are lightweight packages.
- Do **not** bypass Biome rules or skip CI checks.
- Do **not** target or require pnpm 11 until a stable release ships.
