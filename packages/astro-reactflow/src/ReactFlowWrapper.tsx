import {
  addEdge,
  Background,
  BackgroundVariant,
  type ColorMode,
  Controls,
  type Edge,
  MarkerType,
  MiniMap,
  type Node,
  type OnConnect,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Viewport,
} from "@xyflow/react";
import { toPng, toSvg } from "html-to-image";
import {
  type CSSProperties,
  type RefObject,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import "@xyflow/react/dist/style.css";
import "./styles.css";

/**
 * Friendly node definition. Maps to a React Flow {@link Node} internally — the
 * top-level `label` becomes `data.label`, so callers don't have to nest it.
 */
export interface DiagramNode {
  id: string;
  type?: "default" | "input" | "output" | "group" | (string & {});
  label: string;
  position: { x: number; y: number };
  style?: CSSProperties;
  className?: string;
  parentId?: string;
  extent?: "parent";
}

/**
 * Friendly edge definition. `markerEnd` / `strokeWidth` are shorthands resolved
 * against the diagram-level `defaultMarkerEnd` / `defaultStrokeWidth`.
 */
export interface DiagramEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  type?: "default" | "straight" | "step" | "smoothstep" | "bezier";
  animated?: boolean;
  style?: CSSProperties;
  markerEnd?: "arrow" | "arrowclosed" | boolean;
  /** Stroke width for this edge (overrides the diagram default). */
  strokeWidth?: number;
}

/** Named mini-map size presets (width × height in px, 4:3 like React Flow's default). */
export type MiniMapPreset = "sm" | "md" | "lg";

/**
 * A single mini-map dimension. A `number` is treated as px; a string ending in
 * `%` is relative to the diagram pane (e.g. `"25%"`).
 */
export type MiniMapDimension = number | string;

/**
 * Mini-map size. One of:
 * - a named preset: `"sm"` (120×90), `"md"` (200×150 — the default), `"lg"` (320×240);
 * - a single number — width in px, with height derived from the default 4:3 ratio;
 * - an explicit `{ width, height }` where each value is px (`number`) or a
 *   percentage of the diagram pane (`string`, e.g. `"25%"`).
 */
export type MiniMapSize = MiniMapPreset | number | { width: MiniMapDimension; height: MiniMapDimension };

export interface ReactFlowWrapperProps {
  /** Nodes to render (friendly shape — `label` is hoisted to `data.label`). */
  nodes: DiagramNode[];
  /** Edges to render. */
  edges: DiagramEdge[];
  /** Optional title rendered in a header bar above the diagram. */
  title?: string;
  /** Optional description rendered in a footer bar below the diagram. */
  description?: string;
  /**
   * Container width. Numbers are treated as px. Strings are passed through
   * (e.g. `"100%"`, `"40rem"`). Defaults to `"100%"`.
   */
  width?: number | string;
  /**
   * Container height. Numbers are treated as px. Strings are passed through.
   * Defaults to `400` (px). React Flow renders blank when its parent has no
   * height, so the wrapper enforces a working default.
   */
  height?: number | string;
  /** Whether to show the mini map (default: false). */
  showMiniMap?: boolean;
  /**
   * Mini-map size. A preset (`"sm"` | `"md"` | `"lg"`), a single number (width
   * in px; height follows the default 4:3 ratio), or an explicit
   * `{ width, height }` in px (`number`) or as a percentage of the diagram pane
   * (`string`, e.g. `"25%"`). Defaults to React Flow's 200×150 when omitted.
   */
  miniMapSize?: MiniMapSize;
  /** Whether to show the zoom/pan controls (default: true). */
  showControls?: boolean;
  /** Background variant: 'dots', 'lines', or 'cross' (default: 'dots'). */
  backgroundVariant?: "dots" | "lines" | "cross";
  /** Whether to allow focus/fullscreen mode (default: true). */
  allowFocusMode?: boolean;
  /** Whether nodes can be dragged/connected/selected (default: false). */
  interactive?: boolean;
  /** Fit the diagram to the viewport on load (default: true). */
  fitView?: boolean;
  /** Default arrow marker for all edges (default: false). */
  defaultMarkerEnd?: "arrow" | "arrowclosed" | boolean;
  /** Default stroke width for all edges (default: 2). */
  defaultStrokeWidth?: number;
  /**
   * Color mode. `"auto"` (default) follows the host page's theme signals
   * (`.dark` / `.scheme-dark` class, `data-theme-scheme`, a `data-theme` value
   * containing `"dark"`) and falls back to `prefers-color-scheme`. Pass
   * `"light"` / `"dark"` to pin it.
   */
  colorMode?: "auto" | "light" | "dark";
  /** Additional class applied to the outer wrapper. */
  className?: string;
  /** Additional inline styles applied to the outer wrapper. */
  style?: CSSProperties;
  /** Enable PNG / SVG export buttons (default: false). */
  enableExport?: boolean;
}

const toCssDimension = (value: number | string): string => (typeof value === "number" ? `${value}px` : value);

/** React Flow's intrinsic mini-map size — kept identical when no size is set. */
const MINIMAP_DEFAULT = { width: 200, height: 150 } as const;

/** Named presets, sized 4:3 to match React Flow's default proportions. */
const MINIMAP_PRESETS: Record<MiniMapPreset, { width: number; height: number }> = {
  sm: { width: 120, height: 90 },
  md: { width: MINIMAP_DEFAULT.width, height: MINIMAP_DEFAULT.height },
  lg: { width: 320, height: 240 },
};

/** Aspect ratio applied when a single number is given (height = width × this). */
const MINIMAP_ASPECT = MINIMAP_DEFAULT.height / MINIMAP_DEFAULT.width;

/** A `%` dimension must be measured against the pane before React Flow can use it. */
const isRelativeDimension = (dimension: MiniMapDimension): boolean =>
  typeof dimension === "string" && dimension.trim().endsWith("%");

/** Reduce a {@link MiniMapSize} to a width/height pair (each may still be relative). */
const resolveMiniMapSpec = (size: MiniMapSize): { width: MiniMapDimension; height: MiniMapDimension } => {
  if (typeof size === "string") {
    return MINIMAP_PRESETS[size] ?? MINIMAP_DEFAULT;
  }
  if (typeof size === "number") {
    return { width: size, height: Math.round(size * MINIMAP_ASPECT) };
  }
  return size;
};

/** Resolve one dimension to px. `%` strings are taken against `basis` (the pane). */
const toMiniMapPx = (dimension: MiniMapDimension, basis: number): number => {
  if (typeof dimension === "number") {
    return dimension;
  }
  const trimmed = dimension.trim();
  const value = Number.parseFloat(trimmed);
  if (!Number.isFinite(value)) {
    return 0;
  }
  return trimmed.endsWith("%") ? (value / 100) * basis : value;
};

/**
 * Resolve a {@link MiniMapSize} to concrete pixel dimensions for React Flow's
 * `<MiniMap>`, which needs numeric width/height for its viewport math. Returns
 * `null` when no size is configured so the mini-map keeps React Flow's defaults.
 * Percentage dimensions are measured against the diagram pane and tracked with a
 * `ResizeObserver` so they follow focus-mode and container resizes.
 */
const useMiniMapDimensions = (
  size: MiniMapSize | undefined,
  paneRef: RefObject<HTMLDivElement | null>,
): { width: number; height: number } | null => {
  const spec = useMemo(() => (size === undefined ? null : resolveMiniMapSpec(size)), [size]);
  const relative = spec !== null && (isRelativeDimension(spec.width) || isRelativeDimension(spec.height));

  const measure = useCallback((): { width: number; height: number } | null => {
    if (spec === null) {
      return null;
    }
    const pane = paneRef.current;
    return {
      width: toMiniMapPx(spec.width, pane?.offsetWidth ?? 0),
      height: toMiniMapPx(spec.height, pane?.offsetHeight ?? 0),
    };
  }, [spec, paneRef]);

  // Non-relative sizes resolve synchronously; relative sizes start from the
  // default until the pane can be measured in the layout effect below.
  const [dims, setDims] = useState<{ width: number; height: number } | null>(() =>
    spec === null ? null : relative ? MINIMAP_DEFAULT : measure(),
  );

  useLayoutEffect(() => {
    setDims(measure());
    if (!relative || typeof ResizeObserver === "undefined") {
      return;
    }
    const pane = paneRef.current;
    if (!pane) {
      return;
    }
    const observer = new ResizeObserver(() => setDims(measure()));
    observer.observe(pane);
    return () => observer.disconnect();
  }, [relative, measure, paneRef]);

  return dims;
};

/** Resolve the effective dark/light mode from the host page's theme signals. */
const detectAutoColorMode = (): ColorMode => {
  if (typeof document === "undefined") {
    return "light";
  }
  const root = document.documentElement;
  const hasDarkSignal =
    root.classList.contains("dark") ||
    root.classList.contains("scheme-dark") ||
    root.getAttribute("data-theme-scheme") === "dark" ||
    (root.getAttribute("data-theme")?.includes("dark") ?? false);
  if (hasDarkSignal) {
    return "dark";
  }
  const hasLightSignal =
    root.classList.contains("light") ||
    root.classList.contains("scheme-light") ||
    root.getAttribute("data-theme-scheme") === "light" ||
    (root.getAttribute("data-theme")?.includes("light") ?? false);
  if (hasLightSignal) {
    return "light";
  }
  if (typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
};

/**
 * Resolve the color mode. An explicit `"light"`/`"dark"` is returned as-is;
 * `"auto"` follows the host page and re-evaluates when its theme signals change.
 */
const useResolvedColorMode = (colorMode: "auto" | "light" | "dark"): ColorMode => {
  const [resolved, setResolved] = useState<ColorMode>(() => (colorMode === "auto" ? "light" : colorMode));

  useEffect(() => {
    if (colorMode !== "auto") {
      setResolved(colorMode);
      return;
    }

    const update = () => setResolved(detectAutoColorMode());
    update();

    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme", "data-theme-scheme"],
    });

    const media = window.matchMedia?.("(prefers-color-scheme: dark)");
    media?.addEventListener("change", update);

    return () => {
      observer.disconnect();
      media?.removeEventListener("change", update);
    };
  }, [colorMode]);

  return resolved;
};

function ReactFlowWrapperInner({
  nodes: nodeDefs,
  edges: edgeDefs,
  title,
  description,
  width = "100%",
  height = 400,
  showMiniMap = false,
  miniMapSize,
  showControls = true,
  backgroundVariant = "dots",
  allowFocusMode = true,
  interactive = false,
  fitView = true,
  defaultMarkerEnd = false,
  defaultStrokeWidth = 2,
  colorMode = "auto",
  className,
  style,
  enableExport = false,
}: ReactFlowWrapperProps) {
  const paneRef = useRef<HTMLDivElement>(null);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [savedViewport, setSavedViewport] = useState<Viewport | null>(null);

  const resolvedColorMode = useResolvedColorMode(colorMode);
  const miniMapDimensions = useMiniMapDimensions(miniMapSize, paneRef);
  const { fitView: fitViewFn, getViewport, setViewport } = useReactFlow();

  // Unique id so multiple diagrams on one page don't share a <Background> pattern.
  const diagramId = useId();

  const bgVariant = useMemo(() => {
    switch (backgroundVariant) {
      case "lines":
        return BackgroundVariant.Lines;
      case "cross":
        return BackgroundVariant.Cross;
      default:
        return BackgroundVariant.Dots;
    }
  }, [backgroundVariant]);

  const initialNodes: Node[] = useMemo(
    () =>
      nodeDefs.map((node) => {
        const rfNode: Node = {
          id: node.id,
          type: node.type || "default",
          position: node.position,
          data: { label: node.label },
          // Provide measured dimensions so the minimap can render before layout.
          measured: { width: 150, height: 40 },
        };
        // Only attach optional keys when present (exactOptionalPropertyTypes).
        if (node.style) rfNode.style = node.style;
        if (node.className) rfNode.className = node.className;
        if (node.parentId) rfNode.parentId = node.parentId;
        if (node.extent) rfNode.extent = node.extent;
        return rfNode;
      }),
    [nodeDefs],
  );

  const initialEdges: Edge[] = useMemo(
    () =>
      edgeDefs.map((edge) => {
        const strokeWidth = edge.strokeWidth ?? defaultStrokeWidth;

        const reactFlowEdge: Edge = {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          type: edge.type || "smoothstep",
          style: { ...edge.style, strokeWidth },
        };
        if (edge.label !== undefined) reactFlowEdge.label = edge.label;
        if (edge.animated !== undefined) reactFlowEdge.animated = edge.animated;

        // Per-edge marker takes precedence over the diagram default.
        const markerSetting = edge.markerEnd !== undefined ? edge.markerEnd : defaultMarkerEnd;
        if (markerSetting === "arrow") {
          reactFlowEdge.markerEnd = { type: MarkerType.Arrow };
        } else if (markerSetting === "arrowclosed" || markerSetting === true) {
          reactFlowEdge.markerEnd = { type: MarkerType.ArrowClosed };
        }

        return reactFlowEdge;
      }),
    [edgeDefs, defaultMarkerEnd, defaultStrokeWidth],
  );

  const [nodes, _setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Use the freshly-derived edges for static diagrams so prop changes show up.
  const edgesToRender = interactive ? edges : initialEdges;

  const onConnect: OnConnect = useCallback(
    (params) => {
      if (interactive) {
        setEdges((eds) => addEdge(params, eds));
      }
    },
    [interactive, setEdges],
  );

  const toggleFocusMode = useCallback(() => {
    if (!isFocusMode) {
      setSavedViewport(getViewport());
      document.body.style.overflow = "hidden";
      setIsFocusMode(true);
      // Fit once the container has settled into fixed positioning (250ms anim).
      setTimeout(() => {
        fitViewFn({ padding: 0.15, duration: 400 });
      }, 100);
    } else {
      document.body.style.overflow = "";
      if (savedViewport) {
        setViewport(savedViewport, { duration: 300 });
      }
      setTimeout(() => {
        setIsFocusMode(false);
      }, 50);
    }
  }, [isFocusMode, getViewport, setViewport, fitViewFn, savedViewport]);

  // Restore body scroll if we unmount while in focus mode.
  useEffect(() => {
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Esc exits focus mode.
  useEffect(() => {
    if (!isFocusMode) {
      return;
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        toggleFocusMode();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFocusMode, toggleFocusMode]);

  // Dev-only nudge when the diagram has no size (a common React Flow footgun).
  // Skipped under test runners: jsdom/happy-dom never lay out, so offset sizes
  // are always 0 and this would fire a false positive on every mount. Vitest
  // sets `import.meta.env.MODE` to "test".
  useEffect(() => {
    if (!import.meta.env?.DEV || import.meta.env?.MODE === "test") {
      return;
    }
    const pane = paneRef.current;
    if (pane && (pane.offsetWidth === 0 || pane.offsetHeight === 0)) {
      console.warn(
        `[@sjohansson/astro-reactflow] ReactFlowWrapper rendered with zero size (${pane.offsetWidth}×${pane.offsetHeight}px). ` +
          "Pass the `height`/`width` props or set a size on the parent container. " +
          "See https://reactflow.dev/error#004",
      );
    }
  }, []);

  const downloadImage = useCallback(
    (format: "png" | "svg") => {
      if (!paneRef.current) {
        return;
      }
      const exportFunction = format === "png" ? toPng : toSvg;
      exportFunction(paneRef.current, {
        backgroundColor: resolvedColorMode === "dark" ? "#1a1a1a" : "#ffffff",
        width: paneRef.current.offsetWidth,
        height: paneRef.current.offsetHeight,
      })
        .then((dataUrl) => {
          const link = document.createElement("a");
          link.download = `diagram.${format}`;
          link.href = dataUrl;
          link.click();
          link.remove();
        })
        .catch((error) => {
          console.error("Error exporting diagram:", error);
        });
    },
    [resolvedColorMode],
  );

  const focusButtonLabel = isFocusMode ? "Exit focus mode (Esc)" : "Enter focus mode";

  const containerClassName = ["reactflow-wrapper", isFocusMode ? "reactflow-focus-mode" : "", className || ""]
    .filter(Boolean)
    .join(" ");

  // Focus mode is sized fullscreen by CSS — no inline sizing so the stylesheet
  // wins the cascade. Normal mode uses the width/height props.
  const containerStyle: CSSProperties = isFocusMode
    ? {}
    : { width: toCssDimension(width), height: toCssDimension(height), ...style };

  // Only wire interaction handlers when interactive (avoids passing `undefined`
  // to optional props under exactOptionalPropertyTypes).
  const interactionProps = interactive ? { onNodesChange, onEdgesChange, onConnect } : {};

  const linesColor = resolvedColorMode === "dark" ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)";
  const backgroundColorProp = bgVariant === BackgroundVariant.Lines ? { color: linesColor } : {};

  return (
    <div className={containerClassName} data-color-mode={resolvedColorMode} style={containerStyle}>
      {title && !isFocusMode && <div className="reactflow-title">{title}</div>}
      <div className="reactflow-pane" ref={paneRef}>
        <ReactFlow
          nodes={nodes}
          edges={edgesToRender}
          {...interactionProps}
          fitView={fitView}
          colorMode={resolvedColorMode}
          nodesDraggable={interactive}
          nodesConnectable={interactive}
          elementsSelectable={interactive}
          panOnDrag
          zoomOnScroll
          proOptions={{ hideAttribution: true }}
        >
          <Background
            id={`bg-${diagramId}`}
            variant={bgVariant}
            gap={25}
            size={bgVariant === BackgroundVariant.Cross ? 6 : 1}
            {...backgroundColorProp}
          />
          {showControls && <Controls showInteractive={false} />}
          {showMiniMap && (
            <MiniMap
              {...(miniMapDimensions
                ? { style: { width: miniMapDimensions.width, height: miniMapDimensions.height } }
                : {})}
              nodeStrokeWidth={1}
              nodeBorderRadius={3}
              zoomable
              pannable
              nodeColor={(node) => {
                if (node.type === "input") return "#3b82f6";
                if (node.type === "output") return "#10b981";
                return "#6b7280";
              }}
              nodeStrokeColor="#374151"
              maskColor="rgba(0, 0, 0, 0.2)"
            />
          )}
          {allowFocusMode && (
            <Panel position="top-right" className="reactflow-panel">
              {isFocusMode && title && <span className="reactflow-focus-title">{title}</span>}
              <button
                type="button"
                onClick={toggleFocusMode}
                className="reactflow-focus-button"
                title={focusButtonLabel}
                aria-label={focusButtonLabel}
              >
                {isFocusMode ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <title>{focusButtonLabel}</title>
                    <path d="M8 3v3a2 2 0 0 1-2 2H3" />
                    <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
                    <path d="M3 16h3a2 2 0 0 1 2 2v3" />
                    <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <title>{focusButtonLabel}</title>
                    <path d="M8 3H5a2 2 0 0 0-2 2v3" />
                    <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
                    <path d="M3 16v3a2 2 0 0 0 2 2h3" />
                    <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
                  </svg>
                )}
              </button>
            </Panel>
          )}
          {enableExport && (
            <Panel position="top-left" className="reactflow-export-controls">
              <button
                type="button"
                onClick={() => downloadImage("png")}
                className="reactflow-export-button"
                title="Export as PNG"
                aria-label="Export as PNG"
              >
                PNG
              </button>
              <button
                type="button"
                onClick={() => downloadImage("svg")}
                className="reactflow-export-button"
                title="Export as SVG"
                aria-label="Export as SVG"
              >
                SVG
              </button>
            </Panel>
          )}
        </ReactFlow>
      </div>
      {description && !isFocusMode && <div className="reactflow-description">{description}</div>}
    </div>
  );
}

/**
 * React Flow diagram wrapper for Astro. Renders a titled, themeable diagram with
 * optional focus (fullscreen) mode, minimap, and PNG/SVG export.
 *
 * @example
 * ```tsx
 * <ReactFlowWrapper
 *   client:only="react"
 *   title="Basic Process Flow"
 *   nodes={[
 *     { id: "1", type: "input", label: "Start", position: { x: 0, y: 0 } },
 *     { id: "2", label: "Process", position: { x: 0, y: 100 } },
 *     { id: "3", type: "output", label: "End", position: { x: 0, y: 200 } },
 *   ]}
 *   edges={[
 *     { id: "e1-2", source: "1", target: "2", animated: true },
 *     { id: "e2-3", source: "2", target: "3" },
 *   ]}
 *   description="A simple linear process flow."
 *   showMiniMap
 *   height={450}
 * />
 * ```
 */
export default function ReactFlowWrapper(props: ReactFlowWrapperProps) {
  return (
    <ReactFlowProvider>
      <ReactFlowWrapperInner {...props} />
    </ReactFlowProvider>
  );
}
