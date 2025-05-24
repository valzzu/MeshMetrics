import { useState } from "react";
import { Zoomies } from "ldrs/react";
import NodeInfoCard from "../components/NodeInfoCard";
import NodeInfoPopup from "../components/NodeInfoPopup"; // Make sure this import exists
import { sortMqttDates } from "../utils/mqttChecks";
import type { NodeData } from "../utils/NodeData";

interface HeaderProps {
  nodes: NodeData[];
}

function NodeCards({ nodes }: HeaderProps) {
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);

  const sortedNodes = [...nodes].sort((a, b) => {
    const aOnline =
      sortMqttDates([a.mqtt_updated_at ? new Date(a.mqtt_updated_at) : null])
        .online.length > 0;
    const bOnline =
      sortMqttDates([b.mqtt_updated_at ? new Date(b.mqtt_updated_at) : null])
        .online.length > 0;
    if (aOnline && !bOnline) return -1;
    if (!aOnline && bOnline) return 1;
    return 0;
  });

  return (
    <>
      <div className="pt-16 flex flex-wrap justify-center align-top">
        {sortedNodes.length > 0 ? (
          sortedNodes.map((node) => (
            <NodeInfoCard
              key={node.id}
              node={node}
              onOpenPopup={() => setSelectedNode(node)}
            />
          ))
        ) : (
          <div className="justify-center content-center select-none">
            <p>Loading nodes</p>
            <Zoomies
              size="80"
              stroke="5"
              bgOpacity="0.1"
              speed="1.4"
              color="white"
            />
          </div>
        )}
      </div>
      {selectedNode && (
        <div onClick={() => setSelectedNode(null)}>
          <div onClick={(e) => e.stopPropagation()}>
            <NodeInfoPopup
              node={selectedNode}
              onClose={() => setSelectedNode(null)}
            />
          </div>
        </div>
      )}
    </>
  );
}

export default NodeCards;
