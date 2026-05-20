# QR Code Scanning & Test Charging Setup

This document explains how to set up and test the QR code scanning functionality for charging sessions.

## 🔧 Setup Instructions

### 1. Backend Setup

#### Install QR Code Package (Optional - for generating test QR codes)
```bash
cd Backend
npm install qrcode
```

#### Create Test Chargers in Database
```bash
cd Backend
node create-test-chargers.js
```

This will create:
- A test host named "Test Host"
- A test station named "Test Station" 
- 5 test chargers with IDs: CH-001, CH-002, CH-003, CH-004, CH-005

#### Generate Test QR Codes (Optional)
```bash
cd Backend
node generate-qr-test.js
```

This will create:
- PNG and SVG QR codes for each test charger
- An HTML file to view all QR codes
- Files saved in `Backend/test-qr-codes/` directory

### 2. Frontend Setup

The QR scanner component is already integrated into the user dashboard. No additional setup required.

## 🎯 How to Test

### Method 1: Using QR Scanner (Recommended)

1. **Open User Dashboard**
   - Login as a user (not admin or host)
   - Navigate to the user dashboard

2. **Start QR Scanning**
   - Click the "Start Charging" button in the top right
   - OR click the "Scan & Charge" button in the Quick Actions section

3. **Scan QR Code**
   - Point your camera at a charger QR code
   - The system will automatically detect and process the code
   - A test transaction will be created for ₹1

4. **View Results**
   - Success message will appear with transaction ID
   - Transaction will auto-complete after 30 seconds
   - Check the "Recent Transactions" table for the new entry

### Method 2: Manual Charger ID Input (Recommended for Testing)

1. **Open Manual Input**
   - Click "Enter ID" button in the top right of user dashboard
   - OR click "Enter Charger ID" in the Quick Actions section

2. **Enter Charger ID**
   - Type the charger ID manually (e.g., "CH-001")
   - OR click one of the quick-select test charger buttons
   - Click "Start Charging"

3. **Process Transaction**
   - Same as Method 1 - transaction will be created and auto-completed

### Method 3: QR Scanner Manual Input (Fallback)

1. **Open QR Scanner**
   - Click "Scan QR" on user dashboard

2. **Use Manual Input**
   - Click "Manual Input" button in the scanner modal
   - Enter a test charger ID (e.g., "CH-001")
   - Click OK

3. **Process Transaction**
   - Same as other methods - transaction will be created and auto-completed

## 🔌 Charger Connection Status

### Fixed Issues

The charger connection logic has been fixed to show accurate status:

- **Before**: All chargers showed as "Connected" automatically
- **After**: Chargers only show as "Connected" when they have an active WebSocket connection

### How It Works

1. **WebSocket Events**: Chargers connect via OCPP WebSocket protocol
2. **Real-time Updates**: Connection status updates in real-time based on actual WebSocket events
3. **Proper Filtering**: Only processes `chargePointConnected` and `chargePointDisconnected` events

### Testing Connection Status

To see chargers as "Connected":
1. Use an OCPP client/simulator to connect to the WebSocket endpoint
2. Connect to: `ws://localhost:5000/ocpp/{charger-id}` (development)
3. Or: `wss://your-domain.com/ocpp/{charger-id}` (production)

## 📱 QR Code Format

The QR codes contain simple charger IDs:
- **Content**: Just the charger ID (e.g., "CH-001")
- **Format**: Plain text string
- **Processing**: System extracts charger ID and validates against database

## 🔄 Transaction Flow

### Test Transaction Process

1. **Scan QR Code** → Extract charger ID
2. **Validate Charger** → Check if charger exists in database
3. **Create Transaction** → Generate test transaction with ₹1 amount
4. **Send OCPP Command** → Attempt to send RemoteStartTransaction (if charger connected)
5. **Auto-Complete** → Transaction completes automatically after 30 seconds
6. **Update Status** → Mark as completed and send stop command

### Transaction Details

- **Amount**: ₹1 (test transaction)
- **Duration**: 30 seconds (auto-completion)
- **Energy**: 0.1 kWh (simulated)
- **Type**: Test transaction (tagged in metadata)
- **Status Flow**: ACTIVE → COMPLETED

## 🛠 API Endpoints

### Start Test Charge
```
POST /api/transactions/start-test-charge
Authorization: Bearer {token}
Content-Type: application/json

{
  "chargerId": "CH-001",
  "amount": 1
}
```

### Response
```json
{
  "success": true,
  "message": "Test charging session started",
  "transactionId": "TEST-1671234567890-abc123def",
  "data": {
    "transaction": { ... },
    "charger": { ... },
    "estimatedDuration": "30 seconds (test)",
    "amount": 1
  }
}
```

## 🔍 Troubleshooting

### Common Issues

1. **"Charger not found" Error**
   - Ensure test chargers are created in database
   - Run: `node create-test-chargers.js`
   - Verify charger ID matches exactly

2. **Camera Not Working**
   - Grant camera permissions in browser
   - Use HTTPS for production (required for camera access)
   - Use "Manual Input" as fallback

3. **Transaction Not Creating**
   - Check user authentication token
   - Verify API endpoint URL in config
   - Check browser console for errors

4. **Chargers Always Show Disconnected**
   - This is correct behavior - chargers only show connected with active WebSocket
   - Use OCPP simulator to test real connections
   - Check WebSocket logs in admin panel

### Debug Steps

1. **Check Browser Console** for JavaScript errors
2. **Check Network Tab** for API request/response
3. **Check Backend Logs** for server-side errors
4. **Verify Database** that test chargers exist

## 📊 Features Implemented

### ✅ Completed Features

- [x] QR Code scanner component with camera access
- [x] Dedicated manual charger ID input component
- [x] Manual input fallback within QR scanner
- [x] Quick-select buttons for test chargers
- [x] Test transaction creation (₹1 amount)
- [x] Auto-completion after 30 seconds
- [x] Real-time charger connection status
- [x] Integration with user dashboard
- [x] OCPP command integration
- [x] Transaction history display
- [x] Error handling and user feedback
- [x] Multiple charging initiation methods

### 🔄 Future Enhancements

- [ ] Real QR code detection using jsQR library
- [ ] Payment gateway integration for real transactions
- [ ] Real-time energy consumption tracking
- [ ] Push notifications for transaction updates
- [ ] Offline QR code scanning capability
- [ ] Multi-language support

## 🔐 Security Considerations

- User authentication required for all transactions
- Charger validation against database
- Transaction amount limits (₹1 for test)
- Secure WebSocket connections (WSS in production)
- Input validation and sanitization

## 📝 Notes

- Test transactions are automatically tagged for easy identification
- Real charger connections require OCPP-compliant hardware
- QR codes can be printed and placed on physical chargers
- System supports both development and production environments 