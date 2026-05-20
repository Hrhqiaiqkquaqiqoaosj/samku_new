const WebSocket = require("ws");
const { v4: uuidv4 } = require("uuid");

// 🔹 Charger Configuration
const chargerId = "TEST_CP_001";
const protocol = "ocpp1.6";

// ✅ IMPORTANT: NO SPACE before email
const USER_EMAIL = "nagosesarthak1588@gmail.com"

let ws;
let heartbeatInterval = 300;
let transactionId = null;
let meterInterval = null;

// =============================
// 🔌 CONNECT TO CMS
// =============================
function connect() {
  ws = new WebSocket(
    `ws://localhost:5000/ocpp/${chargerId}`,
    [protocol]
  );

  ws.on("open", () => {
    console.log("🔌 Connected to CMS");
    sendBootNotification();
  });

  ws.on("message", (data) => {
    const message = JSON.parse(data.toString());
    console.log("📩 Received:", message);

    const [messageType, messageId, payload] = message;

    if (messageType === 3) {
      handleCallResult(payload);
    }

    if (messageType === 2) {
      handleServerCall(message);
    }
  });

  ws.on("close", () => {
    console.log("❌ Disconnected. Reconnecting in 5s...");
    setTimeout(connect, 5000);
  });

  ws.on("error", (err) => {
    console.error("WebSocket error:", err.message);
  });
}

// =============================
// 📤 SEND MESSAGE
// =============================
function sendMessage(action, payload) {
  const messageId = uuidv4();
  const message = [2, messageId, action, payload];
  ws.send(JSON.stringify(message));
}

// =============================
// 🔹 OCPP MESSAGES
// =============================

function sendBootNotification() {
  console.log("📢 Sending BootNotification...");
  sendMessage("BootNotification", {
    chargePointVendor: "Samku",
    chargePointModel: "EV-Model-X"
  });
}

function sendHeartbeat() {
  sendMessage("Heartbeat", {});
}

function sendAuthorize() {
  console.log("🔐 Sending Authorize...");
  sendMessage("Authorize", { idTag: USER_EMAIL });
}

function sendStartTransaction() {
  console.log("🚀 Sending StartTransaction...");
  sendMessage("StartTransaction", {
    connectorId: 1,
    idTag: USER_EMAIL,
    meterStart: 0,
    timestamp: new Date().toISOString()
  });
}

function sendMeterValues() {
  if (!transactionId) return;

  sendMessage("MeterValues", {
    connectorId: 1,
    transactionId: transactionId,
    meterValue: [
      {
        timestamp: new Date().toISOString(),
        sampledValue: [
          {
            value: Math.floor(Math.random() * 100 + 10).toString(),
            measurand: "Energy.Active.Import.Register",
            unit: "Wh"
          }
        ]
      }
    ]
  });

  console.log("📊 MeterValues sent");
}

function sendStopTransaction() {
  if (!transactionId) return;

  console.log("🛑 Sending StopTransaction...");

  sendMessage("StopTransaction", {
    transactionId: transactionId,
    meterStop: 150,
    timestamp: new Date().toISOString(),
    idTag: USER_EMAIL
  });

  clearInterval(meterInterval);
  transactionId = null;
}

// =============================
// 📥 HANDLE CMS RESPONSE
// =============================
function handleCallResult(payload) {

  // BootNotification response
  if (payload.interval) {
    heartbeatInterval = payload.interval;
    console.log("💓 Heartbeat interval:", heartbeatInterval);

    setInterval(sendHeartbeat, heartbeatInterval * 1000);

    // Auto flow
    setTimeout(sendAuthorize, 2000);
    setTimeout(sendStartTransaction, 4000);
  }

  // StartTransaction response
  if (payload.transactionId) {
    transactionId = payload.transactionId;
    console.log("🔋 Transaction started ID:", transactionId);

    meterInterval = setInterval(sendMeterValues, 10000);

    setTimeout(sendStopTransaction, 30000);
  }
}

// =============================
// 📥 HANDLE SERVER COMMANDS
// =============================
function handleServerCall(message) {
  const [messageType, messageId, action] = message;

  console.log("📨 Server Command:", action);

  let response = [3, messageId, {}];

  switch (action) {

    case "RemoteStartTransaction":
      sendAuthorize();
      setTimeout(sendStartTransaction, 2000);
      break;

    case "RemoteStopTransaction":
      sendStopTransaction();
      break;

    default:
      response = [4, messageId, "NotImplemented", "Action not supported", {}];
  }

  ws.send(JSON.stringify(response));
}

// =============================
connect();