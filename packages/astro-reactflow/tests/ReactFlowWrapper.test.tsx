import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ReactFlowWrapper, { type DiagramEdge, type DiagramNode } from "../src/ReactFlowWrapper";

// Mock @xyflow/react to avoid full canvas rendering in happy-dom. Each mocked
// element surfaces the props it received so we can assert on them.
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
    // biome-ignore lint/suspicious/noExplicitAny: minimal test doubles
    Background: ({ id }: any) => <div data-testid={`background-${id}`} />,
    Controls: () => <div data-testid="controls" />,
    MiniMap: () => <div data-testid="minimap" />,
    // biome-ignore lint/suspicious/noExplicitAny: minimal test doubles
    Panel: ({ children, position }: any) => (
      <div data-testid="panel" data-position={position}>
        {children}
      </div>
    ),
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
  { id: "2", label: "Process", position: { x: 0, y: 100 } },
  { id: "3", label: "End", position: { x: 0, y: 200 }, type: "output" },
];

const edges: DiagramEdge[] = [
  { id: "e1-2", source: "1", target: "2" },
  { id: "e2-3", source: "2", target: "3" },
];

// biome-ignore lint/suspicious/noExplicitAny: parsed JSON from the mock
const flowProps = (): any => JSON.parse(screen.getByTestId("react-flow").getAttribute("data-props") || "{}");

beforeEach(() => {
  document.body.style.overflow = "";
  document.documentElement.className = "";
  document.documentElement.removeAttribute("data-theme");
  document.documentElement.removeAttribute("data-theme-scheme");
});

afterEach(() => {
  document.body.style.overflow = "";
  vi.clearAllMocks();
});

describe("ReactFlowWrapper", () => {
  describe("rendering", () => {
    it("renders the diagram", () => {
      render(<ReactFlowWrapper nodes={nodes} edges={edges} />);
      expect(screen.getByTestId("react-flow")).toBeInTheDocument();
    });

    it("hoists the friendly label onto data.label", () => {
      render(<ReactFlowWrapper nodes={nodes} edges={edges} />);
      const props = flowProps();
      expect(props.nodes).toHaveLength(3);
      expect(props.nodes[0]).toMatchObject({ id: "1", type: "input", data: { label: "Start" } });
    });

    it("renders the title in a header bar", () => {
      const { container } = render(<ReactFlowWrapper nodes={nodes} edges={edges} title="My Title" />);
      expect(container.querySelector(".reactflow-title")).toHaveTextContent("My Title");
    });

    it("renders the description in a footer bar", () => {
      const { container } = render(<ReactFlowWrapper nodes={nodes} edges={edges} description="Some description" />);
      expect(container.querySelector(".reactflow-description")).toHaveTextContent("Some description");
    });
  });

  describe("controls and features", () => {
    it("shows controls by default and hides them when disabled", () => {
      const { rerender } = render(<ReactFlowWrapper nodes={nodes} edges={edges} />);
      expect(screen.getByTestId("controls")).toBeInTheDocument();
      rerender(<ReactFlowWrapper nodes={nodes} edges={edges} showControls={false} />);
      expect(screen.queryByTestId("controls")).not.toBeInTheDocument();
    });

    it("hides the minimap by default and shows it when enabled", () => {
      const { rerender } = render(<ReactFlowWrapper nodes={nodes} edges={edges} />);
      expect(screen.queryByTestId("minimap")).not.toBeInTheDocument();
      rerender(<ReactFlowWrapper nodes={nodes} edges={edges} showMiniMap />);
      expect(screen.getByTestId("minimap")).toBeInTheDocument();
    });

    it("shows the focus-mode button by default and hides it when disabled", () => {
      const { rerender } = render(<ReactFlowWrapper nodes={nodes} edges={edges} />);
      expect(screen.getByRole("button", { name: /Enter focus mode/i })).toBeInTheDocument();
      rerender(<ReactFlowWrapper nodes={nodes} edges={edges} allowFocusMode={false} />);
      expect(screen.queryByRole("button", { name: /focus mode/i })).not.toBeInTheDocument();
    });

    it("renders export buttons only when enabled", () => {
      const { rerender } = render(<ReactFlowWrapper nodes={nodes} edges={edges} />);
      expect(screen.queryByRole("button", { name: /Export as PNG/i })).not.toBeInTheDocument();
      rerender(<ReactFlowWrapper nodes={nodes} edges={edges} enableExport />);
      expect(screen.getByRole("button", { name: /Export as PNG/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Export as SVG/i })).toBeInTheDocument();
    });
  });

  describe("focus mode", () => {
    it("toggles focus mode and locks body scroll", async () => {
      render(<ReactFlowWrapper nodes={nodes} edges={edges} />);
      fireEvent.click(screen.getByRole("button", { name: /Enter focus mode/i }));

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Exit focus mode/i })).toBeInTheDocument();
      });
      expect(document.body.style.overflow).toBe("hidden");
    });

    it("exits focus mode when the exit button is clicked", async () => {
      render(<ReactFlowWrapper nodes={nodes} edges={edges} />);
      fireEvent.click(screen.getByRole("button", { name: /Enter focus mode/i }));
      await waitFor(() => expect(document.body.style.overflow).toBe("hidden"));

      fireEvent.click(screen.getByRole("button", { name: /Exit focus mode/i }));
      await waitFor(() => expect(document.body.style.overflow).toBe(""));
    });

    it("exits focus mode when Escape is pressed", async () => {
      render(<ReactFlowWrapper nodes={nodes} edges={edges} />);
      fireEvent.click(screen.getByRole("button", { name: /Enter focus mode/i }));
      await waitFor(() => expect(document.body.style.overflow).toBe("hidden"));

      fireEvent.keyDown(window, { key: "Escape" });
      await waitFor(() => expect(document.body.style.overflow).toBe(""));
    });

    it("shows the title in the focus-mode panel", async () => {
      const { container } = render(<ReactFlowWrapper nodes={nodes} edges={edges} title="Focus Test" />);
      fireEvent.click(screen.getByRole("button", { name: /Enter focus mode/i }));

      await waitFor(() => {
        expect(container.querySelector(".reactflow-focus-title")).toHaveTextContent("Focus Test");
      });
    });

    it("restores body scroll on unmount", () => {
      const { unmount } = render(<ReactFlowWrapper nodes={nodes} edges={edges} />);
      fireEvent.click(screen.getByRole("button", { name: /Enter focus mode/i }));
      document.body.style.overflow = "hidden";
      unmount();
      expect(document.body.style.overflow).toBe("");
    });
  });

  describe("interactivity", () => {
    it("is non-interactive by default", () => {
      render(<ReactFlowWrapper nodes={nodes} edges={edges} />);
      const props = flowProps();
      expect(props.nodesDraggable).toBe(false);
      expect(props.nodesConnectable).toBe(false);
      expect(props.elementsSelectable).toBe(false);
    });

    it("is interactive when interactive is true", () => {
      render(<ReactFlowWrapper nodes={nodes} edges={edges} interactive />);
      const props = flowProps();
      expect(props.nodesDraggable).toBe(true);
      expect(props.nodesConnectable).toBe(true);
      expect(props.elementsSelectable).toBe(true);
    });
  });

  describe("edge configuration", () => {
    it("applies the default marker end", () => {
      render(
        <ReactFlowWrapper
          nodes={nodes}
          edges={[{ id: "e1", source: "1", target: "2" }]}
          defaultMarkerEnd="arrowclosed"
        />,
      );
      expect(flowProps().edges[0].markerEnd.type).toBe("arrowclosed");
    });

    it("applies the default stroke width", () => {
      render(<ReactFlowWrapper nodes={nodes} edges={edges} defaultStrokeWidth={4} />);
      for (const edge of flowProps().edges) {
        expect(edge.style.strokeWidth).toBe(4);
      }
    });

    it("allows per-edge stroke width and marker overrides", () => {
      render(
        <ReactFlowWrapper
          nodes={nodes}
          edges={[
            { id: "e1", source: "1", target: "2", strokeWidth: 8, markerEnd: "arrow" },
            { id: "e2", source: "2", target: "3", markerEnd: false },
          ]}
          defaultStrokeWidth={2}
          defaultMarkerEnd="arrowclosed"
        />,
      );
      const { edges: rendered } = flowProps();
      expect(rendered[0].style.strokeWidth).toBe(8);
      expect(rendered[0].markerEnd.type).toBe("arrow");
      expect(rendered[1].style.strokeWidth).toBe(2);
      expect(rendered[1].markerEnd).toBeUndefined();
    });
  });

  describe("height and styling", () => {
    it("applies the default height", () => {
      const { container } = render(<ReactFlowWrapper nodes={nodes} edges={edges} />);
      expect(container.querySelector(".reactflow-wrapper")).toHaveStyle({ height: "400px" });
    });

    it("applies a custom numeric height", () => {
      const { container } = render(<ReactFlowWrapper nodes={nodes} edges={edges} height={600} />);
      expect(container.querySelector(".reactflow-wrapper")).toHaveStyle({ height: "600px" });
    });

    it("applies a custom string height", () => {
      const { container } = render(<ReactFlowWrapper nodes={nodes} edges={edges} height="50vh" />);
      expect(container.querySelector(".reactflow-wrapper")?.getAttribute("style")).toContain("height: 50vh");
    });

    it("applies a custom className", () => {
      const { container } = render(<ReactFlowWrapper nodes={nodes} edges={edges} className="custom-class" />);
      expect(container.querySelector(".reactflow-wrapper")).toHaveClass("custom-class");
    });
  });

  describe("color mode", () => {
    it("defaults to light", () => {
      render(<ReactFlowWrapper nodes={nodes} edges={edges} />);
      expect(flowProps().colorMode).toBe("light");
    });

    it("honors an explicit dark colorMode", () => {
      render(<ReactFlowWrapper nodes={nodes} edges={edges} colorMode="dark" />);
      expect(flowProps().colorMode).toBe("dark");
    });

    it("auto-detects dark via the scheme-dark class", () => {
      document.documentElement.classList.add("scheme-dark");
      render(<ReactFlowWrapper nodes={nodes} edges={edges} />);
      expect(flowProps().colorMode).toBe("dark");
    });

    it("auto-detects dark via data-theme-scheme", () => {
      document.documentElement.setAttribute("data-theme-scheme", "dark");
      render(<ReactFlowWrapper nodes={nodes} edges={edges} />);
      expect(flowProps().colorMode).toBe("dark");
    });

    it("reflects the resolved mode on the wrapper data attribute", () => {
      const { container } = render(<ReactFlowWrapper nodes={nodes} edges={edges} colorMode="dark" />);
      expect(container.querySelector(".reactflow-wrapper")).toHaveAttribute("data-color-mode", "dark");
    });
  });

  describe("background variant", () => {
    it.each(["dots", "lines", "cross"] as const)("renders the %s variant", (variant) => {
      render(<ReactFlowWrapper nodes={nodes} edges={edges} backgroundVariant={variant} />);
      expect(screen.getByTestId(/background-/)).toBeInTheDocument();
    });
  });
});
