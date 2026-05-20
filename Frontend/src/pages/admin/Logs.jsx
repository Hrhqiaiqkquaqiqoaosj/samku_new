import { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { 
  RefreshCw, 
  Download, 
  Search, 
  Filter, 
  Wifi, 
  WifiOff, 
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

const AdminLogs = () => {
  const { 
    logs, 
    fetchLogs, 
    loading, 
    wsConnected, 
    setupWebSocket 
  } = useData();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterDirection, setFilterDirection] = useState('');
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [lastWebSocketMessage, setLastWebSocketMessage] = useState(null);
  const [allWebSocketMessages, setAllWebSocketMessages] = useState([]); // Store all messages
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  
  // Filter logs based on search query and filters
  useEffect(() => {
    if (!logs) return;
    
    const filtered = logs.filter(log => {
      const matchesSearch = searchQuery ? 
        (log.content && log.content.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (log.action && log.action.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (log.chargePointId && log.chargePointId.toLowerCase().includes(searchQuery.toLowerCase()))
        : true;
        
      const matchesType = filterType ? log.action === filterType : true;
      const matchesDirection = filterDirection ? log.direction === filterDirection : true;
      
      return matchesSearch && matchesType && matchesDirection;
    });
    
    setFilteredLogs(filtered);
  }, [logs, searchQuery, filterType, filterDirection]);
  
  // Load logs on component mount
  useEffect(() => {
    fetchLogs();
    
    // Set up WebSocket message listener
    if (window.socket) {
      const messageHandler = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Safely create message object, ensuring data is serializable
          const messageWithTimestamp = {
            type: data.type || 'unknown',
            timestamp: new Date().toISOString(),
            data: data
          };
          
          // Test if the message can be safely stringified
          try {
            JSON.stringify(messageWithTimestamp);
          } catch (stringifyError) {
            console.warn('Message data not serializable, creating safe version:', stringifyError);
            messageWithTimestamp.data = {
              type: data.type || 'unknown',
              error: 'Data not serializable',
              originalError: stringifyError.message
            };
          }
          
          // Update last message
          setLastWebSocketMessage(messageWithTimestamp);
          
          // Add to all messages (limited to last 50 messages to prevent memory issues)
          setAllWebSocketMessages(prev => [messageWithTimestamp, ...prev.slice(0, 49)]);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
          
          // Create a safe error message object
          const errorMessage = {
            type: 'parse-error',
            timestamp: new Date().toISOString(),
            data: {
              error: 'Failed to parse WebSocket message',
              message: error.message
            }
          };
          
          setLastWebSocketMessage(errorMessage);
          setAllWebSocketMessages(prev => [errorMessage, ...prev.slice(0, 49)]);
        }
      };
      
      window.socket.addEventListener('message', messageHandler);
      
      return () => {
        if (window.socket) {
          window.socket.removeEventListener('message', messageHandler);
        }
      };
    }
  }, []);
  
  // Handle manual WebSocket reconnect
  const handleReconnect = () => {
    setConnectionAttempts(prev => prev + 1);
    setupWebSocket();
  };
  
  // Get unique action types for filter dropdown
  const getActionTypes = () => {
    if (!logs) return [];
    const types = new Set();
    logs.forEach(log => {
      if (log.action) types.add(log.action);
    });
    return Array.from(types).sort();
  };
  
  // Format log timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };
  
  // Download logs as JSON
  const downloadLogs = () => {
    const data = JSON.stringify(logs, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ocpp-logs-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // Download WebSocket messages as JSON
  const downloadWebSocketMessages = () => {
    const data = JSON.stringify(allWebSocketMessages, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `websocket-messages-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">System Logs</h1>
        
        <div className="flex space-x-2">
          <Button
            variant="outline"
            leftIcon={<RefreshCw size={16} />}
            onClick={fetchLogs}
            disabled={loading.logs}
          >
            {loading.logs ? 'Refreshing...' : 'Refresh'}
          </Button>
          
          <Button
            variant="outline"
            leftIcon={<Download size={16} />}
            onClick={downloadLogs}
          >
            Export
          </Button>
        </div>
      </div>
      
      {/* WebSocket Connection Status */}
      <Card className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center">
            <div className={`p-3 rounded-full ${wsConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} mr-4`}>
              {wsConnected ? <Wifi size={24} /> : <WifiOff size={24} />}
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-800 dark:text-white">
                WebSocket Connection Status
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {wsConnected 
                  ? 'Connected to OCPP WebSocket server' 
                  : 'Disconnected from OCPP WebSocket server'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Reconnection attempts: {connectionAttempts}
            </div>
            
            <Button
              variant={wsConnected ? 'outline' : 'primary'}
              leftIcon={<RefreshCw size={16} />}
              onClick={handleReconnect}
              disabled={loading.logs}
            >
              Reconnect
            </Button>
          </div>
        </div>
        
        {/* WebSocket Messages Section */}
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-md font-medium text-gray-700 dark:text-gray-300">
              WebSocket Messages (Testing):
            </h4>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Download size={14} />}
              onClick={downloadWebSocketMessages}
            >
              Export Messages
            </Button>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md overflow-x-auto max-h-96 overflow-y-auto">
            {allWebSocketMessages.length > 0 ? (
              allWebSocketMessages.map((msg, index) => (
                <div key={index} className="mb-4 pb-4 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                      {formatTimestamp(msg.timestamp)}
                    </span>
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">
                      {typeof msg.type === 'string' ? msg.type : 'unknown'}
                    </span>
                  </div>
                  <pre className="text-xs text-gray-800 dark:text-gray-300 whitespace-pre-wrap">
                    {(() => {
                      try {
                        if (msg.data === null || msg.data === undefined) {
                          return 'No data';
                        }
                        if (typeof msg.data === 'string') {
                          return msg.data;
                        }
                        return JSON.stringify(msg.data, null, 2);
                      } catch (error) {
                        return `Error displaying data: ${error.message}`;
                      }
                    })()}
                  </pre>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                No WebSocket messages received yet
              </div>
            )}
          </div>
        </div>
      </Card>
      
      {/* Search and Filter */}
      <Card>
        <div className="mb-6 flex flex-col md:flex-row md:items-center gap-4">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search logs by content, action or charger ID"
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex space-x-4">
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Action Type</label>
              <select
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="">All Actions</option>
                {getActionTypes().map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Direction</label>
              <select
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filterDirection}
                onChange={(e) => setFilterDirection(e.target.value)}
              >
                <option value="">All</option>
                <option value="incoming">Incoming</option>
                <option value="outgoing">Outgoing</option>
                <option value="system">System</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Logs Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Charger ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Direction
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Content
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatTimestamp(log.timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {log.chargePointId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${log.action === 'ERROR' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : 
                          log.action === 'CONNECTION' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' : 
                          'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                        ${log.direction === 'incoming' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 
                          log.direction === 'outgoing' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' : 
                          'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'}`}>
                        {log.direction}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-md truncate">
                      <div className="max-h-20 overflow-y-auto">
                        <pre className="text-xs whitespace-pre-wrap">{log.content}</pre>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <AlertCircle size={32} className="text-gray-400 mb-2" />
                      <p className="text-gray-500 dark:text-gray-400">No logs found</p>
                      {(searchQuery || filterType || filterDirection) && (
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                          Try adjusting your search or filter criteria
                        </p>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination could go here */}
      </Card>
    </div>
  );
};

export default AdminLogs;