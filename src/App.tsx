import "./App.css";
import Header from "./components/Header";
import WorldMap from "./pages/WorldMap";
import NodeCards from "./pages/NodeCards";
import NotFound from "./pages/NotFound";
import { useEffect } from "react";
import { useNodeStore } from "./utils/store";
import { BrowserRouter, Routes, Route } from "react-router";
import "ldrs/react/Zoomies.css";
import config from "./config.json";
import { sortMqttDates } from "./utils/mqttChecks";

function App() {
  const nodes = useNodeStore((state) => state.nodes);
  const setNodes = useNodeStore((state) => state.setNodes);

  useEffect(() => {
    const fetchInitialData = async () => {
      const response = await fetch(`${config.api_url}/api/nodes`);
      const initialNodes = await response.json();
      console.log("fetched");

      if (response.status !== 200) {
        console.error("Error fetching nodes:", response.statusText);
        return;
      }
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

  const { online, offline } = sortMqttDates(
    nodes.map((node) =>
      node.mqtt_updated_at ? new Date(node.mqtt_updated_at) : null
    )
  );

  return (
    <>
      <Header online={online} offline={offline} />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<NodeCards nodes={nodes} />} />
          <Route path="/map" element={<WorldMap nodes={nodes} />} />
          <Route path="*" element={<NotFound />} /> {/* 404 Route */}
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
