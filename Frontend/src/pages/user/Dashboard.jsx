import React, { useState, useEffect } from "react";
import {
  History,
  Zap,
  Wallet,
  BarChart2,
  QrCode,
  Hash,
  Sun,
  BatteryCharging,
  Clock,
  Search,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import QRScanner from "../../components/ui/QRScanner";
import ManualChargerInput from "../../components/ui/ManualChargerInput";

import { useTheme } from "../../contexts/ThemeContext";
import { useData } from "../../contexts/DataContext";
import { API_ENDPOINTS } from "../../config/config";

const UserDashboard = () => {
  const { theme } = useTheme();
  const { user } = useData();
  const navigate = useNavigate();

  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [isManualInputOpen, setIsManualInputOpen] = useState(false);
  const [isStartingCharge, setIsStartingCharge] = useState(false);
  const [chargeStatus, setChargeStatus] = useState(null);

  // Initialize stats state
  const [stats, setStats] = useState({
    sessions: { total: 0 },
    consumedUnits: "0 kWh",
    spending: { total: "₹0" },
    avgSessionTime: "0 min",
  });

  // State for transactions
  const [recentTransactions, setRecentTransactions] = useState([]);

  // Fetch transactions and update stats
  // Fetch transactions and update stats
  const fetchTransactions = async () => {
    try {
      const response = await fetch(
        `${API_ENDPOINTS.TRANSACTIONS.BASE}`,
        {
          method: "GET",

          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,

          },
        }
      );

      const result = await response.json();

      if (result.success) {
        const transactions = result.data || [];
        setRecentTransactions(transactions);

        // Only completed transactions
        const completed = transactions.filter(
          (tx) => tx.status === "COMPLETED"
        );

        // Total sessions
        const totalSessions = completed.length;

        // 🔋 Total Energy (Wh → kWh)
        const totalEnergyWh = completed.reduce((sum, tx) => {
          const start = tx.meterStart || 0;
          const stop = tx.meterStop || 0;
          return sum + (stop - start);
        }, 0);

        const totalEnergyKwh = (totalEnergyWh / 1000).toFixed(2);

        // ⏱ Avg Session Duration
        const totalDurationSec = completed.reduce((sum, tx) => {
          if (tx.startTime && tx.endTime) {
            return (
              sum +
              (new Date(tx.endTime) - new Date(tx.startTime)) / 1000
            );
          }
          return sum;
        }, 0);

        const avgDurationMin =
          totalSessions > 0
            ? (totalDurationSec / totalSessions / 60).toFixed(1)
            : 0;

        // 💰 Total Spending
        const totalSpending = completed.reduce(
          (sum, tx) => sum + (tx.pricing?.totalAmount || 0),
          0
        );

        setStats({
          sessions: { total: totalSessions },
          consumedUnits: `${totalEnergyKwh} kWh`,
          spending: { total: `₹${totalSpending}` },
          avgSessionTime: `${avgDurationMin} min`,
        });
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

 useEffect(() => {
   fetchTransactions();

   const interval = setInterval(() => {
     fetchTransactions();
   }, 5000); // refresh every 5 seconds

   return () => clearInterval(interval);
 }, []);

  const handleQRScanSuccess = async (chargerId) => {
    setIsStartingCharge(true);
    setChargeStatus(null);

    try {
      const response = await fetch(
        `${API_ENDPOINTS.TRANSACTIONS.BASE}/start-test-charge`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            chargerId,
            amount: 1,
            userId: user?.id || user?._id,
          }),
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Failed to start charging");
      }

      setChargeStatus({
        type: "success",
        message: `Charging started for charger ${chargerId}`,
        transactionId: result.transactionId,
      });

      // ✅ THIS LINE
      await fetchTransactions();

    } catch (error) {
      setChargeStatus({
        type: "error",
        message: error.message || "Something went wrong",
      });
    } finally {
      setIsStartingCharge(false);
    }
  };

  return (
    <div className="space-y-8 p-6">
      {/* HEADER */}
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
        User Dashboard
      </h1>

      {/* STATUS MESSAGE */}
      {chargeStatus && (
        <div
          className={`p-4 rounded-lg ${
            chargeStatus.type === "success"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          <div className="font-medium">{chargeStatus.message}</div>
          {chargeStatus.transactionId && (
            <div className="text-sm opacity-70 mt-1">
              Transaction ID: {chargeStatus.transactionId}
            </div>
          )}
        </div>
      )}

      {/* ================= STATS SECTION ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Sessions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 border border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-3 rounded-lg shadow">
              <History size={20} />
            </div>
            <span className="text-xs text-gray-400">Last 30 days</span>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Total Sessions
            </p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
              {stats.sessions.total}
            </p>
          </div>
        </div>

        {/* Energy Consumed */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 border border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-3 rounded-lg shadow">
              <Zap size={20} />
            </div>
            <span className="text-xs text-gray-400">Total</span>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Energy Consumed
            </p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
              {stats.consumedUnits}
            </p>
          </div>
        </div>

        {/* Total Spending */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 border border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-3 rounded-lg shadow">
              <Wallet size={20} />
            </div>
            <span className="text-xs text-gray-400">All time</span>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Total Spending
            </p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
              {stats.spending.total}
            </p>
          </div>
        </div>

        {/* Avg Session Time */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 border border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-3 rounded-lg shadow">
              <BarChart2 size={20} />
            </div>
            <span className="text-xs text-gray-400">Per session</span>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Avg. Session Time
            </p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
              {stats.avgSessionTime}
            </p>
          </div>
        </div>
      </div>

      {/* ================= ENERGY SYSTEM ================= */}
      <Card title="Energy System">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Solar */}
          <div
            onClick={() => navigate("/user/solar-monitoring")}
            className="cursor-pointer bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 border border-gray-100 dark:border-gray-700 flex items-center gap-4"
          >
            <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 text-white p-3 rounded-lg shadow">
              <Sun size={20} />
            </div>
            <div>
              <p className="font-semibold text-gray-800 dark:text-white">
                Solar System
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                View generation data
              </p>
            </div>
          </div>

          {/* Battery */}
          <div
            onClick={() => navigate("/user/battery")}
            className="cursor-pointer bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 border border-gray-100 dark:border-gray-700 flex items-center gap-4"
          >
            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-3 rounded-lg shadow">
              <BatteryCharging size={20} />
            </div>
            <div>
              <p className="font-semibold text-gray-800 dark:text-white">
                Battery (BESS)
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Check SOC & backup
              </p>
            </div>
          </div>

          {/* Grid */}
          <div
            onClick={() => navigate("/user/grid")}
            className="cursor-pointer bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 border border-gray-100 dark:border-gray-700 flex items-center gap-4"
          >
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-3 rounded-lg shadow">
              <Zap size={20} />
            </div>
            <div>
              <p className="font-semibold text-gray-800 dark:text-white">
                Grid
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Import & Export data
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* ================= QUICK ACTIONS ================= */}
      <Card title="Quick Actions">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* QR Code Scan Button */}
          <Button
            onClick={() => setIsQRScannerOpen(true)}
            disabled={isStartingCharge}
            className="bg-green-600 hover:bg-green-700 text-white p-4 flex items-center justify-center gap-2"
          >
            <QrCode size={20} />
            Scan QR Code
          </Button>

          {/* Manual Charger ID Entry */}
          <Button
            onClick={() => setIsManualInputOpen(true)}
            variant="outline"
            disabled={isStartingCharge}
            className="p-4 flex items-center justify-center gap-2"
          >
            <Hash size={20} />
            Enter Charger ID
          </Button>

          {/* Find Station Button */}
          <Button
            onClick={() => alert("Navigate to Find Station page")}
            className="bg-gray-600 hover:bg-gray-700 text-white p-4 flex items-center justify-center gap-2"
          >
            <Search size={20} />
            Find Station
          </Button>

          {/* View History Button */}
          <Button
            onClick={() => alert("Navigate to View History page")}
            className="bg-gray-600 hover:bg-gray-700 text-white p-4 flex items-center justify-center gap-2"
          >
            <History size={20} />
            View History
          </Button>
        </div>
      </Card>

      {/* ================= Recent Transactions ================= */}
      <Card title="Recent Transactions">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
           <thead>
             <tr>
               <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                 Transaction ID
               </th>
               <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                 Station
               </th>
               <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                 Date
               </th>
               <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                 Amount
               </th>

               {/* ✅ NEW COLUMN */}
               <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                 Protocol
               </th>

               <th className="px-4 py-2"></th>
             </tr>
           </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {recentTransactions.map((tx) => (
                <tr key={tx._id}>
                  <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200">
                    {tx._id}
                  </td>

                  <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200">
                    {tx.stationName}
                  </td>

                  <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200">
                    {new Date(tx.createdAt).toLocaleDateString()}
                  </td>

                  <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200">
                    ₹{tx.pricing?.totalAmount || 0}
                  </td>

                  {/* ✅ PROTOCOL COLUMN */}
                  <td className="px-4 py-2 text-sm">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        tx.protocolVersion === "2.0.1"
                          ? "bg-green-100 text-green-700"
                          : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      OCPP {tx.protocolVersion || "1.6"}
                    </span>
                  </td>

                  <td className="px-4 py-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => alert(`Viewing details for ${tx._id}`)}
                    >
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>

          </table>
        </div>
      </Card>

      {/* MODALS */}
      <QRScanner
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        onScanSuccess={handleQRScanSuccess}
      />

      <ManualChargerInput
        isOpen={isManualInputOpen}
        onClose={() => setIsManualInputOpen(false)}
        onStartCharge={handleQRScanSuccess}
      />
    </div>
  );
};

export default UserDashboard;