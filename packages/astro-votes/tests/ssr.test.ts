// @vitest-environment node
import { describe, expect, it } from "vitest";

describe("server import", () => {
  it("loads without a DOM and renders markup", async () => {
    expect(typeof HTMLElement).toBe("undefined");
    const votes = await import("../src/index");
    expect(typeof votes.VoteButtonsElement).toBe("function");
    expect(votes.voteButtonsHTML({ up: 3, down: 1, state: null })).toContain('data-count="up">3<');
  });
});
