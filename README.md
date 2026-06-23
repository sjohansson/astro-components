# Astro Components

A collection of modern, well-tested Astro components built with TypeScript, designed for Astro 5, 6, and 7 projects.

[![CI](https://github.com/sjohansson/astro-components/workflows/CI/badge.svg)](https://github.com/sjohansson/astro-components/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 📦 Packages

This monorepo contains the following Astro components:

- **[@sjohansson/astro-reactflow](./packages/astro-reactflow)** - React Flow integration for Astro
- **[@sjohansson/astro-theme-toggle](./packages/astro-theme-toggle)** - Modern theme toggle with Tailwind CSS 4 support
- **[@sjohansson/astro-version-note](./packages/astro-version-note)** - Version note component for site checks/documentation

Each component can be used as either a standalone component or as an Astro integration for enhanced functionality and automatic configuration.

## 🚀 Quick Start

Install the component you need:

```bash
pnpm add @sjohansson/astro-theme-toggle
```

### Option 1: Use as an Integration (Recommended)

```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import themeToggle from '@sjohansson/astro-theme-toggle/integration';

export default defineConfig({
  integrations: [themeToggle()],
});
```

### Option 2: Use as a Component

```astro
---
import { ThemeToggle } from '@sjohansson/astro-theme-toggle';
---

<ThemeToggle />
```

**See the [Integration Guide](./docs/INTEGRATION_GUIDE.md) for detailed usage instructions and best practices.**

## 📁 Examples

Check out the [examples directory](./examples) for complete working examples:

- **[Basic Usage](./examples/basic-usage)** - All three integrations working together
- **[Theming Showcase](./examples/theming-showcase)** - Theme toggle with inline theming
- **[Theming Showcase with Attributes](./examples/theming-showcase-attributes)** - Theme toggle using HTML attributes for CSS theming

Each example is a fully functional Astro project you can run and explore.

## 🛠️ Development

This monorepo uses modern tooling for 2026:

- **Node.js 22+** - Active LTS baseline (Astro 6 requires Node 22.12.0+)
- **pnpm** - Fast, disk space efficient package manager with workspaces
- **TypeScript 5.7** - Strict type checking for reliability
- **Biome** - Lightning-fast linter and formatter (replaces ESLint + Prettier)
- **Vitest** - Modern test framework with native ESM support
- **Changesets** - Automated versioning and changelog generation
- **GitHub Actions** - CI/CD for testing, linting, and publishing

### Prerequisites

- Node.js >= 22.12.0
- pnpm >= 9.0.0

### Setup

```bash
# Clone the repository
git clone https://github.com/sjohansson/astro-components.git
cd astro-components

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Lint and format
pnpm lint:fix
```

### Available Scripts

```bash
pnpm build          # Build all packages
pnpm test           # Run tests
pnpm test:ui        # Run tests with UI
pnpm test:coverage  # Generate coverage report
pnpm lint           # Lint code with Biome
pnpm lint:fix       # Lint and auto-fix issues
pnpm format         # Format code with Biome
pnpm typecheck      # Type check with TypeScript
pnpm check          # Run all checks (lint + typecheck + test)
pnpm changeset      # Create a changeset for versioning
pnpm dev            # Run dev mode for all packages
```

### Project Structure

```
astro-components/
├── .changeset/              # Changesets configuration
├── .github/
│   └── workflows/           # GitHub Actions workflows
├── packages/
│   ├── astro-reactflow/     # React Flow integration
│   ├── astro-theme-toggle/  # Theme toggle component
│   └── astro-version-note/  # Version note component
├── biome.json               # Biome configuration
├── tsconfig.json            # TypeScript configuration
├── vitest.config.ts         # Vitest configuration
└── pnpm-workspace.yaml      # pnpm workspace configuration
```

## 📐 Package scaffold

Each component package is fully isolated—no shared code or cross-package imports—so you can publish them independently. Common build settings live in [`tsdown.package.config.ts`](./tsdown.package.config.ts), which:

- Emits ESM + `.d.ts` files via Rolldown
- Emits `.css` assets into `dist/assets/` with content hashing
- Treats Astro, Node built-ins, and framework dependencies as externals so consumers bring their own runtime

When creating a new component package:

1. **Add a `package.json`** with `peerDependencies` for any framework/runtime requirements and `publishConfig.access: "public"`.
2. **Extend the root `tsconfig.json`** and include a `src/env.d.ts` that references `astro/client` for `.astro` type support.
3. **Reuse the shared tsdown config** by exporting `createPackageConfig()` from `tsdown.package.config.ts`, adding any package-specific externals.
4. **Document and test** inside `packages/<name>/README.md` and `packages/<name>/tests/` so the package remains self-contained.

## 🧪 Testing

Tests are written using Vitest with happy-dom for DOM testing:

```bash
# Run tests in watch mode
pnpm test

# Run tests with UI
pnpm test:ui

# Generate coverage report
pnpm test:coverage
```

## 📝 Creating a Changeset

When making changes, create a changeset to document your changes:

```bash
pnpm changeset
```

This will:

1. Prompt you to select affected packages
1. Ask for the version bump type (major/minor/patch)
1. Request a description of your changes

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](./CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📚 Documentation

- **[Integration Guide](./docs/INTEGRATION_GUIDE.md)** - Learn how to use components as integrations vs standalone
- **[Packaging Guide](./docs/PACKAGING_GUIDE.md)** - Architecture and best practices for the monorepo
- **[Contributing Guide](.CONTRIBUTING.md)** - How to contribute to this project
- **[Getting Started](./docs/GETTING_STARTED.md)** - Detailed setup and workflow guide

## 📄 License

MIT © [sjohansson](https://github.com/sjohansson)

## 🔗 Links

- [Astro Documentation](https://docs.astro.build)
- [Biome Documentation](https://biomejs.dev)
- [Vitest Documentation](https://vitest.dev)
- [Changesets Documentation](https://github.com/changesets/changesets)
