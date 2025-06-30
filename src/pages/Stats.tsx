import { useEffect } from "react";
import config from "../config.json";

function Stats() {
  useEffect(() => {
    const fetchData = async () => {
      try {
        const portnums = await fetch(`${config.api_url}/api/portnums`);
        if (!portnums.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await portnums.json();
        console.log("portnums data:", data);
      } catch (error) {
        console.error("Error fetching portnums:", error);
      }
      try {
        const packets = await fetch(`${config.api_url}/api/packets`);
        if (!packets.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await packets.json();
        console.log("packet data:", data);
      } catch (error) {
        console.error("Error fetching packets:", error);
      }
    };

    fetchData();
  }, []);
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h1 className="text-4xl font-bold mb-4">Stats Page</h1>
      <p className="text-lg text-gray-700">This is the stats page.</p>
    </div>
  );
}
export default Stats;
