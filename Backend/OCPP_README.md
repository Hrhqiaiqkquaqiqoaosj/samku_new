# OCPP WebSocket Server Implementation

## Overview

This implementation provides a complete OCPP (Open Charge Point Protocol) 1.6 WebSocket server integrated with the Samku CMS backend. The server handles real-time communication with electric vehicle charging stations and provides a comprehensive API for monitoring and controlling charge points.

## Features

- ✅ **OCPP 1.6 JSON over WebSocket** - Full protocol support
- ✅ **Real-time Communication** - Bidirectional messaging with charge points
- ✅ **Multi-tenant Support** - Handle multiple charge points simultaneously
- ✅ **Message Logging** - Complete audit trail of all OCPP messages
- ✅ **RESTful API** - HTTP endpoints for integration and monitoring
- ✅ **Production Ready** - Deployed on Render with proper error handling
- ✅ **Test Client** - Built-in testing tools for validation

## Deployment Information

- **Production URL**: `https://cms-o4rp.onrender.com`
- **WebSocket Endpoint**: `wss://cms-o4rp.onrender.com/ocpp/{charge-point-id}`
- **API Base**: `https://cms-o4rp.onrender.com/api`
- **Health Check**: `https://cms-o4rp.onrender.com/health`

## Supported OCPP Actions

### Charge Point to Central System (Incoming)
- `BootNotification` - Charger registration and configuration
- `Heartbeat` - Keep-alive messages
- `StatusNotification` - Connector status updates
- `Authorize` - RFID tag authorization
- `StartTransaction` - Transaction initiation
- `StopTransaction` - Transaction completion
- `MeterValues` - Energy consumption data
- `DataTransfer` - Vendor-specific data exchange
- `DiagnosticsStatusNotification` - Diagnostic status updates
- `FirmwareStatusNotification` - Firmware update status

### Central System to Charge Point (Outgoing)
- `Reset` - Restart charge point
- `RemoteStartTransaction` - Start charging remotely
- `RemoteStopTransaction` - Stop charging remotely
- `ChangeConfiguration` - Update charger settings
- `GetConfiguration` - Retrieve charger configuration
- `ClearCache` - Clear authorization cache

## API Endpoints

### OCPP Management

#### Generate WebSocket URL
```http
POST /api/ocpp/generate-url
Authorization: Bearer <token>
Content-Type: application/json

{
  "chargePointId": "CP_001" // Optional, auto-generated if not provided
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "chargePointId": "CP_001",
    "websocketUrl": "wss://cms-o4rp.onrender.com/ocpp/CP_001",
    "frontendUrl": "https://cms-o4rp.onrender.com",
    "instructions": {
      "connection": "Connect your OCPP client to: wss://cms-o4rp.onrender.com/ocpp/CP_001",
      "protocol": "OCPP 1.6 JSON over WebSocket",
      "subProtocol": "ocpp1.6"
    }
  }
}
```

#### Get Connected Chargers
```http
GET /api/ocpp/connected-chargers
Authorization: Bearer <token>
```

#### Get OCPP Logs
```http
GET /api/ocpp/logs?limit=100&chargePointId=CP_001&direction=incoming
Authorization: Bearer <token>
```

#### Send Command to Charge Point
```http
POST /api/ocpp/send-command
Authorization: Bearer <token>
Content-Type: application/json

{
  "chargePointId": "CP_001",
  "command": "Reset",
  "payload": {
    "type": "Soft"
  }
}
```

#### Server Status
```http
GET /api/ocpp/server-status
Authorization: Bearer <token>
```

## WebSocket Connection

### Connection URL Format
```
wss://cms-o4rp.onrender.com/ocpp/{charge-point-id}
```

### Supported Sub-protocols
- `ocpp1.6`

### Message Format
All messages follow the OCPP 1.6 JSON format:

**CALL (Request)**
```json
[2, "message-id", "action", {"payload": "data"}]
```

**CALLRESULT (Response)**
```json
[3, "message-id", {"result": "data"}]
```

**CALLERROR (Error)**
```json
[4, "message-id", "error-code", "error-description", {"details": "data"}]
```

## Testing the Connection

### Using the Built-in Test Client

1. **Test with deployed server:**
```bash
cd Backend
npm run test-ocpp
```

2. **Test with local server:**
```bash
cd Backend
npm run test-ocpp-local
```

3. **Custom test:**
```bash
cd Backend
node test-ocpp-connection.js YOUR_CHARGE_POINT_ID wss://cms-o4rp.onrender.com/ocpp/YOUR_CHARGE_POINT_ID
```

### Using External OCPP Simulators

1. **SteVe (Steve's OCPP Simulator)**
   - URL: `wss://cms-o4rp.onrender.com/ocpp/{your-charge-point-id}`
   - Protocol: OCPP 1.6 JSON

2. **OCPP Simulator Tools**
   - Any OCPP 1.6 compatible simulator
   - Configure WebSocket URL and charge point ID

### Manual Testing with WebSocket Client

```javascript
const ws = new WebSocket('wss://cms-o4rp.onrender.com/ocpp/TEST_CP_001', ['ocpp1.6']);

ws.onopen = () => {
  // Send BootNotification
  const bootNotification = [
    2, // CALL
    "boot_001",
    "BootNotification",
    {
      "chargePointVendor": "TestVendor",
      "chargePointModel": "TestModel",
      "chargePointSerialNumber": "TEST_CP_001",
      "firmwareVersion": "1.0.0"
    }
  ];
  ws.send(JSON.stringify(bootNotification));
};

ws.onmessage = (event) => {
  console.log('Received:', JSON.parse(event.data));
};
```

## Monitoring and Debugging

### Real-time Logs
All OCPP messages are logged in real-time and can be accessed via:
- API endpoint: `/api/ocpp/logs`
- Server console output
- WebSocket broadcast to UI clients

### Health Monitoring
- Health check endpoint: `/health`
- Server status: `/api/ocpp/server-status`
- Connected chargers: `/api/ocpp/connected-chargers`

### Log Levels
- `INFO` - Normal operations (connections, successful messages)
- `ERROR` - Errors and exceptions
- `SYSTEM` - Server events (startup, shutdown, connections)

## Integration Examples

### Frontend Integration
```javascript
// Connect to UI WebSocket for real-time updates
const uiWs = new WebSocket('wss://cms-o4rp.onrender.com/ocpp/ui-client');

uiWs.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  switch(data.type) {
    case 'chargePointConnected':
      console.log('New charger connected:', data.chargePointId);
      break;
    case 'ocppMessage':
      console.log('OCPP message:', data);
      break;
    case 'newLog':
      console.log('New log entry:', data.log);
      break;
  }
};
```

### Backend Integration
```javascript
// Send command to charge point
const response = await fetch('/api/ocpp/send-command', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    chargePointId: 'CP_001',
    command: 'RemoteStartTransaction',
    payload: {
      connectorId: 1,
      idTag: 'RFID_123'
    }
  })
});
```

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Check if the server is running: `https://cms-o4rp.onrender.com/health`
   - Verify the WebSocket URL format
   - Ensure charge point ID is provided

2. **Authentication Errors**
   - OCPP WebSocket connections don't require authentication
   - API endpoints require valid JWT token

3. **Message Format Errors**
   - Ensure JSON format is valid
   - Follow OCPP 1.6 message structure
   - Check message type IDs (2=CALL, 3=CALLRESULT, 4=CALLERROR)

4. **Timeout Issues**
   - Default heartbeat interval is 300 seconds
   - Connection timeout is handled automatically
   - Check network connectivity

### Debug Mode
Set `NODE_ENV=development` for detailed logging:
```bash
NODE_ENV=development npm start
```

## Performance Considerations

- **Memory Management**: Logs are limited to 10,000 entries in memory
- **Connection Limits**: No artificial limits, depends on server resources
- **Message Rate**: No rate limiting on OCPP messages
- **Cleanup**: Disconnected charge points are removed after 5 minutes

## Security

- **HTTPS/WSS**: All connections use TLS encryption
- **CORS**: Configured for production domain
- **Rate Limiting**: Applied to HTTP API endpoints
- **Input Validation**: All API inputs are validated
- **Error Handling**: Comprehensive error handling prevents crashes

## Support

For issues or questions:
1. Check the logs: `/api/ocpp/logs`
2. Verify server status: `/health`
3. Test connection: `npm run test-ocpp`
4. Review this documentation

## Version Information

- **OCPP Version**: 1.6
- **WebSocket Protocol**: RFC 6455
- **Node.js**: 18.x
- **Server**: Express.js with ws library 