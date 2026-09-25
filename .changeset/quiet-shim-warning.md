---
"@sjohansson/astro-reactflow": patch
---

Stop Vite warning `Failed to resolve dependency: use-sync-external-store/shim/with-selector` on dev start in pnpm projects. The integration no longer lists the shim in `optimizeDeps.include`; pre-bundling `@xyflow/react` already bundles it.
