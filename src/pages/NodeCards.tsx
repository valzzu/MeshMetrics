import { Zoomies } from "ldrs/react";
import NodeInfoCard from "../components/NodeInfoCard";
import { sortMqttDates } from "../utils/mqttChecks";

interface HeaderProps {
  nodes: any[]; // Replace 'any' with the actual type of your nodes
}

function NodeCards({ nodes }: HeaderProps) {
  const sortedNodes = [...nodes].sort((a, b) => {
    const aOnline =
      sortMqttDates([a.mqtt_updated_at ? new Date(a.mqtt_updated_at) : null])
        .online.length > 0;
    const bOnline =
      sortMqttDates([b.mqtt_updated_at ? new Date(b.mqtt_updated_at) : null])
        .online.length > 0;
    if (aOnline && !bOnline) return -1; // a is online, b is offline
    if (!aOnline && bOnline) return 1; // a is offline, b is online
    return 0; // Both are online or both are offline, maintain order
  });

  return (
    <div className="pt-16 flex flex-wrap justify-center align-top">
      {sortedNodes.length > 0 ? (
        sortedNodes.map((node) => (
          <NodeInfoCard
            key={node.id}
            longName={node.longName}
            shortName={node.shortName}
            id={node.id}
            temp={
              node.telemetry?.temperature !== undefined
                ? `${node.telemetry.temperature}°C`
                : "N/A"
            }
            humidity={
              node.telemetry?.relative_humidity !== undefined
                ? `${node.telemetry.relative_humidity}%`
                : "N/A"
            }
            pressure={
              node.telemetry?.barometric_pressure !== undefined
                ? `${node.telemetry.barometric_pressure}hPa`
                : "N/A"
            }
            ch1Power={
              node.telemetry?.voltage_ch1 !== undefined &&
              node.telemetry?.current_ch1 !== undefined
                ? `${node.telemetry.voltage_ch1}V ${node.telemetry.current_ch1}mA`
                : "N/A"
            }
            ch2Power={
              node.telemetry?.voltage_ch2 !== undefined &&
              node.telemetry?.current_ch2 !== undefined
                ? `${node.telemetry.voltage_ch2}V ${node.telemetry.current_ch2}mA`
                : "N/A"
            }
            ch3Power={
              node.telemetry?.voltage_ch3 !== undefined &&
              node.telemetry?.current_ch3 !== undefined
                ? `${node.telemetry.voltage_ch3}V ${node.telemetry.current_ch3}mA`
                : "N/A"
            }
            mqttUpdated={
              node.mqtt_updated_at
                ? new Date(node.mqtt_updated_at)
                : new Date(0) // Fallback to epoch date
            }
            hardwareModel={node.hardware_model}
            role={node.role}
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
  );
}

export default NodeCards;
