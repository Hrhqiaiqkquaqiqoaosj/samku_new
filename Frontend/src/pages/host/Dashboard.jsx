import React, { useState, useEffect } from 'react';
import { BatteryCharging, Server, AlertTriangle, Users, Wallet, Activity } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import Card from '../../components/ui/Card';
import StatsCard from '../../components/ui/StatsCard';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const HostDashboard = () => {
  const { theme } = useTheme();
  
  // Mock data
  const stats = {
    chargers: { active: 12, offline: 3, faulted: 1, total: 16 },
    revenue: { daily: "₹2,845", weekly: "₹18,670", monthly: "₹76,320" },
    sessions: { daily: 34, weekly: 246, monthly: 980 },
    customers: { total: 142, new: 8 },
    energyDelivered: { daily: "356 kWh", weekly: "2,423 kWh", monthly: "10,548 kWh" }
  };
  
  // Mock data for charts
  const dailyUsageData = [
    { time: '00:00', usage: 12 },
    { time: '04:00', usage: 8 },
    { time: '08:00', usage: 24 },
    { time: '12:00', usage: 32 },
    { time: '16:00', usage: 38 },
    { time: '20:00', usage: 25 },
    { time: '23:59', usage: 18 },
  ];
  
  const chargerStatusData = [
    { name: 'Active', value: stats.chargers.active, color: '#10b981' },
    { name: 'Offline', value: stats.chargers.offline, color: '#ef4444' },
    { name: 'Faulted', value: stats.chargers.faulted, color: '#f59e0b' },
  ];
  
  const COLORS = ['#10b981', '#ef4444', '#f59e0b'];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Host Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Chargers Overview */}
        <StatsCard 
          title="Total Chargers" 
          value={stats.chargers.total.toString()}
          icon={<BatteryCharging size={24} />}
          color="blue"
        />
        
        <StatsCard 
          title="Active Sessions" 
          value={stats.chargers.active.toString()}
          icon={<Activity size={24} />}
          color="green"
        />
        
        <StatsCard 
          title="Today's Revenue" 
          value={stats.revenue.daily}
          icon={<Wallet size={24} />}
          color="purple"
        />
        
        <StatsCard 
          title="Total Customers" 
          value={stats.customers.total.toString()}
          icon={<Users size={24} />}
          color="indigo"
        />
      </div>
      
      {/* Chargers Summary */}
      <Card title="Chargers">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-300">Active</p>
            <p className="text-xl font-semibold text-gray-800 dark:text-white">{stats.chargers.active}</p>
          </div>
          <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-300">Offline</p>
            <p className="text-xl font-semibold text-gray-800 dark:text-white">{stats.chargers.offline}</p>
          </div>
          <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-300">Faulted</p>
            <p className="text-xl font-semibold text-gray-800 dark:text-white">{stats.chargers.faulted}</p>
          </div>
          <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-300">Total</p>
            <p className="text-xl font-semibold text-gray-800 dark:text-white">{stats.chargers.total}</p>
          </div>
        </div>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Energy Delivered */}
        <Card title="Energy Delivered">
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-300">Today</p>
              <p className="text-xl font-semibold text-gray-800 dark:text-white">{stats.energyDelivered.daily}</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-300">This Week</p>
              <p className="text-xl font-semibold text-gray-800 dark:text-white">{stats.energyDelivered.weekly}</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-300">This Month</p>
              <p className="text-xl font-semibold text-gray-800 dark:text-white">{stats.energyDelivered.monthly}</p>
            </div>
          </div>
        </Card>
        
        {/* Revenue */}
        <Card title="Revenue">
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-300">Today</p>
              <p className="text-xl font-semibold text-gray-800 dark:text-white">{stats.revenue.daily}</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-300">This Week</p>
              <p className="text-xl font-semibold text-gray-800 dark:text-white">{stats.revenue.weekly}</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-300">This Month</p>
              <p className="text-xl font-semibold text-gray-800 dark:text-white">{stats.revenue.monthly}</p>
            </div>
          </div>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Daily Usage Chart */}
        <Card title="Daily Usage">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={dailyUsageData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
                <XAxis 
                  dataKey="time" 
                  tick={{ fill: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
                />
                <YAxis 
                  tick={{ fill: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                    borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                    color: theme === 'dark' ? '#f9fafb' : '#111827'
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="usage" 
                  stroke="#3b82f6" 
                  strokeWidth={2} 
                  activeDot={{ r: 8 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        
        {/* Charger Status Chart */}
        <Card title="Charger Status">
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chargerStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {chargerStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                    borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                    color: theme === 'dark' ? '#f9fafb' : '#111827'
                  }}
                  formatter={(value, name) => [`${value} chargers`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default HostDashboard;