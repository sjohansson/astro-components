# Astro Integration Guide

This guide explains how to use the components in this repository as Astro integrations or as standalone components.

## Table of Contents
- [What's the Difference?](#whats-the-difference)
- [Integration Usage](#integration-usage)
- [Component Usage](#component-usage)
- [When to Use Which?](#when-to-use-which)
- [Best Practices](#best-practices)

## What's the Difference?

### Astro Integration
An **Astro integration** is a plugin that extends Astro's functionality through its Integration API. Integrations can:
- Run setup code during build/dev time
- Modify Astro configuration
- Inject scripts and styles globally
- Add middleware or routes
- Provide automatic configuration for components

### Standalone Component
A **standalone component** is simply imported and used directly in your `.astro` files without any special setup.

## Integration Usage

Each package provides both an integration and a component. Using the integration gives you:
- Automatic setup and configuration
- Global scripts/styles when needed
- Better defaults and automatic optimizations
- Validation and warnings

### Theme Toggle Integration

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import themeToggle from '@sjohansson/astro-theme-toggle/integration';

export default defineConfig({
  integrations: [
    themeToggle({
      // Optional: inject theme initialization script globally
      injectScript: true, // default: false
    })
  ],
});
```

Then use the component:

```astro
---
import { ThemeToggle } from '@sjohansson/astro-theme-toggle';
---

<ThemeToggle class="my-custom-styles" />
```

**Benefits of using the integration:**
- Automatic theme persistence script injection (if enabled)
- Better SSR handling
- Fewer flash-of-unstyled-content issues

### Version Note Integration

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import versionNote from '@sjohansson/astro-version-note/integration';

export default defineConfig({
  integrations: [
    versionNote({
      // Optional: set defaults for all version notes
      defaultVersion: 'v1.0.0',
      defaultType: 'info', // 'info' | 'warning' | 'success' | 'error'
    })
  ],
});
```

Then use the component:

```astro
---
import { VersionNote } from '@sjohansson/astro-version-note';
---

<VersionNote version="v2.0.0" type="warning">
  This feature requires version 2.0.0 or higher.
</VersionNote>
```

**Benefits of using the integration:**
- Global configuration for consistent styling
- Default values applied automatically

### React Flow Integration

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import reactFlow from '@sjohansson/astro-reactflow/integration';

export default defineConfig({
  integrations: [
    react(), // Required: React Flow integration needs @astrojs/react
    reactFlow({
      // Optional: automatically handle React Flow styles
      injectStyles: true, // default: true
    })
  ],
});
```

Then use the component:

```astro
---
import { ReactFlowWrapper } from '@sjohansson/astro-reactflow';

const nodes = [
  { id: '1', position: { x: 0, y: 0 }, data: { label: 'Start' } }
];
const edges = [];
---

<ReactFlowWrapper
  client:only="react"
  nodes={nodes}
  edges={edges}
  className="h-96"
/>
```

**Benefits of using the integration:**
- Automatic detection of missing dependencies
- Proper SSR configuration for React Flow
- Optimized Vite configuration

## Component Usage

If you prefer minimal setup, you can use components directly without the integration:

```bash
# Install only the component you need
pnpm add @sjohansson/astro-theme-toggle
```

```astro
---
// Import and use directly
import { ThemeToggle } from '@sjohansson/astro-theme-toggle';
---

<ThemeToggle />
```

This works fine for simple use cases, but you lose the benefits of automatic configuration.

## When to Use Which?

### Use the Integration when:
- You want automatic setup and best practices
- You need global configuration
- You're using the component extensively throughout your site
- You want helpful warnings and validation

### Use Components Directly when:
- You need minimal setup
- You're only using the component in one or two places
- You want full manual control over configuration
- You're already familiar with the component requirements

## Best Practices

### 1. Independent Versioning
Each package is versioned independently. Always check the version compatibility:

```json
{
  "dependencies": {
    "@sjohansson/astro-theme-toggle": "^0.1.0",
    "@sjohansson/astro-version-note": "^0.2.0"
  }
}
```

### 2. Peer Dependencies
Check each package's peer dependencies:

- **astro-theme-toggle**: `astro@^5.0.0`, optional `tailwindcss@^4.0.0`
- **astro-version-note**: `astro@^5.0.0`
- **astro-reactflow**: `astro@^5.0.0`, `@astrojs/react`, `react`, `react-dom`, `@xyflow/react`

### 3. Type Safety
All integrations are fully typed. Use TypeScript for the best development experience:

```ts
// astro.config.mjs (or .ts)
import { defineConfig } from 'astro/config';
import themeToggle from '@sjohansson/astro-theme-toggle/integration';

export default defineConfig({
  integrations: [
    themeToggle({
      injectScript: true, // TypeScript will autocomplete and validate
    })
  ],
});
```

### 4. Progressive Enhancement
Integrations are designed for progressive enhancement:
- They work without JavaScript when possible
- They enhance the experience when JavaScript is available
- They respect user preferences (like prefers-color-scheme)

### 5. Testing
Test your integration setup:

```bash
# Build your site
pnpm build

# Check for warnings or errors in the build output
```

## Migration from Component-Only to Integration

If you're already using a component directly, migrating to the integration is easy:

**Before:**
```astro
---
import { ThemeToggle } from '@sjohansson/astro-theme-toggle';
---
<ThemeToggle />
```

**After:**
1. Add the integration to your config:
```js
// astro.config.mjs
import themeToggle from '@sjohansson/astro-theme-toggle/integration';

export default defineConfig({
  integrations: [themeToggle()],
});
```

2. Keep using the component as before (no changes needed):
```astro
---
import { ThemeToggle } from '@sjohansson/astro-theme-toggle';
---
<ThemeToggle />
```

The component works the same way, but now benefits from the integration's automatic setup!

## Troubleshooting

### Integration not loading
- Ensure the integration is listed in `astro.config.mjs`
- Check that you're importing from the `/integration` subpath
- Restart your dev server after adding an integration

### Type errors
- Ensure you're using compatible versions of Astro (5.0.0+)
- Check that peer dependencies are installed
- Restart your TypeScript server in your editor

### Build errors
- Check the build output for integration warnings
- Verify that all peer dependencies are satisfied
- Ensure your configuration options match the expected types

## Further Reading

- [Astro Integration API Documentation](https://docs.astro.build/en/reference/integrations-reference/)
- [Astro Configuration Reference](https://docs.astro.build/en/reference/configuration-reference/)
- Individual package READMEs for component-specific details
