import { useEffect, useState } from "react";
import axios from "axios";
import {
  Zap,
  Activity,
  Gauge,
  Wifi,
  ArrowDownUp
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

const UserGridDashboard = () => {
  const [gridData, setGridData] = useState([]);
  const [latest, setLatest] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchGridData = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/grid/latest"
      );

      if (res.data.success) {
        const data = res.data.data || [];

        const sorted = [...data].sort(
          (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
        );

        setGridData(sorted);

        if (sorted.length > 0) {
          setLatest(sorted[sorted.length - 1]);
        }
      }

      setLoading(false);
    } catch (error) {
      console.error("Grid fetch error:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGridData();
    const interval = setInterval(fetchGridData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="p-6 text-lg">Loading Grid Data...</div>;
  }

  return (
    <div className="p-6 space-y-8">

      {/* HEADER */}
      <div className="flex items-center gap-3">
        <div className="bg-blue-600 text-white p-3 rounded-lg shadow">
          <Zap size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold">
            Grid Monitoring Dashboard
          </h1>
          <p className="text-sm text-gray-500">
            Real-time grid import & export parameters
          </p>
        </div>
      </div>

      {!latest && (
        <p className="text-gray-500">No Grid Data Available</p>
      )}

      {latest && (
        <>
          {/* 🔥 Main Card */}
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl p-8 shadow-xl flex justify-between items-center">
            <div>
              <p className="opacity-80 text-sm">Current Grid Power</p>
              <h2 className="text-4xl font-bold">
                {latest.power} W
              </h2>

              <span className="mt-3 inline-flex items-center gap-1 text-sm px-3 py-1 rounded-full bg-white/20">
                <Wifi size={14} />
                {latest.status || "Online"}
              </span>
            </div>

            <Zap size={60} className="opacity-80" />
          </div>

          {/* 📊 Parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

            <MetricCard icon={<Activity />} label="Voltage" value={`${latest.voltage} V`} color="blue" />
            <MetricCard icon={<Gauge />} label="Current" value={`${latest.current} A`} color="green" />
            <MetricCard icon={<ArrowDownUp />} label="Import Energy" value={`${latest.importEnergy || 0} kWh`} color="purple" />
            <MetricCard icon={<ArrowDownUp />} label="Export Energy" value={`${latest.exportEnergy || 0} kWh`} color="orange" />
            <MetricCard icon={<Zap />} label="Frequency" value={`${latest.frequency || 50} Hz`} color="indigo" />

          </div>

          {/* 📈 Chart */}
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-semibold mb-6">
              Live Grid Power (W)
            </h2>

            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={gridData}>
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
                  stroke="#2563eb"
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

/* 🔹 Metric Card */
const MetricCard = ({ icon, label, value, color }) => {
  const colors = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    purple: "bg-purple-500",
    orange: "bg-orange-500",
    indigo: "bg-indigo-500"
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

export default UserGridDashboard;
