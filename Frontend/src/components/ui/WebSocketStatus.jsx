import React from 'react';
import { useData } from '../../contexts/DataContext';

const WebSocketStatus = () => {
  const { 
    wsConnected, 
    wsConnecting, 
    wsReconnectAttempts, 
    reconnectWebSocket 
  } = useData();

  const getStatusColor = () => {
    if (wsConnected) return 'text-green-600';
    if (wsConnecting) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusText = () => {
    if (wsConnected) return 'Connected';
    if (wsConnecting) return 'Connecting...';
    return 'Disconnected';
  };

  const getStatusIcon = () => {
    if (wsConnected) return '🟢';
    if (wsConnecting) return '🟡';
    return '🔴';
  };

  return (
    <div className="flex items-center space-x-2 text-sm">
      <span className="font-medium text-gray-700">WebSocket:</span>
      <span className={getStatusColor()}>
        {getStatusIcon()} {getStatusText()}
      </span>
      
      {wsReconnectAttempts > 0 && (
        <span className="text-gray-500">
          (Attempt {wsReconnectAttempts}/3)
        </span>
      )}
      
      {!wsConnected && !wsConnecting && (
        <button
          onClick={reconnectWebSocket}
          className="ml-2 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Reconnect
        </button>
      )}
    </div>
  );
};

export default WebSocketStatus; 