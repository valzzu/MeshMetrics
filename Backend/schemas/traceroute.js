const mongoose = require("mongoose");

const tracerouteSchema = new mongoose.Schema({
  from: { type: String, required: true }, // Changed to String
  to: String, // Changed to String
  want_response: Boolean,
  route: [Number],
  snr_towards: Number,
  route_back: [Number],
  snr_back: Number,
  channel: Number,
  packet_id: Number,
  channel_id: String,
  gateway_id: mongoose.Schema.Types.BigInt,
}, { timestamps: true });

module.exports = mongoose.model("Traceroute", tracerouteSchema);