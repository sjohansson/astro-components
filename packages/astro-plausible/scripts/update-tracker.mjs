#!/usr/bin/env node
// Moves @plausible-analytics/tracker to the newest release on npm and prints what changed, with the entries from the
// tracker's changelog. With --check it writes nothing and exits 1 when a newer release exists, so CI can compare
// without touching the tree. pnpm's minimumReleaseAge (pnpm-workspace.yaml) still applies: a release younger than
// that is reported but not installed until it is old enough.
import { exec as execCallback } from "node:child_process";
import { appendFile, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const PACKAGE = "@plausible-analytics/tracker";
const PACKAGE_DIR = fileURLToPath(new URL("..", import.meta.url));
const INSTALLED = new URL(`../node_modules/${PACKAGE}/`, import.meta.url);
const REGISTRY_URL = `https://registry.npmjs.org/${PACKAGE.replace("/", "%2F")}`;
const check = process.argv.includes("--check");

const exec = promisify(execCallback);

/**
 * Runs a pnpm command in the package directory and returns its stdout. Through the shell, so pnpm.cmd works on
 * Windows; the arguments are constants from this file.
 */
async function pnpm(command, { allowExit1 = false } = {}) {
  try {
    const { stdout } = await exec(`pnpm ${command}`, { cwd: PACKAGE_DIR });
    return stdout;
  } catch (error) {
    // pnpm outdated exits 1 when something is outdated; its report is still on stdout.
    if (allowExit1 && error.code === 1 && typeof error.stdout === "string") return error.stdout;
    throw error;
  }
}

async function installedVersion() {
  return JSON.parse(await readFile(new URL("package.json", INSTALLED), "utf8")).version;
}

/** The newest version on npm, or undefined when the installed one is it. */
async function latestVersion() {
  const report = JSON.parse((await pnpm(`outdated ${PACKAGE} --json`, { allowExit1: true })) || "{}");
  return report[PACKAGE]?.latest;
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
const latest = await latestVersion();

if (!latest || latest === current) {
  console.log(`${PACKAGE} ${current} is the newest release on npm.`);
  process.exit(0);
}

console.log(`${PACKAGE} ${current} is behind npm.`);
console.log(`  installed ${current}`);
console.log(`  latest    ${latest}, published ${await publishedOn(latest)}`);

if (check) process.exit(1);

await pnpm(`update --latest ${PACKAGE}`);
const updated = await installedVersion();

if (updated === current) {
  console.log(`pnpm kept ${current}: ${latest} is younger than minimumReleaseAge in pnpm-workspace.yaml.`);
  console.log("Try again when it is old enough.");
  process.exit(0);
}

console.log(`Updated ${PACKAGE} to ${updated} in package.json and pnpm-lock.yaml.`);
console.log("Review the changelog, then run the tests.");
const changelog = await readFile(new URL("CHANGELOG.md", INSTALLED), "utf8").catch(() => "");
const entries = changelogSince(changelog, current);
if (entries) console.log(`\n${entries}`);

if (process.env.GITHUB_OUTPUT) {
  await appendFile(process.env.GITHUB_OUTPUT, `previous=${current}\nversion=${updated}\n`);
}
