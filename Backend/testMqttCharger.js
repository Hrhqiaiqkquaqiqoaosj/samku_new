const mqtt = require("mqtt");

const chargerId = "CP001";

// 🔥 IMPORTANT FIX
const client = mqtt.connect("mqtt://52.58.229.146:1883");

client.on("connect", () => {
  console.log("✅ Charger connected to broker");

  client.publish(
    `charger/${chargerId}/boot`,
    JSON.stringify({
      vendor: "Samku",
      model: "EVX",
      timestamp: new Date().toISOString()
    })
  );
});

client.on("error", (err) => {
  console.error("❌ MQTT Error:", err.message);
});

client.on("reconnect", () => {
  console.log("🔄 Reconnecting...");
});