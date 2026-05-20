import { useState } from 'react';
import { Bell, Moon, Sun, ChevronDown, LogOut, User, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import WebSocketStatus from '../ui/WebSocketStatus';
import logo from '../../images/logo.png';

const Header = ({ toggleSidebar, selectedClient, onClientChange }) => {
  const navigate = useNavigate();
  const { logout, currentUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);
  
  // Get user display name from profile
  const userDisplayName = currentUser?.profile?.firstName 
    ? `${currentUser.profile.firstName} ${currentUser.profile.lastName || ''}`
    : currentUser?.username || 'User';
  
  console.log('Header user data:', { userDisplayName, currentUser });
  
  // Mock list of clients for admin/host users
  const clients = [
    { id: '1', name: 'ABC Energy' },
    { id: '2', name: 'GreenPower Inc.' },
    { id: '3', name: 'City Charging Network' },
    { id: '4', name: 'Metro EV Solutions' },
  ];

  return (
    <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700">
      <div className="flex items-center justify-between h-16 px-4">
        {/* Left side: Logo only */}
        <div className="flex items-center">
          <div className="flex items-center">
            <img src={logo} alt="SAMKU EV" className="h-8 w-auto" />
            <span className="ml-2 text-lg font-bold text-gray-900 dark:text-white">Charger Management System</span>
          </div>
        </div>
        
        {/* Right side: Actions */}
        <div className="flex items-center space-x-4">
          {/* Client Selector (for admin/host) - moved to right side */}
          {clients.length > 0 && (
            <div className="relative">
              <button
                className="flex items-center px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                onClick={() => setClientDropdownOpen(!clientDropdownOpen)}
              >
                <span className="text-gray-800 dark:text-white">
                  {selectedClient ? selectedClient : 'Select Client'}
                </span>
                <ChevronDown size={16} className="ml-2 text-gray-500 dark:text-gray-400" />
              </button>
              
              {clientDropdownOpen && (
                <div className="absolute mt-1 w-56 bg-white dark:bg-slate-800 shadow-lg rounded-md border border-gray-200 dark:border-slate-700 z-10">
                  <div className="py-1">
                    {clients.map((client) => (
                      <button
                        key={client.id}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                        onClick={() => {
                          onClientChange(client.name);
                          setClientDropdownOpen(false);
                        }}
                      >
                        {client.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* WebSocket Status */}
          <WebSocketStatus />

          {/* Theme toggle */}
          <button
            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full focus:outline-none"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          
          {/* Notifications */}
          <button
            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full focus:outline-none relative"
            aria-label="Notifications"
          >
            <Bell size={20} />
            <span className="absolute top-0 right-0 w-2 h-2 bg-primary-500 rounded-full"></span>
          </button>
          
          {/* User profile dropdown */}
          <div className="relative">
            <button
              className="flex items-center text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md px-2 py-1 focus:outline-none"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >              <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-slate-600 flex items-center justify-center mr-2">
                <User size={16} className="text-gray-600 dark:text-gray-300" />
              </div>
              <span className="text-sm font-medium">{userDisplayName}</span>
              <ChevronDown size={16} className="ml-1 text-gray-500 dark:text-gray-400" />
            </button>
            
            {dropdownOpen && (
              <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-slate-800 shadow-lg rounded-md border border-gray-200 dark:border-slate-700 z-10">
                <div className="py-1">
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center"
                    onClick={() => {
                      setDropdownOpen(false);
                      navigate('/profile');
                    }}
                  >
                    <User size={16} className="mr-2" />
                    Profile
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center"
                    onClick={() => {
                      setDropdownOpen(false);
                      navigate('/settings');
                    }}
                  >
                    <Settings size={16} className="mr-2" />
                    Settings
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center"
                    onClick={() => {
                      setDropdownOpen(false);
                      logout();
                    }}
                  >
                    <LogOut size={16} className="mr-2" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;