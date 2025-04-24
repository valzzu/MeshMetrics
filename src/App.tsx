import "./App.css";
import Header from "./components/Header";
import NodeInfoCard from "./components/NodeInfoCard";
import WorldMap from "./components/WorldMap";
import { useEffect } from "react";
import { useNodeStore } from "./utils/store";
import { Zoomies } from "ldrs/react";
import "ldrs/react/Zoomies.css";
import config from "./config.json";

function App() {
  const nodes = useNodeStore((state) => state.nodes);
  const setNodes = useNodeStore((state) => state.setNodes);

  useEffect(() => {
    const fetchInitialData = async () => {
      const response = await fetch(`${config.api_url}/api/nodes`);
      const initialNodes = await response.json();
      console.log("fetched");
      setNodes(initialNodes);
    };

    // Initial fetch
    fetchInitialData();

    // Set up timer for periodic fetching (every 60 seconds)
    const timer = setInterval(() => {
      fetchInitialData();
    }, 60000);

    // Cleanup function to clear the timer when component unmounts
    return () => clearInterval(timer);
  }, [setNodes]);

  interface DateStatus {
    online: (Date | string)[];
    offline: (Date | string)[];
  }

  const sortMqttDates = (
    dates: (Date | string | null | undefined)[],
    minutesThreshold: number = 60
  ): DateStatus => {
    const online: (Date | string)[] = [];
    const offline: (Date | string)[] = [];

    const isMqttUpdated = (
      dateInput: Date | string | null | undefined
    ): boolean => {
      let date: Date;
      if (typeof dateInput === "string") {
        date = new Date(dateInput);
      } else if (dateInput instanceof Date) {
        date = dateInput;
      } else {
        return false; // null, undefined
      }
      if (isNaN(date.getTime())) {
        return false; // Invalid date
      }

      const now = new Date();
      const diff = Math.abs(now.getTime() - date.getTime());
      const diffInMinutes = Math.floor(diff / (1000 * 60));
      return diffInMinutes < minutesThreshold;
    };

    dates.forEach((date) => {
      if (isMqttUpdated(date)) {
        online.push(date!); // Non-null since invalid goes to offline
      } else {
        offline.push(date ?? "invalid"); // Mark null/undefined as 'invalid'
      }
    });

    return { online, offline };
  };

  const { online, offline } = sortMqttDates(
    nodes.map((node) =>
      node.mqtt_updated_at ? new Date(node.mqtt_updated_at) : null
    ),
    60
  );

  // Sort nodes: online nodes first
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
    <>
      <div>
        <Header
          onlineCount={online.length}
          offlineCount={offline.length}
          nodesCount={nodes.length} // Optional: pass total nodes
        />
      </div>
      <div className="pt-16 flex flex-wrap justify-center align-top">
        {sortedNodes.length > 0 ? (
          sortedNodes.map((node) => (
            <NodeInfoCard
              key={node.id}
              longName={node.longName}
              shortName={node.shortName}
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
      <div>{nodes.length > 0 ? <WorldMap nodes={nodes} /> : <div></div>}</div>
    </>
  );
}

export default App;
