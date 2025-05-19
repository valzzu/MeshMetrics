import type { NodeData } from "../utils/NodeData";
import { lastSeen } from "../utils/mqttChecks";

interface NodeInfoPopupProps {
  node: NodeData;
  onClose: () => void;
  // other props if any
}

function NodeInfoPopup({ node, onClose }: NodeInfoPopupProps) {
  const isValid = (value: string) =>
    value && value !== "N/A" && value.trim() !== "";

  const ch1Power =
    node &&
    node.telemetry?.voltage_ch1 !== undefined &&
    node.telemetry?.current_ch1 !== null
      ? `${node.telemetry.voltage_ch1}V ${node.telemetry.current_ch1}mA`
      : "0V 0mA";
  const ch2Power =
    node &&
    node?.telemetry?.voltage_ch2 !== undefined &&
    node?.telemetry?.current_ch2 !== null
      ? `${node.telemetry.voltage_ch2}V ${node.telemetry.current_ch2}mA`
      : "0V 0mA";
  const ch3Power =
    node &&
    node?.telemetry?.voltage_ch3 !== undefined &&
    node?.telemetry?.current_ch3 !== null
      ? `${node.telemetry.voltage_ch3}V ${node.telemetry.current_ch3}mA`
      : "0V 0mA";

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
        className="bg-[#1b1b1d] p-6 rounded shadow-lg w-80 relative "
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
          <div className="flex flex-col gap-4 justify-start text-left">
            <h2 className="text-[24px] font-bold select-none">
              {node.longName} | {node.shortName}
            </h2>
            <div>
              <p>
                Active:{" "}
                {lastSeen({
                  date: node.mqtt_updated_at
                    ? new Date(node.mqtt_updated_at)
                    : new Date(0),
                })}
              </p>
              <div>
                {isValid(String(node.telemetry.temperature)) && (
                  <p className="mr-2 select-none">
                    Temp: {node.telemetry.temperature}°C
                  </p>
                )}
                {isValid(String(node.telemetry.relative_humidity)) && (
                  <p className="mr-2 select-none">
                    Humidity: {node.telemetry.relative_humidity}%
                  </p>
                )}
                {isValid(String(node.telemetry.barometric_pressure)) && (
                  <p className="mr-2 select-none">
                    Pressure: {node.telemetry.barometric_pressure}hPa
                  </p>
                )}
              </div>
              <h5>Power telemetry: </h5>
              <p>ch1: {ch1Power}</p>
              <p>ch2: {ch2Power}</p>
              <p>ch3: {ch3Power}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NodeInfoPopup;
