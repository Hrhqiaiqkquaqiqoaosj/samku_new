const mongoose = require("mongoose");

const solarDataSchema = new mongoose.Schema({
  plantId: String,
  voltage: Number,
  current: Number,
  power: Number,
  energyToday: Number,
  temperature: Number,
  status: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("SolarData", solarDataSchema);
