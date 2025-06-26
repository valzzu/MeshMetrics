const mongoose = require("mongoose");

const portnumCountSchema = new mongoose.Schema({
  portnum: { type: Number, required: true, unique: true },
  count: { type: Number, default: 0 },
  last_updated: { type: Date, default: Date.now },
});

/**
 * Increments the count for a given portnum.
 * @param {number} portnum - The portnum to increment.
 * @returns {Promise<void>}
 */
(portnumCountSchema.statics.incrementCount = async function (portnum) {
  await this.findOneAndUpdate(
    { portnum },
    { $inc: { count: 1 }, $set: { last_updated: new Date() } },
    { upsert: true }
  );
}),
  { timestamps: true };

module.exports = mongoose.model("PortnumCount", portnumCountSchema);
