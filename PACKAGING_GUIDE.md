# Packaging Guide for Astro Components

This guide documents the best practices and architecture for packaging Astro components as standalone, independently versioned integrations in a monorepo.

## Table of Contents
- [Architecture Overview](#architecture-overview)
- [Monorepo Structure](#monorepo-structure)
- [Package Independence](#package-independence)
- [Integration API Implementation](#integration-api-implementation)
- [Build Configuration](#build-configuration)
- [Publishing Strategy](#publishing-strategy)
- [Best Practices](#best-practices)

## Architecture Overview

### Design Principles

1. **Independence**: Each component is fully self-contained with no cross-package dependencies
2. **Dual Export**: Components export both raw components and Astro integrations
3. **Version Freedom**: Each package versions and releases independently via Changesets
4. **Modern Tooling**: Uses pnpm workspaces, Biome, TypeScript, and Vitest
5. **CI/CD Automation**: Automated testing, linting, and publishing via GitHub Actions

### Key Technologies

- **pnpm Workspaces**: Efficient monorepo package management
- **Changesets**: Independent versioning and changelog generation
- **tsup**: Fast TypeScript bundler with ESM output
- **Biome**: Fast linting and formatting (replaces ESLint + Prettier)
- **Vitest**: Modern test framework with ESM support
- **GitHub Actions**: CI/CD pipeline for testing and publishing

## Monorepo Structure

```
astro-components/
├── .changeset/                  # Changesets configuration
│   ├── config.json             # Independent versioning config
│   └── *.md                    # Individual changesets
├── .github/
│   └── workflows/
│       ├── ci.yml              # Linting, testing, building
│       └── release.yml         # Automated publishing
├── packages/
│   ├── astro-reactflow/        # React Flow integration
│   │   ├── src/
│   │   │   ├── index.ts        # Component exports
│   │   │   ├── integration.ts  # Astro integration
│   │   │   └── *.tsx           # React components
│   │   ├── tests/              # Package-specific tests
│   │   ├── package.json        # Independent versioning
│   │   ├── README.md           # Package documentation
│   │   └── tsup.config.ts      # Build configuration
│   ├── astro-theme-toggle/
│   └── astro-version-note/
├── package.json                # Root workspace config
├── pnpm-workspace.yaml         # Workspace definition
├── tsup.package.config.ts      # Shared build utilities
├── tsconfig.json               # Shared TypeScript config
├── vitest.config.ts            # Shared test config
└── biome.json                  # Linting and formatting config
```

## Package Independence

### Why Independence Matters

- **Faster iterations**: Update one package without affecting others
- **Clear dependencies**: No circular or hidden dependencies
- **Better testing**: Test packages in isolation
- **Flexible versioning**: Each package follows its own semver
- **Easier maintenance**: Changes are localized and predictable

### Ensuring Independence

Each package must:
1. Have its own `package.json` with independent version
2. Define all dependencies (including peer dependencies)
3. Include its own tests
4. Have complete documentation
5. Build independently of other packages

### Package.json Structure

```json
{
  "name": "@sjohansson/astro-theme-toggle",
  "version": "0.0.1",
  "description": "Theme toggle component for Astro",
  "type": "module",
  
  // Define all entry points
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./integration": {
      "types": "./dist/integration.d.ts",
      "import": "./dist/integration.js"
    },
    "./styles": "./dist/styles.css"
  },
  
  // Only include build output and source in package
  "files": [
    "dist",
    "src"
  ],
  
  // Define peer dependencies (what consumers must have)
  "peerDependencies": {
    "astro": "^5.0.0"
  },
  
  // NPM publishing configuration
  "publishConfig": {
    "access": "public"
  },
  
  // Repository information
  "repository": {
    "type": "git",
    "url": "https://github.com/sjohansson/astro-components.git",
    "directory": "packages/astro-theme-toggle"
  }
}
```

### Critical package.json Fields

- **`exports`**: Defines subpath exports (component and integration)
- **`files`**: Only ship `dist/` and `src/` (no test files or configs)
- **`peerDependencies`**: Consumer must install these
- **`publishConfig.access`**: "public" for scoped packages (@sjohansson/*)
- **`repository.directory`**: Links to specific package in monorepo

## Integration API Implementation

### Basic Integration Structure

```typescript
// src/integration.ts
import type { AstroIntegration } from 'astro';

export interface MyIntegrationOptions {
  // Define configuration options
  option1?: string;
  option2?: boolean;
}

export default function myIntegration(
  options: MyIntegrationOptions = {}
): AstroIntegration {
  return {
    name: '@sjohansson/my-integration',
    hooks: {
      'astro:config:setup': ({ logger, updateConfig, injectScript }) => {
        logger.info('Setting up integration');
        
        // Modify Astro configuration
        updateConfig({ /* ... */ });
        
        // Inject global scripts
        if (options.option2) {
          injectScript('head-inline', '/* script code */');
        }
      },
      'astro:config:done': ({ config, logger }) => {
        logger.info('Integration configured');
        // Validate configuration
        // Log helpful debugging info
      },
    },
  };
}
```

### Integration Hooks

Common hooks and their use cases:

- **`astro:config:setup`**: Early hook for modifying config, adding renderers, injecting scripts
- **`astro:config:done`**: Access final config, perform validation
- **`astro:server:setup`**: Add middleware to dev server
- **`astro:build:start`**: Run tasks at build start
- **`astro:build:done`**: Post-build tasks (e.g., generate files)

### Integration Best Practices

1. **Provide helpful logging**: Use `logger.info()`, `logger.warn()`, `logger.debug()`
2. **Validate configuration**: Check requirements in `astro:config:done`
3. **Fail fast**: Throw clear errors if requirements aren't met
4. **Document options**: Use JSDoc comments with examples
5. **Be conservative**: Only inject global code when necessary

## Build Configuration

### Shared Build Config

```typescript
// tsup.package.config.ts
import { defineConfig } from 'tsup';

export function createPackageConfig({
  entry = 'src/index.ts',
  external = []
}) {
  return defineConfig({
    entry: Array.isArray(entry) ? entry : [entry],
    format: ['esm'],
    target: 'es2022',
    dts: true,              // Generate .d.ts files
    sourcemap: true,        // Include source maps
    clean: true,            // Clean output before build
    treeshake: true,        // Remove unused code
    splitting: false,       // No code splitting for libraries
    minify: false,          // Keep code readable
    platform: 'browser',    // Target browser environment
    external: ['astro', ...external],
    esbuildOptions(options) {
      // Copy .astro and .css files to dist
      options.loader = {
        ...options.loader,
        '.astro': 'copy',
        '.css': 'copy',
      };
    },
  });
}
```

### Package-Specific Config

```typescript
// packages/astro-theme-toggle/tsup.config.ts
import { createPackageConfig } from '../../tsup.package.config';

export default createPackageConfig({
  // Build both component and integration
  entry: ['src/index.ts', 'src/integration.ts'],
});
```

### Build Output

Each package builds to `dist/` with:
- **ESM JavaScript**: `*.js` files
- **Type definitions**: `*.d.ts` files
- **Source maps**: `*.js.map` files
- **Copied assets**: `.astro`, `.css` files

## Publishing Strategy

### Changesets Workflow

1. **Make changes** to package code
2. **Create changeset**: `pnpm changeset`
   - Select affected packages
   - Choose bump type (major/minor/patch)
   - Describe changes
3. **Commit changeset**: Git commit the `.changeset/*.md` file
4. **CI creates version PR**: Automated PR with version bumps
5. **Merge version PR**: Triggers automated publish to npm

### Changeset Configuration

```json
// .changeset/config.json
{
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "fixed": [],           // Empty: all packages version independently
  "linked": [],          // Empty: no version linking
  "access": "public",    // Publish as public packages
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": []
}
```

### Versioning Guidelines

- **Major (1.0.0)**: Breaking API changes
- **Minor (0.1.0)**: New features, backward compatible
- **Patch (0.0.1)**: Bug fixes, no API changes

### Pre-publish Checklist

- [ ] All tests passing
- [ ] Builds successfully
- [ ] README updated
- [ ] Changeset created
- [ ] Types are correct
- [ ] No security vulnerabilities

## Best Practices

### 1. Component Design

- **Keep components focused**: One component, one responsibility
- **Minimize dependencies**: Only include what's necessary
- **Export types**: Share TypeScript interfaces for props
- **Document props**: Use JSDoc or comments
- **Support SSR**: Test both SSR and client-side rendering

### 2. Testing Strategy

```typescript
// tests/component.test.ts
import { describe, it, expect } from 'vitest';
import { render } from './test-utils';

describe('MyComponent', () => {
  it('renders correctly', () => {
    const result = render('<MyComponent />');
    expect(result).toBeTruthy();
  });
  
  it('handles props', () => {
    // Test component behavior
  });
});
```

Test both:
- **Component rendering**: Does it render without errors?
- **Integration setup**: Does the integration configure correctly?

### 3. Documentation

Each package needs:
- **README.md**: Installation, usage, examples, props
- **CHANGELOG.md**: Auto-generated by Changesets
- **JSDoc comments**: For all public APIs
- **Examples**: Real-world usage examples

### 4. Type Safety

```typescript
// Export all types
export type { ThemeToggleProps } from './ThemeToggle.astro';
export type { ThemeToggleOptions } from './integration';

// Use strict TypeScript
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true
  }
}
```

### 5. CI/CD Pipeline

**On every push/PR:**
- Lint with Biome
- Type check with TypeScript
- Run tests with Vitest
- Build all packages
- Check build artifacts

**On main branch merge:**
- Create version PR (if changesets exist)
- When version PR merges: publish to npm

### 6. Peer Dependencies

Define what consumers **must** have:

```json
{
  "peerDependencies": {
    "astro": "^5.0.0",
    "react": "^18.0.0"
  },
  "peerDependenciesMeta": {
    "react": {
      "optional": true  // Mark as optional if not always needed
    }
  }
}
```

### 7. Breaking Changes

When making breaking changes:
1. Document migration path in CHANGELOG
2. Bump major version
3. Consider deprecation period for gradual migration
4. Update examples and documentation

### 8. Security

- Run `pnpm audit` regularly
- Keep dependencies updated (Renovate helps)
- Don't include secrets in code
- Validate user input in integrations

## Common Patterns

### Pattern: Component + Integration

```typescript
// Export component for direct use
export { default as MyComponent } from './MyComponent.astro';

// Also export as integration
export { default as myIntegration } from './integration';
```

Users can choose:
```javascript
// Option 1: Direct component import
import { MyComponent } from '@sjohansson/my-package';

// Option 2: Use as integration
import myIntegration from '@sjohansson/my-package/integration';
```

### Pattern: Configuration Passing

```typescript
// integration.ts
export default function myIntegration(options) {
  return {
    name: '@sjohansson/my-integration',
    hooks: {
      'astro:config:setup': ({ updateConfig }) => {
        updateConfig({
          vite: {
            define: {
              '__MY_CONFIG__': JSON.stringify(options),
            },
          },
        });
      },
    },
  };
}
```

### Pattern: Conditional Features

```typescript
export default function myIntegration(options = {}) {
  return {
    hooks: {
      'astro:config:setup': ({ injectScript }) => {
        // Only inject if requested
        if (options.autoInit) {
          injectScript('head-inline', '/* init code */');
        }
      },
    },
  };
}
```

## Resources

- [Astro Integration API](https://docs.astro.build/en/reference/integrations-reference/)
- [Changesets Documentation](https://github.com/changesets/changesets)
- [pnpm Workspaces](https://pnpm.io/workspaces)
- [tsup Documentation](https://tsup.egoist.dev/)
- [Semantic Versioning](https://semver.org/)

## Conclusion

This architecture provides:
- ✅ Independent versioning and releases
- ✅ Easy integration for end users
- ✅ Flexible component usage
- ✅ Automated CI/CD pipeline
- ✅ Modern development experience
- ✅ Scalable monorepo structure

Each component can evolve at its own pace while maintaining high quality and developer experience.
