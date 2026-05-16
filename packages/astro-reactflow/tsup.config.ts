import { createPackageConfig } from "../../tsup.package.config";

export default createPackageConfig({
  entry: ["src/index.ts", "src/integration.ts"],
  external: ["react", "react-dom", "@xyflow/react", "@astrojs/react"],
});
