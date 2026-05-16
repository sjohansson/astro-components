import { Background, Controls, type Edge, type Node, ReactFlow } from "@xyflow/react";
import { toPng, toSvg } from "html-to-image";
import { type CSSProperties, useCallback, useEffect, useRef } from "react";
import "@xyflow/react/dist/style.css";
import "./styles.css";

interface ReactFlowWrapperProps {
  nodes: Node[];
  edges: Edge[];
  /**
   * Container width. Numbers are treated as px. Strings are passed through
   * (e.g. `"100%"`, `"40rem"`). Defaults to `"100%"`.
   */
  width?: number | string;
  /**
   * Container height. Numbers are treated as px. Strings are passed through.
   * Defaults to `500` (px). React Flow renders blank when its parent has no
   * height, so the wrapper enforces a working default.
   */
  height?: number | string;
  className?: string;
  style?: CSSProperties;
  enableExport?: boolean;
}

const toCssDimension = (value: number | string): string => (typeof value === "number" ? `${value}px` : value);

export default function ReactFlowWrapper({
  nodes,
  edges,
  width = "100%",
  height = 500,
  className,
  style,
  enableExport = false,
}: ReactFlowWrapperProps) {
  const flowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (import.meta.env?.DEV && flowRef.current) {
      const { offsetWidth, offsetHeight } = flowRef.current;
      if (offsetWidth === 0 || offsetHeight === 0) {
        console.warn(
          `[@sjohansson/astro-reactflow] ReactFlowWrapper rendered with zero size (${offsetWidth}×${offsetHeight}px). ` +
            "Pass the `height`/`width` props or set a size on the parent container. " +
            "See https://reactflow.dev/error#004",
        );
      }
    }
  }, []);

  const downloadImage = useCallback((format: "png" | "svg") => {
    if (!flowRef.current) {
      return;
    }

    const exportFunction = format === "png" ? toPng : toSvg;

    exportFunction(flowRef.current, {
      backgroundColor: "#ffffff",
      width: flowRef.current.offsetWidth,
      height: flowRef.current.offsetHeight,
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
  }, []);

  return (
    <div
      className={`reactflow-wrapper ${className || ""}`}
      ref={flowRef}
      style={{ width: toCssDimension(width), height: toCssDimension(height), ...style }}
    >
      <ReactFlow nodes={nodes} edges={edges} fitView>
        <Background />
        <Controls />
      </ReactFlow>
      {enableExport && (
        <div className="export-controls">
          <button type="button" onClick={() => downloadImage("png")} className="export-button" title="Export as PNG">
            PNG
          </button>
          <button type="button" onClick={() => downloadImage("svg")} className="export-button" title="Export as SVG">
            SVG
          </button>
        </div>
      )}
    </div>
  );
}
