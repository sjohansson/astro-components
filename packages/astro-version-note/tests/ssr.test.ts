// @vitest-environment node
import { describe, expect, it } from "vitest";

describe("server import", () => {
  it("loads without a DOM and renders markup", async () => {
    expect(typeof HTMLElement).toBe("undefined");
    const note = await import("../src/index");
    expect(typeof note.VersionNoteElement).toBe("function");
    expect(note.versionNoteHTML({ version: "f61f9f0" })).toContain("f61f9f0");
  });
});
