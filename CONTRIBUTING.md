# Contributing to Astro Components

Thank you for your interest in contributing! 🎉

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/astro-components.git`
3. Install dependencies: `pnpm install`
4. Create a branch: `git checkout -b feature/your-feature-name`

## Development Workflow

### Prerequisites

- Node.js >= 24.0.0
- pnpm >= 9.0.0

### Setup

```bash
# Install dependencies
pnpm install

# Run tests in watch mode
pnpm test

# Run linting
pnpm lint

# Type check
pnpm typecheck

# Build all packages
pnpm build
```

## Making Changes

1. Make your changes in the appropriate package under `packages/`
2. Add tests for your changes
3. Run auto-fix to format code: `.\scripts\fix.ps1`
4. Run pre-commit checks: `.\scripts\pre-commit.ps1`
5. Ensure all checks pass before committing
6. Create a changeset: `pnpm changeset`
7. Commit your changes with a descriptive message

### Changeset Guidelines

When you make changes that should be released, create a changeset:

```bash
pnpm changeset
```

Follow the prompts to:
- Select which packages are affected
- Choose the version bump type (major, minor, patch)
- Describe your changes

### Pre-Commit Workflow

This project uses **PowerShell scripts and VS Code tasks** for quality checks (not Git hooks, which are unreliable on Windows):

```bash
# 1. Make your changes
# 2. Auto-fix formatting
.\scripts\fix.ps1

# 3. Run all checks (lint, type check, tests)
.\scripts\pre-commit.ps1

# 4. If all pass, commit
git add .
git commit -m "feat: your change"
```

Read [SCRIPTS_AND_TASKS.md](./SCRIPTS_AND_TASKS.md) for complete details on available scripts and VS Code task integration.

### Code Standards

- **TypeScript**: All code must be written in TypeScript with strict type checking
- **Formatting**: Code is automatically formatted using Biome
- **Linting**: All code must pass Biome linting rules
- **Testing**: All features must have tests with good coverage
- **Documentation**: Update README files when adding features

### Code Quality Checks

Before every commit, run:

```bash
# Auto-fix code formatting and issues
.\scripts\fix.ps1

# Verify all checks pass
.\scripts\pre-commit.ps1
```

Or use VS Code tasks (press `Ctrl+Shift+B`):
- **Pre-commit checks** - Run before committing
- **Auto-fix issues** - Format and fix code

See [SCRIPTS_AND_TASKS.md](./SCRIPTS_AND_TASKS.md) for detailed information.

### Pull Requests

1. Push your changes to your fork
2. Create a pull request against the `main` branch
3. Ensure all CI checks pass
4. Wait for review and address any feedback

### Testing

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run tests in UI mode
pnpm test:ui
```

### Building

```bash
# Build all packages
pnpm build

# Build specific package
pnpm --filter @sjohansson/astro-theme-toggle build
```

## Project Structure

```
astro-components/
├── packages/
│   ├── astro-reactflow/      # React Flow integration
│   ├── astro-theme-toggle/   # Theme toggle component
│   └── astro-version-note/   # Version note component
├── .github/
│   └── workflows/            # CI/CD workflows
├── .changeset/               # Changesets configuration
└── package.json              # Root package.json
```

## Questions?

Feel free to open an issue for any questions or concerns.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
