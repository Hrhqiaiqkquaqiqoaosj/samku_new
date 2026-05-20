import React, { useEffect, useState } from "react";
import axios from "axios";

const GridDashboard = () => {
  const [grid, setGrid] = useState(null);

  const fetchGrid = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/grid/latest");

      if (res.data.success && res.data.data.length > 0) {
        setGrid(res.data.data[0]);
      }
    } catch (error) {
      console.error("Grid Fetch Error:", error);
    }
  };

  useEffect(() => {
    fetchGrid();
    const interval = setInterval(fetchGrid, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!grid) return <h2>Loading Grid Data...</h2>;

  return (
    <div style={{ padding: "30px" }}>
      <h1>⚡ Grid Dashboard</h1>

      <div style={cardStyle}>
        <h2>Grid ID: {grid.gridId}</h2>
        <p>Voltage: {grid.voltage} V</p>
        <p>Current: {grid.current} A</p>
        <p>Power: {grid.power} W</p>
        <p>Frequency: {grid.frequency} Hz</p>
        <p>Mode: {grid.mode}</p>
        <p>Updated: {new Date(grid.createdAt).toLocaleString()}</p>
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

export default GridDashboard;
