import react from "@astrojs/react";
import reactFlow from "@sjohansson/astro-reactflow/integration";
import themeToggle from "@sjohansson/astro-theme-toggle/integration";
import versionNote from "@sjohansson/astro-version-note/integration";
import votes from "@sjohansson/astro-votes/integration";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  integrations: [
    react(),
    themeToggle({
      // Inject theme initialization script globally
      injectScript: true,
    }),
    versionNote({
      // Document version note conventions (informational)
      defaultType: "info",
    }),
    reactFlow({
      // Configure SSR handling for React Flow
      configureSsr: true,
    }),
    votes({
      // No analytics in the example; the page logs vote-change events instead
      transport: "none",
    }),
  ],
});
