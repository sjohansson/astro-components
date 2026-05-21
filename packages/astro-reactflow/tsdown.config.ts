import { createPackageConfig } from "../../tsdown.package.config.ts";

export default createPackageConfig({
  entry: ["src/index.ts", "src/integration.ts"],
  external: ["react", "react-dom", "@xyflow/react", "@astrojs/react"],
});
