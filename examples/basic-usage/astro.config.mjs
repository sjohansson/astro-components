import react from "@astrojs/react";
import plausible from "@sjohansson/astro-plausible/integration";
import reactFlow from "@sjohansson/astro-reactflow/integration";
import themeToggle from "@sjohansson/astro-theme-toggle/integration";
import umami from "@sjohansson/astro-umami/integration";
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
    // Registers <version-note> on every page
    versionNote(),
    reactFlow({
      // Configure SSR handling for React Flow
      configureSsr: true,
    }),
    votes({
      // No analytics in the example; the page logs vote-change events instead
      transport: "none",
    }),
    // Both analytics integrations bundle their tracker and send events to a relay on the site's own domain
    // (api/send and api/event, written by `astro-umami init` and `astro-plausible init`). The example has no
    // relay, so they stay off; set enabled: false to see the bundled trackers in a build.
    umami({
      websiteId: "00000000-0000-0000-0000-000000000000",
      enabled: false,
    }),
    plausible({
      domain: "example.com",
      enabled: false,
    }),
  ],
});
