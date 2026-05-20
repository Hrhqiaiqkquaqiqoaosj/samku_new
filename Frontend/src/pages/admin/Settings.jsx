import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import Card from '../../components/ui/Card';
import { 
  Sun, 
  Moon, 
  Bell, 
  Lock, 
  User, 
  Settings as SettingsIcon,
  Globe,
  Shield,
  Database,
  AlertTriangle,
  Save
} from 'lucide-react';

const Settings = () => {
  const { theme, setTheme } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [maintenanceAlerts, setMaintenanceAlerts] = useState(true);
  const [criticalAlerts, setCriticalAlerts] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(true);
  const [formSubmitting, setFormSubmitting] = useState(false);
  
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setFormSubmitting(false);
      // Show success message
      alert('Settings saved successfully');
    }, 800);
  };

  // Toggle switch component
  const ToggleSwitch = ({ enabled, onChange, label, description }) => {
    return (
      <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-slate-700 last:border-b-0">
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">{label}</h4>
          {description && <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>}
        </div>
        <button
          type="button"
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            enabled ? 'bg-primary-600' : 'bg-gray-200 dark:bg-slate-700'
          }`}
          role="switch"
          aria-checked={enabled}
          onClick={() => onChange(!enabled)}
        >
          <span
            aria-hidden="true"
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              enabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    );
  };

  // Form Group component for consistent styling
  const FormGroup = ({ label, children, className = "" }) => {
    return (
      <div className={`mb-4 ${className}`}>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
        {children}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Settings</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Appearance Settings */}
        <Card 
          title="Appearance" 
          description="Customize how SAMKU EV looks for you"
          variant="default"
          className="col-span-1"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">Theme</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">Choose between light and dark mode</p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleTheme}
                  className={`p-2 rounded-md ${
                    theme === 'light' 
                      ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400' 
                      : 'bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-gray-400'
                  }`}
                  aria-label="Light mode"
                >
                  <Sun size={18} />
                </button>
                <button
                  onClick={toggleTheme}
                  className={`p-2 rounded-md ${
                    theme === 'dark' 
                      ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400' 
                      : 'bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-gray-400'
                  }`}
                  aria-label="Dark mode"
                >
                  <Moon size={18} />
                </button>
              </div>
            </div>
            
            <div className="pt-4 border-t border-gray-100 dark:border-slate-700">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Dashboard Layout</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="border border-gray-200 dark:border-slate-700 rounded-md p-2 cursor-pointer hover:border-primary-500 dark:hover:border-primary-500">
                  <div className="h-24 bg-gray-100 dark:bg-slate-700 rounded flex items-center justify-center">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Compact</span>
                  </div>
                </div>
                <div className="border-2 border-primary-500 dark:border-primary-500 rounded-md p-2 cursor-pointer">
                  <div className="h-24 bg-gray-100 dark:bg-slate-700 rounded flex items-center justify-center">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Expanded</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
        
        {/* Notification Settings */}
        <Card 
          title="Notifications" 
          description="Manage your notification preferences"
          variant="default"
          className="col-span-1"
        >
          <form onSubmit={handleSaveSettings}>
            <ToggleSwitch 
              enabled={notificationsEnabled}
              onChange={setNotificationsEnabled}
              label="Enable Notifications"
              description="Master toggle for all notifications"
            />
            
            <ToggleSwitch 
              enabled={maintenanceAlerts}
              onChange={setMaintenanceAlerts}
              label="Maintenance Alerts"
              description="Get notified about scheduled maintenance"
            />
            
            <ToggleSwitch 
              enabled={criticalAlerts}
              onChange={setCriticalAlerts}
              label="Critical Alerts"
              description="Important system alerts and warnings"
            />
            
            <ToggleSwitch 
              enabled={weeklyReports}
              onChange={setWeeklyReports}
              label="Weekly Reports"
              description="Receive weekly performance reports"
            />
            
            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                disabled={formSubmitting}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md transition-colors duration-200 flex items-center"
              >
                <Save size={16} className="mr-2" />
                {formSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Card>
        
        {/* System Settings */}
        <Card 
          title="System" 
          description="Configure system-wide settings"
          variant="default"
          className="col-span-1"
        >
          <div className="space-y-4">
            <FormGroup label="Data Retention Period">
              <select 
                className="w-full rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="30">30 days</option>
                <option value="60">60 days</option>
                <option value="90">90 days</option>
                <option value="180">6 months</option>
                <option value="365">1 year</option>
              </select>
            </FormGroup>
            
            <FormGroup label="API Rate Limit">
              <select 
                className="w-full rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="100">100 requests/minute</option>
                <option value="500">500 requests/minute</option>
                <option value="1000">1000 requests/minute</option>
                <option value="5000">5000 requests/minute</option>
              </select>
            </FormGroup>
            
            <FormGroup label="Maintenance Window">
              <div className="grid grid-cols-2 gap-3">
                <select 
                  className="rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="0">Sunday</option>
                  <option value="1">Monday</option>
                  <option value="2">Tuesday</option>
                  <option value="3">Wednesday</option>
                  <option value="4">Thursday</option>
                  <option value="5">Friday</option>
                  <option value="6">Saturday</option>
                </select>
                <select 
                  className="rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="0">00:00 - 02:00</option>
                  <option value="1">02:00 - 04:00</option>
                  <option value="2">22:00 - 00:00</option>
                </select>
              </div>
            </FormGroup>
            
            <div className="pt-4 border-t border-gray-100 dark:border-slate-700">
              <button
                type="button"
                className="px-4 py-2 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-md hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors duration-200 flex items-center justify-center w-full"
              >
                <AlertTriangle size={16} className="mr-2" />
                Clear System Cache
              </button>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Security Settings */}
      <Card 
        title="Security" 
        description="Manage security settings and permissions"
        variant="default"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Password Policy</h4>
            <div className="space-y-3">
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="minLength" 
                  checked 
                  disabled
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="minLength" className="ml-2 block text-sm text-gray-600 dark:text-gray-400">
                  Minimum 8 characters
                </label>
              </div>
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="uppercase" 
                  checked 
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="uppercase" className="ml-2 block text-sm text-gray-600 dark:text-gray-400">
                  Require uppercase letters
                </label>
              </div>
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="lowercase" 
                  checked 
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="lowercase" className="ml-2 block text-sm text-gray-600 dark:text-gray-400">
                  Require lowercase letters
                </label>
              </div>
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="number" 
                  checked 
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="number" className="ml-2 block text-sm text-gray-600 dark:text-gray-400">
                  Require numbers
                </label>
              </div>
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="special"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="special" className="ml-2 block text-sm text-gray-600 dark:text-gray-400">
                  Require special characters
                </label>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Authentication Settings</h4>
            <div className="space-y-4">
              <FormGroup label="Session Timeout">
                <select 
                  className="w-full rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="120">2 hours</option>
                  <option value="240">4 hours</option>
                </select>
              </FormGroup>
              
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="twoFactor" 
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="twoFactor" className="ml-2 block text-sm text-gray-600 dark:text-gray-400">
                  Enable two-factor authentication
                </label>
              </div>
              
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="ipRestriction" 
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="ipRestriction" className="ml-2 block text-sm text-gray-600 dark:text-gray-400">
                  IP address restriction
                </label>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md transition-colors duration-200 flex items-center"
          >
            <Save size={16} className="mr-2" />
            Save Security Settings
          </button>
        </div>
      </Card>
      
      {/* API Settings */}
      <Card 
        title="API & Integration" 
        description="Manage API keys and integrations"
        variant="default"
      >
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 dark:bg-slate-700/30 rounded-lg">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">API Key</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Use this key to authenticate API requests</p>
                <div className="flex items-center">
                  <input 
                    type="password" 
                    value="sk_live_51NkZrdSIBwkwJ0avda3MhsQGEpoCUVs"
                    readOnly
                    className="text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-slate-600 rounded py-1 px-2 mr-2"
                  />
                  <button 
                    type="button"
                    className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                  >
                    Show
                  </button>
                </div>
              </div>
              <button
                type="button"
                className="px-3 py-1 bg-gray-200 hover:bg-gray-300 dark:bg-slate-600 dark:hover:bg-slate-500 text-gray-700 dark:text-gray-300 rounded text-sm transition-colors duration-200"
              >
                Regenerate
              </button>
            </div>
          </div>
          
          <div className="border-t border-gray-100 dark:border-slate-700 pt-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Active Integrations</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mr-3">
                    <Globe size={16} />
                  </div>
                  <div>
                    <h5 className="text-sm font-medium text-gray-900 dark:text-white">Maps Integration</h5>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Connected</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  Disconnect
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center mr-3">
                    <Database size={16} />
                  </div>
                  <div>
                    <h5 className="text-sm font-medium text-gray-900 dark:text-white">Payment Gateway</h5>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Connected</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  Disconnect
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center mr-3">
                    <Shield size={16} />
                  </div>
                  <div>
                    <h5 className="text-sm font-medium text-gray-900 dark:text-white">Authentication Service</h5>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Connected</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  Disconnect
                </button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Settings;