const express = require("express");
const router = express.Router();
const GridData = require("../models/GridData");

/*
-----------------------------------
POST /api/grid/push
-----------------------------------
*/
router.post("/push", async (req, res) => {
  try {
    const data = req.body;

    const power = data.voltage * data.current;

    await GridData.create({
      gridId: data.gridId || "GRID-1",
      voltage: Number(data.voltage),
      current: Number(data.current),
      power,
      frequency: Number(data.frequency),
      mode: data.mode || "Import"
    });

    res.json({ success: true, message: "Grid Data Saved" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Grid Push Failed" });
  }
});

/*
-----------------------------------
GET /api/grid/latest
-----------------------------------
*/
router.get("/latest", async (req, res) => {
  const data = await GridData.find()
    .sort({ createdAt: -1 })
    .limit(10);

  res.json({ success: true, data });
});

module.exports = router;
