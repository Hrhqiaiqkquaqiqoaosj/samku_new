const mongoose = require("mongoose");

const SolarSchema = new mongoose.Schema({
  plantId: String,
  voltage: Number,
  current: Number,
  power: Number,
  energy: Number,
  temp: Number,
  status: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const SolarData = mongoose.models.SolarData || mongoose.model("SolarData", SolarSchema);

exports.saveSolarData = async (data) => {
  try {
    await SolarData.create(data);
    console.log("📊 Solar Data Saved");
  } catch (err) {
    console.error("Solar Save Error:", err.message);
  }
};
