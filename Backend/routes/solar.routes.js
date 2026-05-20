const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { saveSolarData } = require("../services/solar.service");

const SolarData = mongoose.model("SolarData");

console.log("🌐 Solar HTTP Routes Loaded");

/*
-----------------------------------
POST /api/solar/push
-----------------------------------
*/
router.post("/push", async (req, res) => {
  try {
    const data = req.body;

    // Basic validation
    if (!data.voltage || !data.current) {
      return res.status(400).json({
        success: false,
        message: "Invalid solar data"
      });
    }

    const solarPayload = {
      plantId: data.plantId || "Plant-1",
      voltage: Number(data.voltage),
      current: Number(data.current),
      power: Number(data.power),
      energy: Number(data.energy),
      temp: Number(data.temp),
      status: data.status || "Online",
      timestamp: new Date()
    };

    await saveSolarData(solarPayload);

    console.log("📥 Solar Data Saved");

    // 🔴 REAL-TIME BROADCAST TO UI
    if (global.ocppServer) {
      global.ocppServer.broadcastToUIClients({
        type: "solarUpdate",
        data: solarPayload
      });
    }

    res.json({
      success: true,
      message: "Solar Data Saved Successfully"
    });

  } catch (error) {
    console.error("❌ Solar Push Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save solar data"
    });
  }
});

/*
-----------------------------------
GET /api/solar/latest
-----------------------------------
*/
router.get("/latest", async (req, res) => {
  try {
    const latest = await SolarData
      .find()
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      success: true,
      data: latest
    });

  } catch (error) {
    console.error("❌ Fetch Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch solar data"
    });
  }
});

module.exports = router;
