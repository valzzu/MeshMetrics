const mongoose = require("mongoose");

const textMessageSchema = new mongoose.Schema({
  from: { type: String, required: true }, // Changed to String
  to: String, // Changed to String
  channel: Number,
  packet_id: Number,
  channel_id: String,
  gateway_id: mongoose.Schema.Types.BigInt,
  text: String,
  rx_time: Number,
  rx_snr: Number,
  rx_rssi: Number,
  hop_limit: Number,
}, { timestamps: true });

module.exports = mongoose.model("TextMessage", textMessageSchema);