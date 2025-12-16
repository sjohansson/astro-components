# Getting Started with Astro Components

This guide will help you get started with developing, building, and publishing Astro components in this monorepo.

## Initial Setup

1. **Install pnpm** (if not already installed):
   ```bash
   npm install -g pnpm
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Install Git hooks**:
   ```bash
   pnpm prepare
   ```

## Development Workflow

### Making Changes

1. **Create a new branch**:
   ```bash
   git checkout -b feature/my-new-feature
   ```

2. **Make your changes** in the appropriate package under `packages/`

3. **Build your changes**:
   ```bash
   pnpm build
   ```

4. **Run tests**:
   ```bash
   pnpm test
   ```

5. **Check code quality**:
   ```bash
   pnpm check
   ```

### Creating a Changeset

Before committing, create a changeset to describe your changes:

```bash
pnpm changeset
```

Follow the prompts:
- Select the packages affected by your changes
- Choose the version bump type:
  - **major**: Breaking changes (e.g., API changes)
  - **minor**: New features (backward compatible)
  - **patch**: Bug fixes
- Write a summary of your changes

### Committing Changes

```bash
git add .
git commit -m "feat(theme-toggle): add keyboard navigation"
git push origin feature/my-new-feature
```

The pre-commit hook will:
- Run Biome to lint and format your code
- Check markdown files with markdownlint

### Creating a Pull Request

1. Push your branch to GitHub
2. Open a pull request against `main`
3. Wait for CI checks to pass
4. Request a review

## Publishing Packages

### Automated Publishing (Recommended)

When changes are merged to `main`, the release workflow will:
1. Create a "Version Packages" PR with updated versions and changelogs
2. When that PR is merged, automatically publish to npm

### Manual Publishing

If you need to publish manually:

1. **Version packages**:
   ```bash
   pnpm changeset:version
   ```

2. **Build packages**:
   ```bash
   pnpm build
   ```

3. **Publish to npm**:
   ```bash
   pnpm changeset:publish
   ```

   Note: You need to be logged in to npm with publishing rights:
   ```bash
   npm login
   ```

## NPM Configuration

### Publishing for the First Time

1. **Set up npm authentication**:
   - Create an npm account at https://www.npmjs.com
   - Run `npm login` locally
   - For GitHub Actions, add `NPM_TOKEN` secret to your repository

2. **Update package names** (if needed):
   - Each package.json has `"name": "@sjohansson/package-name"`
   - Change `@sjohansson` to your npm organization/username

3. **Verify package access**:
   ```bash
   npm access public @sjohansson/astro-theme-toggle
   ```

## Testing Components Locally

To test a component in another project before publishing:

1. **Build the package**:
   ```bash
   pnpm --filter @sjohansson/astro-theme-toggle build
   ```

2. **Link the package** in your test project:
   ```bash
   cd /path/to/test-project
   pnpm link /path/to/astro-components/packages/astro-theme-toggle
   ```

3. **Use the component** in your test project as normal

## Troubleshooting

### Build Errors

If you encounter build errors:
```bash
pnpm clean
pnpm install
pnpm build
```

### Type Errors

Check TypeScript errors:
```bash
pnpm typecheck
```

### Lint Errors

Auto-fix lint issues:
```bash
pnpm lint:fix
```

### Test Failures

Run tests in watch mode for debugging:
```bash
pnpm test
```

Or with UI:
```bash
pnpm test:ui
```

## VS Code Setup

Recommended extensions are listed in `.vscode/extensions.json`. Install them for the best development experience:

1. Open VS Code
2. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
3. Type "Extensions: Show Recommended Extensions"
4. Install all recommended extensions

## CI/CD

### GitHub Actions Workflows

- **CI** (`.github/workflows/ci.yml`): Runs on every push and PR
  - Linting with Biome
  - Type checking with TypeScript
  - Tests with Vitest
  - Build verification

- **Release** (`.github/workflows/release.yml`): Runs on push to main
  - Creates version PRs with Changesets
  - Publishes to npm when version PR is merged

### Required Secrets

Add these secrets to your GitHub repository:
- `NPM_TOKEN`: Your npm authentication token

## Need Help?

- Check [CONTRIBUTING.md](./CONTRIBUTING.md)
- Open an issue on GitHub
- Review existing issues and PRs

Happy coding! 🚀
