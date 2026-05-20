const mqtt = require("mqtt");
require("dotenv").config();

// Load from .env
const MQTT_HOST = process.env.MQTT_HOST || "broker.hivemq.com";
const MQTT_PORT = process.env.MQTT_PORT || 1883;
const MQTT_CLIENT_ID = process.env.MQTT_CLIENT_ID || "samku_charger";

// Create URL
const MQTT_URL = `mqtt://${MQTT_HOST}:${MQTT_PORT}`;

// Connect
const client = mqtt.connect(MQTT_URL, {
  clientId: MQTT_CLIENT_ID,
  reconnectPeriod: 5000
});

// =======================
// CONNECT
// =======================
client.on("connect", () => {
  console.log("🔌 CMS connected to MQTT broker:", MQTT_URL);

  client.subscribe("charger/#", () => {
    console.log("📡 CMS subscribed to charger/#");
  });
});

// =======================
// MESSAGE
// =======================
client.on("message", (topic, message) => {
  try {
    const payload = JSON.parse(message.toString());

    const parts = topic.split("/");
    const chargerId = parts[1];
    const type = parts[2];

    console.log(`📩 ${type} from ${chargerId}`, payload);

    handleChargerMessage(chargerId, type, payload);

  } catch (err) {
    console.error("❌ Message Parse Error:", err.message);
  }
});

// =======================
// ERROR HANDLING
// =======================
client.on("error", (err) => {
  console.error("❌ CMS MQTT Error:", err.message);
});

client.on("reconnect", () => {
  console.log("🔄 CMS MQTT Reconnecting...");
});

client.on("offline", () => {
  console.log("⚠ CMS MQTT Offline");
});

// =======================
// LOGIC
// =======================
function handleChargerMessage(chargerId, type, payload) {
  switch (type) {
    case "boot":
      console.log(`⚡ Charger ${chargerId} Booted`);
      break;

    case "heartbeat":
      console.log(`💓 Charger ${chargerId} Alive`);
      break;

    case "start":
      console.log(`🔋 Charging Started`);
      break;

    case "stop":
      console.log(`🛑 Charging Stopped`);
      break;

    case "meter":
      console.log(`📊 Meter Update`);
      break;

    default:
      console.log("⚠ Unknown message type:", type);
  }
}

module.exports = client;