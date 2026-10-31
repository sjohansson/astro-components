import { defineConfig } from "tsdown";
import { createPackageConfig } from "../../tsdown.package.config.ts";

export default [
  createPackageConfig({
    entry: ["src/index.ts", "src/integration.ts", "src/client.ts", "src/relay.ts", "src/bin.ts"],
  }),
  // The relay function `astro-umami init` writes. Built on its own so it is one file with no imports: Static Web
  // Apps managed functions cannot reach node_modules, and a dependency-free api/ folder skips the API build step.
  defineConfig({
    entry: { swa: "src/templates/swa.ts" },
    outDir: "dist/templates",
    format: ["esm"],
    target: "es2022",
    platform: "node",
    dts: false,
    sourcemap: false,
    clean: false,
    treeshake: true,
  }),
];
