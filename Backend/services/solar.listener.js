const mqtt = require("mqtt");

const client = mqtt.connect(
   "mqtt://broker.hivemq.com:1883"
);

// ============================
// CONNECT
// ============================

client.on("connect", () => {

   console.log(
      "☀ Solar Listener Connected"
   );

   // ALL SOLAR STATIONS

   client.subscribe(
      "station/+/solar/live"
   );

});

// ============================
// RECEIVE DATA
// ============================

client.on("message",

(topic, message) => {

   try {

      const data =
      JSON.parse(message.toString());

      console.log(
         "\n☀ SOLAR DATA"
      );

      console.log(
         "Topic:",
         topic
      );

      console.log(data);

   }

   catch(error){

      console.log(error.message);

   }

});

module.exports = client;