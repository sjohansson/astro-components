// The relay function that `astro-umami init --target swa` writes to api/send/index.mjs. It is built as one file
// with no imports. The CLI replaces the config identifier below with the options given on the command line.
import { createRelay, type RelayOptions, swaHandler } from "../relay";

declare const __ASTRO_UMAMI_RELAY_CONFIG__: RelayOptions;

export const relay = createRelay(__ASTRO_UMAMI_RELAY_CONFIG__);

// function.json names this as the entryPoint. The Functions worker only guesses the entry point when a module has a
// single export, so without it the extra export above would make every call fail with a 500.
export default swaHandler(relay);
