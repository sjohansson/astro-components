import { Background, Controls, type Edge, type Node, ReactFlow } from "@xyflow/react";
import { toPng, toSvg } from "html-to-image";
import { useCallback, useRef } from "react";
import "@xyflow/react/dist/style.css";
import "./styles.css";

interface ReactFlowWrapperProps {
  nodes: Node[];
  edges: Edge[];
  className?: string;
  enableExport?: boolean;
}

export default function ReactFlowWrapper({ nodes, edges, className, enableExport = false }: ReactFlowWrapperProps) {
  const flowRef = useRef<HTMLDivElement>(null);

  const downloadImage = useCallback((format: "png" | "svg") => {
    if (!flowRef.current) {
      return;
    }

    const exportFunction = format === "png" ? toPng : toSvg;
    const fileExtension = format;

    exportFunction(flowRef.current, {
      backgroundColor: "#ffffff",
      width: flowRef.current.offsetWidth,
      height: flowRef.current.offsetHeight,
    })
      .then((dataUrl) => {
        const link = document.createElement("a");
        link.download = `diagram.${fileExtension}`;
        link.href = dataUrl;
        link.click();
        link.remove();
      })
      .catch((error) => {
        console.error("Error exporting diagram:", error);
      });
  }, []);

  return (
    <div className={`reactflow-wrapper ${className || ""}`} ref={flowRef}>
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
