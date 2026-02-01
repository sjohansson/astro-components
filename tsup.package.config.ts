import { type Options, defineConfig } from 'tsup';

type PackageConfigOptions = {
  entry?: string;
  external?: string[];
};

const assetLoaders: NonNullable<Options['esbuildOptions']>['loader'] = {
  '.astro': 'copy',
  '.css': 'copy',
};

export function createPackageConfig({
  entry = 'src/index.ts',
  external = [],
}: PackageConfigOptions = {}) {
  return defineConfig({
    entry: [entry],
    format: ['esm'],
    target: 'es2022',
    dts: true,
    sourcemap: true,
    clean: true,
    treeshake: true,
    splitting: false,
    minify: false,
    platform: 'browser',
    external: Array.from(new Set(['astro', ...external])),
    esbuildOptions(options) {
      options.loader = { ...options.loader, ...assetLoaders };
    },
  });
}

export default createPackageConfig;
