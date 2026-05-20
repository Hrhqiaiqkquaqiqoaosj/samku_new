import React, { useEffect, useState } from "react";
import axios from "axios";

const BatteryDashboard = () => {
  const [battery, setBattery] = useState(null);

  const fetchBatteryData = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/battery/latest"
      );

      if (res.data.success && res.data.data.length > 0) {
        setBattery(res.data.data[0]); // Latest record
      }
    } catch (error) {
      console.error("Battery Fetch Error:", error);
    }
  };

  useEffect(() => {
    fetchBatteryData();
    const interval = setInterval(fetchBatteryData, 5000); // Auto refresh
    return () => clearInterval(interval);
  }, []);

  if (!battery) return <h2>Loading Battery Data...</h2>;

  return (
    <div style={{ padding: "30px" }}>
      <h1>🔋 BESS Dashboard</h1>

      <div style={cardStyle}>
        <h2>Battery ID: {battery.batteryId}</h2>
        <p>Voltage: {battery.voltage} V</p>
        <p>Current: {battery.current} A</p>
        <p>Power: {battery.power} W</p>
        <p>State of Charge: {battery.soc} %</p>
        <p>Temperature: {battery.temperature} °C</p>
        <p>Mode: {battery.mode}</p>
        <p>Updated: {new Date(battery.createdAt).toLocaleString()}</p>
      </div>
    </div>
  );
};

const cardStyle = {
  background: "#1e293b",
  color: "white",
  padding: "20px",
  borderRadius: "10px",
  width: "350px",
  marginTop: "20px"
};

export default BatteryDashboard;
