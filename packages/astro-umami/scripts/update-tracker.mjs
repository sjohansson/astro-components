#!/usr/bin/env node
// Refreshes vendor/umami.js from Umami Cloud. Prints what changed. With --check it writes nothing and exits 1 on
// drift, so CI can compare without touching the tree.
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const UPSTREAM_URL = "https://cloud.umami.is/script.js";
const LOCAL_PATH = new URL("../vendor/umami.js", import.meta.url);
const check = process.argv.includes("--check");

const sha = (text) => createHash("sha256").update(text).digest("hex");

async function fetchUpstream() {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(UPSTREAM_URL, { headers: { "user-agent": "astro-umami update-tracker" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (error) {
      lastError = error;
      if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, attempt * 10_000));
    }
  }
  throw new Error(`Could not fetch ${UPSTREAM_URL}: ${lastError}`);
}

const local = await readFile(LOCAL_PATH, "utf8");
const upstream = await fetchUpstream();

if (local === upstream) {
  console.log(`vendor/umami.js matches upstream (${sha(local)}, ${Buffer.byteLength(local)} bytes).`);
  process.exit(0);
}

console.log("vendor/umami.js differs from upstream.");
console.log(`  local    ${sha(local)} ${Buffer.byteLength(local)} bytes`);
console.log(`  upstream ${sha(upstream)} ${Buffer.byteLength(upstream)} bytes`);

if (check) process.exit(1);

await writeFile(LOCAL_PATH, upstream);
console.log("Updated vendor/umami.js. Review the diff, then run the tests.");
