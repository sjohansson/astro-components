import { describe, expect, it } from "vitest";

describe("package exports", () => {
  it("exports the element, register function, and markup helpers", async () => {
    const mod = await import("../src/index");
    expect(typeof mod.VersionNoteElement).toBe("function");
    expect(typeof mod.registerVersionNote).toBe("function");
    expect(typeof mod.versionNoteHTML).toBe("function");
    expect(typeof mod.formatBuildTime).toBe("function");
    expect(mod.DEFAULT_LABELS.close).toBe("Close version info");
  });

  it("observes open and every markup attribute", async () => {
    const { VersionNoteElement } = await import("../src/version-note");
    expect(VersionNoteElement.observedAttributes).toEqual([
      "open",
      "version",
      "built",
      "locale",
      "time-zone",
      "version-label",
      "built-label",
      "close-label",
      "close-text",
      "close-class",
    ]);
  });

  it("keeps its styles behind :where so site styles win", async () => {
    const { VersionNoteElement } = await import("../src/version-note");
    expect(VersionNoteElement.styles).toContain(":where(version-note[open])");
    expect(VersionNoteElement.styles).toContain("prefers-reduced-motion");
  });
});
