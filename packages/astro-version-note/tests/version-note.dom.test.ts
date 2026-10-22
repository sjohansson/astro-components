import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { versionNoteHTML } from "../src/markup";
import { registerVersionNote, type VersionNoteElement, type VersionNoteToggleDetail } from "../src/version-note";

const BUILT = "2026-10-20T19:00:00.000Z";

function mount(attrs: Record<string, string> = {}, inner = ""): VersionNoteElement {
  const el = document.createElement("version-note") as VersionNoteElement;
  for (const [k, v] of Object.entries({ id: "site-version", version: "f61f9f0", ...attrs })) el.setAttribute(k, v);
  el.innerHTML = inner;
  document.body.appendChild(el);
  return el;
}

function addToggle(controls = "site-version"): HTMLButtonElement {
  const button = document.createElement("button");
  button.setAttribute("aria-controls", controls);
  button.textContent = "Version";
  document.body.prepend(button);
  return button;
}

const closeButton = (el: HTMLElement) => el.querySelector("[data-version-note-close]") as HTMLButtonElement;

beforeAll(() => {
  registerVersionNote();
});

beforeEach(() => {
  document.body.innerHTML = "";
  document.getElementById("version-note-styles")?.remove();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("<version-note> registration", () => {
  it("defines the element once", () => {
    registerVersionNote();
    expect(customElements.get("version-note")).toBeDefined();
  });
});

describe("<version-note> rendering", () => {
  it("renders from attributes and injects styles once", () => {
    const el = mount({ built: BUILT, locale: "en-AU", "time-zone": "Australia/Sydney" });
    mount({ id: "other" });

    expect(el.querySelector("code")?.textContent).toBe("f61f9f0");
    expect(el.querySelector("time")?.textContent).toBe("21/10/2026, 6:00:00 am");
    expect(document.querySelectorAll("#version-note-styles")).toHaveLength(1);
  });

  it("adopts server-rendered markup instead of replacing it", () => {
    const el = mount({}, versionNoteHTML({ version: "abc1234", closeText: "[x]" }));
    expect(el.querySelector("code")?.textContent).toBe("abc1234");
    expect(closeButton(el).textContent).toBe("[x]");
  });

  it("re-renders when a markup attribute changes", () => {
    const el = mount();
    el.setAttribute("version", "1234567");
    el.setAttribute("close-class", "icon-button");
    expect(el.querySelector("code")?.textContent).toBe("1234567");
    expect(closeButton(el).classList.contains("icon-button")).toBe(true);
    expect(el.querySelectorAll(".version-note")).toHaveLength(1);
  });

  it("starts collapsed", () => {
    expect(mount().open).toBe(false);
  });

  it("leaves styles alone when registered with injectStyles off", () => {
    registerVersionNote({ injectStyles: false });
    try {
      mount();
      expect(document.getElementById("version-note-styles")).toBeNull();
    } finally {
      registerVersionNote();
    }
  });

  it("puts the styles back after a view transition drops them", () => {
    mount();
    document.getElementById("version-note-styles")?.remove();
    document.dispatchEvent(new Event("astro:after-swap"));
    expect(document.getElementById("version-note-styles")).not.toBeNull();
  });
});

describe("<version-note> toggling", () => {
  it("opens from a button that controls it and marks the button expanded", () => {
    const toggle = addToggle();
    const el = mount();
    expect(toggle.getAttribute("aria-expanded")).toBe("false");

    toggle.click();

    expect(el.open).toBe(true);
    expect(el.hasAttribute("open")).toBe(true);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
  });

  it("closes from its close button", () => {
    const toggle = addToggle();
    const el = mount();
    toggle.click();

    closeButton(el).click();

    expect(el.open).toBe(false);
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
  });

  it("finds its id among several in aria-controls", () => {
    const toggle = addToggle("menu site-version");
    const el = mount();
    toggle.click();
    expect(el.open).toBe(true);
  });

  it("ignores buttons that control something else", () => {
    const other = addToggle("menu");
    const el = mount();
    other.click();
    expect(el.open).toBe(false);
    expect(other.hasAttribute("aria-expanded")).toBe(false);
  });

  it("moves focus to the close button and back", () => {
    const toggle = addToggle();
    const el = mount();
    toggle.focus();

    toggle.click();
    expect(document.activeElement).toBe(closeButton(el));

    closeButton(el).click();
    expect(document.activeElement).toBe(toggle);
  });

  it("scrolls to the bottom on open only when asked", () => {
    const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    const toggle = addToggle();
    const el = mount();

    toggle.click();
    expect(scrollTo).not.toHaveBeenCalled();

    el.hide();
    el.setAttribute("scroll-to-bottom", "");
    toggle.click();
    expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ behavior: "smooth" }));
  });

  it("announces each change with version-note-toggle", () => {
    const el = mount();
    const seen: boolean[] = [];
    document.addEventListener("version-note-toggle", (event) => {
      seen.push((event as CustomEvent<VersionNoteToggleDetail>).detail.open);
    });

    el.show();
    el.toggle();
    el.open = true;

    expect(seen).toEqual([true, false, true]);
  });

  it("stops listening once removed", () => {
    const toggle = addToggle();
    const el = mount();
    el.remove();
    toggle.click();
    expect(el.open).toBe(false);
  });
});
