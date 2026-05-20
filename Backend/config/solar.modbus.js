const ModbusRTU = require("modbus-serial");
const { saveSolarData } = require("../services/solar.service");

const client = new ModbusRTU();

async function startModbus() {

  try {
    console.log("🔌 Connecting to Solar Modbus...");

    // Change IP to your inverter IP
    await client.connectTCP("192.168.1.50", { port: 502 });

    client.setID(1);

    console.log("🔌 Solar Modbus Connected");

    setInterval(async () => {

      try {
        const data = await client.readHoldingRegisters(0, 6);

        await saveSolarData({
          plantId: "modbus-plant",
          voltage: data.data[0],
          current: data.data[1],
          power: data.data[2],
          energy: data.data[3],
          temp: data.data[4],
          status: "Running"
        });

        console.log("📊 Modbus Data Saved");

      } catch (err) {
        console.log("⚠ Modbus Read Error");
      }

    }, 5000);

  } catch (error) {
    console.log("⚠ Modbus not connected (Demo Mode)");
  }

}

startModbus();
