import type { Plugin } from "vite";
import { describe, expect, it, vi } from "vitest";
import versionNoteIntegration, { CLIENT_SCRIPT, STYLES_ID } from "../src/integration";
import { VERSION_NOTE_STYLES } from "../src/styles";

function runSetup(integration: ReturnType<typeof versionNoteIntegration>) {
  const injectScript = vi.fn();
  const updateConfig = vi.fn();
  const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(), label: "test", fork: vi.fn() };
  // biome-ignore lint/suspicious/noExplicitAny: partial Astro hook context
  (integration.hooks["astro:config:setup"] as any)({ injectScript, updateConfig, logger });
  return { injectScript, updateConfig };
}

describe("version note integration", () => {
  it("is named after the package", () => {
    expect(versionNoteIntegration().name).toBe("@sjohansson/astro-version-note");
  });

  it("registers the element without runtime style injection", () => {
    const { injectScript } = runSetup(versionNoteIntegration());

    expect(injectScript).toHaveBeenCalledWith("page", CLIENT_SCRIPT);
    expect(CLIENT_SCRIPT).toContain('from "@sjohansson/astro-version-note"');
    expect(CLIENT_SCRIPT).toContain("registerVersionNote({ injectStyles: false });");
  });

  it("bundles the default styles through a virtual module", () => {
    const { injectScript, updateConfig } = runSetup(versionNoteIntegration());

    expect(injectScript).toHaveBeenCalledWith("page-ssr", `import "${STYLES_ID}";`);
    const plugin = updateConfig.mock.calls[0]?.[0].vite.plugins[0] as Plugin;
    const resolveId = plugin.resolveId as (id: string) => string | undefined;
    const load = plugin.load as (id: string) => string | undefined;
    const resolved = resolveId(STYLES_ID);
    expect(resolved).toBe(`\0${STYLES_ID}`);
    expect(load(resolved ?? "")).toBe(VERSION_NOTE_STYLES);
    expect(resolveId("other.css")).toBeUndefined();
  });

  it("leaves the styles out when asked", () => {
    const { injectScript, updateConfig } = runSetup(versionNoteIntegration({ styles: false }));

    expect(updateConfig).not.toHaveBeenCalled();
    expect(injectScript).toHaveBeenCalledTimes(1);
    expect(injectScript).toHaveBeenCalledWith("page", CLIENT_SCRIPT);
  });
});
