import { defineConfig } from "vitest/config";
import { vendorScriptPlugin } from "./tsdown.package.config.ts";

export default defineConfig({
  plugins: [vendorScriptPlugin()],
  test: {
    globals: true,
    environment: "happy-dom",
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "dist/",
        "**/*.config.{js,ts}",
        "**/*.d.ts",
        "**/test/**",
        "**/tests/**",
        "**/vendor/**",
      ],
    },
    include: ["packages/**/tests/**/*.{test,spec}.{js,ts,jsx,tsx}"],
    exclude: ["node_modules", "dist", ".astro"],
  },
});
