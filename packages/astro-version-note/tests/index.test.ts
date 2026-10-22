import { describe, expect, it } from "vitest";

describe("package exports", () => {
  it("exports the element, register function, and markup helpers", async () => {
    const mod = await import("../src/index");
    expect(typeof mod.VersionNoteElement).toBe("function");
    expect(typeof mod.registerVersionNote).toBe("function");
    expect(typeof mod.versionNoteHTML).toBe("function");
    expect(typeof mod.formatBuildTime).toBe("function");
    expect(mod.VERSION_NOTE_STYLES).toBe(mod.VersionNoteElement.styles);
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

  it("keeps its styles in a layer and behind :where so site styles win", async () => {
    const { VERSION_NOTE_STYLES } = await import("../src/styles");
    expect(VERSION_NOTE_STYLES.trim().startsWith("@layer version-note {")).toBe(true);
    expect(VERSION_NOTE_STYLES).toContain(":where(version-note[open])");
  });

  it("drives every transition from the duration properties, which reduced motion zeroes", async () => {
    const { VERSION_NOTE_STYLES } = await import("../src/styles");
    const reduced = VERSION_NOTE_STYLES.slice(VERSION_NOTE_STYLES.indexOf("prefers-reduced-motion"));
    expect(reduced).toMatch(/--version-note-duration: 0s;\s*--version-note-line-duration: 0s;/);
    for (const [, value] of VERSION_NOTE_STYLES.matchAll(/transition:([^;]+);/g)) {
      // A literal 0s (no wait) is fine. Any real duration must come from a property.
      expect(value.replaceAll(/\b0s\b/g, "")).not.toMatch(/\d+m?s/);
    }
  });
});
