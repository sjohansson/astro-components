import { readFile } from "node:fs/promises";
import { defineConfig, type Options } from "tsdown";

type PackageConfigOptions = {
  entry?: string | string[];
  external?: (string | RegExp)[];
};

const FN_SUFFIX = "?fn";

interface ResolveContext {
  resolve(
    source: string,
    importer: string | undefined,
    options: { skipSelf: boolean },
  ): Promise<{ id: string } | null | undefined>;
}

/**
 * Lets a package import a vendored classic script as a function: `import run from "../vendor/x.js?fn"` gives a
 * function whose body is the file, so the script runs when called instead of when the module loads. The vendored
 * file stays byte-identical to upstream. Shared with vitest.config.ts so tests see the same modules as the build.
 */
export function vendorScriptPlugin() {
  return {
    name: "vendor-script-as-function",
    enforce: "pre" as const,
    async resolveId(this: ResolveContext, source: string, importer: string | undefined) {
      if (!source.endsWith(FN_SUFFIX)) return null;
      const resolved = await this.resolve(source.slice(0, -FN_SUFFIX.length), importer, { skipSelf: true });
      return resolved ? `${resolved.id}${FN_SUFFIX}` : null;
    },
    async load(id: string) {
      if (!id.endsWith(FN_SUFFIX)) return null;
      const code = await readFile(id.slice(0, -FN_SUFFIX.length), "utf8");
      return { code: `export default function run() {\n${code}\n}\n`, map: null };
    },
  };
}

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
    plugins: [vendorScriptPlugin()],
  });
}

export default createPackageConfig;
