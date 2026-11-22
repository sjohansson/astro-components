/**
 * Regression tests for the vendored tracker's `data-umami-event` click listener. A tracker update can change when a
 * tracked link navigates, what event data it sends, and which clicks it blocks, so those are pinned here.
 *
 * One tracker runs for the whole file (it installs its listener once per window). Each test swaps the hook on the
 * `window.umamiConfig` object the tracker reads `beforeSend` from on every event.
 */
import { afterEach, beforeAll, beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import { startUmami } from "../src/client";

const WEBSITE_ID = "930ef364-ec51-4ca5-b5af-2b09ca6a0a21";

type Hook = (type: string, payload: Record<string, unknown>) => unknown;
type ConfigWindow = Window & { umamiConfig: Record<string, unknown> };

let fetchMock: Mock;
let navigate: Mock;

function setHook(hook: Hook | undefined): void {
  (window as ConfigWindow).umamiConfig["beforeSend"] = hook;
}

/** A tracked link inside the document. Clicks dispatch on the inner span, so the listener has to find the anchor. */
function trackedLink(attributes: Record<string, string> = {}): { link: HTMLAnchorElement; inner: HTMLElement } {
  const link = document.createElement("a");
  link.href = "/pricing";
  link.setAttribute("data-umami-event", "pricing-click");
  link.setAttribute("data-umami-event-plan", "pro");
  link.setAttribute("data-umami-event-position", "header");
  for (const [name, value] of Object.entries(attributes)) link.setAttribute(name, value);
  const inner = document.createElement("span");
  inner.textContent = "Pricing";
  link.append(inner);
  document.body.append(link);
  return { link, inner };
}

function click(target: Element, init: MouseEventInit = {}): MouseEvent {
  const event = new MouseEvent("click", { bubbles: true, cancelable: true, ...init });
  // The tracker listens in the capture phase. Stop the event at the target so happy-dom's own link activation
  // does not navigate, which would hide whether the tracker did.
  target.addEventListener("click", (e) => e.preventDefault(), { once: true });
  const prevented: boolean[] = [];
  document.addEventListener("click", (e) => prevented.push(e.defaultPrevented), { capture: true, once: true });
  target.dispatchEvent(event);
  // `defaultPrevented` as the tracker left it, before the target handler above ran.
  Object.defineProperty(event, "trackerPrevented", { value: prevented[0] });
  return event;
}

function trackerPrevented(event: MouseEvent): boolean {
  return (event as MouseEvent & { trackerPrevented: boolean }).trackerPrevented;
}

/** Lets pending promise callbacks and zero-delay timers run. */
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

function sentEvents(): { type: string; payload: Record<string, unknown> }[] {
  return fetchMock.mock.calls.map(([, init]) => JSON.parse(init.body));
}

/** The request body for a click on `trackedLink()`, with any fields a hook added. */
function pricingEvent(extra: Record<string, unknown> = {}) {
  return {
    type: "event",
    payload: expect.objectContaining({ name: "pricing-click", data: { plan: "pro", position: "header" }, ...extra }),
  };
}

function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

beforeAll(async () => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  // Keys already on window.umamiConfig win over the options, so the start-up pageview can be switched off here.
  (window as ConfigWindow).umamiConfig = { autoPageview: false };
  startUmami({ websiteId: WEBSITE_ID, hostUrl: "/", autoTrack: true });
  // The listener is installed once the document is complete.
  await tick();
});

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));
  navigate = vi.fn();
  vi.spyOn(window.location, "href", "set").mockImplementation(navigate);
  setHook(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
  document.body.replaceChildren();
});

describe("tracked link clicks with an async beforeSend hook", () => {
  it("holds navigation until the hook settles, then navigates without waiting for the request", async () => {
    const hook = deferred<Record<string, unknown>>();
    const beforeSend = vi.fn((_type: string, _payload: Record<string, unknown>) => hook.promise);
    setHook(beforeSend);
    // The analytics request never finishes. Navigation must not depend on it.
    fetchMock.mockReturnValue(new Promise(() => {}));
    const { link, inner } = trackedLink();

    const event = click(inner);

    expect(trackerPrevented(event)).toBe(true);
    expect(beforeSend).toHaveBeenCalledTimes(1);
    const [type, payload] = beforeSend.mock.calls[0] ?? [];
    expect(type).toBe("event");
    expect(payload).toMatchObject({
      website: WEBSITE_ID,
      name: "pricing-click",
      data: { plan: "pro", position: "header" },
    });

    await tick();
    expect(navigate).not.toHaveBeenCalled();

    hook.resolve({ ...payload, tagged: true });
    await tick();
    await tick();

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith(link.href);
    expect(sentEvents()).toEqual([pricingEvent({ tagged: true })]);
  });

  it("still navigates when the hook drops the event", async () => {
    setHook(async () => null);
    const { link, inner } = trackedLink();

    const event = click(inner);
    await tick();
    await tick();

    expect(trackerPrevented(event)).toBe(true);
    expect(navigate).toHaveBeenCalledWith(link.href);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    ["ctrl-click", { ctrlKey: true }],
    ["shift-click", { shiftKey: true }],
    ["meta-click", { metaKey: true }],
    ["middle click", { button: 1 }],
  ])("does not block a %s", async (_name, init) => {
    setHook(async (_type, payload) => payload);
    const { inner } = trackedLink();

    const event = click(inner, init);
    await tick();
    await tick();

    expect(trackerPrevented(event)).toBe(false);
    expect(navigate).not.toHaveBeenCalled();
    expect(sentEvents()).toEqual([pricingEvent()]);
  });

  it("does not block a link that opens in a new tab", async () => {
    setHook(async (_type, payload) => payload);
    const { inner } = trackedLink({ target: "_blank" });

    const event = click(inner);
    await tick();
    await tick();

    expect(trackerPrevented(event)).toBe(false);
    expect(navigate).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not block a tracked element that is not a link", async () => {
    setHook(async (_type, payload) => payload);
    const button = document.createElement("button");
    button.setAttribute("data-umami-event", "signup");
    button.setAttribute("data-umami-event-plan", "free");
    document.body.append(button);

    const event = click(button);
    await tick();
    await tick();

    expect(trackerPrevented(event)).toBe(false);
    expect(navigate).not.toHaveBeenCalled();
    expect(sentEvents()).toEqual([
      { type: "event", payload: expect.objectContaining({ name: "signup", data: { plan: "free" } }) },
    ]);
  });
});

describe("tracked link clicks without an async hook", () => {
  it.each([
    ["no hook", undefined],
    ["a sync hook", (_type: string, payload: Record<string, unknown>) => payload],
  ])("leaves navigation to the browser with %s", async (_name, hook) => {
    setHook(hook);
    const { inner } = trackedLink();

    const event = click(inner);
    await tick();
    await tick();

    expect(trackerPrevented(event)).toBe(false);
    expect(navigate).not.toHaveBeenCalled();
    expect(sentEvents()).toEqual([pricingEvent()]);
  });

  it("ignores clicks outside tracked elements", async () => {
    const plain = document.createElement("a");
    plain.href = "/about";
    document.body.append(plain);

    const event = click(plain);
    await tick();

    expect(trackerPrevented(event)).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });
});
