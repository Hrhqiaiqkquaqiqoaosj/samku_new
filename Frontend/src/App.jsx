import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { AuthProvider } from "./contexts/AuthContext";
import { DataProvider } from "./contexts/DataContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import ProtectedRoute from "./components/ProtectedRoute";

import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";

// ================= ADMIN PAGES =================
import AdminDashboard from "./pages/admin/Dashboard";
import AdminChargers from "./pages/admin/Chargers";
import AdminRFIDManagement from "./pages/admin/RFIDManagement";
import AdminHostManagement from "./pages/admin/HostManagement";
import AdminCustomers from "./pages/admin/Customers";
import AdminStations from "./pages/admin/Stations";
import AdminChargingHistory from "./pages/admin/ChargingHistory";
import AdminWalletHistory from "./pages/admin/WalletHistory";
import AdminReports from "./pages/admin/Reports";
import AdminNotifications from "./pages/admin/Notifications";
import AdminLogs from "./pages/admin/Logs";
import AdminSettings from "./pages/admin/Settings";

import SolarMonitoring from "./pages/admin/SolarMonitoring";
import BatteryDashboard from "./pages/admin/BatteryDashboard";
import GridDashboard from "./pages/admin/GridDashboard";

// ================= HOST PAGES =================
import HostDashboard from "./pages/host/Dashboard";
import HostStations from "./pages/host/Stations";
import HostChargingHistory from "./pages/host/ChargingHistory";
import HostWalletHistory from "./pages/host/WalletHistory";
import HostReports from "./pages/host/Reports";

// ================= USER PAGES =================
import UserDashboard from "./pages/user/Dashboard";

// ⚠️ IMPORTANT: Make sure these files exist inside pages/user
import UserSolarDashboard from "./pages/user/UserSolarDashboard";
import UserBatteryDashboard from "./pages/user/UserBatteryDashboard";
import UserGridDashboard from "./pages/user/UserGridDashboard";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>
          <Router>
            <Routes>

              {/* ================= PUBLIC ROUTES ================= */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />

              {/* ================= ADMIN ROUTES ================= */}
              <Route path="/admin" element={<ProtectedRoute role="admin" />}>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="chargers" element={<AdminChargers />} />
                <Route path="rfid-management" element={<AdminRFIDManagement />} />
                <Route path="host-management" element={<AdminHostManagement />} />
                <Route path="customers" element={<AdminCustomers />} />
                <Route path="stations" element={<AdminStations />} />
                <Route path="charging-history" element={<AdminChargingHistory />} />
                <Route path="wallet-history" element={<AdminWalletHistory />} />
                <Route path="reports" element={<AdminReports />} />
                <Route path="notifications" element={<AdminNotifications />} />
                <Route path="logs" element={<AdminLogs />} />
                <Route path="settings" element={<AdminSettings />} />

                {/* ENERGY MANAGEMENT */}
                <Route path="solar-monitoring" element={<SolarMonitoring />} />
                <Route path="battery" element={<BatteryDashboard />} />
                <Route path="grid" element={<GridDashboard />} />

                <Route index element={<Navigate to="/admin/dashboard" replace />} />
              </Route>

              {/* ================= HOST ROUTES ================= */}
              <Route path="/host" element={<ProtectedRoute role="host" />}>
                <Route path="dashboard" element={<HostDashboard />} />
                <Route path="stations" element={<HostStations />} />
                <Route path="charging-history" element={<HostChargingHistory />} />
                <Route path="wallet-history" element={<HostWalletHistory />} />
                <Route path="reports" element={<HostReports />} />

                <Route index element={<Navigate to="/host/dashboard" replace />} />
              </Route>

              {/* ================= USER ROUTES ================= */}
              <Route path="/user" element={<ProtectedRoute role="user" />}>
                <Route path="dashboard" element={<UserDashboard />} />

                {/* ENERGY DASHBOARDS */}
                <Route path="solar-monitoring" element={<UserSolarDashboard />} />
                <Route path="battery" element={<UserBatteryDashboard />} />
                <Route path="grid" element={<UserGridDashboard />} />

                <Route index element={<Navigate to="/user/dashboard" replace />} />
              </Route>

              {/* ================= DEFAULT ================= */}
              <Route path="*" element={<Navigate to="/login" replace />} />

            </Routes>
          </Router>
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
