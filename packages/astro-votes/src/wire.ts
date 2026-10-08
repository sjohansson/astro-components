/**
 * The vote wire format. Every vote change is sent as one or more analytics
 * events whose single property value is `<item>:<op>`. Keeping it to one
 * property means one query returns the counts for every item.
 */

/** A visitor's current vote on an item. */
export type VoteState = "up" | "down" | null;

/** One change sent to the analytics provider. Undo ops cancel an earlier vote. */
export type VoteOp = "up" | "up-undo" | "down" | "down-undo";

export const VOTE_OPS: readonly VoteOp[] = ["up", "up-undo", "down", "down-undo"];

/** Default analytics event name. */
export const DEFAULT_EVENT_NAME = "vote";

/** Default analytics event property that carries `<item>:<op>`. */
export const DEFAULT_PROPERTY_NAME = "vote";

/** Allowed item ids: a slug or a path. */
export const ITEM_PATTERN: RegExp = /^[A-Za-z0-9._/-]{1,200}$/;

/** A full wire value. Use this to validate events in a relay or proxy. */
export const VOTE_VALUE_PATTERN: RegExp = /^[A-Za-z0-9._/-]{1,200}:(?:up|down)(?:-undo)?$/;

export function isValidItem(item: string): boolean {
  return ITEM_PATTERN.test(item);
}

export function encodeVote(item: string, op: VoteOp): string {
  return `${item}:${op}`;
}

export function parseVote(value: string): { item: string; op: VoteOp } | null {
  if (!VOTE_VALUE_PATTERN.test(value)) return null;
  const at = value.lastIndexOf(":");
  return { item: value.slice(0, at), op: value.slice(at + 1) as VoteOp };
}

/** The ops that move a visitor from one vote to another, in send order. */
export function opsForChange(from: VoteState, to: VoteState): VoteOp[] {
  if (from === to) return [];
  const ops: VoteOp[] = [];
  if (from) ops.push(`${from}-undo`);
  if (to) ops.push(to);
  return ops;
}
