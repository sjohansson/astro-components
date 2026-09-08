import { createPackageConfig } from "../../tsdown.package.config.ts";

export default {
  ...createPackageConfig({
    entry: ["src/index.ts", "src/integration.ts"],
    external: ["react", "react-dom", "@xyflow/react", "@astrojs/react"],
  }),
  // Emit the stylesheet as `dist/styles.css` rather than a content-hashed
  // `dist/assets/styles-<hash>.css`. The name has to be stable so it can be a
  // public export (`@sjohansson/astro-reactflow/styles.css`) that consumers —
  // and the integration — can import by path. The component's own
  // `import "./styles.css"` resolves to the same file, so nothing is duplicated.
  outputOptions: { assetFileNames: "[name][extname]" },
};
