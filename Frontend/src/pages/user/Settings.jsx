import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import Card from '../../components/ui/Card';
import { 
  Sun, 
  Moon, 
  Bell, 
  User, 
  Settings as SettingsIcon,
  Save,
  Shield,
  CreditCard,
  Car,
  MapPin,
  Smartphone
} from 'lucide-react';

const Settings = () => {
  const { theme, setTheme } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [chargingAlerts, setChargingAlerts] = useState(true);
  const [paymentAlerts, setPaymentAlerts] = useState(true);
  const [promotionalAlerts, setPromotionalAlerts] = useState(false);
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
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">User Settings</h1>
      
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
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Language</h4>
              <select 
                className="w-full rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="mr">Marathi</option>
                <option value="gu">Gujarati</option>
                <option value="ta">Tamil</option>
              </select>
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
              enabled={chargingAlerts}
              onChange={setChargingAlerts}
              label="Charging Alerts"
              description="Get notified about charging status"
            />
            
            <ToggleSwitch 
              enabled={paymentAlerts}
              onChange={setPaymentAlerts}
              label="Payment Alerts"
              description="Get notified about payments and wallet updates"
            />
            
            <ToggleSwitch 
              enabled={promotionalAlerts}
              onChange={setPromotionalAlerts}
              label="Promotional Alerts"
              description="Receive offers and promotional messages"
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
        
        {/* Charging Preferences */}
        <Card 
          title="Charging Preferences" 
          description="Customize your charging experience"
          variant="default"
          className="col-span-1"
        >
          <div className="space-y-4">
            <FormGroup label="Default Payment Method">
              <select 
                className="w-full rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="wallet">Wallet Balance</option>
                <option value="upi">UPI</option>
                <option value="card">Saved Card</option>
              </select>
            </FormGroup>
            
            <FormGroup label="Max Charging Budget (₹)">
              <input 
                type="number" 
                defaultValue="500"
                min="100" 
                className="w-full rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </FormGroup>
            
            <div className="mt-3 space-y-3">
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="autoStart" 
                  checked 
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="autoStart" className="ml-2 block text-sm text-gray-600 dark:text-gray-400">
                  Auto-start charging when connected
                </label>
              </div>
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="stopAtFull" 
                  checked
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="stopAtFull" className="ml-2 block text-sm text-gray-600 dark:text-gray-400">
                  Stop charging when battery full
                </label>
              </div>
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="preferGreen" 
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="preferGreen" className="ml-2 block text-sm text-gray-600 dark:text-gray-400">
                  Prefer green energy stations
                </label>
              </div>
            </div>
            
            <div className="pt-4 border-t border-gray-100 dark:border-slate-700 mt-4">
              <button
                type="button"
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md transition-colors duration-200 flex items-center justify-center w-full"
              >
                <Save size={16} className="mr-2" />
                Save Preferences
              </button>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Profile and Account Settings */}
      <Card 
        title="Profile & Account" 
        description="Update your personal information"
        variant="default"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <div className="flex flex-col items-center">
              <div className="w-32 h-32 rounded-full bg-gray-300 dark:bg-gray-600 overflow-hidden mb-4 relative">
                <div className="absolute inset-0 flex items-center justify-center text-gray-500 dark:text-gray-400">
                  <User size={40} />
                </div>
              </div>
              <button
                type="button"
                className="px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors duration-200 text-sm"
              >
                Change Photo
              </button>
            </div>
          </div>
          
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormGroup label="Full Name">
              <input 
                type="text" 
                defaultValue="Alex Johnson"
                className="w-full rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </FormGroup>
            
            <FormGroup label="Email">
              <input 
                type="email" 
                defaultValue="alex@example.com"
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
            
            <FormGroup label="Date of Birth">
              <input 
                type="date" 
                defaultValue="1990-01-15"
                className="w-full rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </FormGroup>
            
            <div className="md:col-span-2">
              <FormGroup label="Address">
                <textarea 
                  rows="3"
                  defaultValue="123 EV Street, Green City, Maharashtra - 400001"
                  className="w-full rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                ></textarea>
              </FormGroup>
            </div>
          </div>
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-100 dark:border-slate-700">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Vehicles</h4>
          
          <div className="space-y-4">
            <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mr-3">
                    <Car size={20} />
                  </div>
                  <div>
                    <h5 className="text-sm font-medium text-gray-900 dark:text-white">Tata Nexon EV</h5>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Battery: 40.5 kWh • Added: Jan 2023</p>
                  </div>
                </div>
                <div>
                  <button className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
                    Edit
                  </button>
                </div>
              </div>
            </div>
            
            <button
              type="button"
              className="w-full px-4 py-2 border border-dashed border-gray-300 dark:border-slate-600 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-400 dark:hover:border-slate-500 flex items-center justify-center"
            >
              <span className="mr-2">+</span> Add Another Vehicle
            </button>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md transition-colors duration-200 flex items-center"
          >
            <Save size={16} className="mr-2" />
            Save Profile
          </button>
        </div>
      </Card>
      
      {/* Security Settings */}
      <Card 
        title="Security" 
        description="Manage your account security"
        variant="default"
      >
        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Change Password</h4>
            <div className="space-y-4">
              <FormGroup label="Current Password">
                <input 
                  type="password" 
                  placeholder="••••••••"
                  className="w-full rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </FormGroup>
              
              <FormGroup label="New Password">
                <input 
                  type="password" 
                  placeholder="••••••••"
                  className="w-full rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </FormGroup>
              
              <FormGroup label="Confirm New Password">
                <input 
                  type="password" 
                  placeholder="••••••••"
                  className="w-full rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </FormGroup>
            </div>
            
            <div className="mt-4">
              <button
                type="button"
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md transition-colors duration-200 text-sm"
              >
                Update Password
              </button>
            </div>
          </div>
          
          <div className="pt-6 border-t border-gray-100 dark:border-slate-700">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Two-Factor Authentication</h4>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Add an extra layer of security to your account by enabling two-factor authentication.
              </p>
              
              <div className="flex items-center">
                <ToggleSwitch 
                  enabled={false}
                  onChange={() => {}}
                  label="Enable Two-Factor Authentication"
                  description="Require a verification code when logging in"
                />
              </div>
            </div>
          </div>
          
          <div className="pt-6 border-t border-gray-100 dark:border-slate-700">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Login Devices</h4>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center mr-3">
                    <Smartphone size={16} />
                  </div>
                  <div>
                    <h5 className="text-sm font-medium text-gray-900 dark:text-white">iPhone 13 Pro</h5>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Current device • Last active: Now</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 flex items-center justify-center mr-3">
                    <Smartphone size={16} />
                  </div>
                  <div>
                    <h5 className="text-sm font-medium text-gray-900 dark:text-white">Chrome • Windows</h5>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Last active: 2 days ago</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </Card>
      
      {/* Payment Methods */}
      <Card 
        title="Payment Methods" 
        description="Manage your payment options"
        variant="default"
      >
        <div className="space-y-4">
          <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mr-3">
                  <CreditCard size={20} />
                </div>
                <div>
                  <h5 className="text-sm font-medium text-gray-900 dark:text-white">HDFC Bank Credit Card</h5>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Ending with 4242 • Expires: 05/25</p>
                </div>
              </div>
              <div>
                <button className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">
                  Remove
                </button>
              </div>
            </div>
          </div>
          
          <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex">
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center mr-3">
                  <Shield size={20} />
                </div>
                <div>
                  <h5 className="text-sm font-medium text-gray-900 dark:text-white">UPI</h5>
                  <p className="text-xs text-gray-500 dark:text-gray-400">user@okbank</p>
                </div>
              </div>
              <div>
                <button className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">
                  Remove
                </button>
              </div>
            </div>
          </div>
          
          <button
            type="button"
            className="w-full px-4 py-2 border border-dashed border-gray-300 dark:border-slate-600 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-400 dark:hover:border-slate-500 flex items-center justify-center"
          >
            <span className="mr-2">+</span> Add Payment Method
          </button>
        </div>
      </Card>
    </div>
  );
};

export default Settings;