import type { AstroIntegration } from "astro";

export interface ReactFlowOptions {
  /**
   * Whether to configure React Flow for proper SSR handling
   * @default true
   */
  configureSsr?: boolean;
}

/**
 * Astro integration for React Flow components.
 *
 * This integration provides React Flow diagram support for Astro sites,
 * with automatic React renderer setup and SSR configuration.
 *
 * Note: React Flow styles are imported automatically by the ReactFlowWrapper component.
 *
 * @example
 * ```js
 * // astro.config.mjs
 * import react from '@astrojs/react';
 * import reactFlow from '@sjohansson/astro-reactflow/integration';
 *
 * export default defineConfig({
 *   integrations: [
 *     react(),
 *     reactFlow({ configureSsr: true })
 *   ],
 * });
 * ```
 */
export default function reactFlowIntegration(options: ReactFlowOptions = {}): AstroIntegration {
  const { configureSsr = true } = options;

  return {
    name: "@sjohansson/astro-reactflow",
    hooks: {
      "astro:config:setup": ({ logger, updateConfig }) => {
        logger.info("Setting up React Flow integration");

        // Configure SSR handling for React Flow if requested
        if (configureSsr) {
          updateConfig({
            vite: {
              ssr: {
                // Ensure React Flow is bundled for SSR compatibility
                noExternal: ["@xyflow/react"],
              },
            },
          });

          logger.debug("React Flow SSR configuration applied");
        }
      },
      "astro:config:done": ({ config, logger }) => {
        logger.info("React Flow integration configured");

        // Verify React integration is present
        const hasReactIntegration = config.integrations.some((integration) => integration.name === "@astrojs/react");

        if (!hasReactIntegration) {
          logger.warn("React Flow integration requires @astrojs/react. Please add it to your integrations.");
        }
      },
    },
  };
}
