const WebSocket = require('ws');
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const morgan = require('morgan');
const path = require('path');

class OCPPWebSocketServer {
    constructor() {
        this.app = express();
        this.server = null;
        this.wss = null;
        this.chargePoints = new Map(); // Store connected charge points
        this.clients = new Map(); // Store UI clients
        this.logs = []; // Store all logs
        this.maxLogs = 10000; // Maximum logs to keep in memory for production
        this.port = process.env.PORT || 3000; // Use environment port for Vercel
        this.isDevelopment = process.env.NODE_ENV !== 'production';
        
        this.setupExpress();
        this.setupWebSocket();
    }    setupExpress() {
        // Middleware
        this.app.use(cors({
            origin: this.isDevelopment ? '*' : ['https://cms-ocpp.vercel.app'],
            credentials: true
        }));
        this.app.use(morgan(this.isDevelopment ? 'dev' : 'combined'));
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.static(path.join(__dirname)));

        // Health check endpoint for production monitoring
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                connectedChargePoints: this.chargePoints.size,
                totalLogs: this.logs.length,
                uptime: process.uptime()
            });
        });

        // API Routes
        this.app.get('/api/charge-points', (req, res) => {
            const chargePointsList = Array.from(this.chargePoints.entries()).map(([id, cp]) => ({
                id,
                status: cp.status,
                lastSeen: cp.lastSeen,
                connectedAt: cp.connectedAt,
                messageCount: cp.messageCount,
                ip: cp.ip
            }));
            res.json(chargePointsList);
        });        this.app.get('/api/logs', (req, res) => {
            const limit = parseInt(req.query.limit) || 100;
            const offset = parseInt(req.query.offset) || 0;
            const chargePointId = req.query.chargePointId;
            const direction = req.query.direction;
            const action = req.query.action;
            
            let filteredLogs = this.logs;
            
            // Apply filters
            if (chargePointId) {
                filteredLogs = filteredLogs.filter(log => log.chargePointId === chargePointId);
            }
            if (direction) {
                filteredLogs = filteredLogs.filter(log => log.direction === direction);
            }
            if (action) {
                filteredLogs = filteredLogs.filter(log => log.action === action);
            }
            
            const result = filteredLogs
                .slice(offset, offset + limit)
                .reverse(); // Show newest first
                
            res.json({
                logs: result,
                total: filteredLogs.length,
                filtered: filteredLogs.length < this.logs.length
            });
        });this.app.post('/api/generate-url', (req, res) => {
            const chargePointId = req.body.chargePointId || uuidv4();
            // Always use wss for the deployed domain
            const protocol = 'wss';
            const host = 'cms-ocpp.vercel.app';
            
            const wsUrl = `${protocol}://${host}/ocpp/${chargePointId}`;
            
            res.json({
                chargePointId,
                websocketUrl: wsUrl,
                httpUrl: `https://${host}`,
                generated: new Date().toISOString()
            });
        });

        // Serve the main UI
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, 'index.html'));
        });
    }    setupWebSocket() {
        this.server = this.app.listen(this.port, () => {
            console.log(`🚀 OCPP WebSocket Server running on port ${this.port}`);
            console.log('📊 Dashboard: https://cms-ocpp.vercel.app');
            console.log('🔌 WebSocket Endpoint: wss://cms-ocpp.vercel.app/ocpp/{charge-point-id}');
            console.log(`🌍 Environment: ${this.isDevelopment ? 'Development' : 'Production'}`);
            console.log(`📝 Max logs in memory: ${this.maxLogs}`);
        });        this.wss = new WebSocket.Server({ 
            server: this.server,
            verifyClient: (info) => {
                try {
                    const url = new URL(info.req.url, `http://${info.req.headers.host}`);
                    return url.pathname.startsWith('/ocpp/');
                } catch (error) {
                    console.error('Error verifying WebSocket client:', error);
                    return false;
                }
            }
        });

        this.wss.on('connection', (ws, req) => {
            try {
                const url = new URL(req.url, `http://${req.headers.host}`);
                const pathParts = url.pathname.split('/');
                const chargePointId = pathParts[pathParts.length - 1];
                
                if (!chargePointId || chargePointId === 'ocpp') {
                    ws.close(1008, 'Charge Point ID required');
                    return;
                }

                // Check if this is a UI client connection
                if (chargePointId === 'ui-client') {
                    this.handleUIClient(ws, req);
                    return;
                }

                this.handleChargePointConnection(ws, chargePointId, req);
            } catch (error) {
                console.error('Error handling WebSocket connection:', error);
                ws.close(1011, 'Server error');
            }
        });

        // Graceful shutdown handling
        process.on('SIGTERM', () => {
            console.log('🛑 Received SIGTERM, shutting down gracefully...');
            this.shutdown();
        });

        process.on('SIGINT', () => {
            console.log('🛑 Received SIGINT, shutting down gracefully...');
            this.shutdown();
        });
    }    handleUIClient(ws, req) {
        const clientId = uuidv4();
        const clientInfo = {
            ws,
            connectedAt: new Date().toISOString(),
            ip: req.socket.remoteAddress,
            userAgent: req.headers['user-agent']
        };
        
        this.clients.set(clientId, clientInfo);

        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                this.handleUIMessage(clientId, message);
            } catch (error) {
                console.error('Error parsing UI message:', error);
                ws.send(JSON.stringify({
                    type: 'error',
                    message: 'Invalid JSON format'
                }));
            }
        });

        ws.on('close', () => {
            this.clients.delete(clientId);
            console.log(`UI client ${clientId} disconnected`);
        });

        ws.on('error', (error) => {
            console.error(`UI client ${clientId} error:`, error);
            this.clients.delete(clientId);
        });

        // Send initial data
        ws.send(JSON.stringify({
            type: 'connection',
            status: 'connected',
            clientId,
            serverInfo: {
                connectedChargePoints: this.chargePoints.size,
                totalLogs: this.logs.length,
                serverTime: new Date().toISOString()
            }
        }));

        console.log(`UI client ${clientId} connected from ${req.socket.remoteAddress}`);
    }    handleChargePointConnection(ws, chargePointId, req) {
        console.log(`🔌 Charge Point ${chargePointId} attempting to connect from ${req.socket.remoteAddress}`);
        
        // Check if charge point is already connected
        if (this.chargePoints.has(chargePointId)) {
            const existingCP = this.chargePoints.get(chargePointId);
            if (existingCP.ws.readyState === WebSocket.OPEN) {
                existingCP.ws.close(1000, 'Replaced by new connection');
            }
        }
        
        const chargePoint = {
            id: chargePointId,
            ws,
            status: 'Connected',
            connectedAt: new Date().toISOString(),
            lastSeen: new Date().toISOString(),
            messageCount: 0,
            ip: req.socket.remoteAddress,
            userAgent: req.headers['user-agent'],
            protocol: req.headers['sec-websocket-protocol']
        };

        this.chargePoints.set(chargePointId, chargePoint);

        // Handle OCPP messages
        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                this.handleOCPPMessage(chargePointId, message, 'incoming');
            } catch (error) {
                console.error(`Error parsing message from ${chargePointId}:`, error);
                this.logMessage(chargePointId, 'ERROR', `Invalid JSON: ${error.message}`, 'incoming');
                
                // Send error response for invalid JSON
                const errorResponse = [4, 'unknown', 'FormationViolation', 'Invalid JSON format', {}];
                ws.send(JSON.stringify(errorResponse));
            }
        });

        ws.on('close', (code, reason) => {
            console.log(`🔌 Charge Point ${chargePointId} disconnected: ${code} ${reason}`);
            if (this.chargePoints.has(chargePointId)) {
                this.chargePoints.get(chargePointId).status = 'Disconnected';
                // Remove from memory after 5 minutes to prevent memory leaks
                setTimeout(() => {
                    if (this.chargePoints.has(chargePointId)) {
                        const cp = this.chargePoints.get(chargePointId);
                        if (cp.status === 'Disconnected') {
                            this.chargePoints.delete(chargePointId);
                            console.log(`🗑️ Removed disconnected charge point ${chargePointId} from memory`);
                        }
                    }
                }, 5 * 60 * 1000);
            }
            this.logMessage(chargePointId, 'CONNECTION', `Disconnected: ${code} ${reason}`, 'system');
            
            // Notify UI clients of disconnection
            this.broadcastToUIClients({
                type: 'chargePointDisconnected',
                chargePointId,
                timestamp: new Date().toISOString()
            });
        });

        ws.on('error', (error) => {
            console.error(`WebSocket error for ${chargePointId}:`, error);
            this.logMessage(chargePointId, 'ERROR', `WebSocket error: ${error.message}`, 'system');
        });

        this.logMessage(chargePointId, 'CONNECTION', `Charge Point Connected from ${req.socket.remoteAddress}`, 'system');
        this.broadcastToUIClients({
            type: 'chargePointConnected',
            chargePointId,
            chargePoint: {
                id: chargePointId,
                status: chargePoint.status,
                connectedAt: chargePoint.connectedAt,
                ip: chargePoint.ip
            },
            timestamp: new Date().toISOString()
        });
    }

    handleOCPPMessage(chargePointId, message, direction) {
        const chargePoint = this.chargePoints.get(chargePointId);
        if (chargePoint) {
            chargePoint.messageCount++;
            chargePoint.lastSeen = new Date().toISOString();
        }

        const [messageType, messageId, action, payload] = message;
        
        // Log the message
        this.logMessage(chargePointId, action || 'RESPONSE', JSON.stringify(message), direction);

        // Handle different OCPP message types
        switch (messageType) {
            case 2: // Call
                this.handleOCPPCall(chargePointId, messageId, action, payload);
                break;
            case 3: // CallResult
                this.handleOCPPCallResult(chargePointId, messageId, payload);
                break;
            case 4: // CallError
                this.handleOCPPCallError(chargePointId, messageId, payload);
                break;
        }

        // Broadcast to UI clients
        this.broadcastToUIClients({
            type: 'ocppMessage',
            chargePointId,
            message,
            direction,
            timestamp: new Date().toISOString()
        });
    }

    handleOCPPCall(chargePointId, messageId, action, payload) {
        const chargePoint = this.chargePoints.get(chargePointId);
        if (!chargePoint) return;

        let response;

        switch (action) {
            case 'BootNotification':
                response = [3, messageId, {
                    status: 'Accepted',
                    currentTime: new Date().toISOString(),
                    interval: 60
                }];
                chargePoint.status = 'Available';
                break;

            case 'Heartbeat':
                response = [3, messageId, {
                    currentTime: new Date().toISOString()
                }];
                break;

            case 'StatusNotification':
                response = [3, messageId, {}];
                if (payload.status) {
                    chargePoint.status = payload.status;
                }
                break;

            case 'StartTransaction':
                const transactionId = Math.floor(Math.random() * 1000000);
                response = [3, messageId, {
                    transactionId,
                    idTagInfo: {
                        status: 'Accepted'
                    }
                }];
                chargePoint.status = 'Charging';
                break;

            case 'StopTransaction':
                response = [3, messageId, {
                    idTagInfo: {
                        status: 'Accepted'
                    }
                }];
                chargePoint.status = 'Available';
                break;

            case 'MeterValues':
                response = [3, messageId, {}];
                break;

            case 'Authorize':
                response = [3, messageId, {
                    idTagInfo: {
                        status: 'Accepted'
                    }
                }];
                break;

            case 'DataTransfer':
                response = [3, messageId, {
                    status: 'Accepted'
                }];
                break;

            default:
                response = [4, messageId, 'NotImplemented', `Action ${action} not implemented`, {}];
        }

        // Send response
        if (response) {
            chargePoint.ws.send(JSON.stringify(response));
            this.handleOCPPMessage(chargePointId, response, 'outgoing');
        }
    }

    handleOCPPCallResult(chargePointId, messageId, payload) {
        // Handle successful responses
        console.log(`✅ CallResult from ${chargePointId}: ${messageId}`);
    }

    handleOCPPCallError(chargePointId, messageId, payload) {
        // Handle error responses
        console.error(`❌ CallError from ${chargePointId}: ${messageId}`, payload);
    }

    handleUIMessage(clientId, message) {
        switch (message.type) {
            case 'sendToChargePoint':
                this.sendMessageToChargePoint(message.chargePointId, message.ocppMessage);
                break;
            case 'getChargePoints':
                this.sendToUIClient(clientId, {
                    type: 'chargePoints',
                    data: Array.from(this.chargePoints.values())
                });
                break;
            case 'getLogs':
                this.sendToUIClient(clientId, {
                    type: 'logs',
                    data: this.logs.slice(-100) // Last 100 logs
                });
                break;
        }
    }

    sendMessageToChargePoint(chargePointId, message) {
        const chargePoint = this.chargePoints.get(chargePointId);
        if (chargePoint && chargePoint.ws.readyState === WebSocket.OPEN) {
            chargePoint.ws.send(JSON.stringify(message));
            this.handleOCPPMessage(chargePointId, message, 'outgoing');
            return true;
        }
        return false;
    }

    sendToUIClient(clientId, message) {
        const client = this.clients.get(clientId);
        if (client && client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(JSON.stringify(message));
        }
    }

    broadcastToUIClients(message) {
        this.clients.forEach((client, clientId) => {
            if (client.ws.readyState === WebSocket.OPEN) {
                client.ws.send(JSON.stringify(message));
            }
        });
    }    logMessage(chargePointId, action, content, direction) {
        const logEntry = {
            id: uuidv4(),
            chargePointId,
            action,
            content,
            direction, // 'incoming', 'outgoing', 'system'
            timestamp: new Date().toISOString(),
            // Add additional metadata for production monitoring
            level: direction === 'system' && action === 'ERROR' ? 'error' : 'info'
        };

        this.logs.push(logEntry);

        // Keep only the last maxLogs entries
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(-this.maxLogs);
        }

        // Broadcast to UI clients immediately for real-time monitoring
        this.broadcastToUIClients({
            type: 'newLog',
            log: logEntry
        });

        // Enhanced console logging for production
        const logLevel = logEntry.level === 'error' ? 'error' : 'log';
        console[logLevel](`[${direction.toUpperCase()}] ${chargePointId} - ${action}: ${content}`);
    }

    shutdown() {
        console.log('🔄 Starting graceful shutdown...');
        
        // Close all charge point connections
        this.chargePoints.forEach((cp, id) => {
            if (cp.ws.readyState === WebSocket.OPEN) {
                cp.ws.close(1001, 'Server shutting down');
            }
        });
        
        // Close all UI client connections
        this.clients.forEach((client, id) => {
            if (client.ws.readyState === WebSocket.OPEN) {
                client.ws.close(1001, 'Server shutting down');
            }
        });
        
        // Close WebSocket server
        if (this.wss) {
            this.wss.close(() => {
                console.log('✅ WebSocket server closed');
            });
        }
        
        // Close HTTP server
        if (this.server) {
            this.server.close(() => {
                console.log('✅ HTTP server closed');
                process.exit(0);
            });
        }
        
        // Force exit after 10 seconds
        setTimeout(() => {
            console.log('⚠️ Forced exit after 10 seconds');
            process.exit(1);
        }, 10000);
    }
}

// Start the server
new OCPPWebSocketServer();
