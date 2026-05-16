import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import type { AstroIntegration } from "astro";

export interface ReactFlowOptions {
  /**
   * Whether to configure React Flow for proper SSR handling.
   * @default true
   */
  configureSsr?: boolean;
  /**
   * Automatically register `@astrojs/react` if it isn't already in the
   * consumer's `integrations` array. Disable to manage the React renderer
   * yourself.
   * @default true
   */
  autoRegisterReact?: boolean;
}

/**
 * Astro integration for React Flow components.
 *
 * Registers `@astrojs/react` automatically when missing and applies the Vite
 * SSR settings React Flow needs. Throws a clear error at config-load time if
 * `@astrojs/react` is not installed, instead of failing later with the cryptic
 * `NoMatchingRenderer` runtime error.
 *
 * @example
 * ```js
 * // astro.config.mjs
 * import reactFlow from '@sjohansson/astro-reactflow/integration';
 *
 * export default defineConfig({
 *   integrations: [reactFlow()],
 * });
 * ```
 */
export default function reactFlowIntegration(options: ReactFlowOptions = {}): AstroIntegration {
  const { configureSsr = true, autoRegisterReact = true } = options;

  return {
    name: "@sjohansson/astro-reactflow",
    hooks: {
      "astro:config:setup": async ({ config, updateConfig, logger }) => {
        const hasReact = config.integrations.some((i) => i.name === "@astrojs/react");

        if (!hasReact) {
          if (!autoRegisterReact) {
            throw new Error(
              "[@sjohansson/astro-reactflow] @astrojs/react is required but not registered. " +
                "Add `react()` to your integrations or enable `autoRegisterReact`.",
            );
          }

          // Resolve `@astrojs/react` from the consumer's project root, not from
          // this package's own node_modules — under pnpm's strict isolation the
          // peer is only linked into the consumer's tree.
          const consumerRequire = createRequire(new URL("./package.json", config.root));
          let reactModulePath: string;
          try {
            reactModulePath = consumerRequire.resolve("@astrojs/react");
          } catch {
            throw new Error(
              "[@sjohansson/astro-reactflow] Missing peer dependency `@astrojs/react`. " +
                "Install it with: pnpm add @astrojs/react react react-dom",
            );
          }

          const reactModule = (await import(pathToFileURL(reactModulePath).href)) as {
            default: () => AstroIntegration;
          };
          updateConfig({ integrations: [reactModule.default()] });
          logger.info("Auto-registered @astrojs/react");
        }

        if (configureSsr) {
          updateConfig({
            vite: {
              ssr: {
                noExternal: ["@xyflow/react"],
              },
              optimizeDeps: {
                // Pre-bundle CJS deps that React Flow / Zustand pull in, so
                // the browser doesn't choke on `import x from 'cjs-module'`.
                include: ["@xyflow/react", "use-sync-external-store/shim/with-selector"],
              },
            },
          });
        }
      },
    },
  };
}
