import { createPackageConfig } from "../../tsdown.package.config.ts";

export default createPackageConfig({
  entry: [
    // Root (Astro compat — re-exports astro/index)
    "src/index.ts",
    // Core (framework-agnostic Web Components)
    "src/core/index.ts",
    "src/core/theme-toggle.ts",
    "src/core/theme-controller.ts",
    "src/core/theme-preview.ts",
    "src/core/theme-init.ts",
    // Astro wrappers
    "src/astro/index.ts",
    "src/astro/integration.ts",
    // Config + types (shared)
    "src/theme-config.ts",
    "src/types.ts",
    // Theme families
    "src/themes/index.ts",
    "src/themes/kawaii.ts",
    "src/themes/less-is-more.ts",
    "src/themes/seventies.ts",
  ],
});
