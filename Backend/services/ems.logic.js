const SolarData = require("../models/SolarData");
const BatteryData = require("../models/BatteryData");
const GridData = require("../models/GridData");
const Charger = require("../models/Charger");

// ==========================================
// CONFIGURATION
// ==========================================

const MIN_SOC = 20;                  // Minimum battery SOC %
const MAX_SOC = 85;                  // Maximum battery SOC %

const BATTERY_MAX_DISCHARGE = 5000; // 5kW
const BATTERY_MAX_CHARGE = 5000;    // 5kW

const HUB_MAX_POWER = 15000;        // 15kW hub limit

// ==========================================
// EMS MAIN FUNCTION
// ==========================================

async function calculateEMS() {

  try {

    // ==========================================
    // 1️⃣ GET LATEST DATA
    // ==========================================

    const solar = await SolarData
      .findOne()
      .sort({ createdAt: -1 });

    const battery = await BatteryData
      .findOne()
      .sort({ createdAt: -1 });

    const grid = await GridData
      .findOne()
      .sort({ createdAt: -1 });

    const chargers = await Charger.find({
      status: "Charging"
    });

    // ==========================================
    // 2️⃣ LIVE POWER VALUES
    // ==========================================

    const solarPower =
      solar?.power || 0;

    const batterySOC =
      battery?.soc || 0;

    const batteryPower =
      battery?.availablePower || 0;

    const gridPower =
      grid?.availablePower || 0;

    const gridAvailable =
      grid?.status === "ON";

    // ==========================================
    // 3️⃣ TOTAL HUB CAPACITY
    // ==========================================

    const hubCapacity = Math.min(

      solarPower +
      batteryPower +
      gridPower,

      HUB_MAX_POWER

    );

    // ==========================================
    // 4️⃣ CALCULATE CHARGER LOAD
    // ==========================================

    let loadDemand = 0;

    chargers.forEach(charger => {

      loadDemand +=
        charger.currentPower || 0;

    });

    // ==========================================
    // 5️⃣ DLB LOGIC
    // ==========================================

    let dlbActive = false;

    let powerPerCharger = 0;

    let chargerAllocations = [];

    if (
      loadDemand > hubCapacity &&
      chargers.length > 0
    ) {

      dlbActive = true;

      powerPerCharger =
        hubCapacity / chargers.length;

      chargers.forEach(charger => {

        chargerAllocations.push({

          chargerId:
            charger.serialNumber,

          requestedPower:
            charger.currentPower,

          allocatedPower:
            powerPerCharger

        });

      });

    } else {

      chargers.forEach(charger => {

        chargerAllocations.push({

          chargerId:
            charger.serialNumber,

          requestedPower:
            charger.currentPower,

          allocatedPower:
            charger.currentPower

        });

      });

    }

    // ==========================================
    // 6️⃣ ENERGY FLOW LOGIC
    // ==========================================

    let usedByLoad = 0;

    let chargeToBattery = 0;

    let dischargeFromBattery = 0;

    let exportToGrid = 0;

    let importFromGrid = 0;

    // ==========================================
    // 🔆 SOLAR PRIORITY
    // ==========================================

    if (solarPower >= loadDemand) {

      usedByLoad = loadDemand;

      const excessSolar =
        solarPower - loadDemand;

      // ========================================
      // 🔋 CHARGE BATTERY
      // ========================================

      if (batterySOC < MAX_SOC) {

        chargeToBattery = Math.min(

          excessSolar,

          BATTERY_MAX_CHARGE

        );

      }

      // ========================================
      // ⚡ EXPORT TO GRID
      // ========================================

      else {

        exportToGrid =
          excessSolar;

      }

    }

    // ==========================================
    // 🔋 SOLAR NOT ENOUGH
    // ==========================================

    else {

      usedByLoad = solarPower;

      const remainingLoad =
        loadDemand - solarPower;

      // ========================================
      // 🔋 BATTERY SUPPORT
      // ========================================

      if (batterySOC > MIN_SOC) {

        dischargeFromBattery =
          Math.min(

            remainingLoad,

            BATTERY_MAX_DISCHARGE

          );

        usedByLoad +=
          dischargeFromBattery;

      }

      // ========================================
      // ⚡ GRID SUPPORT
      // ========================================

      const stillRemaining =
        loadDemand - usedByLoad;

      if (

        stillRemaining > 0 &&
        gridAvailable

      ) {

        importFromGrid =
          stillRemaining;

        usedByLoad +=
          stillRemaining;

      }

    }

    // ==========================================
    // 7️⃣ SYSTEM MODE
    // ==========================================

    let systemMode = "Idle";

    if (dlbActive)
      systemMode = "DLB Active";

    if (chargeToBattery > 0)
      systemMode = "Charging Battery";

    if (dischargeFromBattery > 0)
      systemMode = "Battery Supplying Load";

    if (exportToGrid > 0)
      systemMode = "Exporting To Grid";

    if (importFromGrid > 0)
      systemMode = "Importing From Grid";

    // ==========================================
    // 8️⃣ BATTERY BACKUP TIME
    // ==========================================

    const backupTime =

      loadDemand > 0

      ? (
          battery?.availableEnergy || 0
        ) / loadDemand

      : 0;

    // ==========================================
    // 9️⃣ RETURN EMS RESPONSE
    // ==========================================

    return {

      success: true,

      // ========================================
      // LIVE POWER DATA
      // ========================================

      solarPower,
      batteryPower,
      gridPower,

      // ========================================
      // SYSTEM DATA
      // ========================================

      loadDemand,
      hubCapacity,

      activeChargers:
        chargers.length,

      batterySOC,
      gridAvailable,

      // ========================================
      // DLB DATA
      // ========================================

      dlbActive,
      powerPerCharger,

      chargerAllocations,

      // ========================================
      // POWER FLOW
      // ========================================

      usedByLoad,
      chargeToBattery,
      dischargeFromBattery,

      importFromGrid,
      exportToGrid,

      // ========================================
      // BACKUP
      // ========================================

      backupTime,

      // ========================================
      // MODE
      // ========================================

      systemMode

    };

  }

  catch (error) {

    console.error(
      "EMS ERROR:",
      error
    );

    return {

      success: false,

      message:
        error.message

    };

  }

}

module.exports = {
  calculateEMS
};