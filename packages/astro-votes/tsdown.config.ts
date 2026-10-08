import { createPackageConfig } from "../../tsdown.package.config.ts";

export default createPackageConfig({
  entry: ["src/index.ts", "src/integration.ts", "src/sync.ts", "src/cli.ts"],
});
