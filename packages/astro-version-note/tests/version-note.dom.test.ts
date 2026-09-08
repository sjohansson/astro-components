import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { registerVersionNote, VersionNoteElement } from "../src/version-note";

/**
 * DOM behavior tests for <version-note>. The shared vitest environment is
 * happy-dom (configured at the repo root), so document and customElements are
 * available.
 */

function mount(attrs: Record<string, string> = {}): HTMLElement {
  const el = document.createElement("version-note");
  for (const [k, v] of Object.entries(attrs)) {
    el.setAttribute(k, v);
  }
  document.body.appendChild(el);
  return el;
}

const noteDiv = (el: HTMLElement): HTMLElement => el.querySelector(".version-note") as HTMLElement;

beforeAll(() => {
  registerVersionNote();
});

beforeEach(() => {
  document.body.innerHTML = "";
  document.getElementById("version-note-styles")?.remove();
});

describe("<version-note> registration", () => {
  it("defines the custom element", () => {
    expect(customElements.get("version-note")).toBe(VersionNoteElement);
  });

  it("is idempotent — a second register call does not throw or redefine", () => {
    expect(() => {
      registerVersionNote();
    }).not.toThrow();
    expect(customElements.get("version-note")).toBe(VersionNoteElement);
  });
});

describe("<version-note> rendering", () => {
  it("renders a note with the version label and a note role", () => {
    const el = mount({ version: "v1.2.3" });
    const note = noteDiv(el);
    expect(note).not.toBeNull();
    expect(note.getAttribute("role")).toBe("note");
    expect(el.querySelector(".version-note__label")?.textContent).toBe("Version v1.2.3");
  });

  it("defaults to the info type when no type attribute is given", () => {
    const el = mount({ version: "v1.0.0" });
    expect(noteDiv(el).classList.contains("version-note--info")).toBe(true);
  });

  it.each(["info", "warning", "success", "error"])("applies the %s type modifier class", (type) => {
    const el = mount({ version: "v1.0.0", type });
    expect(noteDiv(el).classList.contains(`version-note--${type}`)).toBe(true);
  });

  it("renders an empty version label when the version attribute is absent", () => {
    const el = mount();
    expect(el.querySelector(".version-note__label")?.textContent).toBe("Version ");
  });

  it("renders a content area for the note body", () => {
    const el = mount({ version: "v1.0.0" });
    expect(el.querySelector(".version-note__content")).not.toBeNull();
  });
});

describe("<version-note> style injection", () => {
  it("injects the stylesheet once", () => {
    mount({ version: "v1.0.0" });
    const style = document.getElementById("version-note-styles");
    expect(style).not.toBeNull();
    expect(style?.textContent).toBe(VersionNoteElement.styles);

    mount({ version: "v2.0.0" });
    expect(document.querySelectorAll("#version-note-styles")).toHaveLength(1);
  });
});

describe("<version-note> attribute changes", () => {
  it("re-renders when the version attribute changes while connected", () => {
    const el = mount({ version: "v1.0.0" });
    el.setAttribute("version", "v2.0.0");
    expect(el.querySelector(".version-note__label")?.textContent).toBe("Version v2.0.0");
  });

  it("re-renders when the type attribute changes while connected", () => {
    const el = mount({ version: "v1.0.0", type: "info" });
    el.setAttribute("type", "error");
    const note = noteDiv(el);
    expect(note.classList.contains("version-note--error")).toBe(true);
    expect(note.classList.contains("version-note--info")).toBe(false);
  });

  it("does not render while disconnected, then renders on connect", () => {
    const el = document.createElement("version-note");
    el.setAttribute("version", "v3.0.0");
    expect(el.innerHTML).toBe("");

    document.body.appendChild(el);
    expect(el.querySelector(".version-note__label")?.textContent).toBe("Version v3.0.0");
  });
});
