import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { voteButtonsHTML } from "../src/markup";
import { configureVotes, type VoteSend } from "../src/transport";
import { registerVoteButtons, type VoteButtonsElement, type VoteChangeDetail } from "../src/vote-buttons";

const SYNCED = "2026-10-08T18:30:00.000Z";
const SYNCED_MS = Date.parse(SYNCED);

function mount(attrs: Record<string, string> = {}, inner = ""): VoteButtonsElement {
  const el = document.createElement("vote-buttons") as VoteButtonsElement;
  for (const [k, v] of Object.entries({ item: "my-post", up: "10", down: "2", ...attrs })) el.setAttribute(k, v);
  el.innerHTML = inner;
  document.body.appendChild(el);
  return el;
}

const button = (el: HTMLElement, side: "up" | "down") =>
  el.querySelector(`button[data-vote="${side}"]`) as HTMLButtonElement;
const count = (el: HTMLElement, side: "up" | "down") => el.querySelector(`[data-count="${side}"]`)?.textContent;

let sent: VoteSend[];

beforeAll(() => {
  registerVoteButtons();
});

beforeEach(() => {
  document.body.innerHTML = "";
  document.getElementById("vote-buttons-styles")?.remove();
  localStorage.clear();
  sent = [];
  configureVotes({ transport: (s) => sent.push(s), eventName: "vote" });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("<vote-buttons> rendering", () => {
  it("renders both buttons with the synced counts and injects styles once", () => {
    const el = mount();
    mount({ item: "other" });
    expect(count(el, "up")).toBe("10");
    expect(count(el, "down")).toBe("2");
    expect(button(el, "up").getAttribute("aria-pressed")).toBe("false");
    expect(document.querySelectorAll("#vote-buttons-styles")).toHaveLength(1);
  });

  it("adopts server-rendered markup instead of replacing it", () => {
    const el = mount({}, voteButtonsHTML({ up: 10, down: 2 }));
    const before = button(el, "up");
    button(el, "up").click();
    expect(button(el, "up")).toBe(before);
  });

  it("uses custom labels", () => {
    const el = mount({ "label-up": "Good", "label-down": "Bad", "group-label": "Rate it" });
    expect(button(el, "up").textContent).toContain("Good");
    expect(el.querySelector('[role="group"]')?.getAttribute("aria-label")).toBe("Rate it");
  });

  it("disables the buttons for an invalid item", () => {
    const el = mount({ item: "not valid!" });
    expect(button(el, "up").disabled).toBe(true);
    el.toggle("up");
    expect(sent).toHaveLength(0);
  });
});

describe("<vote-buttons> voting", () => {
  it("cycles none -> up -> down -> none with the right ops and counts", () => {
    const el = mount();
    const changes: VoteChangeDetail[] = [];
    document.addEventListener("vote-change", (e) => changes.push((e as CustomEvent<VoteChangeDetail>).detail));

    button(el, "up").click();
    expect([count(el, "up"), count(el, "down")]).toEqual(["11", "2"]);
    expect(button(el, "up").getAttribute("aria-pressed")).toBe("true");

    button(el, "down").click();
    expect([count(el, "up"), count(el, "down")]).toEqual(["10", "3"]);

    button(el, "down").click();
    expect([count(el, "up"), count(el, "down")]).toEqual(["10", "2"]);
    expect(el.state).toBeNull();

    expect(sent.map((s) => s.value)).toEqual(["my-post:up", "my-post:up-undo", "my-post:down", "my-post:down-undo"]);
    expect(changes.map((c) => c.to)).toEqual(["up", "down", null]);
  });

  it("uses the element's event name over the page default", () => {
    const el = mount({ "event-name": "rating" });
    button(el, "up").click();
    expect(sent[0]?.eventName).toBe("rating");
  });

  it("remembers the vote across reloads", () => {
    button(mount(), "up").click();
    document.body.innerHTML = "";
    const again = mount();
    expect(again.state).toBe("up");
    expect(count(again, "up")).toBe("11");
  });

  it("does not add the vote again once a sync has counted it", () => {
    vi.useFakeTimers();
    vi.setSystemTime(SYNCED_MS - 60_000);
    button(mount(), "up").click();
    document.body.innerHTML = "";

    // The next build has the vote in its counts.
    const synced = mount({ up: "11", "synced-at": SYNCED });
    expect(synced.state).toBe("up");
    expect(count(synced, "up")).toBe("11");

    // Undoing it after the sync takes it off the synced count.
    vi.setSystemTime(SYNCED_MS + 60_000);
    button(synced, "up").click();
    expect(count(synced, "up")).toBe("10");
  });

  it("keeps counting a vote made after the last sync", () => {
    vi.useFakeTimers();
    vi.setSystemTime(SYNCED_MS + 60_000);
    button(mount({ "synced-at": SYNCED }), "down").click();
    document.body.innerHTML = "";
    expect(count(mount({ "synced-at": SYNCED }), "down")).toBe("3");
  });

  it("still works when storage throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    const el = mount();
    button(el, "up").click();
    expect(count(el, "up")).toBe("11");
    expect(sent).toHaveLength(1);
  });

  it("survives a transport that throws", () => {
    configureVotes({
      transport: () => {
        throw new Error("offline");
      },
    });
    const el = mount();
    expect(() => button(el, "up").click()).not.toThrow();
    expect(el.state).toBe("up");
  });

  it("is a no-op with the umami transport when the tracker is missing", () => {
    configureVotes({ transport: "umami" });
    const el = mount();
    expect(() => button(el, "up").click()).not.toThrow();
  });

  it("calls umami.track when the tracker is present", () => {
    const track = vi.fn();
    (globalThis as { umami?: unknown }).umami = { track };
    configureVotes({ transport: "umami" });
    button(mount(), "down").click();
    expect(track).toHaveBeenCalledWith("vote", { vote: "my-post:down" });
    delete (globalThis as { umami?: unknown }).umami;
  });
});

describe("<vote-buttons> lifecycle", () => {
  it("re-adds styles after a view transition swap", () => {
    mount();
    document.getElementById("vote-buttons-styles")?.remove();
    document.dispatchEvent(new Event("astro:after-swap"));
    expect(document.getElementById("vote-buttons-styles")).not.toBeNull();
  });

  it("stops listening when removed", () => {
    const el = mount();
    el.remove();
    document.getElementById("vote-buttons-styles")?.remove();
    document.dispatchEvent(new Event("astro:after-swap"));
    expect(document.getElementById("vote-buttons-styles")).toBeNull();
  });
});
