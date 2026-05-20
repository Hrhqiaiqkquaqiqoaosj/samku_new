const WebSocket = require("ws");

const chargerId = "TEST_CHARGER_201";

const ws = new WebSocket(
  `ws://localhost:5000/ocpp/${chargerId}`,
  "ocpp2.0.1"
);

ws.on("open", () => {
  console.log("🔌 Connected using OCPP 2.0.1");

  // 1️⃣ BootNotification
  ws.send(JSON.stringify([
    2,
    "msg1",
    "BootNotification",
    {
      chargingStation: {
        model: "Samku-DC",
        vendorName: "Samku"
      },
      reason: "PowerUp"
    }
  ]));

  // 2️⃣ Start Transaction
  setTimeout(() => {
    ws.send(JSON.stringify([
      2,
      "msg2",
      "TransactionEvent",
      {
        eventType: "Started",
        timestamp: new Date().toISOString(),
        transactionInfo: {
          transactionId: "TX201"
        },
        meterValue: [{
          sampledValue: [{
            value: "0"
          }]
        }]
      }
    ]));
  }, 3000);

  // 3️⃣ Update Meter
  setTimeout(() => {
    ws.send(JSON.stringify([
      2,
      "msg3",
      "TransactionEvent",
      {
        eventType: "Updated",
        timestamp: new Date().toISOString(),
        transactionInfo: {
          transactionId: "TX201"
        },
        meterValue: [{
          sampledValue: [{
            value: "5000"
          }]
        }]
      }
    ]));
  }, 6000);

  // 4️⃣ End Transaction
  setTimeout(() => {
    ws.send(JSON.stringify([
      2,
      "msg4",
      "TransactionEvent",
      {
        eventType: "Ended",
        timestamp: new Date().toISOString(),
        transactionInfo: {
          transactionId: "TX201"
        },
        meterValue: [{
          sampledValue: [{
            value: "15000"
          }]
        }]
      }
    ]));
  }, 9000);
});

ws.on("message", (data) => {
  console.log("📩 Received:", data.toString());
});

ws.on("close", () => {
  console.log("❌ Disconnected");
});

ws.on("error", (err) => {
  console.error("⚠️ Error:", err.message);
});