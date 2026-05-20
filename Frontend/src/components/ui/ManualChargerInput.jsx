import { useState } from 'react';
import { Zap, Hash, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import Button from './Button';
import Modal from './Modal';
import { OCPP_BASE_URL } from '../../config/config';

const ManualChargerInput = ({ isOpen, onClose, onStartCharge }) => {
  const [chargerId, setChargerId] = useState('');
  const [wsUrl, setWsUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!chargerId.trim()) {
      setError('Please enter a charger ID');
      return;
    }

    setIsProcessing(true);
    setError('');
    setSuccess('');

    try {
      await onStartCharge(chargerId.trim());
      setSuccess(`Charging session initiated for charger ${chargerId}`);

      setTimeout(() => {
        handleClose();
      }, 2000);

    } catch (err) {
      console.error('Error starting charge:', err);
      setError(err.message || 'Failed to start charging session');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setChargerId('');
    setError('');
    setSuccess('');
    setIsProcessing(false);
    onClose();
  };

  const handleChargerIdChange = (e) => {
    const value = e.target.value.toUpperCase();
    setChargerId(value);
    setError('');

    const url = `${OCPP_BASE_URL}/${value}`;
    console.log("Generated URL:", url);
    setWsUrl(url);
  };

  const testChargerIds = ['CH-001', 'CH-002', 'CH-003', 'CH-004', 'CH-005'];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Enter Charger ID"
      actions={
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isProcessing || !chargerId.trim()}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isProcessing ? (
              <>
                <Loader size={16} className="animate-spin mr-2" />
                Starting...
              </>
            ) : (
              <>
                <Zap size={16} className="mr-2" />
                Start Charging
              </>
            )}
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="chargerId"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Charger ID
            </label>

            <div className="relative">
              <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                id="chargerId"
                value={chargerId}
                onChange={handleChargerIdChange}
                placeholder="Enter charger ID (e.g., CH-001)"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-green-500 focus:border-green-500
                         placeholder-gray-500 dark:placeholder-gray-400"
                disabled={isProcessing}
                autoComplete="off"
                autoFocus
              />
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Enter the charger ID found on the charging station
            </p>

            {wsUrl && (
              <div className="mt-3">
                <label>WebSocket URL</label>
                <input value={wsUrl} readOnly />
              </div>
            )}

          </div>

          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Quick Select (Test Chargers)
          </h4>

          <div className="grid grid-cols-3 gap-2">
            {testChargerIds.map((id) => (
              <Button
                key={id}
                variant="outline"
                size="sm"
                onClick={() => {
                  setChargerId(id);
                  const url = `${OCPP_BASE_URL}/${id}`;
                  setWsUrl(url);
                }}
                disabled={isProcessing}
                className="text-xs"
              >
                {id}
              </Button>
            ))}
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Click any test charger ID to auto-fill
          </p>

        </form>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
            <AlertCircle size={20} />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-300">
            <CheckCircle size={20} />
            <span className="text-sm">{success}</span>
          </div>
        )}

        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
            How to find your Charger ID:
          </h4>
          <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
            <li>• Look for a label or sticker on the charging station</li>
            <li>• Check the station's display screen</li>
            <li>• Scan the QR code if available (use QR scanner instead)</li>
            <li>• Ask station staff if you can't locate the ID</li>
          </ul>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Transaction Details:
          </h4>
          <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <div className="flex justify-between">
              <span>Amount:</span>
              <span className="font-medium">₹1.00 (Test)</span>
            </div>
            <div className="flex justify-between">
              <span>Duration:</span>
              <span className="font-medium">30 seconds</span>
            </div>
            <div className="flex justify-between">
              <span>Auto-complete:</span>
              <span className="font-medium">Yes</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            This is a test transaction that will complete automatically
          </p>
        </div>

      </div>
    </Modal>
  );
};

export default ManualChargerInput;