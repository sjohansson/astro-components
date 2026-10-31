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
      // Without `include`, only files some test imports are reported, so an untested module never shows up.
      include: ["packages/*/src/**/*.{ts,tsx}"],
      exclude: [
        "**/*.d.ts",
        "**/vendor/**",
        // Process entry points: run main() from cli.ts and set the exit code. main() is tested directly.
        "packages/*/src/bin.ts",
      ],
      // A floor just under the current numbers, so a regression fails the run. Raise it as coverage improves.
      thresholds: { statements: 98, branches: 93, functions: 98, lines: 98 },
    },
    include: ["packages/**/tests/**/*.{test,spec}.{js,ts,jsx,tsx}"],
    exclude: ["node_modules", "dist", ".astro"],
  },
});
