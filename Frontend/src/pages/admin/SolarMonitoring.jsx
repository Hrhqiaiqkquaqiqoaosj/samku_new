import { useEffect, useState } from "react";
import axios from "axios";
import { Sun } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

const SolarMonitoring = () => {
  const [solarData, setSolarData] = useState([]);
  const [latest, setLatest] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSolarData = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/solar/latest"
      );

      if (res.data.success) {
        const data = res.data.data || [];

        // Sort oldest → newest for chart
        const sortedData = [...data].sort(
          (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
        );

        setSolarData(sortedData);

        if (sortedData.length > 0) {
          setLatest(sortedData[sortedData.length - 1]);
        }
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching solar data:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSolarData();

    const interval = setInterval(() => {
      fetchSolarData();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="p-6">Loading Solar Data...</div>;
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Sun className="text-yellow-500" />
        <h1 className="text-2xl font-bold">
          Solar Monitoring Dashboard
        </h1>
      </div>

      {!latest && (
        <p className="text-gray-500">
          No Solar Data Available
        </p>
      )}

      {latest && (
        <>
          {/* 🔹 Live Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">

            <div className="bg-white dark:bg-slate-800 p-5 rounded-lg shadow">
              <p className="text-gray-500 text-sm">Voltage</p>
              <h2 className="text-2xl font-bold">
                {latest.voltage} V
              </h2>
            </div>

            <div className="bg-white dark:bg-slate-800 p-5 rounded-lg shadow">
              <p className="text-gray-500 text-sm">Current</p>
              <h2 className="text-2xl font-bold">
                {latest.current} A
              </h2>
            </div>

            <div className="bg-white dark:bg-slate-800 p-5 rounded-lg shadow">
              <p className="text-gray-500 text-sm">Power</p>
              <h2 className="text-2xl font-bold">
                {latest.power} W
              </h2>
            </div>

            <div className="bg-white dark:bg-slate-800 p-5 rounded-lg shadow">
              <p className="text-gray-500 text-sm">Status</p>
              <h2
                className={`text-2xl font-bold ${
                  latest.status === "Online"
                    ? "text-green-500"
                    : "text-red-500"
                }`}
              >
                {latest.status}
              </h2>
            </div>

          </div>

          {/* 🔹 Power Chart */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">
              Live Power Output (W)
            </h2>

            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={solarData}>
                <CartesianGrid strokeDasharray="3 3" />

                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(value) =>
                    new Date(value).toLocaleTimeString()
                  }
                />

                <YAxis />

                <Tooltip
                  labelFormatter={(value) =>
                    new Date(value).toLocaleString()
                  }
                />

                <Line
                  type="monotone"
                  dataKey="power"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
};

export default SolarMonitoring;
