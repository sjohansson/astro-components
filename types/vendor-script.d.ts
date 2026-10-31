/** A vendored classic script wrapped in a function by `vendorScriptPlugin` in tsdown.package.config.ts. */
declare module "*?fn" {
  const run: () => void;
  export default run;
}
