import { describe, expect, it } from "vitest";
import { formatBuildTime, versionNoteHTML } from "../src/markup";

const BUILT = "2026-10-20T19:00:00.000Z";

function parse(html: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = html;
  return host;
}

describe("formatBuildTime", () => {
  it("formats in the given locale and time zone", () => {
    // 19:00 UTC on 20 October is 6am AEDT on 21 October.
    expect(formatBuildTime(BUILT, { locale: "en-AU", timeZone: "Australia/Sydney" })).toBe("21/10/2026, 6:00:00 am");
  });

  it("takes a Date", () => {
    expect(formatBuildTime(new Date(BUILT), { locale: "en-AU", timeZone: "UTC" })).toBe("20/10/2026, 7:00:00 pm");
  });

  it("returns anything that is not a date unchanged", () => {
    expect(formatBuildTime("yesterday")).toBe("yesterday");
  });
});

describe("versionNoteHTML", () => {
  it("renders the version, the build time, and a close button", () => {
    const host = parse(
      versionNoteHTML({ version: "f61f9f0", built: BUILT, locale: "en-AU", timeZone: "Australia/Sydney" }),
    );

    expect(host.querySelector("code")?.textContent).toBe("f61f9f0");
    expect(host.querySelector("time")?.getAttribute("datetime")).toBe(BUILT);
    expect(host.querySelector("time")?.textContent).toBe("21/10/2026, 6:00:00 am");
    expect([...host.querySelectorAll("dt")].map((dt) => dt.textContent)).toEqual(["version:", "built:"]);
    const close = host.querySelector("button[data-version-note-close]");
    expect(close?.getAttribute("type")).toBe("button");
    expect(close?.getAttribute("aria-label")).toBe("Close version info");
    expect(close?.textContent).toBe("×");
  });

  it("leaves the build row out without a build time", () => {
    const host = parse(versionNoteHTML({ version: "dev" }));
    expect(host.querySelectorAll("dt")).toHaveLength(1);
    expect(host.querySelector("time")).toBeNull();
  });

  it("uses custom labels and close button classes", () => {
    const host = parse(
      versionNoteHTML({
        version: "1.0.0",
        built: BUILT,
        versionLabel: "commit",
        builtLabel: "deployed",
        closeLabel: "Hide",
        closeText: "[x]",
        closeClass: "icon-button small",
      }),
    );
    expect([...host.querySelectorAll("dt")].map((dt) => dt.textContent)).toEqual(["commit", "deployed"]);
    const close = host.querySelector("button");
    expect(close?.className).toBe("version-note__close icon-button small");
    expect(close?.getAttribute("aria-label")).toBe("Hide");
    expect(close?.textContent).toBe("[x]");
  });

  it("takes HTML for the close button, ahead of the text", () => {
    const host = parse(versionNoteHTML({ version: "1", closeText: "x", closeHTML: '<svg aria-hidden="true"></svg>' }));
    expect(host.querySelector("button svg")).not.toBeNull();
    expect(host.querySelector("button")?.textContent).toBe("");
  });

  it("escapes everything it is given", () => {
    const html = versionNoteHTML({ version: "<b>x</b>", closeLabel: '"><script>', closeClass: '"onclick="x' });
    expect(html).not.toContain("<b>");
    expect(html).not.toContain("<script>");
    expect(html).not.toContain('"onclick');
  });
});
