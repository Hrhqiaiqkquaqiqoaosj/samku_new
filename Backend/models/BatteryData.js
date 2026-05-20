const mongoose = require("mongoose");

const batterySchema = new mongoose.Schema({
  batteryId: { type: String, default: "BESS-1" },
  voltage: Number,
  current: Number,
  power: Number,
  soc: Number,        // State of Charge %
  temperature: Number,
  mode: String,       // Charging / Discharging / Idle
}, { timestamps: true });

module.exports = mongoose.model("BatteryData", batterySchema);
