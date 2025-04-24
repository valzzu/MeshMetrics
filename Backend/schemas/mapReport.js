const mongoose = require("mongoose");

const mapReportSchema = new mongoose.Schema({
  from: { type: String, required: true }, // Changed to String
  long_name: String,
  short_name: String,
  role: Number,
  hardware_model: Number,
  firmware_version: String,
  region: Number,
  modem_preset: Number,
  has_default_channel: Boolean,
  latitude: Number,
  longitude: Number,
  altitude: Number,
  position_precision: Number,
  num_online_local_nodes: Number,
}, { timestamps: true });

module.exports = mongoose.model("MapReport", mapReportSchema);