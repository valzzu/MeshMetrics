const schemas = require("../schemas");
const { formatNumber } = require("./format");

/**
 * Formats telemetry data with specified precision.
 * @param {Object} telemetry - Telemetry document.
 * @returns {Object} Formatted telemetry object.
 */
function formatTelemetry(telemetry) {
  if (!telemetry) return {};
  return {
    air_util_tx: telemetry.air_util_tx,
    battery_level: telemetry.battery_level,
    channel_utilization: telemetry.channel_utilization,
    uptime_seconds: telemetry.uptime_seconds,
    voltage: telemetry.voltage,
    barometric_pressure: formatNumber(telemetry.barometric_pressure, 1),
    current: telemetry.current,
    gas_resistance: telemetry.gas_resistance,
    iaq: telemetry.iaq,
    lux: telemetry.lux,
    relative_humidity: formatNumber(telemetry.relative_humidity, 1),
    temperature: formatNumber(telemetry.temperature, 1),
    white_lux: telemetry.white_lux,
    wind_direction: telemetry.wind_direction,
    wind_speed: telemetry.wind_speed,
    current_ch1: formatNumber(telemetry.current_ch1, 1),
    current_ch2: formatNumber(telemetry.current_ch2, 1),
    current_ch3: formatNumber(telemetry.current_ch3, 1),
    voltage_ch1: formatNumber(telemetry.voltage_ch1, 1),
    voltage_ch2: formatNumber(telemetry.voltage_ch2, 1),
    voltage_ch3: formatNumber(telemetry.voltage_ch3, 1),
    wind_gust: telemetry.wind_gust,
    wind_lull: telemetry.wind_lull,
  };
}

/**
 * Retrieves combined node data.
 * @returns {Promise<Array<Object>>} Array of node objects.
 */
async function getNodesData() {
  const [nodeInfos, telemetryData] = await Promise.all([
    schemas.nodeinfo.find().lean(),
    schemas.telemetry.find().lean(),
  ]);

  const telemetryMap = new Map(telemetryData.map((t) => [t.from, t]));

  return nodeInfos.map((info) => ({
    id: info._id,
    shortName: info.short_name,
    longName: info.long_name,
    telemetry: formatTelemetry(telemetryMap.get(info.from)),
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
    neighbour_broadcast_interval_secs: info.neighbour_broadcast_interval_secs,
    neighbours: info.neighbours,
    mqtt_connection_state: info.mqtt_connection_state,
    mqtt_updated_at: info.mqtt_updated_at,
    firmware_version: info.firmware_version,
    region: info.region,
    modem_preset: info.modem_preset,
    has_default_channel: info.has_default_channel,
    position_precision: info.position_precision,
    num_online_local_nodes: info.num_online_local_nodes,
  }));
}

module.exports = { getNodesData };
