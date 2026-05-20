import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Sun } from 'lucide-react';
import { 
  LayoutDashboard, 
  PlugZap, 
  Users, 
  Settings, 
  CreditCard, 
  ClipboardList, 
  Clock, 
  Bell, 
  Tag,
  ChevronLeft,
  ChevronRight,
  BarChart
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import logo from '../../images/logo.png';

const Sidebar = ({ isOpen, role }) => {
  const { theme } = useTheme();
  const [expanded, setExpanded] = useState(true);

  console.log('Sidebar received role:', role);

  // Define navigation items based on user role
  const getNavItems = () => {
    // If role is undefined, return empty array
    if (!role) {
      console.warn('No role provided to sidebar');
      return [];
    }

    // Role should already be normalized to lowercase from AuthContext
    const roleNormalized = role;

    console.log('Using normalized role for sidebar:', roleNormalized);

    const baseItems = [
      { name: 'Dashboard', path: `/${roleNormalized}/dashboard`, icon: <LayoutDashboard size={20} /> },
    ];

    if (roleNormalized === 'admin') {
      return [
        ...baseItems,
        {
              name: 'Solar Monitoring',
              path: '/admin/solar-monitoring',
              icon: <BarChart size={20} />   // 👈 use BarChart (already imported)
            },

        { name: 'Stations', path: '/admin/stations', icon: <PlugZap size={20} /> },
        { name: 'Chargers', path: '/admin/chargers', icon: <PlugZap size={20} /> },
        { name: 'Customers', path: '/admin/customers', icon: <Users size={20} /> },
        { name: 'RFID Management', path: '/admin/rfid-management', icon: <Tag size={20} /> },
        { name: 'Host Management', path: '/admin/host-management', icon: <Users size={20} /> },
        { name: 'Charging History', path: '/admin/charging-history', icon: <Clock size={20} /> },
        { name: 'Wallet History', path: '/admin/wallet-history', icon: <CreditCard size={20} /> },
        { name: 'Reports', path: '/admin/reports', icon: <BarChart size={20} /> },        { name: 'Logs', path: '/admin/logs', icon: <ClipboardList size={20} /> },
        { name: 'Notifications', path: '/admin/notifications', icon: <Bell size={20} /> },
        { name: 'Settings', path: '/admin/settings', icon: <Settings size={20} /> },
      ];
    } else if (roleNormalized === 'host') {
      return [
        ...baseItems,
        { name: 'Stations', path: '/host/stations', icon: <PlugZap size={20} /> },
        { name: 'Charging History', path: '/host/charging-history', icon: <Clock size={20} /> },
        { name: 'Wallet History', path: '/host/wallet-history', icon: <CreditCard size={20} /> },
        { name: 'Reports', path: '/host/reports', icon: <BarChart size={20} /> },
        { name: 'Settings', path: '/host/settings', icon: <Settings size={20} /> },
      ];
    } else {
      return [
        ...baseItems,
        { name: 'Settings', path: '/user/settings', icon: <Settings size={20} /> },
      ];
    }
  };
  const navItems = getNavItems();

  // Don't show the sidebar for user role or if no role is provided
  if (!role || role === 'user') {
    console.log('Not showing sidebar for role:', role);
    return null;
  }

  return (
    <div
      className={`h-screen bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transition-all duration-300 ${
        isOpen ? (expanded ? 'w-64' : 'w-20') : 'w-0'
      }`}
    >
      {/* Logo and branding */}
      <div className="p-5">
        <div className={`flex ${expanded ? 'justify-between' : 'justify-center'} items-center`}>
          {expanded && (
            <div className="flex items-center">
              <img src={logo} alt="SAMKU EV" className="h-8 w-auto" />
              <span className="ml-2 text-lg font-bold text-gray-900 dark:text-white">SAMKU EV</span>
            </div>
          )}

          {/* Collapse/Expand button */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-md bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600"
          >
            {expanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-5 px-3">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) => `
                  flex items-center py-2 px-3 rounded-lg transition-colors
                  ${isActive ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'}
                  ${expanded ? 'justify-start' : 'justify-center'}
                `}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {expanded && <span className="ml-3 truncate">{item.name}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;