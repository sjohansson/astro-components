import { describe, expect, it } from "vitest";

describe("VersionNote", () => {
  it("should export VersionNoteElement class", async () => {
    const { VersionNoteElement } = await import("../src/index");
    expect(VersionNoteElement).toBeDefined();
    expect(typeof VersionNoteElement).toBe("function");
  });

  it("should export registerVersionNote function", async () => {
    const { registerVersionNote } = await import("../src/index");
    expect(typeof registerVersionNote).toBe("function");
  });

  it("should export from version-note entry point", async () => {
    const { VersionNoteElement, registerVersionNote } = await import("../src/version-note");
    expect(VersionNoteElement).toBeDefined();
    expect(typeof registerVersionNote).toBe("function");
  });

  it("should have observed attributes", async () => {
    const { VersionNoteElement } = await import("../src/version-note");
    expect(VersionNoteElement.observedAttributes).toEqual(["version", "type"]);
  });

  it("should have static styles", async () => {
    const { VersionNoteElement } = await import("../src/version-note");
    expect(typeof VersionNoteElement.styles).toBe("string");
    expect(VersionNoteElement.styles).toContain("version-note");
    expect(VersionNoteElement.styles).toContain("version-note--info");
    expect(VersionNoteElement.styles).toContain("version-note--warning");
    expect(VersionNoteElement.styles).toContain("version-note--success");
    expect(VersionNoteElement.styles).toContain("version-note--error");
  });
});
