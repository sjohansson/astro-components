import { createPackageConfig } from "../../tsup.package.config";

export default createPackageConfig({
  entry: ["src/index.ts", "src/integration.ts", "src/version-note.ts"],
});
