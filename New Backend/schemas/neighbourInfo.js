const mongoose = require("mongoose");

const neighbourInfoSchema = new mongoose.Schema({
  from: { type: String, required: true }, // Changed to String
  node_broadcast_interval_secs: Number,
  neighbours: [{ node_id: Number, snr: Number }],
}, { timestamps: true });

module.exports = mongoose.model("NeighbourInfo", neighbourInfoSchema);