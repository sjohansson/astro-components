#!/usr/bin/env node
import { fail, main } from "./cli";

main(process.argv.slice(2), process.env).then(
  (code) => {
    process.exitCode = code;
  },
  (error: unknown) => {
    process.exitCode = fail(error instanceof Error ? error.message : String(error));
  },
);
