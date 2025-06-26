const mongoose = require("mongoose");

const waypointSchema = new mongoose.Schema(
  {
    from: { type: String, required: true }, // Changed to String
    to: String, // Changed to String
    waypoint_id: Number,
    latitude: Number,
    longitude: Number,
    expire: Number,
    locked_to: Number,
    name: String,
    description: String,
    icon: Number,
    channel: Number,
    packet_id: Number,
    channel_id: String,
    gateway_id: mongoose.Schema.Types.BigInt,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Waypoint", waypointSchema);
