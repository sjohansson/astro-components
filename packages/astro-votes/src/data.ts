/**
 * The vote data file written by `astro-votes-sync` and read by the site at
 * build time.
 */

export interface VoteCounts {
  up: number;
  down: number;
}

export interface VoteData {
  /** ISO time the counts were taken. Votes cast before it are already included. */
  updated: string | null;
  items: Record<string, VoteCounts>;
}

/** Attributes for `<vote-buttons>`, ready to spread onto the element. */
export interface VoteAttributes {
  item: string;
  up: number;
  down: number;
  "synced-at"?: string;
}

/** Counts for one item. Unknown items, or no data at all, give zero. */
export function countsFor(data: VoteData | null | undefined, item: string): VoteCounts {
  const counts = data?.items?.[item];
  return { up: toCount(counts?.up), down: toCount(counts?.down) };
}

/**
 * Element attributes for one item.
 *
 * @example
 * ```astro
 * <vote-buttons {...voteAttributes(votes, post.data.slug)}></vote-buttons>
 * ```
 */
export function voteAttributes(data: VoteData | null | undefined, item: string): VoteAttributes {
  const attrs: VoteAttributes = { item, ...countsFor(data, item) };
  if (data?.updated) attrs["synced-at"] = data.updated;
  return attrs;
}

function toCount(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}
