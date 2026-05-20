const express = require("express");
const router = express.Router();

const { calculateEMS } = require("../services/ems.logic");

// GET EMS STATUS
router.get("/latest", async (req, res) => {
  try {

    const result = await calculateEMS();

    res.json(result);

  } catch (error) {
    console.error("EMS Error:", error);
    res.status(500).json({
      success: false,
      message: "EMS calculation failed"
    });
  }
});

module.exports = router;
