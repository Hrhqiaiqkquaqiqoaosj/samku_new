const mqtt = require("mqtt");
require("dotenv").config();

const MQTT_URL =

`mqtt://${process.env.MQTT_HOST}:${process.env.MQTT_PORT}`;

const client = mqtt.connect(

   MQTT_URL,

   {
      clientId:
         process.env.MQTT_CLIENT_ID
   }

);

client.on("connect", () => {

   console.log(
      "✅ DLB CMS Connected"
   );

   setInterval(() => {

      const payload = {

         chargerId: "CH-01",

         allocatedPower: 5000,

         dlbActive: true

      };

      client.publish(

         "cms/dlb/allocation",

         JSON.stringify(payload)

      );

      console.log(
         "📤 DLB SENT:",
         payload
      );

   }, 5000);

});