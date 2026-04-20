import themeToggle from "@sjohansson/astro-theme-toggle/integration";
import { defineConfig } from "astro/config";

export default defineConfig({
  integrations: [
    themeToggle({
      injectScript: true,
    }),
  ],
});
