import { memo } from "react";
import { lastSeen, isMqttUpdated } from "../utils/mqttChecks";
import { HardwareModel, Role } from "../utils/NodeData";
import NodeInfoPopup from "../components/NodeInfoPopup";
import { useState } from "react";

interface NodeInfoProps {
  id: string;
  longName: string;
  shortName: string;
  temp: string;
  humidity: string;
  pressure: string;
  ch1Power: string;
  ch2Power: string;
  ch3Power: string;
  mqttUpdated: Date;
  hardwareModel?: number;
  role?: number;
}

function NodeInfoCard({
  id,
  longName,
  shortName,
  temp,
  humidity,
  pressure,
  ch1Power,
  ch2Power,
  ch3Power,
  mqttUpdated,
  hardwareModel,
  role,
}: NodeInfoProps) {
  const [showPopup, setShowPopup] = useState(false);

  const isValid = (value: string) =>
    value && value !== "N/A" && value.trim() !== "";

  const displayShortName = isValid(shortName) ? shortName : "????";
  const displayLongName = isValid(longName) ? longName : "Unknown";
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

  function getHardwareName(id: number | undefined): string {
    if (id === undefined) {
      return "Unknown Hardware";
    }
    const hardware_model = HardwareModel[id];
    if (!hardware_model) {
      return "Unknown Hardware";
    }
    return hardware_model.split("_").join(" ");
  }

  function getRoleName(id: number | undefined): string {
    if (id === undefined) {
      return "Unknown Role";
    }

    const hardware_model = Role[id];
    if (!hardware_model) {
      return "Unknown Role";
    }
    return hardware_model.split("_").join(" ");
  }

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
    <div
      className="bg-[#1b1b1d] w-90 h-30 m-2 p-2 text-white flex hover:border-[#2a9d5f] hover:border-2 rounded-lg shadow-md "
      onClick={() => {
        setShowPopup(true);
      }}
    >
      {/* Left Section: Short Name in a grey circle */}
      <div className="flex items-center justify-center w-20 h-20 ml-3 mr-4">
        <div
          className={`w-20 h-20 ${updatedClass} border-0 border-solid border-[#333] rounded-full flex items-center justify-center mt-0 mx-[-5px] mb-[-23px]`}
        >
          <span className={`${shortNameClass} select-none`}>
            {displayShortName}
          </span>
        </div>
      </div>

      {/* Right Section: Long Name and Telemetry in a centered column */}
      <div className="flex-1 flex flex-col justify-start text-left">
        <p className="text-[18px] font-bold select-none">{displayLongName}</p>
        <p
          id="LastSeen"
          className="select-none text-[#ccc] text-[14px] font-medium text-left"
        >
          Active: {lastSeen({ date: mqttUpdated })}
        </p>
        <div
          id="EnvInfo"
          className="flex justify-start text-[#ccc] select-none text-[14px] font-medium"
        >
          {isValid(temp || humidity || pressure) && (
            <p className="mr-1">Env:</p>
          )}
          {isValid(temp) && <p className="mr-2 select-none">{temp}</p>}
          {isValid(humidity) && <p className="mr-2 select-none">{humidity}</p>}
          {isValid(pressure) && <p className="mr-2 select-none">{pressure}</p>}
        </div>
        <div
          id="PowerInfo"
          className="flex justify-start  text-[#ccc] select-none text-[14px] font-medium"
        >
          {isValid(ch1Power || ch2Power || ch3Power) && <p>Power:</p>}
          {isValid(ch1Power) && <p className="mr-2 select-none">{ch1Power}</p>}
          {isValid(ch2Power) && <p className="mr-2 select-none">{ch2Power}</p>}
          {isValid(ch3Power) && <p className="mr-2 select-none">{ch3Power}</p>}
        </div>

        <div
          id="DeviceInfo"
          className="select-none  text-[#ccc] flex justify-start text-[14px] font-medium"
        >
          <p className="mr-1"> Device:</p>
          <p className="mr-2 select-none">{getHardwareName(hardwareModel)}</p>
        </div>
        <div
          id="DeviceInfo"
          className="select-none  text-[#ccc] flex justify-start text-[14px] font-medium"
        >
          <p className="mr-1">Role:</p>{" "}
          <p className="mr-2 select-none">{getRoleName(role)}</p>
        </div>
      </div>
      <NodeInfoPopup
        id={id}
        isOpen={showPopup}
        onClose={() => {
          setShowPopup(false);
        }}
      />
    </div>
  );
}

export default memo(NodeInfoCard);
