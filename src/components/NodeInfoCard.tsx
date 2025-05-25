import { memo } from "react";
import { lastSeen, isMqttUpdated } from "../utils/mqttChecks";
import type { NodeData } from "../utils/NodeData";
import { getHardwareName, getRoleName } from "../utils/NodeData";

type NodeInfoCardProps = {
  node: NodeData;
  onOpenPopup?: () => void;
};

function NodeInfoCard({ node, onOpenPopup }: NodeInfoCardProps) {
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

  const mqttUpdated = node.mqtt_updated_at
    ? new Date(node.mqtt_updated_at)
    : new Date(0); // Fallback to epoch date

  const hardwareModel =
    node.hardware_model !== undefined ? Number(node.hardware_model) : undefined;

  const role = node.role !== undefined ? Number(node.role) : undefined;
  const latitude =
    node.latitude !== undefined ? node.latitude / 1_000_0000 : undefined;

  const longitude =
    node.longitude !== undefined ? node.longitude / 1_000_0000 : undefined;

  const isValid = (value: string) =>
    value && value !== "N/A" && value.trim() !== "";

  const displayShortName = isValid(node.shortName) ? node.shortName : "????";
  const displayLongName = isValid(node.longName) ? node.longName : "Unknown";
  // Function to detect if the string is an emoji
  const isEmoji = (str: string) => {
    // This regex matches most emojis (Unicode ranges for emoji)
    // biome-ignore lint/suspicious/noMisleadingCharacterClass: <explanation>
    const emojiRegex = /[\p{Emoji_Presentation}\p{Emoji}\u200D\uFE0F]/u;
    return emojiRegex.test(str) && str.length <= 2; // Ensure it's a single emoji
  };

  const isUpdated = isMqttUpdated({ date: mqttUpdated });
  const updatedClass = isUpdated ? "bg-[#21b062] " : "bg-[#3b3c36]";

  // Conditionally set the font size: larger for emojis, smaller for strings
  const shortNameClass = isEmoji(displayShortName) ? "text-[38px]" : "text-2xl";
  0;

  return (
    <div
      className="relative w-90 h-35 m-2 p-2 bg-[#1b1b1d] text-white flex hover:border-[#2a9d5f] hover:bg-[#313135] rounded-lg shadow-md"
      onClick={() => {
        if (onOpenPopup) onOpenPopup();
      }}
      onKeyUp={(e) => {
        if ((e.key === "Enter" || e.key === " ") && onOpenPopup) {
          onOpenPopup();
        }
      }}
    >
      {/* Location icon in the top-right corner */}
      {longitude && latitude && (
        <a
          className="absolute bottom-2 right-2 select-none hover:scale-125 transition-transform duration-170 ease-in-out"
          id="location-icon"
          href={`https://www.google.com/maps/search/?q=${latitude},${longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src="location.svg"
            alt="Position Icon"
            className="text-white w-6 h-6"
          />
        </a>
      )}

      {/* Left Section: Short Name in a grey circle */}
      <div className="flex items-center justify-center w-20 h-20 ml-3 mr-4 top-5 ">
        <div
          className={`w-20 h-20 ${updatedClass} border-0 border-solid border-[#333] rounded-full flex items-center justify-center mt-0 mx-[-5px] mb-[-23px] left-5 bottom-13 absolute`}
        >
          <span className={`${shortNameClass} select-none`}>
            {displayShortName}
          </span>
        </div>
      </div>

      {/* Right Section: Long Name and Telemetry */}
      <div className="flex-1 flex flex-col justify-start text-left top-2 relative">
        <p className="text-[18px] font-bold select-none">{displayLongName}</p>
        <p className="select-none text-[#ccc] text-[14px] font-medium text-left">
          Active: {lastSeen({ date: mqttUpdated })}
        </p>

        <div className="flex justify-start text-[#ccc] select-none text-[14px] font-medium">
          {isValid(temp || humidity || pressure) && (
            <p className="mr-1">Env:</p>
          )}
          {isValid(temp) && <p className="mr-2 select-none">{temp}</p>}
          {isValid(humidity) && <p className="mr-2 select-none">{humidity}</p>}
          {isValid(pressure) && <p className="mr-2 select-none">{pressure}</p>}
        </div>

        <div className="select-none text-[#ccc] flex justify-start text-[14px] font-medium">
          <p className="mr-1">Device:</p>
          <p className="mr-2 select-none">{getHardwareName(hardwareModel)}</p>
        </div>

        <div className="select-none text-[#ccc] flex justify-start text-[14px] font-medium">
          <p className="mr-1">Role:</p>
          <p className="mr-2 select-none">{getRoleName(role)}</p>
        </div>
      </div>
    </div>
  );
}

export default memo(NodeInfoCard);
