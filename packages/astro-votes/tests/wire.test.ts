import { describe, expect, it } from "vitest";
import { countsFor, voteAttributes } from "../src/data";
import { encodeVote, isValidItem, opsForChange, parseVote, VOTE_VALUE_PATTERN } from "../src/wire";

describe("wire format", () => {
  it("round-trips item and op, including path items", () => {
    expect(parseVote(encodeVote("posts/my-post", "up-undo"))).toEqual({ item: "posts/my-post", op: "up-undo" });
  });

  it("rejects values outside the format", () => {
    for (const bad of ["my-post", "my-post:sideways", ":up", "a b:up", `${"x".repeat(201)}:up`, "x:up:down"]) {
      expect(parseVote(bad)).toBeNull();
      expect(VOTE_VALUE_PATTERN.test(bad)).toBe(false);
    }
  });

  it("validates items", () => {
    expect(isValidItem("2026-10-08-four-agents")).toBe(true);
    expect(isValidItem("")).toBe(false);
    expect(isValidItem("<script>")).toBe(false);
  });

  it.each([
    [null, "up", ["up"]],
    ["up", null, ["up-undo"]],
    ["up", "down", ["up-undo", "down"]],
    ["down", "up", ["down-undo", "up"]],
    ["down", "down", []],
  ] as const)("ops from %s to %s", (from, to, ops) => {
    expect(opsForChange(from, to)).toEqual(ops);
  });
});

describe("data helpers", () => {
  const data = { updated: "2026-10-08T18:30:00.000Z", items: { a: { up: 3, down: 1 } } };

  it("reads counts and defaults to zero", () => {
    expect(countsFor(data, "a")).toEqual({ up: 3, down: 1 });
    expect(countsFor(data, "missing")).toEqual({ up: 0, down: 0 });
    expect(countsFor(undefined, "a")).toEqual({ up: 0, down: 0 });
  });

  it("ignores junk counts", () => {
    // biome-ignore lint/suspicious/noExplicitAny: deliberately malformed data
    expect(countsFor({ updated: null, items: { a: { up: -2, down: "7" as any } } }, "a")).toEqual({ up: 0, down: 0 });
  });

  it("builds element attributes with synced-at only when known", () => {
    expect(voteAttributes(data, "a")).toEqual({ item: "a", up: 3, down: 1, "synced-at": data.updated });
    expect(voteAttributes({ updated: null, items: {} }, "a")).toEqual({ item: "a", up: 0, down: 0 });
  });
});
