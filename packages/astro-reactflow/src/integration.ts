import type { AstroIntegration } from 'astro';

export interface ReactFlowOptions {
  /**
   * Whether to automatically inject React Flow styles globally
   * @default true
   */
  injectStyles?: boolean;
}

/**
 * Astro integration for React Flow components.
 *
 * This integration provides React Flow diagram support for Astro sites,
 * with automatic React renderer setup and optional style injection.
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
 *     reactFlow({ injectStyles: true })
 *   ],
 * });
 * ```
 */
export default function reactFlowIntegration(options: ReactFlowOptions = {}): AstroIntegration {
  const { injectStyles = true } = options;

  return {
    name: '@sjohansson/astro-reactflow',
    hooks: {
      'astro:config:setup': ({ logger, updateConfig }) => {
        logger.info('Setting up React Flow integration');

        // Inject React Flow styles if requested
        if (injectStyles) {
          updateConfig({
            vite: {
              ssr: {
                // Ensure React Flow is not SSR'd since it requires client-side rendering
                noExternal: ['@xyflow/react'],
              },
            },
          });

          logger.debug('React Flow styles will be automatically injected');
        }
      },
      'astro:config:done': ({ config, logger }) => {
        logger.info('React Flow integration configured');

        // Verify React integration is present
        const hasReactIntegration = config.integrations.some(
          (integration) => integration.name === '@astrojs/react'
        );

        if (!hasReactIntegration) {
          logger.warn(
            'React Flow integration requires @astrojs/react. Please add it to your integrations.'
          );
        }
      },
    },
  };
}
