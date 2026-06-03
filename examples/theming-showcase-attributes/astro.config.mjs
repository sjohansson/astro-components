import themeToggle from "@sjohansson/astro-theme-toggle/integration";
import { defineConfig } from "astro/config";

// This showcase uses the **data-attribute** apply mode. The component sets
// `data-theme` / `data-theme-family` / `data-theme-scheme` / `data-theme-category`
// on <html>, and ALL theming is driven by the separate CSS files in
// src/styles/ — the library injects no colors of its own ("clean slate").
//
// The integration injects a FOUC-prevention script that replays the persisted
// data attributes before first paint. Its options must match how the component
// is configured on the page (attribute mode, default `data-theme` base name).
export default defineConfig({
  integrations: [
    themeToggle({
      injectScript: true,
      applyMode: "attribute",
      attributeName: "data-theme",
      attributeCompanions: true,
    }),
  ],
});
