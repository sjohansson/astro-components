/**
 * astro-plausible - writes the relay that forwards tracker events to Plausible.
 *
 * Static Web Apps managed functions must be real files in the repo, and nothing in node_modules is picked up, so
 * the relay is written out as one self-contained file. Re-run the command to update it after a package upgrade.
 */
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { DEFAULT_MAX_BODY_LENGTH, DEFAULT_UPSTREAM, type RelayOptions, type RelayRule } from "./relay";

const HELP = `Usage: astro-plausible init [options]

Writes a relay function that forwards Plausible tracker events from your domain to Plausible.

Options:
  --target <name>      Hosting target. "swa" (Azure Static Web Apps managed functions) is the only one today.
  --domain <domain>    Site domain as entered in Plausible (or PLAUSIBLE_DOMAIN). Repeat it for several sites.
  --upstream <url>     Plausible host, default ${DEFAULT_UPSTREAM}. Self-hosted: https://plausible.example.com
  --dir <path>         API folder, default "api"
  --rule <spec>        Validate a custom event: <event>:<property>=<regex>. Repeatable. Events with a rule are
                       forwarded only with the listed properties, each matching its pattern.
  --max-body <bytes>   Reject bodies larger than this, default ${DEFAULT_MAX_BODY_LENGTH}
  --dry-run            Print the files instead of writing them
  -h, --help           Show this help

Writes <dir>/event/index.mjs and <dir>/event/function.json every time, and <dir>/host.json and <dir>/package.json
when they are missing. Deploy with api_location set to <dir>.
`;

const CONFIG_PLACEHOLDER = "__ASTRO_PLAUSIBLE_RELAY_CONFIG__";
const RULE_PATTERN = /^([\w.-]+):([\w.-]+)=(.+)$/s;

export interface CliContext {
  /** Where the built templates live, as a directory URL. Defaults to the package's own dist/templates. */
  templateDir?: URL;
  version?: string;
  now?: Date;
}

export interface ScaffoldFile {
  path: string;
  content: string;
  /** Written only when the file does not exist yet. */
  keepExisting: boolean;
}

/** Parses `<event>:<property>=<regex>` specs into relay rules. Throws on a bad spec or pattern. */
export function parseRules(specs: string[]): Record<string, RelayRule> {
  const events: Record<string, RelayRule> = {};
  for (const spec of specs) {
    const match = spec.match(RULE_PATTERN);
    if (!match) throw new Error(`--rule must look like <event>:<property>=<regex>, got "${spec}"`);
    const [, event = "", property = "", pattern = ""] = match;
    try {
      new RegExp(pattern);
    } catch (error) {
      throw new Error(`--rule pattern for ${event}:${property} is not a valid regex: ${error}`);
    }
    events[event] = { ...events[event], [property]: pattern };
  }
  return events;
}

/** The files `init --target swa` produces for a relay config. */
export function swaFiles(
  template: string,
  config: RelayOptions,
  dir: string,
  context: Required<Pick<CliContext, "version" | "now">>,
): ScaffoldFile[] {
  if (!template.includes(CONFIG_PLACEHOLDER)) throw new Error("The relay template is missing its config placeholder.");
  const banner = [
    `// Written by astro-plausible init (@sjohansson/astro-plausible ${context.version}) on ${context.now.toISOString().slice(0, 10)}.`,
    "// Forwards Plausible tracker events to Plausible so the tracker runs first party and is not dropped by ad blockers.",
    "// Do not edit: re-run the command to change the config or pick up a new package version.",
    "",
  ].join("\n");
  const code = template
    .replace(/^\/\/# sourceMappingURL=.*$/m, "")
    // A replacement function, so `$` sequences in the patterns are inserted as is.
    .replaceAll(CONFIG_PLACEHOLDER, () => JSON.stringify(config, null, 2))
    .trimEnd();

  const functionJson = {
    scriptFile: "index.mjs",
    entryPoint: "default",
    bindings: [
      { authLevel: "anonymous", type: "httpTrigger", direction: "in", name: "req", methods: ["post"] },
      { type: "http", direction: "out", name: "res" },
    ],
  };
  const packageJson = {
    name: "site-api",
    private: true,
    description: "Static Web Apps managed functions. No dependencies on purpose, so the deploy skips the API build.",
  };

  return [
    { path: join(dir, "event", "index.mjs"), content: `${banner}${code}\n`, keepExisting: false },
    {
      path: join(dir, "event", "function.json"),
      content: `${JSON.stringify(functionJson, null, 2)}\n`,
      keepExisting: false,
    },
    { path: join(dir, "host.json"), content: '{\n  "version": "2.0"\n}\n', keepExisting: true },
    { path: join(dir, "package.json"), content: `${JSON.stringify(packageJson, null, 2)}\n`, keepExisting: true },
  ];
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function packageVersion(): Promise<string> {
  try {
    const pkg = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
    return typeof pkg.version === "string" ? pkg.version : "unknown";
  } catch {
    return "unknown";
  }
}

export async function main(
  argv: string[],
  env: Record<string, string | undefined>,
  context: CliContext = {},
): Promise<number> {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      target: { type: "string" },
      domain: { type: "string", multiple: true },
      upstream: { type: "string" },
      dir: { type: "string" },
      rule: { type: "string", multiple: true },
      "max-body": { type: "string" },
      "dry-run": { type: "boolean" },
      help: { type: "boolean", short: "h" },
    },
  });

  if (values.help || positionals.length === 0) {
    process.stdout.write(HELP);
    return values.help ? 0 : 1;
  }
  if (positionals[0] !== "init") return fail(`Unknown command "${positionals[0]}". Only "init" exists.`);

  const target = values.target ?? "swa";
  if (target !== "swa") return fail(`Unknown target "${target}". Only "swa" exists.`);

  const domains = values.domain ?? (env["PLAUSIBLE_DOMAIN"] ? [env["PLAUSIBLE_DOMAIN"]] : []);
  if (domains.length === 0) return fail("No domain. Pass --domain or set PLAUSIBLE_DOMAIN.");

  const maxBodyLength = values["max-body"] === undefined ? undefined : Number(values["max-body"]);
  if (maxBodyLength !== undefined && !(Number.isInteger(maxBodyLength) && maxBodyLength > 0)) {
    return fail(`--max-body must be a positive whole number, got "${values["max-body"]}".`);
  }

  let events: Record<string, RelayRule>;
  try {
    events = parseRules(values.rule ?? []);
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error));
  }

  const config: RelayOptions = {
    domain: domains.length === 1 ? (domains[0] as string) : domains,
    ...(values.upstream ? { upstream: values.upstream } : {}),
    ...(maxBodyLength ? { maxBodyLength } : {}),
    ...(Object.keys(events).length > 0 ? { events } : {}),
  };

  const templateDir = context.templateDir ?? new URL("./templates/", import.meta.url);
  const template = await readFile(new URL("swa.mjs", templateDir), "utf8");
  const files = swaFiles(template, config, values.dir ?? "api", {
    version: context.version ?? (await packageVersion()),
    now: context.now ?? new Date(),
  });

  for (const file of files) {
    if (values["dry-run"]) {
      process.stdout.write(`--- ${file.path}\n${file.content}\n`);
      continue;
    }
    const present = await exists(file.path);
    if (present && file.keepExisting) {
      process.stdout.write(`kept     ${file.path}\n`);
      continue;
    }
    await mkdir(join(file.path, ".."), { recursive: true });
    await writeFile(file.path, file.content);
    process.stdout.write(`${present ? "updated" : "created"}  ${file.path}\n`);
  }
  return 0;
}

export function fail(message: string): number {
  process.stderr.write(`astro-plausible: ${message}\n`);
  return 1;
}
