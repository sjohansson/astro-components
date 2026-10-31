// @vitest-environment node
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { main, parseRules, swaFiles } from "../src/cli";
import type { SwaContext } from "../src/relay";

const WEBSITE_ID = "930ef364-ec51-4ca5-b5af-2b09ca6a0a21";
const VOTE_VALUE = "^[A-Za-z0-9._/-]{1,200}:(?:up|down)(?:-undo)?$";
const TEMPLATE =
  "const relay = createRelay(__ASTRO_UMAMI_RELAY_CONFIG__);\nexport { relay };\n//# sourceMappingURL=swa.mjs.map\n";

describe("parseRules", () => {
  it("groups properties by event", () => {
    expect(parseRules(["vote:vote=^x$", "vote:item=^y$", "signup:plan=^(free|pro)$"])).toEqual({
      vote: { vote: "^x$", item: "^y$" },
      signup: { plan: "^(free|pro)$" },
    });
  });

  it("rejects bad specs and bad patterns", () => {
    expect(() => parseRules(["vote"])).toThrow(/--rule/);
    expect(() => parseRules(["vote:vote=("])).toThrow(/not a valid regex/);
  });
});

describe("swaFiles", () => {
  it("inserts patterns containing $ as is", () => {
    const config = { websiteId: WEBSITE_ID, events: { vote: { vote: "^\\$$|$&|$'" } } };
    const code = swaFiles(TEMPLATE, config, "api", { version: "x", now: new Date() })[0]?.content ?? "";
    expect(code).toContain(JSON.stringify(config, null, 2));
  });

  it("bakes the config into the template and adds the function files", () => {
    const files = swaFiles(TEMPLATE, { websiteId: WEBSITE_ID }, "api", {
      version: "1.2.3",
      now: new Date("2026-10-31T12:00:00Z"),
    });

    expect(files.map((f) => [f.path, f.keepExisting])).toEqual([
      [join("api", "send", "index.mjs"), false],
      [join("api", "send", "function.json"), false],
      [join("api", "host.json"), true],
      [join("api", "package.json"), true],
    ]);
    const code = files[0]?.content ?? "";
    expect(code).toContain("@sjohansson/astro-umami 1.2.3) on 2026-10-31");
    expect(code).toContain(`createRelay({\n  "websiteId": "${WEBSITE_ID}"\n})`);
    expect(code).not.toContain("sourceMappingURL");
    expect(JSON.parse(files[1]?.content ?? "")).toMatchObject({ scriptFile: "index.mjs", entryPoint: "default" });
    expect(JSON.parse(files[3]?.content ?? "")).not.toHaveProperty("dependencies");
  });

  it("refuses a template without the placeholder", () => {
    expect(() =>
      swaFiles("export default 1;", { websiteId: WEBSITE_ID }, "api", { version: "x", now: new Date() }),
    ).toThrow(/placeholder/);
  });
});

describe("main", () => {
  let dir: string;
  let templateDir: string;
  let stdout: string;
  let stderr: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "astro-umami-"));
    templateDir = join(dir, "templates");
    await writeFile(join(dir, "placeholder"), "");
    await rm(join(dir, "placeholder"));
    await mkdtemp(join(dir, "t-")).then(async (t) => {
      templateDir = t;
      await writeFile(join(t, "swa.mjs"), TEMPLATE);
    });
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
    await mkdtemp(join(dir, "x-")); // unrelated dir, makes sure only api/ is touched
    await rm(join(dir, "api"), { recursive: true, force: true });
    await writeFile(join(dir, "host.json"), "");

    expect(
      await run([
        "init",
        "--target",
        "swa",
        "--dir",
        api,
        "--website-id",
        WEBSITE_ID,
        "--rule",
        `vote:vote=${VOTE_VALUE}`,
        "--upstream",
        "https://umami.example.com",
        "--max-body",
        "8192",
      ]),
    ).toBe(0);

    const code = await readFile(join(api, "send", "index.mjs"), "utf8");
    expect(code).toContain(`"websiteId": "${WEBSITE_ID}"`);
    expect(code).toContain('"upstream": "https://umami.example.com"');
    expect(code).toContain('"maxBodyLength": 8192');
    expect(code).toContain(`"vote": ${JSON.stringify(VOTE_VALUE)}`);
    expect(JSON.parse(await readFile(join(api, "host.json"), "utf8"))).toEqual({ version: "2.0" });
    expect(stdout).toMatch(/created\s+.*index\.mjs/);

    // Second run updates the function and keeps the rest.
    await writeFile(join(api, "package.json"), '{"name":"mine","private":true}\n');
    expect(await run(["init", "--dir", api, "--website-id", WEBSITE_ID])).toBe(0);
    expect(await readFile(join(api, "package.json"), "utf8")).toBe('{"name":"mine","private":true}\n');
    expect(await readFile(join(api, "send", "index.mjs"), "utf8")).not.toContain("umami.example.com");
    expect(stdout).toMatch(/updated\s+.*index\.mjs/);
    expect(stdout).toMatch(/kept\s+.*package\.json/);
  });

  it("takes the website id from the environment and supports --dry-run", async () => {
    expect(await run(["init", "--dir", join(dir, "api"), "--dry-run"], { UMAMI_WEBSITE_ID: WEBSITE_ID })).toBe(0);
    expect(stdout).toContain(`"websiteId": "${WEBSITE_ID}"`);
    await expect(readFile(join(dir, "api", "send", "index.mjs"))).rejects.toThrow();
  });

  it("explains bad usage", async () => {
    expect(await run([])).toBe(1);
    expect(stdout).toContain("Usage: astro-umami init");
    expect(await run(["--help"])).toBe(0);
    expect(await run(["init"])).toBe(1);
    expect(stderr).toContain("No website id");
    expect(await run(["init", "--website-id", WEBSITE_ID, "--target", "vercel"])).toBe(1);
    expect(stderr).toContain('Unknown target "vercel"');
    expect(await run(["init", "--website-id", WEBSITE_ID, "--rule", "bad"])).toBe(1);
    expect(stderr).toContain("--rule must look like");
    expect(await run(["init", "--website-id", WEBSITE_ID, "--max-body", "lots"])).toBe(1);
    expect(stderr).toContain("--max-body");
    expect(await run(["remove"])).toBe(1);
    expect(stderr).toContain('Unknown command "remove"');
  });

  it("stamps the installed package version when none is given", async () => {
    const { version } = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
    const argv = ["init", "--website-id", WEBSITE_ID, "--dry-run"];
    expect(await main(argv, {}, { templateDir: pathToFileURL(`${templateDir}/`) })).toBe(0);
    expect(stdout).toContain(`@sjohansson/astro-umami ${version})`);
  });
});

describe("swa template", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("builds a relay from the baked config and exports the handler as default", async () => {
    vi.stubGlobal("__ASTRO_UMAMI_RELAY_CONFIG__", { websiteId: WEBSITE_ID, events: { vote: { vote: VOTE_VALUE } } });
    const fetchMock = vi.fn().mockResolvedValue(new Response("ok", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const template = await import("../src/templates/swa");

    expect(template.relay.forward(JSON.stringify({ payload: { website: "other" } }), {})).toBeNull();
    const context: SwaContext = { log: { warn: vi.fn() } };
    await template.default(context, {
      rawBody: JSON.stringify({
        type: "event",
        payload: { website: WEBSITE_ID, name: "vote", data: { vote: "a:up" } },
      }),
      headers: {},
    });
    expect(context.res?.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
