const mongoose = require("mongoose");

const SolarStationSchema =
new mongoose.Schema({

   stationId: {

      type: String,

      required: true,

      unique: true

   },

   stationName: {

      type: String,

      required: true

   },

   location: {

      type: String,

      required: true

   },

   mqttTopic: {

      type: String

   },

   createdAt: {

      type: Date,

      default: Date.now

   }

});

module.exports = mongoose.model(

   "SolarStation",

   SolarStationSchema

);