const mongoose = require("mongoose");

const positionSchema = new mongoose.Schema({
  from: { type: String, required: true }, // Changed to String
  to: String, // Changed to String
  channel: Number,
  packet_id: Number,
  channel_id: String,
  gateway_id: mongoose.Schema.Types.BigInt,
  latitude: Number,
  longitude: Number,
  altitude: Number,
  precision_bits: Number,
  time: Number,
}, { timestamps: true });

module.exports = mongoose.model("Position", positionSchema);