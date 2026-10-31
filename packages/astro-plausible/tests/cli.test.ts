import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { main, parseRules, swaFiles } from "../src/cli";

const DOMAIN = "example.com";
const VOTE_VALUE = "^[A-Za-z0-9._/-]{1,200}:(?:up|down)(?:-undo)?$";
const TEMPLATE =
  "const relay = createRelay(__ASTRO_PLAUSIBLE_RELAY_CONFIG__);\nexport { relay };\n//# sourceMappingURL=swa.mjs.map\n";

describe("parseRules", () => {
  it("groups properties by event and rejects bad specs", () => {
    expect(parseRules(["vote:vote=^x$", "vote:item=^y$"])).toEqual({ vote: { vote: "^x$", item: "^y$" } });
    expect(() => parseRules(["vote"])).toThrow(/--rule/);
    expect(() => parseRules(["vote:vote=("])).toThrow(/not a valid regex/);
  });
});

describe("swaFiles", () => {
  it("bakes the config into the template and adds the function files", () => {
    const files = swaFiles(TEMPLATE, { domain: DOMAIN }, "api", {
      version: "1.2.3",
      now: new Date("2026-10-31T12:00:00Z"),
    });

    expect(files.map((f) => [f.path, f.keepExisting])).toEqual([
      [join("api", "event", "index.mjs"), false],
      [join("api", "event", "function.json"), false],
      [join("api", "host.json"), true],
      [join("api", "package.json"), true],
    ]);
    const code = files[0]?.content ?? "";
    expect(code).toContain("@sjohansson/astro-plausible 1.2.3) on 2026-10-31");
    expect(code).toContain(`createRelay({\n  "domain": "${DOMAIN}"\n})`);
    expect(code).not.toContain("sourceMappingURL");
    expect(JSON.parse(files[1]?.content ?? "")).toMatchObject({ scriptFile: "index.mjs", entryPoint: "default" });
    expect(() => swaFiles("export default 1;", { domain: DOMAIN }, "api", { version: "x", now: new Date() })).toThrow(
      /placeholder/,
    );
  });
});

describe("main", () => {
  let dir: string;
  let templateDir: string;
  let stdout: string;
  let stderr: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "astro-plausible-"));
    templateDir = await mkdtemp(join(dir, "t-"));
    await writeFile(join(templateDir, "swa.mjs"), TEMPLATE);
    stdout = "";
    stderr = "";
    vi.spyOn(process.stdout, "write").mockImplementation((chunk) => {
      stdout += String(chunk);
      return true;
    });
    vi.spyOn(process.stderr, "write").mockImplementation((chunk) => {
      stderr += String(chunk);
      return true;
    });
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await rm(dir, { recursive: true, force: true });
  });

  function run(argv: string[], env: Record<string, string> = {}) {
    return main(argv, env, { templateDir: pathToFileURL(`${templateDir}/`), version: "1.2.3" });
  }

  it("writes the function and keeps an existing host.json and package.json", async () => {
    const api = join(dir, "api");
    const argv = [
      "init",
      "--dir",
      api,
      "--domain",
      DOMAIN,
      "--domain",
      "second.example",
      "--rule",
      `vote:vote=${VOTE_VALUE}`,
    ];
    expect(await run([...argv, "--upstream", "https://plausible.example.com", "--max-body", "8192"])).toBe(0);

    const code = await readFile(join(api, "event", "index.mjs"), "utf8");
    expect(code).toContain(`"domain": [\n    "${DOMAIN}",\n    "second.example"\n  ]`);
    expect(code).toContain('"upstream": "https://plausible.example.com"');
    expect(code).toContain('"maxBodyLength": 8192');
    expect(code).toContain(`"vote": ${JSON.stringify(VOTE_VALUE)}`);
    expect(JSON.parse(await readFile(join(api, "host.json"), "utf8"))).toEqual({ version: "2.0" });
    expect(stdout).toMatch(/created\s+.*index\.mjs/);

    await writeFile(join(api, "package.json"), '{"name":"mine","private":true}\n');
    expect(await run(["init", "--dir", api, "--domain", DOMAIN])).toBe(0);
    expect(await readFile(join(api, "package.json"), "utf8")).toBe('{"name":"mine","private":true}\n');
    expect(await readFile(join(api, "event", "index.mjs"), "utf8")).not.toContain("plausible.example.com");
    expect(stdout).toMatch(/updated\s+.*index\.mjs/);
    expect(stdout).toMatch(/kept\s+.*package\.json/);
  });

  it("takes the domain from the environment and supports --dry-run", async () => {
    expect(await run(["init", "--dir", join(dir, "api"), "--dry-run"], { PLAUSIBLE_DOMAIN: DOMAIN })).toBe(0);
    expect(stdout).toContain(`"domain": "${DOMAIN}"`);
    await expect(readFile(join(dir, "api", "event", "index.mjs"))).rejects.toThrow();
  });

  it("explains bad usage", async () => {
    expect(await run([])).toBe(1);
    expect(stdout).toContain("Usage: astro-plausible init");
    expect(await run(["--help"])).toBe(0);
    expect(await run(["init"])).toBe(1);
    expect(stderr).toContain("No domain");
    expect(await run(["init", "--domain", DOMAIN, "--target", "vercel"])).toBe(1);
    expect(stderr).toContain('Unknown target "vercel"');
    expect(await run(["init", "--domain", DOMAIN, "--rule", "bad"])).toBe(1);
    expect(await run(["init", "--domain", DOMAIN, "--max-body", "lots"])).toBe(1);
    expect(await run(["remove"])).toBe(1);
  });
});

describe("swa template", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("builds a relay from the baked config and exports the handler as default", async () => {
    vi.stubGlobal("__ASTRO_PLAUSIBLE_RELAY_CONFIG__", { domain: DOMAIN, events: { vote: { vote: VOTE_VALUE } } });
    const fetchMock = vi.fn().mockResolvedValue(new Response("ok", { status: 202 }));
    vi.stubGlobal("fetch", fetchMock);
    const template = await import("../src/templates/swa");

    expect(template.relay.forward(JSON.stringify({ n: "pageview", d: "other.example" }), {})).toBeNull();
    // biome-ignore lint/suspicious/noExplicitAny: partial Functions context
    const context: Record<string, any> = { log: { warn: vi.fn() } };
    await template.default(context, {
      rawBody: JSON.stringify({ n: "vote", d: DOMAIN, p: { vote: "a:up" } }),
      headers: {},
    });
    expect(context.res.status).toBe(202);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
