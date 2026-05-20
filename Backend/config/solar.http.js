// ✅ Correct path (NO "s")
const { saveSolarData } = require("../services/solar.service");

module.exports = (app) => {

  console.log("🌐 Solar HTTP Protocol Initialized");

  // 📡 Solar device sends data via HTTP POST
  app.post("/api/solar/push", async (req, res) => {
    try {

      const data = req.body;

      // Basic validation
      if (!data.voltage || !data.current) {
        return res.status(400).json({
          success: false,
          message: "Invalid solar data"
        });
      }

      await saveSolarData({
        plantId: data.plantId || "HTTP-Plant",
        voltage: Number(data.voltage),
        current: Number(data.current),
        power: Number(data.power),
        energy: Number(data.energy),
        temp: Number(data.temp),
        status: data.status || "Running"
      });

      console.log("📥 HTTP Solar Data Saved");

      res.json({
        success: true,
        message: "Solar Data Saved Successfully"
      });

    } catch (error) {
      console.error("❌ HTTP Solar Error:", error.message);
      res.status(500).json({
        success: false,
        message: "Failed to save solar data"
      });
    }
  });

};
