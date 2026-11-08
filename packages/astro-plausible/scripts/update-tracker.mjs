#!/usr/bin/env node
// Moves @plausible-analytics/tracker to the newest release on npm and prints what changed, with the entries from the
// tracker's changelog. With --check it writes nothing and exits 1 when an update exists, so CI can compare without
// touching the tree. pnpm's minimumReleaseAge (pnpm-workspace.yaml) still applies: a release younger than that is
// reported but not installed until it is old enough.
import { exec as execCallback } from "node:child_process";
import { appendFile, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const PACKAGE = "@plausible-analytics/tracker";
const PACKAGE_DIR = fileURLToPath(new URL("..", import.meta.url));
const MANIFEST = new URL("../package.json", import.meta.url);
const INSTALLED = new URL(`../node_modules/${PACKAGE}/`, import.meta.url);
const REGISTRY_URL = `https://registry.npmjs.org/${PACKAGE.replace("/", "%2F")}`;
const check = process.argv.includes("--check");

const exec = promisify(execCallback);

/**
 * Runs a pnpm command in the package directory and returns its stdout. Through the shell, so pnpm.cmd works on
 * Windows; the arguments are constants from this file.
 */
async function pnpm(command) {
  const { stdout } = await exec(`pnpm ${command}`, { cwd: PACKAGE_DIR });
  return stdout;
}

async function installedVersion() {
  return JSON.parse(await readFile(new URL("package.json", INSTALLED), "utf8")).version;
}

/** The newest version on npm. */
async function latestVersion() {
  const res = await fetch(REGISTRY_URL, { signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`Could not read ${PACKAGE} from npm: HTTP ${res.status}`);
  return (await res.json())["dist-tags"]?.latest;
}

/** The minimum version declared in package.json's dependency range. */
async function declaredFloor() {
  const manifest = JSON.parse(await readFile(MANIFEST, "utf8"));
  const range = manifest.dependencies?.[PACKAGE];
  const match = typeof range === "string" && range.match(/^[~^]?(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)$/);
  if (!match) throw new Error(`Cannot determine the declared version floor from ${range}.`);
  return match[1];
}

/** The day a version was published, from the registry. */
async function publishedOn(version) {
  try {
    const res = await fetch(REGISTRY_URL, { signal: AbortSignal.timeout(30_000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const time = (await res.json()).time?.[version];
    return time ? time.slice(0, 10) : "an unknown date";
  } catch {
    return "an unknown date";
  }
}

/** The changelog sections above the one for `version`, without the Unreleased section. */
function changelogSince(changelog, version) {
  const sections = [];
  for (const section of changelog.split(/^(?=## )/m).slice(1)) {
    if (section.startsWith(`## [${version}]`)) break;
    if (!section.startsWith("## Unreleased")) sections.push(section.trim());
  }
  return sections.join("\n\n");
}

const current = await installedVersion();
const floor = await declaredFloor();
const latest = await latestVersion();

if (!latest) throw new Error(`Could not determine the latest version of ${PACKAGE} on npm.`);

if (latest === current && latest === floor) {
  console.log(`${PACKAGE} ${current} is installed and declared at the newest release on npm.`);
  process.exit(0);
}

console.log(`${PACKAGE} needs an update to match the newest release on npm.`);
console.log(`  installed ${current}`);
console.log(`  declared  ${floor}`);
console.log(`  latest    ${latest}, published ${await publishedOn(latest)}`);

if (check) process.exit(1);

await pnpm(`update --latest ${PACKAGE}`);
const updated = await installedVersion();
const updatedFloor = await declaredFloor();

if (updated === current && updatedFloor === floor) {
  console.log(`pnpm kept ${current}: ${latest} is younger than minimumReleaseAge in pnpm-workspace.yaml.`);
  console.log("Try again when it is old enough.");
  process.exit(0);
}

console.log(`Updated ${PACKAGE} to ${updated} in package.json and pnpm-lock.yaml.`);
console.log("Review the changelog, then run the tests.");
const changelog = await readFile(new URL("CHANGELOG.md", INSTALLED), "utf8").catch(() => "");
const entries = changelogSince(changelog, floor);
if (entries) console.log(`\n${entries}`);

if (process.env.GITHUB_OUTPUT) {
  await appendFile(process.env.GITHUB_OUTPUT, `previous=${floor}\nversion=${updated}\n`);
}
