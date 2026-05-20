const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({

  // ==============================
  // 🔹 BASIC IDENTIFICATION
  // ==============================

  transactionId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },

  chargerId: {
    type: String,
    required: true,
    trim: true
  },

  // 🔥 Track which protocol created this session
  protocolVersion: {
    type: String,
    enum: ["1.6", "2.0.1"],
    default: "1.6"
  },

  // ==============================
  // 🔹 CONNECTOR / EVSE
  // ==============================

  // OCPP 1.6
  connectorId: {
    type: Number,
    min: 1,
    default: 1
  },

  // OCPP 2.0.1
  evseId: {
    type: Number,
    default: null
  },

  // ==============================
  // 🔹 AUTHENTICATION
  // ==============================

  // OCPP 1.6
  idTag: {
    type: String,
    trim: true,
    default: null
  },

  // OCPP 2.0.1
  idToken: {
    type: String,
    trim: true,
    default: null
  },

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },

  // ==============================
  // 🔹 TIMINGS
  // ==============================

  startTime: {
    type: Date,
    required: true,
    default: Date.now
  },

  endTime: {
    type: Date,
    default: null
  },

  duration: {
    type: Number, // seconds
    min: 0,
    default: 0
  },

  // ==============================
  // 🔹 ENERGY DATA
  // ==============================

  meterStart: {
    type: Number,
    min: 0,
    default: 0
  },

  meterStop: {
    type: Number,
    min: 0,
    default: 0
  },

  // 🔥 STORED IN kWh (NOT Wh)
  energyConsumed: {
    type: Number,
    min: 0,
    default: 0
  },

  // ==============================
  // 🔹 2.0.1 SPECIFIC
  // ==============================

  triggerReason: {
    type: String,
    default: null
  },

  stopReason: {
    type: String,
    enum: [
      "EVDisconnected",
      "EmergencyStop",
      "EnergyLimitReached",
      "GroundFault",
      "ImmediateReset",
      "Local",
      "Other",
      "OvercurrentFault",
      "PowerLoss",
      "PowerQuality",
      "Reboot",
      "Remote",
      "SOCLimitReached",
      "StoppedByEV",
      "TimeLimitReached",
      "Timeout"
    ],
    required: false
  },

  // ==============================
  // 🔹 STATUS
  // ==============================

  status: {
    type: String,
    enum: ["INITIATED", "ACTIVE", "COMPLETED", "FAILED", "CANCELLED"],
    default: "INITIATED",
    required: true
  },

  // ==============================
  // 🔹 PRICING
  // ==============================

  pricing: {
    ratePerKWh: { type: Number, default: 0 },
    ratePerMinute: { type: Number, default: 0 },
    currency: { type: String, default: "INR" },
    energyCost: { type: Number, default: 0 },
    timeCost: { type: Number, default: 0 },
    taxes: { type: Number, default: 0 },
    discounts: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 }
  },

  payment: {
    method: {
      type: String,
      enum: ["WALLET", "CARD", "UPI", "CASH", "SUBSCRIPTION"],
      default: "WALLET"
    },
    status: {
      type: String,
      enum: ["PENDING", "COMPLETED", "FAILED", "REFUNDED"],
      default: "PENDING"
    }
  },

  // ==============================
  // 🔹 METER VALUES HISTORY
  // ==============================

  meterValues: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    values: [{
      measurand: String,
      value: Number,
      unit: String
    }]
  }]

}, { timestamps: true });


// ============================================
// 🔥 AUTO CALCULATE ENERGY IN kWh
// ============================================

transactionSchema.pre("save", function (next) {
  if (this.meterStop >= this.meterStart) {
    // Convert Wh → kWh
    this.energyConsumed = (this.meterStop - this.meterStart) / 1000;
  }
  next();
});


// ============================================
// 🔥 INDEXING FOR PERFORMANCE
// ============================================

transactionSchema.index({ chargerId: 1 });
transactionSchema.index({ userId: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ createdAt: -1 });


// ============================================
// 🔥 EXPORT MODEL
// ============================================

module.exports = mongoose.model("Transaction", transactionSchema);