const mongoose = require("mongoose");

const gridSchema = new mongoose.Schema({
  gridId: { type: String, default: "GRID-1" },
  voltage: Number,
  current: Number,
  power: Number,
  frequency: Number,
  status: { type: String, default: "ON" }, // ON / OFF
  direction: String // Import / Export
}, { timestamps: true });

module.exports = mongoose.model("GridData", gridSchema);
