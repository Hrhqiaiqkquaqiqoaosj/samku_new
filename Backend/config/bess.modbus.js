const ModbusRTU = require("modbus-serial");

const client = new ModbusRTU();

async function connectBess() {
  try {
    await client.connectTCP("192.168.1.120", { port: 502 }); // BESS IP
    client.setID(1);
    console.log("BESS Connected");
  } catch (err) {
    console.error("BESS Connection Error:", err);
  }
}

async function readBessData() {
  try {
    const soc = await client.readHoldingRegisters(0, 1);
    const voltage = await client.readHoldingRegisters(1, 1);
    const current = await client.readHoldingRegisters(2, 1);
    const temp = await client.readHoldingRegisters(3, 1);

    return {
      soc: soc.data[0],
      voltage: voltage.data[0],
      current: current.data[0],
      temperature: temp.data[0],
      timestamp: new Date()
    };
  } catch (err) {
    console.error("BESS Read Error:", err);
    return null;
  }
}

module.exports = { connectBess, readBessData };
