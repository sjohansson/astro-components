import { defineConfig, type Options } from "tsdown";

type PackageConfigOptions = {
  entry?: string | string[];
  external?: (string | RegExp)[];
};

export function createPackageConfig({ entry = "src/index.ts", external = [] }: PackageConfigOptions = {}): Options {
  const entryArray = Array.isArray(entry) ? entry : [entry];

  return defineConfig({
    entry: entryArray,
    format: ["esm"],
    target: "es2022",
    dts: true,
    sourcemap: true,
    clean: true,
    treeshake: true,
    platform: "browser",
    external: [/^node:/, "astro", ...external],
    loader: { ".css": "copy" },
  });
}

export default createPackageConfig;
