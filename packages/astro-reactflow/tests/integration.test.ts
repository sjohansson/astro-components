import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
import reactFlowIntegration from "../src/integration";

describe("ReactFlow Integration", () => {
  it("exports a function", () => {
    expect(typeof reactFlowIntegration).toBe("function");
  });

  it("returns a valid Astro integration with the config:setup hook", () => {
    const result = reactFlowIntegration();

    expect(result.name).toBe("@sjohansson/astro-reactflow");
    expect(result.hooks["astro:config:setup"]).toBeDefined();
  });

  it("accepts options without throwing", () => {
    expect(() => reactFlowIntegration({ configureSsr: false })).not.toThrow();
    expect(() => reactFlowIntegration({ autoRegisterReact: false })).not.toThrow();
    expect(() => reactFlowIntegration({ configureSsr: false, autoRegisterReact: false })).not.toThrow();
  });

  it("auto-registers @astrojs/react when missing", async () => {
    const integration = reactFlowIntegration();
    const setup = integration.hooks["astro:config:setup"];
    if (!setup) throw new Error("setup hook missing");

    const updates: unknown[] = [];
    const logs: string[] = [];

    await setup({
      // biome-ignore lint/suspicious/noExplicitAny: minimal mock for hook param
      config: { integrations: [], root: pathToFileURL(`${process.cwd()}/`) } as any,
      // biome-ignore lint/suspicious/noExplicitAny: minimal mock for hook param
      updateConfig: ((cfg: unknown) => updates.push(cfg)) as any,
      // biome-ignore lint/suspicious/noExplicitAny: minimal mock for hook param
      logger: { info: (m: string) => logs.push(m), warn: () => {}, debug: () => {}, error: () => {} } as any,
    } as never);

    const integrationsAdded = updates.some(
      (u) =>
        typeof u === "object" &&
        u !== null &&
        "integrations" in u &&
        Array.isArray((u as { integrations: unknown[] }).integrations) &&
        (u as { integrations: { name?: string }[] }).integrations.some((i) => i?.name === "@astrojs/react"),
    );
    expect(integrationsAdded).toBe(true);
  });

  it("skips auto-registration when @astrojs/react is already present", async () => {
    const integration = reactFlowIntegration();
    const setup = integration.hooks["astro:config:setup"];
    if (!setup) throw new Error("setup hook missing");

    const updates: unknown[] = [];

    await setup({
      // biome-ignore lint/suspicious/noExplicitAny: minimal mock for hook param
      config: { integrations: [{ name: "@astrojs/react" }] } as any,
      // biome-ignore lint/suspicious/noExplicitAny: minimal mock for hook param
      updateConfig: ((cfg: unknown) => updates.push(cfg)) as any,
      // biome-ignore lint/suspicious/noExplicitAny: minimal mock for hook param
      logger: { info: () => {}, warn: () => {}, debug: () => {}, error: () => {} } as any,
    } as never);

    const integrationsAdded = updates.some(
      (u) =>
        typeof u === "object" &&
        u !== null &&
        "integrations" in u &&
        Array.isArray((u as { integrations: unknown[] }).integrations),
    );
    expect(integrationsAdded).toBe(false);
  });

  it("throws when autoRegisterReact is disabled and @astrojs/react is missing", async () => {
    const integration = reactFlowIntegration({ autoRegisterReact: false });
    const setup = integration.hooks["astro:config:setup"];
    if (!setup) throw new Error("setup hook missing");

    await expect(
      setup({
        // biome-ignore lint/suspicious/noExplicitAny: minimal mock for hook param
        config: { integrations: [], root: pathToFileURL(`${process.cwd()}/`) } as any,
        // biome-ignore lint/suspicious/noExplicitAny: minimal mock for hook param
        updateConfig: (() => {}) as any,
        // biome-ignore lint/suspicious/noExplicitAny: minimal mock for hook param
        logger: { info: () => {}, warn: () => {}, debug: () => {}, error: () => {} } as any,
      } as never),
    ).rejects.toThrow(/@astrojs\/react/);
  });
});
