const { Schema, model } = require("mongoose");

const telemetrySchema = Schema(
  {
    from: { type: String, required: true }, // Changed to String
    air_util_tx: String,
    battery_level: String,
    channel_utilization: String,
    uptime_seconds: String,
    voltage: String,
    barometric_pressure: String,
    current: String,
    gas_resistance: String,
    iaq: String,
    lux: String,
    relative_humidity: String,
    temperature: String,
    voltage: String,
    white_lux: String,
    wind_direction: String,
    wind_speed: String,
    current_ch1: String,
    current_ch2: String,
    current_ch3: String,
    voltage_ch1: String,
    voltage_ch2: String,
    voltage_ch3: String,
  },
  { timestamps: true }
);

module.exports = model("telemetry", telemetrySchema, "telemetry");
