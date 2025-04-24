import { memo } from "react";

interface NodeInfoProps {
  longName: string;
  shortName: string;
  temp: string;
  humidity: string;
  pressure: string;
  ch1Power: string;
  ch2Power: string;
  ch3Power: string;
  mqttUpdated: Date;
}

function NodeInfoCard({
  longName,
  shortName,
  temp,
  humidity,
  pressure,
  ch1Power,
  ch2Power,
  ch3Power,
  mqttUpdated,
}: NodeInfoProps) {
  const isValid = (value: string) =>
    value && value !== "N/A" && value.trim() !== "";

  const displayShortName = isValid(shortName) ? shortName : "????";
  const displayLongName = isValid(longName) ? longName : "Unknown";
  // Function to detect if the string is an emoji
  const isEmoji = (str: string) => {
    // This regex matches most emojis (Unicode ranges for emoji)
    const emojiRegex = /[\p{Emoji_Presentation}\p{Emoji}\u200D\uFE0F]/u;
    return emojiRegex.test(str) && str.length <= 2; // Ensure it's a single emoji
  };

  const isMqttUpdated = (date: Date | null | undefined): boolean => {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      return false; // Return false if date is invalid or undefined
    }

    const now = new Date();
    const diff = Math.abs(now.getTime() - date.getTime());
    const diffInMinutes = Math.floor(diff / (1000 * 60));
    return diffInMinutes < 60; // Check if the update was within the last hour
  };
  const isUpdated = isMqttUpdated(mqttUpdated);
  const updatedClass = isUpdated ? "bg-[#21b062]" : "bg-[#3b3c36]";

  const lastSeen = (date: Date) => {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      return "invalid";
    }
    const now = new Date();
    const diff = Math.abs(now.getTime() - date.getTime());
    const diffInMinutes = Math.floor(diff / (1000 * 60));
    // Check if date is before year 2000 (unset)
    if (date.getTime() < new Date("2000-01-01").getTime()) {
      return "unknown";
    }
    if (diffInMinutes >= 60) {
      const hours = Math.floor(diffInMinutes / 60);
      const minutes = diffInMinutes % 60;
      return `${hours} h ${minutes} min ago`;
    }
    return `${diffInMinutes} min ago`;
  };

  // Conditionally set the font size: larger for emojis, smaller for strings
  const shortNameClass = isEmoji(displayShortName) ? "text-[38px]" : "text-2xl";
  0;
  return (
    <div className="bg-[#1b1b1d] w-90 h-24 m-2 p-2 text-white flex">
      {/* Left Section: Short Name in a grey circle */}
      <div className="flex items-center justify-center w-20 h-20 mr-4">
        <div
          className={`w-20 h-20 ${updatedClass} border-0 border-solid border-[#333] rounded-full flex items-center justify-center `}
        >
          <span className={`${shortNameClass} select-none`}>
            {displayShortName}
          </span>
        </div>
      </div>

      {/* Right Section: Long Name and Telemetry in a centered column */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <p className="text-[18px] select-none">{displayLongName}</p>
        <div
          id="EnvInfo"
          className="flex justify-center text-white select-none"
        >
          {isValid(temp) && <p className="mr-2 select-none">{temp}</p>}
          {isValid(humidity) && <p className="mr-2 select-none">{humidity}</p>}
          {isValid(pressure) && <p className="mr-2 select-none">{pressure}</p>}
        </div>
        <div
          id="PowerInfo"
          className="flex justify-center  text-white select-none"
        >
          {isValid(ch1Power) && <p className="mr-2 select-none">{ch1Power}</p>}
          {isValid(ch2Power) && <p className="mr-2 select-none">{ch2Power}</p>}
          {isValid(ch3Power) && <p className="mr-2 select-none">{ch3Power}</p>}
        </div>
        <p className="select-none">last seen {lastSeen(mqttUpdated)}</p>
      </div>
    </div>
  );
}

export default memo(NodeInfoCard);
