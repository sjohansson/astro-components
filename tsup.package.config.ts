import { defineConfig, type Options } from "tsup";

type PackageConfigOptions = {
  entry?: string | string[];
  external?: string[];
};

const assetLoaders: NonNullable<Options["esbuildOptions"]>["loader"] = {
  ".css": "copy",
};

export function createPackageConfig({ entry = "src/index.ts", external = [] }: PackageConfigOptions = {}) {
  const entryArray = Array.isArray(entry) ? entry : [entry];

  return defineConfig({
    entry: entryArray,
    format: ["esm"],
    target: "es2022",
    dts: true,
    sourcemap: true,
    clean: true,
    treeshake: true,
    splitting: false,
    minify: false,
    platform: "browser",
    external: Array.from(new Set(["astro", ...external])),
    esbuildOptions(options) {
      options.loader = { ...options.loader, ...assetLoaders };
    },
  });
}

export default createPackageConfig;
