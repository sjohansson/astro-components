import { describe, expect, it, vi } from "vitest";
import versionNoteIntegration, { CLIENT_SCRIPT } from "../src/integration";

describe("version note integration", () => {
  it("is named after the package", () => {
    expect(versionNoteIntegration().name).toBe("@sjohansson/astro-version-note");
  });

  it("injects a page script that registers the element", () => {
    const injectScript = vi.fn();
    const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(), label: "test", fork: vi.fn() };
    // biome-ignore lint/suspicious/noExplicitAny: partial Astro hook context
    (versionNoteIntegration().hooks["astro:config:setup"] as any)({ injectScript, logger });

    expect(injectScript).toHaveBeenCalledWith("page", CLIENT_SCRIPT);
    expect(CLIENT_SCRIPT).toContain('from "@sjohansson/astro-version-note"');
    expect(CLIENT_SCRIPT).toContain("registerVersionNote();");
  });
});
