import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ReactFlowWrapper, { type DiagramEdge, type DiagramNode } from "../src/ReactFlowWrapper";

/**
 * Complements ReactFlowWrapper.test.tsx with the paths that need a richer test
 * double: the mini-map's node coloring callback, image export, and the
 * auto color-mode observer.
 */

const toPng = vi.fn();
const toSvg = vi.fn();

vi.mock("html-to-image", () => ({
  toPng: (...args: unknown[]) => toPng(...args),
  toSvg: (...args: unknown[]) => toSvg(...args),
}));

vi.mock("@xyflow/react", async () => {
  const actual = await vi.importActual("@xyflow/react");
  return {
    ...actual,
    // biome-ignore lint/suspicious/noExplicitAny: minimal test doubles
    ReactFlow: ({ children, ...props }: any) => (
      <div data-testid="react-flow" data-props={JSON.stringify(props)}>
        {children}
      </div>
    ),
    // biome-ignore lint/suspicious/noExplicitAny: minimal test doubles
    ReactFlowProvider: ({ children }: any) => <div>{children}</div>,
    Background: () => <div data-testid="background" />,
    Controls: () => <div data-testid="controls" />,
    // Surface the resolved node colors so the `nodeColor` callback is exercised.
    // biome-ignore lint/suspicious/noExplicitAny: minimal test doubles
    MiniMap: ({ nodeColor, style }: any) => (
      <div
        data-testid="minimap"
        data-minimap-style={JSON.stringify(style ?? null)}
        data-node-colors={JSON.stringify(["input", "output", "default"].map((type) => nodeColor?.({ type })))}
      />
    ),
    // biome-ignore lint/suspicious/noExplicitAny: minimal test doubles
    Panel: ({ children }: any) => <div>{children}</div>,
    useReactFlow: () => ({
      fitView: vi.fn(),
      getViewport: vi.fn(() => ({ x: 0, y: 0, zoom: 1 })),
      setViewport: vi.fn(),
    }),
    // biome-ignore lint/suspicious/noExplicitAny: minimal test doubles
    useNodesState: (initialNodes: any) => [initialNodes, vi.fn(), vi.fn()],
    // biome-ignore lint/suspicious/noExplicitAny: minimal test doubles
    useEdgesState: (initialEdges: any) => [initialEdges, vi.fn(), vi.fn()],
    addEdge: vi.fn(),
    MarkerType: { Arrow: "arrow", ArrowClosed: "arrowclosed" },
    BackgroundVariant: { Dots: "dots", Lines: "lines", Cross: "cross" },
  };
});

const nodes: DiagramNode[] = [
  { id: "1", label: "Start", position: { x: 0, y: 0 }, type: "input" },
  { id: "2", label: "End", position: { x: 0, y: 100 }, type: "output" },
];

const edges: DiagramEdge[] = [{ id: "e1-2", source: "1", target: "2" }];

// biome-ignore lint/suspicious/noExplicitAny: parsed JSON from the mock
const flowProps = (): any => JSON.parse(screen.getByTestId("react-flow").getAttribute("data-props") || "{}");

// biome-ignore lint/suspicious/noExplicitAny: parsed JSON from the mock
const miniMapStyle = (): any => JSON.parse(screen.getByTestId("minimap").getAttribute("data-minimap-style") || "null");

/** Force offsetWidth/offsetHeight, which happy-dom always reports as 0. */
function stubOffsets(width: number, height: number): () => void {
  const originalWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetWidth");
  const originalHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight");
  Object.defineProperty(HTMLElement.prototype, "offsetWidth", { configurable: true, get: () => width });
  Object.defineProperty(HTMLElement.prototype, "offsetHeight", { configurable: true, get: () => height });
  return () => {
    if (originalWidth) {
      Object.defineProperty(HTMLElement.prototype, "offsetWidth", originalWidth);
    }
    if (originalHeight) {
      Object.defineProperty(HTMLElement.prototype, "offsetHeight", originalHeight);
    }
  };
}

beforeEach(() => {
  document.documentElement.className = "";
  document.documentElement.removeAttribute("data-theme");
  document.documentElement.removeAttribute("data-theme-scheme");
  toPng.mockReset();
  toSvg.mockReset();
  toPng.mockResolvedValue("data:image/png;base64,AAA");
  toSvg.mockResolvedValue("data:image/svg+xml;base64,BBB");
});

afterEach(() => {
  document.body.style.overflow = "";
  vi.restoreAllMocks();
});

describe("node definition mapping", () => {
  it("carries optional node keys through to React Flow", () => {
    render(
      <ReactFlowWrapper
        nodes={[
          { id: "parent", label: "Group", position: { x: 0, y: 0 }, type: "group" },
          {
            id: "child",
            label: "Child",
            position: { x: 10, y: 10 },
            style: { background: "#eee" },
            className: "highlighted",
            parentId: "parent",
            extent: "parent",
          },
        ]}
        edges={[]}
      />,
    );

    const child = flowProps().nodes[1];
    expect(child).toMatchObject({
      id: "child",
      className: "highlighted",
      parentId: "parent",
      extent: "parent",
      style: { background: "#eee" },
    });
  });

  it("omits optional keys that were not supplied", () => {
    render(<ReactFlowWrapper nodes={nodes} edges={edges} />);
    const node = flowProps().nodes[0];
    expect(node).not.toHaveProperty("className");
    expect(node).not.toHaveProperty("parentId");
    expect(node).not.toHaveProperty("extent");
    expect(node).not.toHaveProperty("style");
  });

  it("defaults an untyped node to the default type", () => {
    render(<ReactFlowWrapper nodes={[{ id: "1", label: "Plain", position: { x: 0, y: 0 } }]} edges={[]} />);
    expect(flowProps().nodes[0].type).toBe("default");
  });

  it("provides measured dimensions so the minimap can render before layout", () => {
    render(<ReactFlowWrapper nodes={nodes} edges={edges} />);
    expect(flowProps().nodes[0].measured).toEqual({ width: 150, height: 40 });
  });
});

describe("edge definition mapping", () => {
  it("carries the label and animated flag through to React Flow", () => {
    render(
      <ReactFlowWrapper nodes={nodes} edges={[{ id: "e1", source: "1", target: "2", label: "yes", animated: true }]} />,
    );
    expect(flowProps().edges[0]).toMatchObject({ label: "yes", animated: true });
  });

  it("omits label and animated when they were not supplied", () => {
    render(<ReactFlowWrapper nodes={nodes} edges={edges} />);
    const edge = flowProps().edges[0];
    expect(edge).not.toHaveProperty("label");
    expect(edge).not.toHaveProperty("animated");
  });

  it("defaults an untyped edge to smoothstep", () => {
    render(<ReactFlowWrapper nodes={nodes} edges={edges} />);
    expect(flowProps().edges[0].type).toBe("smoothstep");
  });

  it("treats markerEnd={true} as a closed arrow", () => {
    render(<ReactFlowWrapper nodes={nodes} edges={[{ id: "e1", source: "1", target: "2", markerEnd: true }]} />);
    expect(flowProps().edges[0].markerEnd.type).toBe("arrowclosed");
  });

  it("treats defaultMarkerEnd={true} as a closed arrow", () => {
    render(<ReactFlowWrapper nodes={nodes} edges={edges} defaultMarkerEnd />);
    expect(flowProps().edges[0].markerEnd.type).toBe("arrowclosed");
  });
});

describe("minimap node colors", () => {
  it("colors input, output, and default nodes distinctly", () => {
    render(<ReactFlowWrapper nodes={nodes} edges={edges} showMiniMap />);
    const colors = JSON.parse(screen.getByTestId("minimap").getAttribute("data-node-colors") || "[]");
    expect(colors).toEqual(["#3b82f6", "#10b981", "#6b7280"]);
  });
});

describe("minimap sizing edge cases", () => {
  it("resolves an unparseable dimension to zero rather than NaN", () => {
    render(<ReactFlowWrapper nodes={nodes} edges={edges} showMiniMap miniMapSize={{ width: "auto", height: 120 }} />);
    expect(miniMapStyle()).toEqual({ width: 0, height: 120 });
  });

  it("resolves a non-percentage string dimension as pixels", () => {
    render(<ReactFlowWrapper nodes={nodes} edges={edges} showMiniMap miniMapSize={{ width: "180px", height: 120 }} />);
    expect(miniMapStyle()).toEqual({ width: 180, height: 120 });
  });

  it("falls back to the default size for an unknown preset", () => {
    render(
      // biome-ignore lint/suspicious/noExplicitAny: exercising an out-of-contract preset
      <ReactFlowWrapper nodes={nodes} edges={edges} showMiniMap miniMapSize={"xl" as any} />,
    );
    expect(miniMapStyle()).toEqual({ width: 200, height: 150 });
  });

  it("remeasures percentage dimensions when the pane resizes", async () => {
    const observers: Array<() => void> = [];
    class StubResizeObserver {
      constructor(callback: () => void) {
        observers.push(callback);
      }
      observe(): void {}
      disconnect(): void {}
    }
    const original = globalThis.ResizeObserver;
    Object.defineProperty(globalThis, "ResizeObserver", {
      value: StubResizeObserver,
      configurable: true,
      writable: true,
    });
    let restoreOffsets = stubOffsets(400, 300);

    try {
      const { unmount } = render(
        <ReactFlowWrapper nodes={nodes} edges={edges} showMiniMap miniMapSize={{ width: "50%", height: "50%" }} />,
      );
      expect(observers).toHaveLength(1);

      // The pane grows; the observer callback re-measures.
      restoreOffsets();
      restoreOffsets = stubOffsets(800, 600);
      for (const fn of observers) {
        fn();
      }
      await waitFor(() => {
        expect(miniMapStyle()).toEqual({ width: 400, height: 300 });
      });
      unmount();
    } finally {
      restoreOffsets();
      Object.defineProperty(globalThis, "ResizeObserver", { value: original, configurable: true, writable: true });
    }
  });
});

describe("image export", () => {
  it("exports a PNG with the light background", async () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    render(<ReactFlowWrapper nodes={nodes} edges={edges} enableExport />);

    fireEvent.click(screen.getByRole("button", { name: /Export as PNG/i }));
    await waitFor(() => expect(click).toHaveBeenCalled());

    expect(toPng).toHaveBeenCalledTimes(1);
    expect(toPng.mock.calls[0]?.[1]).toMatchObject({ backgroundColor: "#ffffff" });
    expect(toSvg).not.toHaveBeenCalled();
  });

  it("exports an SVG", async () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    render(<ReactFlowWrapper nodes={nodes} edges={edges} enableExport />);

    fireEvent.click(screen.getByRole("button", { name: /Export as SVG/i }));
    await waitFor(() => expect(click).toHaveBeenCalled());

    expect(toSvg).toHaveBeenCalledTimes(1);
    expect(toPng).not.toHaveBeenCalled();
  });

  it("uses the dark background in dark color mode", async () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    render(<ReactFlowWrapper nodes={nodes} edges={edges} enableExport colorMode="dark" />);

    fireEvent.click(screen.getByRole("button", { name: /Export as PNG/i }));
    await waitFor(() => expect(click).toHaveBeenCalled());

    expect(toPng.mock.calls[0]?.[1]).toMatchObject({ backgroundColor: "#1a1a1a" });
  });

  it("passes the pane size to the exporter", async () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const restore = stubOffsets(640, 480);
    try {
      render(<ReactFlowWrapper nodes={nodes} edges={edges} enableExport />);
      fireEvent.click(screen.getByRole("button", { name: /Export as PNG/i }));
      await waitFor(() => expect(click).toHaveBeenCalled());
      expect(toPng.mock.calls[0]?.[1]).toMatchObject({ width: 640, height: 480 });
    } finally {
      restore();
    }
  });

  it("logs a failed export instead of throwing", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    toPng.mockRejectedValue(new Error("canvas tainted"));
    render(<ReactFlowWrapper nodes={nodes} edges={edges} enableExport />);

    fireEvent.click(screen.getByRole("button", { name: /Export as PNG/i }));
    await waitFor(() => expect(error).toHaveBeenCalledWith("Error exporting diagram:", expect.any(Error)));
  });
});

describe("auto color mode detection", () => {
  it("detects dark from the .dark class", () => {
    document.documentElement.classList.add("dark");
    render(<ReactFlowWrapper nodes={nodes} edges={edges} />);
    expect(flowProps().colorMode).toBe("dark");
  });

  it("detects dark from a data-theme value containing 'dark'", () => {
    document.documentElement.setAttribute("data-theme", "seventies-dark");
    render(<ReactFlowWrapper nodes={nodes} edges={edges} />);
    expect(flowProps().colorMode).toBe("dark");
  });

  it("detects light from the .light class even when the OS prefers dark", () => {
    const original = Object.getOwnPropertyDescriptor(window, "matchMedia");
    Object.defineProperty(window, "matchMedia", {
      value: (query: string) => ({ matches: true, media: query, addEventListener() {}, removeEventListener() {} }),
      configurable: true,
      writable: true,
    });
    try {
      document.documentElement.classList.add("light");
      render(<ReactFlowWrapper nodes={nodes} edges={edges} />);
      expect(flowProps().colorMode).toBe("light");
    } finally {
      if (original) {
        Object.defineProperty(window, "matchMedia", original);
      }
    }
  });

  it("detects light from data-theme-scheme", () => {
    document.documentElement.setAttribute("data-theme-scheme", "light");
    render(<ReactFlowWrapper nodes={nodes} edges={edges} />);
    expect(flowProps().colorMode).toBe("light");
  });

  it("falls back to the OS preference when the page gives no theme signal", () => {
    const original = Object.getOwnPropertyDescriptor(window, "matchMedia");
    Object.defineProperty(window, "matchMedia", {
      value: (query: string) => ({
        matches: query.includes("prefers-color-scheme: dark"),
        media: query,
        addEventListener() {},
        removeEventListener() {},
      }),
      configurable: true,
      writable: true,
    });
    try {
      render(<ReactFlowWrapper nodes={nodes} edges={edges} />);
      expect(flowProps().colorMode).toBe("dark");
    } finally {
      if (original) {
        Object.defineProperty(window, "matchMedia", original);
      }
    }
  });

  it("follows a later theme change on <html>", async () => {
    render(<ReactFlowWrapper nodes={nodes} edges={edges} />);
    expect(flowProps().colorMode).toBe("light");

    document.documentElement.classList.add("scheme-dark");
    await waitFor(() => {
      expect(flowProps().colorMode).toBe("dark");
    });
  });

  it("ignores <html> changes when the color mode is explicit", async () => {
    render(<ReactFlowWrapper nodes={nodes} edges={edges} colorMode="light" />);
    document.documentElement.classList.add("scheme-dark");
    await waitFor(() => {
      expect(flowProps().colorMode).toBe("light");
    });
  });
});

describe("focus mode viewport", () => {
  it("keeps the wrapper unsized in focus mode so the stylesheet wins", async () => {
    const { container } = render(<ReactFlowWrapper nodes={nodes} edges={edges} height={600} width={800} />);
    const wrapper = container.querySelector(".reactflow-wrapper") as HTMLElement;
    expect(wrapper.getAttribute("style")).toContain("height: 600px");

    fireEvent.click(screen.getByRole("button", { name: /Enter focus mode/i }));
    await waitFor(() => {
      expect(wrapper).toHaveClass("reactflow-focus-mode");
    });
    expect(wrapper.getAttribute("style") || "").not.toContain("height: 600px");
  });

  it("hides the description while in focus mode", async () => {
    const { container } = render(<ReactFlowWrapper nodes={nodes} edges={edges} description="Notes" />);
    expect(container.querySelector(".reactflow-description")).toHaveTextContent("Notes");

    fireEvent.click(screen.getByRole("button", { name: /Enter focus mode/i }));
    await waitFor(() => {
      expect(container.querySelector(".reactflow-description")).toBeNull();
    });
  });

  it("ignores non-Escape keys while in focus mode", async () => {
    render(<ReactFlowWrapper nodes={nodes} edges={edges} />);
    fireEvent.click(screen.getByRole("button", { name: /Enter focus mode/i }));
    await waitFor(() => expect(document.body.style.overflow).toBe("hidden"));

    fireEvent.keyDown(window, { key: "Enter" });
    expect(document.body.style.overflow).toBe("hidden");
  });
});
