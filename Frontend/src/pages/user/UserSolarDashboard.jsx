import { useEffect, useState } from "react";
import axios from "axios";
import {
  Sun,
  Zap,
  Activity,
  Thermometer,
  Wifi,
  Gauge
} from "lucide-react";
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
    const interval = setInterval(fetchSolarData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="p-6 text-lg">Loading Solar Data...</div>;
  }

  return (
    <div className="p-6 space-y-8">

      {/* HEADER */}
      <div className="flex items-center gap-3">
        <div className="bg-yellow-500 text-white p-3 rounded-lg shadow">
          <Sun size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold">
            Solar Monitoring Dashboard
          </h1>
          <p className="text-sm text-gray-500">
            Real-time solar panel parameters
          </p>
        </div>
      </div>

      {!latest && (
        <p className="text-gray-500">No Solar Data Available</p>
      )}

      {latest && (
        <>
          {/* 🔥 Main Output Card */}
          <div className="bg-gradient-to-br from-yellow-400 to-orange-500 text-white rounded-2xl p-8 shadow-xl flex justify-between items-center">
            <div>
              <p className="opacity-80 text-sm">Current Output</p>
              <h2 className="text-4xl font-bold">
                {latest.power} W
              </h2>

              <span
                className={`mt-3 inline-flex items-center gap-1 text-sm px-3 py-1 rounded-full ${
                  latest.status === "Online"
                    ? "bg-green-500/30"
                    : "bg-red-500/30"
                }`}
              >
                <Wifi size={14} />
                {latest.status}
              </span>
            </div>

            <Sun size={60} className="opacity-80" />
          </div>

          {/* 📊 All Solar Parameters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

            <MetricCard icon={<Zap />} label="Voltage" value={`${latest.voltage} V`} color="blue" />
            <MetricCard icon={<Activity />} label="Current" value={`${latest.current} A`} color="green" />
            <MetricCard icon={<Sun />} label="Power" value={`${latest.power} W`} color="yellow" />
            <MetricCard icon={<Gauge />} label="Frequency" value={`${latest.frequency || 50} Hz`} color="purple" />
            <MetricCard icon={<Sun />} label="Energy Today" value={`${latest.energyToday || 0} kWh`} color="orange" />
            <MetricCard icon={<Sun />} label="Total Energy" value={`${latest.totalEnergy || 0} kWh`} color="indigo" />
            <MetricCard icon={<Thermometer />} label="Panel Temperature" value={`${latest.temperature || 0} °C`} color="red" />
            <MetricCard icon={<Sun />} label="Irradiance" value={`${latest.irradiance || 0} W/m²`} color="cyan" />

          </div>

          {/* 📈 Power Chart */}
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-semibold mb-6">
              Live Power Output (W)
            </h2>

            <ResponsiveContainer width="100%" height={320}>
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

/* 🔹 Reusable Metric Card Component */
const MetricCard = ({ icon, label, value, color }) => {
  const colors = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    yellow: "bg-yellow-500",
    purple: "bg-purple-500",
    orange: "bg-orange-500",
    indigo: "bg-indigo-500",
    red: "bg-red-500",
    cyan: "bg-cyan-500"
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all border border-gray-100 dark:border-gray-700">
      <div className={`${colors[color]} text-white p-3 rounded-lg w-fit`}>
        {icon}
      </div>

      <p className="text-gray-500 text-sm mt-4">{label}</p>
      <h2 className="text-xl font-bold">{value}</h2>
    </div>
  );
};

export default SolarMonitoring;
