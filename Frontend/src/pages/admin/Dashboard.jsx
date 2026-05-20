import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { useData } from '../../contexts/DataContext';
import { useTheme } from '../../contexts/ThemeContext';
import {
  BatteryCharging,
  Server,
  AlertTriangle,
  BarChart2,
  Users,
  User,
  Zap,
  Activity,
  Settings,
  DollarSign,
  Wifi,
  WifiOff,
  RefreshCw
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  ComposedChart,
  PieChart,
  Pie,
  Cell,
  Sector
} from 'recharts';

// Card components
const Card = ({ children, className = "", title = "", icon = null }) => {
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-lg shadow-sm p-5 ${className}`}>
      {title && (
        <div className="flex items-center mb-4">
          {icon && <span className="mr-2">{icon}</span>}
          <h2 className="text-lg font-medium text-gray-800 dark:text-white">{title}</h2>
        </div>
      )}
      {children}
    </div>
  );
};

const StatusItem = ({ label, value, color = "gray" }) => {
  return (
    <div className="flex justify-between items-center border-b border-gray-100 dark:border-slate-700 py-3 last:border-b-0">
      <span className="text-gray-600 dark:text-gray-400">{label}:</span>
      <span className={`font-medium text-${color}-600 dark:text-${color}-400`}>{value}</span>
    </div>
  );
};

const IconCard = ({ title, value, icon, bgColor, textColor = "text-white", subtitle = null }) => {
  return (
    <Card className="flex flex-col items-center justify-center text-center h-full">
      <div className={`w-24 h-24 ${bgColor} rounded-full flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-800 dark:text-white">{title}</h3>
      <div className={`mt-2 py-1 px-4 rounded-full ${textColor} ${bgColor} font-medium`}>
        {value}
      </div>
      {subtitle && <p className="mt-2 text-gray-500 dark:text-gray-400">{subtitle}</p>}
    </Card>
  );
};

const CircularProgress = ({ value, size = "lg", color = "primary" }) => {
  const { theme } = useTheme();

  // Calculate the circumference and the offset based on the value
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const progress = value / 100;
  const dashoffset = circumference * (1 - progress);

  // Size variants
  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32",
    xl: "w-40 h-40"
  };

  // Color variants
  const colorClasses = {
    primary: "text-primary-500 dark:text-primary-400",
    success: "text-success-500 dark:text-success-400",
    danger: "text-danger-500 dark:text-danger-400",
    warning: "text-warning-500 dark:text-warning-400"
  };

  return (
    <div className={`relative ${sizeClasses[size]} mx-auto`}>
      <svg className="w-full h-full" viewBox="0 0 120 120">
        {/* Background Circle */}
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke={theme === 'dark' ? '#374151' : '#e5e7eb'}
          strokeWidth="10"
        />

        {/* Progress Circle */}
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          strokeLinecap="round"
          className={colorClasses[color]}
          transform="rotate(-90 60 60)"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-2xl font-bold ${colorClasses[color]}`}>{value}%</span>
      </div>
    </div>
  );
};

// Active shape renderer for pie chart
const renderActiveShape = (props) => {
  const {
    cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle,
    fill, payload, percent, value, theme
  } = props;
  const sin = Math.sin(-midAngle * Math.PI / 180);
  const cos = Math.cos(-midAngle * Math.PI / 180);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  const textColor = theme === 'dark' ? '#e5e7eb' : '#374151';
  const secondaryTextColor = theme === 'dark' ? '#9ca3af' : '#6b7280';

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill={textColor} fontSize={12}>{`${payload.name}`}</text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill={secondaryTextColor} fontSize={12}>
        {`${value} (${(percent * 100).toFixed(0)}%)`}
      </text>
    </g>
  );
};

const AdminDashboard = () => {
    const navigate = useNavigate();
  const { theme } = useTheme();
  const {
    chargers, stations, customers, transactions,
    loading, error, getDashboardStats, refreshData, fetchDashboardStats,
    wsConnected, setupWebSocket
  } = useData();

  const [stats, setStats] = useState({
    chargers: { total: 0, active: 0, inactive: 0 },
    stations: { total: 0, operational: 0, maintenance: 0 },
    customers: { total: 0, active: 0, growth: "+0%" },
    revenue: { total: "₹0", monthly: "₹0", trend: "+0%" },
    uptime: 98.5,
    energyConsumed: "0 kWh",
    sessions: { total: 0, completed: 0, failed: 0 }
  });

  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Mock data for session analytics chart
  const sessionAnalyticsData = [
    { name: 'Mon', completed: 65, failed: 4, duration: 42, energy: 320 },
    { name: 'Tue', completed: 59, failed: 3, duration: 38, energy: 280 },
    { name: 'Wed', completed: 80, failed: 5, duration: 45, energy: 390 },
    { name: 'Thu', completed: 81, failed: 2, duration: 50, energy: 400 },
    { name: 'Fri', completed: 76, failed: 6, duration: 48, energy: 380 },
    { name: 'Sat', completed: 55, failed: 3, duration: 37, energy: 260 },
    { name: 'Sun', completed: 40, failed: 2, duration: 30, energy: 210 },
  ];

  // Mock data for session type breakdown
  const sessionTypeData = [
    { name: 'Standard', value: 65 },
    { name: 'Fast Charge', value: 25 },
    { name: 'Ultra Fast', value: 10 }
  ];

  // Colors for session type chart
  const sessionTypeColors = [
    theme === 'dark' ? '#0e7490' : '#06b6d4', // cyan
    theme === 'dark' ? '#0369a1' : '#0284c7', // sky
    theme === 'dark' ? '#1d4ed8' : '#2563eb'  // blue
  ];

  // Animation settings for charts
  const [chartAnimationActive, setChartAnimationActive] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  // Handle pie chart hover
  const onPieEnter = (_, index) => {
    setActiveIndex(index);
  };

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoadingStats(true);
      console.log("Dashboard: Starting data refresh...");
      await refreshData();
      console.log("Dashboard: Data refresh complete");

      try {
        // Try to get stats from API
        console.log("Dashboard: Fetching stats from API...");
        const apiStats = await fetchDashboardStats();
        console.log("Dashboard: API stats received:", apiStats);

        if (apiStats) {
          setStats(apiStats);
          console.log("Dashboard: Using API stats");
        } else {
          // Fallback to calculated stats
          console.log("Dashboard: API stats not available, calculating from local data");
          const calculatedStats = getDashboardStats();
          console.log("Dashboard: Calculated stats:", calculatedStats);
          setStats(calculatedStats);
        }
      } catch (err) {
        console.error("Error loading dashboard stats:", err);
        // Fallback to calculated stats
        console.log("Dashboard: Error fetching API stats, calculating from local data");
        const calculatedStats = getDashboardStats();
        console.log("Dashboard: Calculated stats after error:", calculatedStats);
        setStats(calculatedStats);
      } finally {
        setIsLoadingStats(false);
      }
    };

    loadData();
  }, []);

  // Update stats when data changes only if we're not using API stats
  useEffect(() => {
    if (!isLoadingStats && !loading.chargers && !loading.stations && !loading.customers && !loading.transactions) {
      // Only update when data changes if we're not loading API stats
      console.log("Dashboard: Data changed, checking if stats need update");
      console.log("Dashboard: Current data state:", {
        chargers: chargers.length,
        stations: stations.length,
        customers: customers.length
      });

      setStats(prevStats => {
        // Only update if we have more data now than before
        if ((chargers.length > 0 || stations.length > 0 || customers.length > 0) &&
            (prevStats.chargers.total === 0 || prevStats.stations.total === 0 || prevStats.customers.total === 0)) {
          console.log("Dashboard: Updating stats with calculated values");
          return getDashboardStats();
        }
        console.log("Dashboard: No need to update stats");
        return prevStats;
      });
    }
  }, [chargers, stations, customers, transactions, loading]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Admin Dashboard</h1>

        {/* WebSocket Connection Status */}
        <div className={`flex items-center px-4 py-2 rounded-md ${wsConnected ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
          {wsConnected ? (
            <>
              <Wifi size={18} className="mr-2" />
              <span className="text-sm font-medium">Connected to Server</span>
            </>
          ) : (
            <>
              <WifiOff size={18} className="mr-2" />
              <span className="text-sm font-medium">Disconnected</span>
              <button
                className="ml-3 text-sm font-medium underline flex items-center"
                onClick={setupWebSocket}
              >
                <RefreshCw size={14} className="mr-1" />
                Reconnect
              </button>
            </>
          )}
        </div>
      </div>

      {/* Loading indicator */}

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white dark:bg-slate-800">
          <div className="flex items-start">
            <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mr-4">
              <BatteryCharging size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Chargers</p>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">{stats.chargers.total}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {stats.chargers.active} active, {stats.chargers.inactive} inactive
              </p>
            </div>
          </div>
        </Card>

        <Card className="bg-white dark:bg-slate-800">
          <div className="flex items-start">
            <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 mr-4">
              <Server size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Stations</p>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">{stats.stations.total}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {stats.stations.operational} operational, {stats.stations.maintenance} in maintenance
              </p>
            </div>
          </div>
        </Card>

        <Card className="bg-white dark:bg-slate-800">
          <div className="flex items-start">
            <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 mr-4">
              <Users size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Customers</p>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">{stats.customers.total}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span className="text-green-500">{stats.customers.growth}</span> this month
              </p>
            </div>
          </div>
        </Card>

        <Card className="bg-white dark:bg-slate-800">
          <div className="flex items-start">
            <div className="p-3 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 mr-4">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Revenue</p>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">{stats.revenue.total}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span className="text-green-500">{stats.revenue.trend}</span> from last month
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1" title="System Health">
          <div className="mb-4">
            <CircularProgress value={stats.uptime} color="success" />
            <h3 className="text-center mt-3 text-lg font-semibold text-gray-800 dark:text-white">System Uptime</h3>
            <p className="text-center text-gray-600 dark:text-gray-400">{stats.uptime}% availability</p>
          </div>

          <div className="space-y-2 mt-6">
            <StatusItem label="API Response Time" value="120ms" color="success" />
            <StatusItem label="Database Load" value="42%" color="success" />
            <StatusItem label="Storage Usage" value="68%" color="warning" />
            <StatusItem label="Memory Usage" value="54%" color="success" />
          </div>
        </Card>

        <Card className="col-span-2" title="Charging Sessions Overview">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-100 dark:bg-slate-700 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Sessions</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.sessions.total}</p>
            </div>
            <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.sessions.completed}</p>
            </div>
            <div className="bg-red-100 dark:bg-red-900/30 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">Failed</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.sessions.failed}</p>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={sessionAnalyticsData}
                margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
                  axisLine={{ stroke: theme === 'dark' ? '#4b5563' : '#d1d5db' }}
                  tickLine={{ stroke: theme === 'dark' ? '#4b5563' : '#d1d5db' }}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fill: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
                  axisLine={{ stroke: theme === 'dark' ? '#4b5563' : '#d1d5db' }}
                  tickLine={{ stroke: theme === 'dark' ? '#4b5563' : '#d1d5db' }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fill: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
                  axisLine={{ stroke: theme === 'dark' ? '#4b5563' : '#d1d5db' }}
                  tickLine={{ stroke: theme === 'dark' ? '#4b5563' : '#d1d5db' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                    borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                    color: theme === 'dark' ? '#f9fafb' : '#111827',
                    borderRadius: '4px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    fontSize: '12px'
                  }}
                  formatter={(value, name) => [value, name]}
                  labelFormatter={(label) => `Day: ${label}`}
                />
                <Legend
                  wrapperStyle={{
                    fontSize: '12px',
                    paddingTop: '10px'
                  }}
                />
                <Bar
                  yAxisId="left"
                  dataKey="completed"
                  name="Completed Sessions"
                  fill={theme === 'dark' ? '#065f46' : '#059669'}
                  radius={[2, 2, 0, 0]}
                />
                <Bar
                  yAxisId="left"
                  dataKey="failed"
                  name="Failed Sessions"
                  fill={theme === 'dark' ? '#991b1b' : '#dc2626'}
                  radius={[2, 2, 0, 0]}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="energy"
                  name="Energy (kWh)"
                  stroke={theme === 'dark' ? '#1d4ed8' : '#2563eb'}
                  strokeWidth={2}
                  dot={{ r: 3, strokeWidth: 1, fill: theme === 'dark' ? '#1d4ed8' : '#2563eb' }}
                  activeDot={{ r: 5, strokeWidth: 1 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Additional Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <IconCard
          title="Total Energy"
          value={stats.energyConsumed}
          icon={<Zap size={32} className="text-white" />}
          bgColor="bg-blue-500 dark:bg-blue-600"
          subtitle="Energy consumed across all stations"
        />

        <IconCard
          title="Active Sessions"
          value="24"
          icon={<Activity size={32} className="text-white" />}
          bgColor="bg-green-500 dark:bg-green-600"
          subtitle="Currently charging vehicles"
        />

        <IconCard
          title="Pending Maintenance"
          value="3"
          icon={<Settings size={32} className="text-white" />}
          bgColor="bg-orange-500 dark:bg-orange-600"
          subtitle="Stations requiring attention"
        />
        <div
          onClick={() => navigate("/admin/solar-monitoring")}
          className="cursor-pointer"
        >
          <IconCard
            title="Solar Monitoring"
            value="Live Data"
            icon={<Zap size={32} className="text-white" />}
            bgColor="bg-yellow-500 dark:bg-yellow-600"
            subtitle="View solar station performance"
          />
        </div>

      </div>

      {/* Session Type Breakdown */}
      <Card title="Session Type Breakdown" className="col-span-1">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                activeIndex={activeIndex}
                activeShape={(props) => renderActiveShape({ ...props, theme })}
                data={sessionTypeData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                dataKey="value"
                onMouseEnter={onPieEnter}
                isAnimationActive={chartAnimationActive}
                animationBegin={200}
                animationDuration={1000}
                animationEasing="ease-out"
              >
                {sessionTypeData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={sessionTypeColors[index % sessionTypeColors.length]}
                    stroke={theme === 'dark' ? '#1f2937' : '#ffffff'}
                    strokeWidth={1}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                  borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                  color: theme === 'dark' ? '#f9fafb' : '#111827',
                  borderRadius: '4px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  fontSize: '12px'
                }}
                formatter={(value, name) => [`${value}%`, name]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4">
            <p className="text-center text-sm text-gray-600 dark:text-gray-400">
              Hover over segments for detailed breakdown
            </p>
          </div>
        </div>
      </Card>

      {/* Session Duration Trends */}
      <Card title="Session Duration Trends" className="mt-6">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={sessionAnalyticsData}
              margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
            >
              <defs>
                <linearGradient id="colorDuration" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={theme === 'dark' ? '#4338ca' : '#4f46e5'} stopOpacity={0.6}/>
                  <stop offset="95%" stopColor={theme === 'dark' ? '#4338ca' : '#4f46e5'} stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
              <XAxis
                dataKey="name"
                tick={{ fill: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
                axisLine={{ stroke: theme === 'dark' ? '#4b5563' : '#d1d5db' }}
                tickLine={{ stroke: theme === 'dark' ? '#4b5563' : '#d1d5db' }}
              />
              <YAxis
                tick={{ fill: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
                axisLine={{ stroke: theme === 'dark' ? '#4b5563' : '#d1d5db' }}
                tickLine={{ stroke: theme === 'dark' ? '#4b5563' : '#d1d5db' }}
                label={{
                  value: 'Minutes',
                  angle: -90,
                  position: 'insideLeft',
                  style: { fill: theme === 'dark' ? '#9ca3af' : '#6b7280', fontSize: '12px' }
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                  borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                  color: theme === 'dark' ? '#f9fafb' : '#111827',
                  borderRadius: '4px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  fontSize: '12px'
                }}
                formatter={(value) => [`${value} minutes`, 'Avg. Duration']}
                labelFormatter={(label) => `Day: ${label}`}
              />
              <Area
                type="monotone"
                dataKey="duration"
                stroke={theme === 'dark' ? '#4338ca' : '#4f46e5'}
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorDuration)"
                animationBegin={400}
                animationDuration={1500}
                animationEasing="ease-out"
                isAnimationActive={chartAnimationActive}
                dot={{ r: 2, strokeWidth: 1, fill: theme === 'dark' ? '#4338ca' : '#4f46e5' }}
                activeDot={{ r: 4, strokeWidth: 1 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
};

export default AdminDashboard;