import { Background, Controls, type Edge, type Node, ReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './styles.css';

interface ReactFlowWrapperProps {
  nodes: Node[];
  edges: Edge[];
  className?: string;
}

export default function ReactFlowWrapper({ nodes, edges, className }: ReactFlowWrapperProps) {
  return (
    <div className={`reactflow-wrapper ${className || ''}`}>
      <ReactFlow nodes={nodes} edges={edges} fitView>
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
