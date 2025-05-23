import type { NodeData } from "../utils/NodeData";
import { getHardwareName, getRoleName } from "../utils/NodeData";

import { lastSeen } from "../utils/mqttChecks";

interface NodeInfoPopupProps {
  node: NodeData;
  onClose: () => void;
  // other props if any
}

function NodeInfoPopup({ node, onClose }: NodeInfoPopupProps) {
  const isValid = (value: string) =>
    value && value !== "N/A" && value.trim() !== "";

  const temp =
    node.telemetry?.temperature !== undefined
      ? `${node.telemetry.temperature}°C`
      : "N/A";

  const humidity =
    node.telemetry?.relative_humidity !== undefined
      ? `${node.telemetry.relative_humidity}%`
      : "N/A";

  const pressure =
    node.telemetry?.barometric_pressure !== undefined
      ? `${node.telemetry.barometric_pressure}hPa`
      : "N/A";

  const ch1Power =
    node &&
    node.telemetry?.voltage_ch1 !== undefined &&
    node.telemetry?.current_ch1 !== null
      ? `${node.telemetry.voltage_ch1}V ${node.telemetry.current_ch1}mA`
      : "N/A";
  const ch2Power =
    node &&
    node?.telemetry?.voltage_ch2 !== undefined &&
    node?.telemetry?.current_ch2 !== null
      ? `${node.telemetry.voltage_ch2}V ${node.telemetry.current_ch2}mA`
      : "N/A";
  const ch3Power =
    node &&
    node?.telemetry?.voltage_ch3 !== undefined &&
    node?.telemetry?.current_ch3 !== null
      ? `${node.telemetry.voltage_ch3}V ${node.telemetry.current_ch3}mA`
      : "N/A";

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
              <p>
                Hardware:{" "}
                {getHardwareName(
                  typeof node.hardware_model === "number"
                    ? node.hardware_model
                    : Number.isNaN(Number(node.hardware_model))
                    ? undefined
                    : Number(node.hardware_model)
                )}
              </p>
              <p>
                Role:{" "}
                {getRoleName(
                  typeof node.role === "number"
                    ? node.role
                    : Number.isNaN(Number(node.role))
                    ? undefined
                    : Number(node.role)
                )}
              </p>
              <div>
                {isValid(temp) && (
                  <p className="mr-2 select-none">Temp: {temp}</p>
                )}
                {isValid(humidity) && (
                  <p className="mr-2 select-none">Humidity: {humidity}</p>
                )}
                {isValid(pressure) && (
                  <p className="mr-2 select-none">Pressure: {pressure}</p>
                )}
              </div>
              {isValid(ch1Power || ch2Power || ch3Power) && (
                <h5>Power telemetry: </h5>
              )}
              {isValid(ch1Power) && <p>ch1: {ch1Power}</p>}
              {isValid(ch2Power) && <p>ch2: {ch2Power}</p>}
              {isValid(ch3Power) && <p>ch3: {ch3Power}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NodeInfoPopup;
