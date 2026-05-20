import { useEffect, useState } from "react";
import axios from "axios";
import {
  BatteryCharging,
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

const UserBatteryDashboard = () => {
  const [batteryData, setBatteryData] = useState([]);
  const [latest, setLatest] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchBatteryData = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/battery/latest"
      );

      if (res.data.success) {
        const data = res.data.data || [];

        const sortedData = [...data].sort(
          (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
        );

        setBatteryData(sortedData);

        if (sortedData.length > 0) {
          setLatest(sortedData[sortedData.length - 1]);
        }
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching battery data:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatteryData();
    const interval = setInterval(fetchBatteryData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="p-6 text-lg">Loading Battery Data...</div>;
  }

  return (
    <div className="p-6 space-y-8">

      {/* HEADER */}
      <div className="flex items-center gap-3">
        <div className="bg-green-600 text-white p-3 rounded-lg shadow">
          <BatteryCharging size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold">
            Battery (BESS) Dashboard
          </h1>
          <p className="text-sm text-gray-500">
            Real-time battery monitoring parameters
          </p>
        </div>
      </div>

      {!latest && (
        <p className="text-gray-500">No Battery Data Available</p>
      )}

      {latest && (
        <>
          {/* 🔋 SOC Main Card */}
          <div className="bg-gradient-to-br from-green-500 to-emerald-700 text-white rounded-2xl p-8 shadow-xl flex justify-between items-center">
            <div>
              <p className="opacity-80 text-sm">State of Charge (SOC)</p>
              <h2 className="text-4xl font-bold">
                {latest.soc || 0} %
              </h2>

              <span
                className={`mt-3 inline-flex items-center gap-1 text-sm px-3 py-1 rounded-full ${
                  latest.status === "Online"
                    ? "bg-green-400/30"
                    : "bg-red-400/30"
                }`}
              >
                <Wifi size={14} />
                {latest.status}
              </span>
            </div>

            <BatteryCharging size={60} className="opacity-80" />
          </div>

          {/* 🔹 Battery Parameters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

            <MetricCard icon={<Zap />} label="Voltage" value={`${latest.voltage} V`} color="blue" />
            <MetricCard icon={<Activity />} label="Current" value={`${latest.current} A`} color="green" />
            <MetricCard icon={<Gauge />} label="Power" value={`${latest.power} W`} color="yellow" />
            <MetricCard icon={<Thermometer />} label="Temperature" value={`${latest.temperature || 0} °C`} color="red" />
            <MetricCard icon={<BatteryCharging />} label="Capacity" value={`${latest.capacity || 0} kWh`} color="purple" />
            <MetricCard icon={<BatteryCharging />} label="Charge Cycles" value={`${latest.cycles || 0}`} color="orange" />
            <MetricCard icon={<BatteryCharging />} label="Charge Mode" value={`${latest.mode || "Idle"}`} color="indigo" />
            <MetricCard icon={<BatteryCharging />} label="Health" value={`${latest.health || 100}%`} color="cyan" />

          </div>

          {/* 📈 SOC Chart */}
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-semibold mb-6">
              SOC Trend (%)
            </h2>

            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={batteryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(value) =>
                    new Date(value).toLocaleTimeString()
                  }
                />
                <YAxis domain={[0, 100]} />
                <Tooltip
                  labelFormatter={(value) =>
                    new Date(value).toLocaleString()
                  }
                />
                <Line
                  type="monotone"
                  dataKey="soc"
                  stroke="#10b981"
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

/* 🔹 Reusable Metric Card */
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

export default UserBatteryDashboard;
