# WebSocket Connection Stability Fixes

## Problem Summary

The React frontend was experiencing frequent WebSocket disconnections when connecting to the Node.js/Express backend's OCPP WebSocket server. The main issues were:

1. **Heartbeat Timing Conflicts**: Both frontend and backend sending pings every 30 seconds
2. **Missing Authentication**: No token validation for UI client connections
3. **Poor Error Handling**: Limited error logging and debugging information
4. **Resource Cleanup Issues**: Intervals not properly cleaned up on disconnection
5. **Connection State Management**: Poor synchronization between frontend and backend

## Root Cause Analysis

### Backend Issues:
- UI client disconnections weren't logging close codes/reasons
- Heartbeat mechanism was too aggressive (30s intervals)
- No authentication for WebSocket connections
- Limited error handling for WebSocket edge cases
- Poor resource cleanup on connection failures

### Frontend Issues:
- Ping interval conflicts with server heartbeat
- No authentication token sent to server
- Poor reconnection logic
- Insufficient error handling and logging
- Resource leaks from uncleaned intervals

## Complete Solution

### 1. Backend Improvements (`Backend/server.js`)

#### A. Enhanced UI Client Authentication
```javascript
// Extract and validate JWT token from query parameters
const url = new URL(req.url, `http://${req.headers.host}`);
const token = url.searchParams.get('token') || req.headers.authorization?.replace('Bearer ', '');

if (!token) {
  ws.close(1008, 'Authentication required');
  return;
}

// Verify JWT token
const jwt = require('jsonwebtoken');
const decoded = jwt.verify(token, process.env.JWT_SECRET);
```

#### B. Improved Close Code Logging
```javascript
ws.on('close', (code, reason) => {
  const reasonStr = reason ? reason.toString() : 'No reason provided';
  console.log(`UI client ${clientId} disconnected: Code ${code}, Reason: ${reasonStr}`);
  
  // Log connection duration and context
  const connectionDuration = Date.now() - new Date(client.connectedAt).getTime();
  console.log(`Connection duration: ${Math.round(connectionDuration/1000)}s`);
  
  // Detailed close code interpretation
  switch (code) {
    case 1000: console.log('Normal closure'); break;
    case 1001: console.log('Going away (page refresh)'); break;
    case 1006: console.log('Abnormal closure (network issue)'); break;
    case 1008: console.log('Policy violation'); break;
    case 1011: console.log('Server error'); break;
  }
});
```

#### C. Optimized Heartbeat Mechanism
```javascript
// Changed from 30s to 45s intervals to avoid conflicts
// UI clients use activity-based checking instead of ping/pong
this.heartbeatInterval = setInterval(() => {
  this.uiClients.forEach((client, id) => {
    const timeSinceLastActivity = Date.now() - new Date(client.lastPing).getTime();
    
    // Terminate if inactive for 90 seconds
    if (timeSinceLastActivity > 90000) {
      client.ws.terminate();
      this.uiClients.delete(id);
      return;
    }
    
    // Only ping if client hasn't been active recently
    if (timeSinceLastActivity > 45000) {
      client.ws.ping();
    }
  });
}, 45000);
```

#### D. Enhanced Error Handling
```javascript
// Better error handling in sendToUIClient
sendToUIClient(clientId, message) {
  const client = this.uiClients.get(clientId);
  if (!client || client.ws.readyState !== WebSocket.OPEN) {
    console.warn(`Cannot send to UI client ${clientId}: not available`);
    this.uiClients.delete(clientId);
    return false;
  }

  try {
    client.ws.send(JSON.stringify(message));
    return true;
  } catch (error) {
    console.error(`Error sending to UI client ${clientId}:`, error);
    client.ws.close(1011, 'Send error');
    this.uiClients.delete(clientId);
    return false;
  }
}
```

### 2. Frontend Improvements (`Frontend/src/contexts/DataContext.jsx`)

#### A. Authentication Integration
```javascript
// Add token to WebSocket URL
const token = localStorage.getItem("token");
const wsUrl = `${WEBSOCKET_URL}/ocpp/ui-client?token=${encodeURIComponent(token)}`;
```

#### B. Improved Connection Management
```javascript
// Connection timeout
const connectionTimeout = setTimeout(() => {
  if (window.socket && window.socket.readyState === WebSocket.CONNECTING) {
    console.error("WebSocket connection timeout");
    window.socket.close(1006, 'Connection timeout');
  }
}, 10000);

// Proper cleanup on connection open
window.socket.onopen = () => {
  clearTimeout(connectionTimeout);
  setWsConnected(true);
  setWsConnecting(false);
  setWsReconnectAttempts(0);
};
```

#### C. Enhanced Error Handling and Logging
```javascript
// Detailed close code logging
window.socket.onclose = (event) => {
  console.log(`WebSocket closed: Code ${event.code}, Reason: ${event.reason}`);
  
  switch (event.code) {
    case 1000: console.log("Normal closure"); break;
    case 1001: console.log("Going away (page refresh)"); break;
    case 1006: console.log("Abnormal closure (network issue)"); break;
    case 1008: console.log("Authentication failed"); break;
    case 1011: console.log("Server error"); break;
  }
};
```

#### D. Proper Resource Cleanup
```javascript
const cleanupWebSocket = () => {
  // Clear all intervals
  if (window.pingInterval) {
    clearInterval(window.pingInterval);
    window.pingInterval = null;
  }
  
  if (window.statusUpdateInterval) {
    clearInterval(window.statusUpdateInterval);
    window.statusUpdateInterval = null;
  }
  
  // Close WebSocket properly
  if (window.socket) {
    if (window.socket.readyState === WebSocket.OPEN) {
      window.socket.close(1000, 'Component unmounting');
    }
    window.socket = null;
  }
};
```

#### E. Smart Reconnection Logic
```javascript
// Only reconnect if authenticated and not auth failure
const shouldReconnect = currentToken && 
                       event.code !== 1000 && // Normal close
                       event.code !== 1008 && // Auth failure
                       wsReconnectAttempts < 3;

if (shouldReconnect) {
  const delay = Math.min(2000 * Math.pow(2, wsReconnectAttempts), 10000);
  setTimeout(() => {
    setWsReconnectAttempts(prev => prev + 1);
    setupWebSocket();
  }, delay);
}
```

### 3. UI Enhancements

#### A. WebSocket Status Component (`Frontend/src/components/ui/WebSocketStatus.jsx`)
- Real-time connection status display
- Manual reconnection button
- Reconnection attempt counter
- Visual indicators (🟢🟡🔴)

#### B. Header Integration
- Added WebSocket status to main header
- Always visible connection state
- Quick access to reconnection

## Key Improvements Made

### 1. **Authentication Security**
- ✅ JWT token validation for WebSocket connections
- ✅ Secure token transmission via query parameters
- ✅ Authentication failure handling

### 2. **Connection Stability**
- ✅ Optimized heartbeat timing (45s server, 30s client)
- ✅ Activity-based connection monitoring
- ✅ Proper connection timeout handling
- ✅ Smart reconnection with exponential backoff

### 3. **Error Handling & Debugging**
- ✅ Comprehensive close code logging
- ✅ Connection duration tracking
- ✅ Detailed error messages
- ✅ WebSocket state monitoring

### 4. **Resource Management**
- ✅ Proper interval cleanup
- ✅ Memory leak prevention
- ✅ Connection state synchronization
- ✅ Graceful shutdown handling

### 5. **User Experience**
- ✅ Visual connection status indicator
- ✅ Manual reconnection capability
- ✅ Connection attempt feedback
- ✅ Reduced polling frequency

## Production Deployment Notes

### Environment Variables Required:
```bash
# Backend
JWT_SECRET=your-jwt-secret-key
NODE_ENV=production

# Frontend
VITE_WEBSOCKET_URL=wss://your-domain.com
```

### Security Considerations:
1. **Token Expiration**: Implement token refresh mechanism
2. **Rate Limiting**: Already implemented in backend
3. **CORS**: Properly configured for production domains
4. **SSL/TLS**: Use WSS in production

### Monitoring & Debugging:
1. **Server Logs**: Monitor WebSocket connection/disconnection patterns
2. **Client Logs**: Use browser dev tools to monitor WebSocket messages
3. **Health Checks**: Use `/health` endpoint to monitor server status
4. **Metrics**: Track connection duration and reconnection rates

## Testing Recommendations

### 1. Connection Stability Tests:
- Page refresh during active connection
- Network interruption simulation
- Token expiration scenarios
- Multiple tab scenarios

### 2. Load Testing:
- Multiple concurrent UI clients
- High-frequency message sending
- Memory usage monitoring
- Connection limit testing

### 3. Error Scenarios:
- Invalid token authentication
- Server restart during connection
- Network timeout scenarios
- Malformed message handling

## Best Practices Implemented

### 1. **WebSocket Connection Management**
- Single connection per client
- Proper connection state tracking
- Graceful connection closure
- Resource cleanup on unmount

### 2. **Error Handling**
- Comprehensive error logging
- User-friendly error messages
- Automatic error recovery
- Manual recovery options

### 3. **Performance Optimization**
- Reduced polling frequency
- Efficient message batching
- Memory leak prevention
- Connection pooling

### 4. **Security**
- Token-based authentication
- Input validation
- Rate limiting
- Secure WebSocket (WSS)

## Future Enhancements

### 1. **Advanced Features**
- Message queuing for offline scenarios
- Connection quality metrics
- Automatic token refresh
- Multi-server load balancing

### 2. **Monitoring**
- Real-time connection analytics
- Performance metrics dashboard
- Alert system for connection issues
- Historical connection data

### 3. **Scalability**
- Redis for multi-server WebSocket scaling
- Message broker integration
- Horizontal scaling support
- Connection clustering

## Additional Fix: Mongoose Connection Close Issue

### Problem
The server was experiencing repeated unhandled promise rejections during shutdown:
```
❌ Unhandled Promise Rejection: MongooseError: Connection.prototype.close() no longer accepts a callback
```

### Root Cause
Newer versions of Mongoose (v6+) changed the API - `mongoose.connection.close()` no longer accepts a callback function and returns a Promise instead.

### Solution
Updated the shutdown method to use async/await pattern:

```javascript
// OLD (causing errors):
mongoose.connection.close(() => {
  console.log("MongoDB connection closed");
  process.exit(0);
});

// NEW (fixed):
async shutdown() {
  // ... other cleanup code ...
  
  try {
    await mongoose.connection.close();
    console.log("✅ MongoDB connection closed");
  } catch (mongoError) {
    console.error("❌ Error closing MongoDB connection:", mongoError);
  }
  
  console.log("✅ Graceful shutdown completed");
  process.exit(0);
}
```

### Enhanced Shutdown Process
1. **Async/Await Pattern**: Proper promise handling for all cleanup operations
2. **Error Handling**: Individual try-catch blocks for each cleanup step
3. **Timeout Protection**: Force exit after 10 seconds if shutdown hangs
4. **Detailed Logging**: Clear status messages for each shutdown step
5. **Signal Handling**: Proper async handling for SIGTERM and SIGINT

### Benefits
- ✅ No more unhandled promise rejections
- ✅ Clean shutdown process
- ✅ Better error visibility
- ✅ Prevents hanging shutdowns
- ✅ Improved debugging information

This fix ensures the server shuts down cleanly without errors, making it production-ready for deployment platforms like Render, Heroku, or Docker containers.

---

This comprehensive solution addresses all identified WebSocket stability issues and provides a robust, production-ready real-time communication system. 