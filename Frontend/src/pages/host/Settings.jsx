import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import Card from '../../components/ui/Card';
import { 
  Sun, 
  Moon, 
  Bell, 
  User, 
  Settings as SettingsIcon,
  Battery,
  Save,
  Clock,
  CreditCard,
  Users,
  PlugZap
} from 'lucide-react';

const Settings = () => {
  const { theme, setTheme } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [chargerAlerts, setChargerAlerts] = useState(true);
  const [paymentAlerts, setPaymentAlerts] = useState(true);
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
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Host Settings</h1>
      
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
              enabled={chargerAlerts}
              onChange={setChargerAlerts}
              label="Charger Alerts"
              description="Get notified about charger status changes"
            />
            
            <ToggleSwitch 
              enabled={paymentAlerts}
              onChange={setPaymentAlerts}
              label="Payment Alerts"
              description="Get notified about payments and transactions"
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
        
        {/* Pricing Settings */}
        <Card 
          title="Station Pricing" 
          description="Configure pricing for your charging stations"
          variant="default"
          className="col-span-1"
        >
          <div className="space-y-4">
            <FormGroup label="Default Charging Rate (₹/kWh)">
              <input 
                type="number" 
                defaultValue="12.50"
                min="1" 
                step="0.01" 
                className="w-full rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </FormGroup>
            
            <FormGroup label="Peak Hours Rate (₹/kWh)">
              <div className="flex space-x-3">
                <input 
                  type="number" 
                  defaultValue="15.00"
                  min="1" 
                  step="0.01" 
                  className="flex-1 rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <select 
                  className="flex-1 rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="17-21">17:00 - 21:00</option>
                  <option value="18-22">18:00 - 22:00</option>
                  <option value="19-23">19:00 - 23:00</option>
                </select>
              </div>
            </FormGroup>
            
            <FormGroup label="Service Fee (₹)">
              <input 
                type="number" 
                defaultValue="5.00"
                min="0" 
                step="0.01" 
                className="w-full rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </FormGroup>
            
            <div className="flex items-center mt-3">
              <input 
                type="checkbox" 
                id="dynamicPricing" 
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="dynamicPricing" className="ml-2 block text-sm text-gray-600 dark:text-gray-400">
                Enable dynamic pricing based on demand
              </label>
            </div>
            
            <div className="pt-4 border-t border-gray-100 dark:border-slate-700 mt-4">
              <button
                type="button"
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md transition-colors duration-200 flex items-center justify-center w-full"
              >
                <Save size={16} className="mr-2" />
                Save Pricing Settings
              </button>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Profile and Account Settings */}
      <Card 
        title="Profile & Account" 
        description="Update your account information"
        variant="default"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <FormGroup label="Host Name">
              <input 
                type="text" 
                defaultValue="EV Station Host"
                className="w-full rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </FormGroup>
            
            <FormGroup label="Email">
              <input 
                type="email" 
                defaultValue="host@example.com"
                className="w-full rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </FormGroup>
            
            <FormGroup label="Phone Number">
              <input 
                type="tel" 
                defaultValue="+91 98765 43210"
                className="w-full rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </FormGroup>
          </div>
          
          <div className="space-y-4">
            <FormGroup label="Host Type">
              <select 
                className="w-full rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="individual">Individual</option>
                <option value="business">Business</option>
                <option value="government">Government</option>
              </select>
            </FormGroup>
            
            <FormGroup label="Business/Entity Name (if applicable)">
              <input 
                type="text" 
                defaultValue="Green Chargers Pvt Ltd"
                className="w-full rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </FormGroup>
            
            <FormGroup label="GST Number (if applicable)">
              <input 
                type="text" 
                defaultValue="22AAAAA0000A1Z5"
                className="w-full rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </FormGroup>
          </div>
        </div>
        
        <div className="mt-6 border-t border-gray-100 dark:border-slate-700 pt-6">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Payment Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormGroup label="Bank Name">
              <input 
                type="text" 
                defaultValue="State Bank of India"
                className="w-full rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </FormGroup>
            
            <FormGroup label="Account Number">
              <input 
                type="text" 
                defaultValue="XXXX XXXX 1234"
                className="w-full rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </FormGroup>
            
            <FormGroup label="IFSC Code">
              <input 
                type="text" 
                defaultValue="SBIN0001234"
                className="w-full rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </FormGroup>
            
            <FormGroup label="Account Holder Name">
              <input 
                type="text" 
                defaultValue="EV Station Host"
                className="w-full rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </FormGroup>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md transition-colors duration-200 flex items-center"
          >
            <Save size={16} className="mr-2" />
            Save Account Settings
          </button>
        </div>
      </Card>
      
      {/* Station Settings */}
      <Card 
        title="Station Management" 
        description="Configure your charging stations"
        variant="default"
      >
        <div className="space-y-4">
          <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Default Station Settings</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormGroup label="Operating Hours">
                <div className="flex space-x-2">
                  <select 
                    className="w-full rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="24">24 Hours</option>
                    <option value="custom">Custom Hours</option>
                  </select>
                </div>
              </FormGroup>
              
              <FormGroup label="Max Power (kW)">
                <input 
                  type="number" 
                  defaultValue="22"
                  className="w-full rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </FormGroup>
              
              <FormGroup label="Idle Fee (₹/min after 15m)">
                <input 
                  type="number" 
                  defaultValue="2"
                  min="0"
                  step="0.5"
                  className="w-full rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </FormGroup>
            </div>
            
            <div className="mt-4 space-y-3">
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="publicAccess" 
                  checked 
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="publicAccess" className="ml-2 block text-sm text-gray-600 dark:text-gray-400">
                  Allow public access
                </label>
              </div>
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="reservations" 
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="reservations" className="ml-2 block text-sm text-gray-600 dark:text-gray-400">
                  Enable station reservations
                </label>
              </div>
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="maintenanceAlerts" 
                  checked
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="maintenanceAlerts" className="ml-2 block text-sm text-gray-600 dark:text-gray-400">
                  Receive maintenance alerts
                </label>
              </div>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Automatic Controls</h4>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <div>
                  <h5 className="text-sm font-medium text-gray-900 dark:text-white">Auto-shutdown during inactivity</h5>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Put stations to sleep when not in use</p>
                </div>
                <ToggleSwitch enabled={true} onChange={() => {}} label="" />
              </div>
              
              <div className="flex items-center justify-between py-2">
                <div>
                  <h5 className="text-sm font-medium text-gray-900 dark:text-white">Load balancing</h5>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Distribute power efficiently across chargers</p>
                </div>
                <ToggleSwitch enabled={true} onChange={() => {}} label="" />
              </div>
              
              <div className="flex items-center justify-between py-2">
                <div>
                  <h5 className="text-sm font-medium text-gray-900 dark:text-white">Scheduled maintenance</h5>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Auto-schedule preventive maintenance</p>
                </div>
                <ToggleSwitch enabled={false} onChange={() => {}} label="" />
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
            Save Station Settings
          </button>
        </div>
      </Card>
    </div>
  );
};

export default Settings;