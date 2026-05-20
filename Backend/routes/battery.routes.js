const express = require("express");
const router = express.Router();

const BatteryData = require("../models/BatteryData");

/*
-----------------------------------
POST /api/battery/push
-----------------------------------
*/
router.post("/push", async (req, res) => {
  try {
    const data = req.body;

    const power = data.voltage * data.current;

    const saved = await BatteryData.create({
      batteryId: data.batteryId || "BESS-1",
      voltage: Number(data.voltage),
      current: Number(data.current),
      power,
      soc: Number(data.soc),
      temperature: Number(data.temperature),
      mode: data.mode || "Idle"
    });

    if (global.ocppServer) {
      global.ocppServer.broadcastToUIClients({
        type: "batteryUpdate",
        data: saved
      });
    }

    res.json({ success: true, message: "Battery Data Saved" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Battery Push Failed" });
  }
});

/*
-----------------------------------
GET /api/battery/latest
-----------------------------------
*/
router.get("/latest", async (req, res) => {
  const data = await BatteryData.find()
    .sort({ createdAt: -1 })
    .limit(10);

  res.json({ success: true, data });
});

module.exports = router;
