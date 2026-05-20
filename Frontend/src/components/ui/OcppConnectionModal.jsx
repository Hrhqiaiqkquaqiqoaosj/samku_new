import { useState, useEffect } from 'react';
import { QrCode, Copy, Link, Clock, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';
import { API_ENDPOINTS, WEBSOCKET_URL } from '../../config/config';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';

const OcppConnectionModal = ({ isOpen, onClose, entity, entityType }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [connectionData, setConnectionData] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [error, setError] = useState(null);
  const { token } = useAuth(); // Get token from AuthContext instead of localStorage
  const { generateOcppUrl, wsConnected, setupWebSocket } = useData(); // Get the WebSocket connection status and setup function
  
  // Generate the OCPP connection URL
  const generateConnectionUrl = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Use charger serial number or generate one for the entity
      const chargePointId = entity?.serialNumber || `CP_${entity?.id?.slice(-8) || entity?._id?.slice(-8)?.toUpperCase()}`;

      console.log(`Generating OCPP connection for ${entityType} with ID: ${chargePointId}`);
      
      const data = await generateOcppUrl(chargePointId);
      
      if (!data) {
        throw new Error("Failed to generate OCPP URL - no data received from server");
      }
      
      console.log("OCPP URL generation response:", data);
      
      // Ensure we're using the correct backend URL
      // Extract the base URL from the config
      const baseUrl = WEBSOCKET_URL.replace(/^(ws|wss):\/\//, '');
      const connectionUrl = `wss://${baseUrl}/ocpp/${chargePointId}`;
      
      // Transform backend response to match UI expectations
      setConnectionData({
        serialNumber: chargePointId,
        connectionUrl: connectionUrl,
        dateGenerated: data.generated || data.dateGenerated || new Date().toISOString(),
        expiresIn: data.expiresIn || "24 hours",
        ...data
      });
    } catch (error) {
      console.error('Error generating connection URL:', error);
      setError(error.message || 'Failed to generate connection URL');
      
      // If we get a 401, suggest re-login
      if (error.message && error.message.includes('401')) {
        setError('Authentication failed. Please try logging out and back in.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Copy the connection URL to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      },
      (err) => {
        console.error('Could not copy text: ', err);
      }
    );
  };

  // Reset the connection data
  const resetConnectionData = () => {
    setConnectionData(null);
    setError(null);
  };

  // Generate QR code URL for the connection
  const getQRCodeUrl = (text) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(text)}`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`OCPP Connection for ${entityType === 'charger' ? 'Charger' : 'Station'}`}
      description={`Generate a secure connection URL for your ${entityType}`}
      size="md"
      footer={
        <>
          <Button
            variant="outline"
            onClick={onClose}
          >
            Close
          </Button>
          {!connectionData && (
            <Button
              variant="primary"
              onClick={generateConnectionUrl}
              disabled={isLoading}
              leftIcon={isLoading ? <RefreshCw className="animate-spin" size={16} /> : <Link size={16} />}
            >
              {isLoading ? 'Generating...' : 'Generate Connection URL'}
            </Button>
          )}
          {connectionData && (
            <Button
              variant="secondary"
              onClick={resetConnectionData}
              leftIcon={<RefreshCw size={16} />}
            >
              Generate New URL
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-4">
        {/* WebSocket Connection Status */}
        <div className={`flex items-center p-3 rounded-md ${wsConnected ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {wsConnected ? (
            <>
              <Wifi size={18} className="mr-2 text-green-500" />
              <span className="text-sm font-medium">WebSocket Connected</span>
            </>
          ) : (
            <>
              <WifiOff size={18} className="mr-2 text-red-500" />
              <span className="text-sm font-medium">WebSocket Disconnected</span>
              <Button
                variant="link"
                size="sm"
                className="ml-auto text-red-700"
                onClick={() => setupWebSocket()}
              >
                Reconnect
              </Button>
            </>
          )}
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
            {error}
          </div>
        )}
        
        {!connectionData && !error && (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Link className="text-blue-600 dark:text-blue-400" size={24} />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Generate OCPP Connection URL
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
              This will create a secure connection URL that your OCPP-compatible charger can use to connect to our system.
            </p>
          </div>
        )}
        
        {connectionData && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mb-4">
                <img 
                  src={getQRCodeUrl(connectionData.connectionUrl)}
                  alt="Connection QR Code"
                  className="h-48 w-48 mx-auto border border-gray-200 dark:border-slate-700 p-2 rounded-md"
                />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                {entityType === 'charger' ? 'Charger' : 'Station'}: {entity.name || entity.serialNumber}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Serial Number: {connectionData.serialNumber}
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Connection URL
                </label>
                <div className="flex items-center">
                  <input
                    type="text"
                    value={connectionData.connectionUrl}
                    readOnly
                    className="flex-1 rounded-l-md border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 px-3 py-2 text-sm text-gray-900 dark:text-white"
                  />
                  <button
                    onClick={() => copyToClipboard(connectionData.connectionUrl)}
                    className="rounded-r-md border border-l-0 border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 px-3 py-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-600"
                    title="Copy to clipboard"
                  >
                    {copySuccess ? (
                      <span className="text-green-500 dark:text-green-400 text-sm font-medium">Copied!</span>
                    ) : (
                      <Copy size={16} />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Use this URL to connect your charger to our system via OCPP protocol
                </p>
              </div>
              
              <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-md text-sm">
                <h4 className="text-blue-800 dark:text-blue-300 font-medium mb-1">Connection Instructions</h4>
                <ul className="list-disc list-inside text-blue-700 dark:text-blue-400 text-xs space-y-1">
                  <li>Use this URL in your OCPP client to connect to the server</li>
                  <li>Protocol: OCPP 1.6</li>
                  <li>Sub-protocol: ocpp1.6</li>
                  <li>Make sure your client sends proper BootNotification and Heartbeat messages</li>
                </ul>
              </div>
              
              <div className="pt-3 border-t border-gray-100 dark:border-slate-700 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center">
                  <Clock size={14} className="mr-1" />
                  <span>Generated on {new Date(connectionData.dateGenerated).toLocaleString()}</span>
                </div>
                <div className="flex items-center mt-1">
                  <RefreshCw size={14} className="mr-1" />
                  <span>Valid for {connectionData.expiresIn}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default OcppConnectionModal;