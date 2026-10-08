import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  buildVoteData,
  fetchUmamiValues,
  fold,
  readVoteData,
  sameItems,
  UMAMI_ROW_LIMIT,
  type ValueRow,
  writeVoteData,
} from "../src/sync";

describe("sameItems", () => {
  it("compares counts regardless of key order", () => {
    const a = { x: { up: 1, down: 0 }, y: { up: 0, down: 2 } };
    expect(sameItems(a, { y: { up: 0, down: 2 }, x: { up: 1, down: 0 } })).toBe(true);
    expect(sameItems(a, { x: { up: 1, down: 0 } })).toBe(false);
    expect(sameItems(a, { x: { up: 2, down: 0 }, y: { up: 0, down: 2 } })).toBe(false);
  });
});

describe("fold", () => {
  it("subtracts undo ops and clamps at zero", () => {
    expect(
      fold([
        { value: "a:up", total: 5 },
        { value: "a:up-undo", total: 2 },
        { value: "a:down", total: 1 },
        { value: "b:down", total: 1 },
        { value: "b:down-undo", total: 3 },
      ]),
    ).toEqual({ a: { up: 3, down: 1 } });
  });

  it("sums rows for the same value from split windows", () => {
    expect(
      fold([
        { value: "a:up", total: 2 },
        { value: "a:up", total: 3 },
      ]),
    ).toEqual({ a: { up: 5, down: 0 } });
  });

  it("ignores values that are not votes and sorts items", () => {
    const items = fold([
      { value: "zeta:up", total: 1 },
      { value: "nonsense", total: 9 },
      { value: "alpha:down", total: 1 },
    ]);
    expect(Object.keys(items)).toEqual(["alpha", "zeta"]);
  });
});

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

const base = {
  apiUrl: "https://api.umami.is/v1/",
  apiKey: "key",
  websiteId: "site",
  startAt: 0,
  endAt: 1_000_000,
  requestGap: 0,
};

describe("fetchUmamiValues", () => {
  it("sends the right query and auth header", async () => {
    const fetch = vi.fn(async () => response([{ value: "a:up", total: "4" }]));
    const rows = await fetchUmamiValues({ ...base, fetch });
    expect(rows).toEqual([{ value: "a:up", total: 4 }]);

    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    const parsed = new URL(url);
    expect(parsed.pathname).toBe("/v1/websites/site/event-data/values");
    expect(Object.fromEntries(parsed.searchParams)).toEqual({
      startAt: "0",
      endAt: "1000000",
      eventName: "vote",
      propertyName: "vote",
    });
    expect((init.headers as Record<string, string>)["authorization"]).toBe("Bearer key");
  });

  it("splits a window that hits the row limit", async () => {
    const full: ValueRow[] = Array.from({ length: UMAMI_ROW_LIMIT }, (_, i) => ({ value: `p${i}:up`, total: 1 }));
    const fetch = vi.fn(async (url: string) => {
      const params = new URL(url).searchParams;
      const whole = params.get("startAt") === "0" && params.get("endAt") === "1000000";
      return response(whole ? full : full.slice(0, 50));
    });
    const rows = await fetchUmamiValues({ ...base, fetch });
    expect(fetch).toHaveBeenCalledTimes(3);
    const halves = fetch.mock.calls.slice(1).map(([u]) => new URL(u).searchParams);
    expect(halves.map((p) => [p.get("startAt"), p.get("endAt")])).toEqual([
      ["0", "500000"],
      ["500001", "1000000"],
    ]);
    expect(rows).toHaveLength(100);
  });

  it("fails loudly on errors and odd shapes", async () => {
    await expect(fetchUmamiValues({ ...base, fetch: async () => response({ error: "no" }, 401) })).rejects.toThrow(
      /401/,
    );
    await expect(fetchUmamiValues({ ...base, fetch: async () => response({ data: [] }) })).rejects.toThrow(
      /expected an array/,
    );
    await expect(fetchUmamiValues({ ...base, fetch: async () => response([{ value: 1 }]) })).rejects.toThrow(
      /Unexpected Umami row/,
    );
  });

  it("gives up on a tiny window that is still full", async () => {
    const full = Array.from({ length: UMAMI_ROW_LIMIT }, (_, i) => ({ value: `p${i}:up`, total: 1 }));
    await expect(fetchUmamiValues({ ...base, endAt: 30_000, fetch: async () => response(full) })).rejects.toThrow(
      /cannot split/,
    );
  });
});

describe("writeVoteData", () => {
  it("writes formatted JSON with a trailing newline", async () => {
    const dir = await mkdtemp(join(tmpdir(), "votes-"));
    try {
      const path = join(dir, "nested", "votes.json");
      await writeVoteData(path, buildVoteData({ a: { up: 1, down: 0 } }, new Date(SYNC)));
      const text = await readFile(path, "utf8");
      expect(text.endsWith("}\n")).toBe(true);
      expect(JSON.parse(text)).toEqual({ updated: SYNC, items: { a: { up: 1, down: 0 } } });
      expect(await readVoteData(path)).toEqual({ updated: SYNC, items: { a: { up: 1, down: 0 } } });
      expect(await readVoteData(join(dir, "missing.json"))).toBeNull();
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});

const SYNC = "2026-10-08T18:30:00.000Z";
