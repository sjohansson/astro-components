/**
 * Node-only helpers that turn analytics events into the vote data file.
 * Used by the `astro-votes-sync` CLI, exported for custom pipelines.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { VoteCounts, VoteData } from "./data";
import { DEFAULT_EVENT_NAME, DEFAULT_PROPERTY_NAME, parseVote, type VoteOp } from "./wire";

/** One row from Umami's event-data values endpoint. */
export interface ValueRow {
  value: string;
  total: number;
}

/** Umami returns at most this many rows per values query. */
export const UMAMI_ROW_LIMIT = 100;

/** Smallest window worth splitting. A window this short that still fills the limit is an error. */
const MIN_WINDOW_MS = 60_000;

/** Stays under Umami Cloud's 50 calls per 15 seconds per key. */
const REQUEST_GAP_MS = 350;

/** Adds up rows into per-item counts. Rows that are not vote values are ignored. */
export function fold(rows: Iterable<ValueRow>): Record<string, VoteCounts> {
  const tallies = new Map<string, Record<VoteOp, number>>();
  for (const row of rows) {
    const vote = parseVote(row.value);
    if (!vote) continue;
    let tally = tallies.get(vote.item);
    if (!tally) {
      tally = { up: 0, "up-undo": 0, down: 0, "down-undo": 0 };
      tallies.set(vote.item, tally);
    }
    tally[vote.op] += row.total;
  }

  const items: Record<string, VoteCounts> = {};
  for (const item of [...tallies.keys()].sort()) {
    const t = tallies.get(item) as Record<VoteOp, number>;
    const up = Math.max(0, t.up - t["up-undo"]);
    const down = Math.max(0, t.down - t["down-undo"]);
    if (up > 0 || down > 0) items[item] = { up, down };
  }
  return items;
}

/** Builds the data file contents. */
export function buildVoteData(items: Record<string, VoteCounts>, updated: Date): VoteData {
  return { updated: updated.toISOString(), items };
}

/** Reads an existing data file, or null when it is missing or not vote data. */
export async function readVoteData(path: string): Promise<VoteData | null> {
  try {
    const data = JSON.parse(await readFile(path, "utf8")) as Partial<VoteData>;
    return data && typeof data.items === "object" && data.items !== null
      ? { updated: data.updated ?? null, items: data.items }
      : null;
  } catch {
    return null;
  }
}

/** True when both sets of counts match, ignoring key order. */
export function sameItems(a: Record<string, VoteCounts>, b: Record<string, VoteCounts>): boolean {
  const keys = Object.keys(a);
  if (keys.length !== Object.keys(b).length) return false;
  return keys.every((key) => a[key]?.up === b[key]?.up && a[key]?.down === b[key]?.down);
}

/** Writes the data file with a trailing newline, creating folders as needed. */
export async function writeVoteData(path: string, data: VoteData): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function parseRows(body: unknown): ValueRow[] {
  if (!Array.isArray(body)) {
    throw new Error(`Unexpected Umami response, expected an array: ${JSON.stringify(body).slice(0, 200)}`);
  }
  return body.map((row: unknown) => {
    const { value, total } = (row ?? {}) as { value?: unknown; total?: unknown };
    const count = Number(total);
    if (typeof value !== "string" || !Number.isFinite(count)) {
      throw new Error(`Unexpected Umami row: ${JSON.stringify(row).slice(0, 200)}`);
    }
    return { value, total: count };
  });
}

export interface UmamiFetchOptions {
  /** API base, `https://api.umami.is/v1` for Umami Cloud or `https://<host>/api` when self-hosted. */
  apiUrl: string;
  /** Umami Cloud API key, or a self-hosted bearer token. */
  apiKey: string;
  websiteId: string;
  eventName?: string;
  propertyName?: string;
  startAt: number;
  endAt: number;
  fetch?: typeof globalThis.fetch;
  /** Pause between requests in ms. */
  requestGap?: number;
}

/**
 * Fetches every vote value between `startAt` and `endAt`. Umami caps a values
 * query at 100 rows, so a full window is split in half until each part fits.
 */
export async function fetchUmamiValues(options: UmamiFetchOptions): Promise<ValueRow[]> {
  const doFetch = options.fetch ?? globalThis.fetch;
  const gap = options.requestGap ?? REQUEST_GAP_MS;
  const base = options.apiUrl.replace(/\/+$/, "");
  const eventName = options.eventName ?? DEFAULT_EVENT_NAME;
  const propertyName = options.propertyName ?? DEFAULT_PROPERTY_NAME;
  let first = true;

  const query = async (startAt: number, endAt: number): Promise<ValueRow[]> => {
    if (!first && gap > 0) await new Promise((resolve) => setTimeout(resolve, gap));
    first = false;

    const params = new URLSearchParams({
      startAt: String(startAt),
      endAt: String(endAt),
      eventName,
      propertyName,
    });
    const url = `${base}/websites/${encodeURIComponent(options.websiteId)}/event-data/values?${params}`;
    const res = await doFetch(url, {
      headers: { accept: "application/json", authorization: `Bearer ${options.apiKey}` },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Umami request failed with ${res.status}: ${text.slice(0, 200)}`);
    }
    return parseRows(await res.json());
  };

  const collect = async (startAt: number, endAt: number): Promise<ValueRow[]> => {
    const rows = await query(startAt, endAt);
    if (rows.length < UMAMI_ROW_LIMIT) return rows;
    if (endAt - startAt <= MIN_WINDOW_MS) {
      throw new Error(`More than ${UMAMI_ROW_LIMIT} vote values inside one minute, cannot split further.`);
    }
    const mid = Math.floor((startAt + endAt) / 2);
    // Umami's range is inclusive at both ends, so the halves must not share a millisecond.
    return [...(await collect(startAt, mid)), ...(await collect(mid + 1, endAt))];
  };

  return collect(options.startAt, options.endAt);
}
