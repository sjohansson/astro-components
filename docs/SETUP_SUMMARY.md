# Project Setup Summary

This document provides an overview of the complete modern development framework set up for the Astro Components monorepo.

## 🎯 Overview

A fully configured, production-ready monorepo for publishing Astro components with best practices for 2026.

## 📦 Tech Stack

### Core Technologies

- **Node.js 24**: Latest LTS with enhanced performance
- **pnpm 11**: Fast, efficient package manager with workspace support
- **TypeScript 6**: Strict type checking with latest features
- **Astro 5, 6, or 7**: Modern web framework (peer dependency; dev-pinned to 7)
- **Tailwind CSS 4**: Utility-first CSS framework (for theme-toggle component)

### Development Tools

- **Biome 1.9**: Ultra-fast linter and formatter (replaces ESLint + Prettier)
- **Vitest 2**: Modern test framework with native ESM support
- **tsdown 0.22**: Rolldown-based TypeScript bundler for component libraries
- **happy-dom**: Lightweight DOM implementation for testing

### Automation & Publishing

- **Changesets**: Automated versioning and changelog generation
- **GitHub Actions**: CI/CD pipelines for testing and publishing
- **Renovate**: Automated dependency updates
- **simple-git-hooks + lint-staged**: Pre-commit quality checks

## 📁 Project Structure

```text
astro-components/
├── .changeset/              # Changesets configuration
│   ├── config.json
│   └── README.md
├── .github/
│   ├── workflows/
│   │   ├── ci.yml          # CI pipeline
│   │   └── release.yml     # Release & publish pipeline
│   └── COMPONENT_README_TEMPLATE.md
├── .vscode/
│   ├── extensions.json     # Recommended extensions
│   └── settings.json       # Workspace settings
├── packages/
│   ├── astro-reactflow/
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   └── ReactFlowWrapper.tsx
│   │   ├── tests/
│   │   │   └── index.test.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── tsdown.config.ts
│   ├── astro-theme-toggle/
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   └── ThemeToggle.astro
│   │   ├── test/
│   │   │   └── index.test.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── tsdown.config.ts
│   └── astro-version-note/
│       ├── src/
│       │   ├── index.ts
│       │   └── VersionNote.astro
│       ├── tests/
│       │   └── index.test.ts
│       ├── package.json
│       ├── tsconfig.json
│       └── tsdown.config.ts
├── .gitignore
├── .markdownlint-cli2.yaml
├── .npmrc
├── biome.json              # Biome configuration
├── CONTRIBUTING.md
├── GETTING_STARTED.md
├── LICENSE
├── package.json            # Root package with scripts
├── pnpm-workspace.yaml     # pnpm workspace config
├── README.md
├── renovate.json           # Renovate configuration
├── tsconfig.json           # Base TypeScript config
└── vitest.config.ts        # Vitest configuration
```

## 🔧 Configuration Files

### Package Management

- **pnpm-workspace.yaml**: Defines workspace packages
- **.npmrc**: npm registry configuration
- **package.json**: Root package with scripts and devDependencies

### TypeScript

- **tsconfig.json**: Base TypeScript config with strict settings
- **packages/*/tsconfig.json**: Per-package TypeScript configs

### Linting & Formatting

- **biome.json**: Comprehensive Biome configuration
  - Strict linting rules
  - Consistent code formatting
  - Import organization
  - Language-specific overrides

### Testing

- **vitest.config.ts**: Vitest configuration
  - happy-dom environment
  - Coverage reporting (text, json, html)
  - Test file patterns

### Build

- **packages/*/tsdown.config.ts**: Build configuration per package
  - ESM output
  - TypeScript declarations
  - Source maps
  - Tree shaking

### Documentation

- **.markdownlint-cli2.yaml**: Markdown linting rules

### Git Hooks

- **package.json** (simple-git-hooks + lint-staged):
  - Pre-commit: Biome linting/formatting
  - Pre-commit: Markdown linting

### CI/CD

- **.github/workflows/ci.yml**: Continuous Integration
  - Lint with Biome
  - Type check with TypeScript
  - Run tests with Vitest
  - Generate coverage
  - Build all packages

- **.github/workflows/release.yml**: Release & Publish
  - Create version PRs with Changesets
  - Publish to npm automatically

### Dependency Management

- **renovate.json**: Automated dependency updates
  - Scheduled updates (weekly)
  - Grouped by type (major/minor/patch)
  - Grouped by category (Astro, React, TypeScript, etc.)
  - Security vulnerability alerts
  - Dependency dashboard

## 🚀 Available Scripts

### Development

```bash
pnpm dev            # Run all packages in dev/watch mode
pnpm build          # Build all packages
pnpm clean          # Clean all build outputs and node_modules
```

### Testing

```bash
pnpm test           # Run tests in watch mode
pnpm test:ui        # Run tests with UI
pnpm test:coverage  # Generate coverage report
```

### Code Quality

```bash
pnpm lint           # Lint code with Biome
pnpm lint:fix       # Lint and auto-fix
pnpm format         # Format code with Biome
pnpm typecheck      # Type check with TypeScript
pnpm check          # Run all checks (lint + typecheck + test)
```

### Versioning & Publishing

```bash
pnpm changeset           # Create a changeset
pnpm changeset:version   # Update versions from changesets
pnpm changeset:publish   # Publish packages to npm
```

## 🔐 npm Authentication

No secrets are needed. The release workflow publishes through npm trusted publishing (OIDC). Configure a trusted
publisher for `release.yml` on each package. See [Trusted publishing](./GETTING_STARTED.md#trusted-publishing).

## 🎨 VS Code Setup

### Recommended Extensions

1. **Biome** (biomejs.biome) - Linting and formatting
2. **Astro** (astro-build.astro-vscode) - Astro language support
3. **Tailwind CSS IntelliSense** (bradlc.vscode-tailwindcss) - Tailwind support
4. **Vitest** (vitest.explorer) - Test runner integration
5. **GitHub Actions** (github.vscode-github-actions) - Workflow support
6. **TypeScript** (ms-vscode.vscode-typescript-next) - Latest TypeScript features

### Workspace Settings

- Auto-format on save with Biome
- Organize imports on save
- Astro file support
- Hide build outputs from explorer

## 🎯 Key Features

### Automated Workflows

1. **Pull Request Checks**: Every PR runs linting, type checking, tests, and builds
2. **Automated Releases**: Changesets creates version PRs automatically
3. **Dependency Updates**: Renovate keeps dependencies up-to-date
4. **Pre-commit Hooks**: Code quality checks before every commit

### Code Quality

- Strict TypeScript configuration
- Comprehensive Biome linting rules
- 100% type coverage enforcement
- Automated code formatting

### Testing

- Modern test framework (Vitest)
- Coverage reporting
- UI mode for debugging
- Fast test execution

### Developer Experience

- Fast package manager (pnpm)
- Hot reload in dev mode
- Clear error messages
- Comprehensive documentation

## 📚 Documentation

- **README.md**: Project overview and quick start
- **CONTRIBUTING.md**: Contribution guidelines
- **GETTING_STARTED.md**: Detailed setup and workflow guide
- **.github/COMPONENT_README_TEMPLATE.md**: Template for component docs
- **.changeset/README.md**: Changeset workflow documentation

## 🔄 Workflow Examples

### Adding a New Component

1. Create new folder in `packages/`
2. Add package.json, tsconfig.json, tsdown.config.ts
3. Implement component in `src/`
4. Add tests in `tests/` or `test/`
5. Run `pnpm build` and `pnpm test`
6. Create changeset: `pnpm changeset`
7. Commit and create PR

### Making Changes

1. Create feature branch
2. Make changes
3. Run `pnpm check` to verify
4. Create changeset: `pnpm changeset`
5. Commit and push
6. Create PR

### Publishing

1. Merge PR to main
2. Changesets creates version PR
3. Review and merge version PR
4. Packages auto-publish to npm

## 🆘 Troubleshooting

### Build Issues

```bash
pnpm clean
pnpm install
pnpm build
```

### Type Errors

```bash
pnpm typecheck
```

### Lint Issues

```bash
pnpm lint:fix
```

### Test Failures

```bash
pnpm test:ui  # Debug with UI
```

## 🎓 Learning Resources

- [Astro Documentation](https://docs.astro.build)
- [Biome Documentation](https://biomejs.dev)
- [Vitest Documentation](https://vitest.dev)
- [Changesets Documentation](https://github.com/changesets/changesets)
- [pnpm Workspaces](https://pnpm.io/workspaces)

## 📝 Next Steps

1. **Install dependencies**: `pnpm install`
2. **Install Git hooks**: `pnpm prepare`
3. **Build packages**: `pnpm build`
4. **Run tests**: `pnpm test`
5. **Start developing**: Add your component logic
6. **Set up npm**: Configure npm authentication
7. **Configure GitHub**: Add a trusted publisher for `release.yml` on each package
8. **Create first release**: Follow the publishing workflow

## 🤝 Support

- Open issues for bugs or questions
- Check existing documentation
- Review CONTRIBUTING.md for guidelines

---

**Everything is ready to go!** This setup provides a modern, automated, and maintainable framework for building and publishing high-quality Astro components. 🚀
