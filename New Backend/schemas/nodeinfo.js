const mongoose = require("mongoose");

const nodeinfoSchema = new mongoose.Schema({
  from: { type: String, required: true }, // Changed to String
  id: String,
  long_name: String,
  short_name: String,
  hardware_model: Number,
  role: Number,
  hop_start: Number,
  hops_away: Number,
  timestamp: Number,
  latitude: Number,
  longitude: Number,
  altitude: Number,
  position_updated_at: Date,
  neighbours_updated_at: Date,
  neighbour_broadcast_interval_secs: Number,
  neighbours: [{ node_id: Number, snr: Number }],
  mqtt_connection_state: String,
  mqtt_updated_at: Date,
  firmware_version: String,
  region: Number,
  modem_preset: Number,
  has_default_channel: Boolean,
  position_precision: Number,
  num_online_local_nodes: Number,
}, { timestamps: true });

module.exports = mongoose.model("NodeInfo", nodeinfoSchema);