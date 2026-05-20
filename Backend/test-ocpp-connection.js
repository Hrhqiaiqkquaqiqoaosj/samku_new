const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

class OCPPTestClient {
    constructor(chargePointId, serverUrl) {
        this.chargePointId = chargePointId;
        this.serverUrl = serverUrl;
        this.ws = null;
        this.messageId = 0;
        this.isConnected = false;
    }

    connect() {
        console.log(`🔌 Connecting to OCPP server: ${this.serverUrl}`);
        
        this.ws = new WebSocket(this.serverUrl, ['ocpp2.0.1']);
        
        this.ws.on('open', () => {
            console.log(`✅ Connected to OCPP server as ${this.chargePointId}`);
            this.isConnected = true;
            this.sendBootNotification();
        });

        this.ws.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                this.handleMessage(message);
            } catch (error) {
                console.error('❌ Error parsing message:', error);
            }
        });

        this.ws.on('close', (code, reason) => {
            console.log(`🔌 Connection closed: ${code} ${reason}`);
            this.isConnected = false;
        });

        this.ws.on('error', (error) => {
            console.error('❌ WebSocket error:', error);
        });
    }

    handleMessage(message) {
        const [messageType, messageId, actionOrPayload, payload] = message;
        
        console.log(`📨 Received message:`, JSON.stringify(message, null, 2));

        switch (messageType) {
            case 3: // CallResult
                console.log(`✅ CallResult for message ${messageId}`);
                if (actionOrPayload.status === 'Accepted') {
                    console.log(`🎉 ${messageId} was accepted by the server`);
                    
                    // After successful boot notification, send heartbeat
                    if (actionOrPayload.interval) {
                        console.log(`💓 Starting heartbeat with interval: ${actionOrPayload.interval}s`);
                        this.startHeartbeat(actionOrPayload.interval * 1000);
                    }
                }
                break;
            case 4: // CallError
                console.error(`❌ CallError for message ${messageId}:`, actionOrPayload, payload);
                break;
            case 2: // Call (server sending command to us)
                console.log(`📤 Server command: ${actionOrPayload}`);
                this.sendCallResult(messageId, {});
                break;
        }
    }

    sendBootNotification() {
        const messageId = this.getNextMessageId();
        const message = [
            2, // CALL
            messageId,
            'BootNotification',
            {
                chargePointVendor: 'SamkuCMS',
                chargePointModel: 'TestCharger',
                chargePointSerialNumber: this.chargePointId,
                firmwareVersion: '1.0.0',
                chargeBoxSerialNumber: this.chargePointId
            }
        ];

        console.log(`📤 Sending BootNotification:`, JSON.stringify(message, null, 2));
        this.sendMessage(message);
    }

    sendHeartbeat() {
        const messageId = this.getNextMessageId();
        const message = [
            2, // CALL
            messageId,
            'Heartbeat',
            {}
        ];

        console.log(`💓 Sending Heartbeat: ${messageId}`);
        this.sendMessage(message);
    }

    sendStatusNotification(status = 'Available', connectorId = 1) {
        const messageId = this.getNextMessageId();
        const message = [
            2, // CALL
            messageId,
            'StatusNotification',
            {
                connectorId,
                status,
                errorCode: 'NoError',
                timestamp: new Date().toISOString()
            }
        ];

        console.log(`📊 Sending StatusNotification: ${status}`);
        this.sendMessage(message);
    }

    sendAuthorize(idTag = 'TEST_RFID_123') {
        const messageId = this.getNextMessageId();
        const message = [
            2, // CALL
            messageId,
            'Authorize',
            {
                idTag
            }
        ];

        console.log(`🔐 Sending Authorize: ${idTag}`);
        this.sendMessage(message);
    }

    sendCallResult(messageId, payload) {
        const message = [3, messageId, payload]; // CALLRESULT
        this.sendMessage(message);
    }

    sendMessage(message) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        } else {
            console.error('❌ WebSocket not connected');
        }
    }

    getNextMessageId() {
        return `msg_${++this.messageId}_${Date.now()}`;
    }

    startHeartbeat(interval = 300000) { // Default 5 minutes
        setInterval(() => {
            if (this.isConnected) {
                this.sendHeartbeat();
            }
        }, interval);
    }

    runTestSequence() {
        console.log('🧪 Starting OCPP test sequence...');
        
        setTimeout(() => {
            if (this.isConnected) {
                this.sendStatusNotification('Available');
            }
        }, 2000);

        setTimeout(() => {
            if (this.isConnected) {
                this.sendAuthorize();
            }
        }, 4000);

        setTimeout(() => {
            if (this.isConnected) {
                this.sendStatusNotification('Preparing');
            }
        }, 6000);

        setTimeout(() => {
            if (this.isConnected) {
                console.log('✅ Test sequence completed successfully!');
                console.log('🎯 Your OCPP WebSocket server is working correctly!');
            }
        }, 8000);
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
        }
    }
}

// Test configuration
const CHARGE_POINT_ID = process.argv[2] || `TEST_CP_${uuidv4().substring(0, 8).toUpperCase()}`;
const SERVER_URL = process.argv[3] || 'ws://127.0.0.1:5000/ocpp/' + CHARGE_POINT_ID;


console.log('🚀 OCPP WebSocket Test Client');
console.log('================================');
console.log(`📍 Charge Point ID: ${CHARGE_POINT_ID}`);
console.log(`🌐 Server URL: ${SERVER_URL}`);
console.log('================================');

const client = new OCPPTestClient(CHARGE_POINT_ID, SERVER_URL);

// Connect and run test
client.connect();

// Run test sequence after connection
setTimeout(() => {
    client.runTestSequence();
}, 1000);

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down test client...');
    client.disconnect();
    process.exit(0);
});

// Keep the process running
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught exception:', error);
    client.disconnect();
    process.exit(1);
});

module.exports = OCPPTestClient; 