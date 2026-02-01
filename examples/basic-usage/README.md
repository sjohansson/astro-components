# Basic Usage Example

This example demonstrates how to use all three Astro integrations in a single project.

## Setup

```bash
# From the repository root
cd examples/basic-usage
pnpm install
pnpm dev
```

## What's Included

This example shows:

1. **Theme Toggle** - Dark/light mode switching with persistence
2. **Version Note** - Documentation version callouts
3. **React Flow** - Interactive diagram rendering

## Project Structure

```
basic-usage/
├── src/
│   ├── pages/
│   │   └── index.astro       # Main page with all components
│   └── layouts/
│       └── Layout.astro      # Base layout
├── public/                   # Static assets
├── astro.config.mjs          # Astro config with integrations
├── package.json
└── tsconfig.json
```

## Key Files

### astro.config.mjs

Shows how to configure all three integrations:

```javascript
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import themeToggle from '@sjohansson/astro-theme-toggle/integration';
import versionNote from '@sjohansson/astro-version-note/integration';
import reactFlow from '@sjohansson/astro-reactflow/integration';

export default defineConfig({
  integrations: [
    react(),
    themeToggle({ injectScript: true }),
    versionNote({ defaultType: 'info' }),
    reactFlow({ injectStyles: true }),
  ],
});
```

### src/pages/index.astro

Demonstrates using all components together:

```astro
---
import Layout from '../layouts/Layout.astro';
import { ThemeToggle } from '@sjohansson/astro-theme-toggle';
import { VersionNote } from '@sjohansson/astro-version-note';
import { ReactFlowWrapper } from '@sjohansson/astro-reactflow';

const nodes = [
  { id: '1', position: { x: 0, y: 0 }, data: { label: 'Start' } },
  { id: '2', position: { x: 0, y: 100 }, data: { label: 'Process' } },
];
const edges = [{ id: 'e1-2', source: '1', target: '2' }];
---

<Layout>
  <header>
    <h1>Astro Components Example</h1>
    <ThemeToggle />
  </header>

  <main>
    <VersionNote version="v1.0.0" type="info">
      This example demonstrates all three components.
    </VersionNote>

    <section>
      <h2>React Flow Diagram</h2>
      <ReactFlowWrapper
        client:only="react"
        nodes={nodes}
        edges={edges}
        className="h-96 border rounded"
      />
    </section>
  </main>
</Layout>
```

## Learn More

- [Integration Guide](../../INTEGRATION_GUIDE.md)
- [Packaging Guide](../../PACKAGING_GUIDE.md)
- Individual package READMEs for detailed API documentation
