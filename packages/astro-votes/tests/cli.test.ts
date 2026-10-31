// @vitest-environment node
import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { main } from "../src/cli";

const NOW = new Date("2026-10-31T12:00:00.000Z");
const ROWS = [
  { value: "a:up", total: 3 },
  { value: "a:up-undo", total: 1 },
  { value: "b:down", total: 2 },
];

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

describe("main", () => {
  let dir: string;
  let out: string;
  let stdout: string;
  let stderr: string;
  let fetch: ReturnType<typeof vi.fn<typeof globalThis.fetch>>;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "astro-votes-"));
    out = join(dir, "data", "votes.json");
    stdout = "";
    stderr = "";
    fetch = vi.fn<typeof globalThis.fetch>(async () => response(ROWS));
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

  function run(argv: string[], env: Record<string, string> = { UMAMI_API_KEY: "key" }) {
    return main(argv, env, { fetch, now: NOW });
  }

  it("writes the folded totals, then leaves an unchanged file alone", async () => {
    expect(await run(["--website", "site", "--out", out])).toBe(0);
    const written = await readFile(out, "utf8");
    expect(JSON.parse(written)).toEqual({
      updated: NOW.toISOString(),
      items: { a: { up: 2, down: 0 }, b: { up: 0, down: 2 } },
    });
    expect(stdout).toContain(`Wrote votes for 2 item(s) to ${out}`);

    const before = (await stat(out)).mtimeMs;
    expect(await main(["--website", "site", "--out", out], { UMAMI_API_KEY: "key" }, { fetch })).toBe(0);
    expect(stdout).toContain("No vote changes");
    expect(await readFile(out, "utf8")).toBe(written);
    expect((await stat(out)).mtimeMs).toBe(before);
  });

  it("rewrites the file when the counts change", async () => {
    expect(await run(["--website", "site", "--out", out])).toBe(0);
    fetch.mockResolvedValue(response([{ value: "a:down", total: 1 }]));
    expect(await run(["--website", "site", "--out", out])).toBe(0);
    expect(JSON.parse(await readFile(out, "utf8")).items).toEqual({ a: { up: 0, down: 1 } });
    expect(stdout).toContain("Wrote votes for 1 item(s)");
  });

  it("reads the website and API from the environment and passes the options on", async () => {
    const env = { UMAMI_API_KEY: "key", UMAMI_WEBSITE_ID: "env-site", UMAMI_API_URL: "https://stats.example.com/api" };
    expect(await run(["--event", "rate", "--property", "pick", "--since", "2026-01-01", "--dry-run"], env)).toBe(0);

    const [url, init] = fetch.mock.calls[0] as [string, RequestInit];
    const parsed = new URL(url);
    expect(parsed.origin + parsed.pathname).toBe("https://stats.example.com/api/websites/env-site/event-data/values");
    expect(Object.fromEntries(parsed.searchParams)).toEqual({
      startAt: String(Date.parse("2026-01-01")),
      endAt: String(NOW.getTime()),
      eventName: "rate",
      propertyName: "pick",
    });
    expect((init.headers as Record<string, string>)["authorization"]).toBe("Bearer key");
  });

  it("prints the data on --dry-run without writing", async () => {
    expect(await run(["--website", "site", "--out", out, "--dry-run"])).toBe(0);
    expect(JSON.parse(stdout)).toMatchObject({ updated: NOW.toISOString(), items: { b: { up: 0, down: 2 } } });
    await expect(readFile(out)).rejects.toThrow();
  });

  it("explains bad usage without calling Umami", async () => {
    expect(await run(["--help"])).toBe(0);
    expect(stdout).toContain("Usage: astro-votes-sync");
    expect(await run(["--website", "site"], {})).toBe(1);
    expect(stderr).toContain("UMAMI_API_KEY is not set");
    expect(await run([])).toBe(1);
    expect(stderr).toContain("No website id");
    expect(await run(["--website", "site", "--since", "someday"])).toBe(1);
    expect(stderr).toContain("--since is not a date: someday");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("rejects when Umami fails, for the bin to report", async () => {
    fetch.mockResolvedValue(response({ error: "no" }, 401));
    await expect(run(["--website", "site", "--out", out])).rejects.toThrow(/401/);
  });
});
