const express = require("express");

const router = express.Router();

const SolarStation =
require("../models/SolarStation");


// =====================================
// ADD SOLAR STATION
// =====================================

router.post("/add",

async(req, res) => {

   try {

      const {

         stationId,

         stationName,

         location

      } = req.body;

      // AUTO MQTT TOPIC

      const mqttTopic =

      `station/${stationId}/solar/live`;

      // SAVE DATABASE

      const station =

      await SolarStation.create({

         stationId,

         stationName,

         location,

         mqttTopic

      });

      res.json({

         success: true,

         station

      });

   }

   catch(error){

      res.status(500).json({

         success: false,

         message: error.message

      });

   }

});


// =====================================
// GET ALL STATIONS
// =====================================

router.get("/",

async(req, res) => {

   try {

      const stations =

      await SolarStation.find();

      res.json(stations);

   }

   catch(error){

      res.status(500).json({

         success: false,

         message: error.message

      });

   }

});

module.exports = router;