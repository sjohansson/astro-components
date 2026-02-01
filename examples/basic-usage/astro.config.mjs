import react from '@astrojs/react';
import reactFlow from '@sjohansson/astro-reactflow/integration';
import themeToggle from '@sjohansson/astro-theme-toggle/integration';
import versionNote from '@sjohansson/astro-version-note/integration';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  integrations: [
    react(),
    themeToggle({
      // Inject theme initialization script globally
      injectScript: true,
    }),
    versionNote({
      // Set default type for version notes
      defaultType: 'info',
    }),
    reactFlow({
      // Automatically handle React Flow styles
      injectStyles: true,
    }),
  ],
});
