import { useEffect, useState } from "react";
import config from "../config.json";
import type { NodeData } from "../utils/NodeData";
import { lastSeen } from "../utils/mqttChecks";
import { Zoomies } from "ldrs/react";

interface NodeInfoPopupProps {
  id: string; // id of the node
  isOpen: boolean;
  onClose: () => void;
}

function NodeInfoPopup({ id, isOpen, onClose }: NodeInfoPopupProps) {
  if (!isOpen) return null;

  // State to hold node data and loading status
  const [nodeData, setNodeData] = useState<NodeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch node data from the API
  useEffect(() => {
    const fetchNodeData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${config.api_url}/api/nodes/${id}`);
        if (response.status !== 200) {
          console.error("Error fetching node data:", response.statusText);
          return;
        }
        const nodeData = await response.json();
        console.log(nodeData);
        setNodeData(nodeData);
      } catch (error) {
        console.error("Error fetching node data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNodeData();
  }, [id]);

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
    <div
      className="fixed inset-0 bg-black/65 flex items-center justify-center z-1000"
      onClick={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
      <div
        className="bg-[#1b1b1d] p-6 rounded shadow-lg w-80 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button in top-right corner */}
        {/* biome-ignore lint/a11y/useButtonType: <explanation> */}
        <button
          className="absolute top-2 right-2 text-white hover:text-gray-300 transition-colors duration-200 z-10"
          onClick={onClose}
          aria-label="Close popup"
        >
          {/* biome-ignore lint/a11y/noSvgWithoutTitle: <explanation> */}
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Content with padding to avoid overlap */}
        <div className="pt-8">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center select-none min-h-[200px]">
              <p>Loading nodes</p>
              <Zoomies
                size="80"
                stroke="5"
                bgOpacity="0.1"
                speed="1.4"
                color="white"
              />
            </div>
          ) : nodeData ? (
            <div className="flex flex-col gap-4">
              <h2 className="text-[24px] font-bold select-none">
                {nodeData.longName} | {nodeData.shortName}
              </h2>
              <div>
                <p>
                  Active:{" "}
                  {lastSeen({
                    date: nodeData.mqtt_updated_at
                      ? new Date(nodeData.mqtt_updated_at)
                      : new Date(0),
                  })}
                </p>
                <p>
                  env: {nodeData.telemetry.temperature}°C{" "}
                  {nodeData.telemetry.relative_humidity}%{" "}
                  {nodeData.telemetry.barometric_pressure}hPa
                </p>
                <h5>Power telemetry: </h5>
                <p>ch1: 4V 400mA</p>
                <p>ch2: 4V 100mA</p>
                <p>ch3: 24V 500mA</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center select-none min-h-[200px]">
              <p>Error loading node data</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default NodeInfoPopup;
