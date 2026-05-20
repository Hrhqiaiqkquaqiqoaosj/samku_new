const mqtt = require("mqtt");
const SolarData = require("../models/SolarData");

const client = mqtt.connect("mqtt://broker.hivemq.com");

client.on("connect", () => {
  console.log("🌞 Solar MQTT Connected");
  client.subscribe("samku/solar/+");
});

client.on("message", async (topic, message) => {
  try {
    const data = JSON.parse(message.toString());

    await SolarData.create({
      plantId: topic.split("/")[2],
      voltage: data.voltage,
      current: data.current,
      power: data.power,
      energyToday: data.energy,
      temperature: data.temp,
      status: data.status
    });

    console.log("📊 Solar Data Saved:", data);
  } catch (err) {
    console.error("Solar MQTT Error:", err);
  }
});
0