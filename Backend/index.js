const express = require("express");
const { connect } = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

// Import schemas from schemas folder
const NodeInfo = require("./schemas/nodeinfo");
const Telemetry = require("./schemas/telemetry");

const app = express();
app.use(express.json());

const allowedOrigin = process.env.FRONTEND_URL;

// CORS configuration
app.use(
  cors({
    origin: allowedOrigin,
    methods: ["GET"],
  })
);

// MongoDB connection
connect(process.env.MONGO_URL, {})
  .then(() => console.log("Connected to Database!"))
  .catch((err) => console.error("Failed to connect to the database:", err));

app.use((req, res, next) => {
  const origin = req.get("Origin");

  console.log("Origin Check");
  // Allow requests from the specified origin
  if (origin === allowedOrigin) {
    console.log("Origin Check passed");
    return next();
  }

  console.log("Origin Check failed");

  // Block requests with no Origin (e.g., direct browser navigation) or incorrect Origin
  res
    .status(403)
    .json({ error: "Access denied: Invalid or missing Origin header" });
});

// REST API endpoint
app.get("/api/nodes", async (req, res) => {
  const nodes = await getNodesData();
  res.json(nodes);
});

// Helper function to get combined nodes data with rounded values
async function getNodesData() {
  const nodeInfos = await NodeInfo.find();
  const telemetryData = await Telemetry.find();

  const nodes = nodeInfos
    .filter((info) => info.short_name && info.long_name) // Skip if short_name or long_name is undefined
    .map((info) => {
      const nodeTelemetry =
        telemetryData.find((t) => t.from === info.from) || {};

      // Function to format numbers from strings with specific precision
      const formatNumber = (value, decimals) => {
        if (!value) return value;
        const num = parseFloat(value);
        return isNaN(num) ? value : num.toFixed(decimals);
      };

      return {
        id: info._id,
        shortName: info.short_name,
        longName: info.long_name,
        telemetry: nodeTelemetry
          ? {
              air_util_tx: nodeTelemetry.air_util_tx,
              battery_level: nodeTelemetry.battery_level,
              channel_utilization: nodeTelemetry.channel_utilization,
              uptime_seconds: nodeTelemetry.uptime_seconds,
              voltage: nodeTelemetry.voltage,
              barometric_pressure: formatNumber(
                nodeTelemetry.barometric_pressure,
                1
              ), // 1000.0 hPa
              current: nodeTelemetry.current,
              gas_resistance: nodeTelemetry.gas_resistance,
              iaq: nodeTelemetry.iaq,
              lux: nodeTelemetry.lux,
              relative_humidity: formatNumber(
                nodeTelemetry.relative_humidity,
                1
              ), // 68.9%
              temperature: formatNumber(nodeTelemetry.temperature, 1), // -0.1°C
              white_lux: nodeTelemetry.white_lux,
              wind_direction: nodeTelemetry.wind_direction,
              wind_speed: nodeTelemetry.wind_speed,
              current_ch1: nodeTelemetry.current_ch1,
              current_ch2: nodeTelemetry.current_ch2,
              current_ch3: nodeTelemetry.current_ch3,
              voltage_ch1: nodeTelemetry.voltage_ch1,
              voltage_ch2: nodeTelemetry.voltage_ch2,
              voltage_ch3: nodeTelemetry.voltage_ch3,
            }
          : {},
        from: info.from,
        hardware_model: info.hardware_model,
        role: info.role,
        hop_start: info.hop_start,
        hops_away: info.hops_away,
        timestamp: info.timestamp,
        latitude: info.latitude,
        longitude: info.longitude,
        altitude: info.altitude,
        position_updated_at: info.position_updated_at,
        neighbours_updated_at: info.neighbours_updated_at,
        neighbour_broadcast_interval_secs:
          info.neighbour_broadcast_interval_secs,
        neighbours: info.neighbours,
        mqtt_connection_state: info.mqtt_connection_state,
        mqtt_updated_at: info.mqtt_updated_at,
        firmware_version: info.firmware_version,
        region: info.region,
        modem_preset: info.modem_preset,
        has_default_channel: info.has_default_channel,
        position_precision: info.position_precision,
        num_online_local_nodes: info.num_online_local_nodes,
      };
    });

  return nodes;
}

const PORT = process.env.PORT || 80;
const server = app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
