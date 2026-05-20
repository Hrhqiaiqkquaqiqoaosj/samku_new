const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Validation middleware
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    }
    next();
};

// POST /api/ocpp/generate-url - Generate OCPP WebSocket URL for a charger
router.post('/generate-url',
    [
        auth,
        body('chargePointId')
            .optional()
            .isLength({ min: 3, max: 50 }).withMessage('Charge Point ID must be 3-50 characters')
            .matches(/^[A-Z0-9_-]+$/i).withMessage('Charge Point ID can only contain letters, numbers, underscores and hyphens'),
        handleValidationErrors
    ],
    async (req, res) => {
        try {
            const chargePointId = req.body.chargePointId || `CP_${uuidv4().replace(/-/g, '').substring(0, 8).toUpperCase()}`;

            // Always use the deployed URL for production
            const protocol = 'wss';
            const host = 'cms-o4rp.onrender.com';

            const websocketUrl = `${protocol}://${host}/ocpp/${chargePointId}`;
            const frontendUrl = 'https://cms-o4rp.onrender.com';

            const currentDate = new Date();
            const expirationDate = new Date(currentDate);
            expirationDate.setDate(currentDate.getDate() + 1); // 24 hours from now

            // Log the generated OCPP URL details for debugging
            console.log('Generated OCPP URL for charge point:', {
                chargePointId,
                websocketUrl,
                environment: 'production'
            });

            res.json({
                success: true,
                data: {
                    chargePointId,
                    serialNumber: chargePointId,
                    websocketUrl,
                    connectionUrl: websocketUrl,
                    frontendUrl,
                    testUrl: `${frontendUrl}/charge/${chargePointId}`,
                    generated: currentDate.toISOString(),
                    dateGenerated: currentDate.toISOString(),
                    expiresIn: "24 hours",
                    expirationDate: expirationDate.toISOString(),
                    instructions: {
                        connection: `Connect your OCPP client to: ${websocketUrl}`,
                        protocol: 'OCPP 1.6 JSON over WebSocket',
                        subProtocol: 'ocpp1.6',
                        testCommand: `You can test the connection using any OCPP 1.6 compatible client or simulator`,
                        supportedActions: [
                            'BootNotification',
                            'Heartbeat',
                            'StatusNotification',
                            'Authorize',
                            'StartTransaction',
                            'StopTransaction',
                            'MeterValues',
                            'DataTransfer'
                        ]
                    }
                }
            });

        } catch (error) {
            console.error('Error generating OCPP URL:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to generate OCPP URL',
                error: error.message
            });
        }
    }
);

// Test endpoint to validate OCPP connection
router.post('/test-connection',
    [
        auth,
        body('chargePointId').notEmpty().withMessage('Charge Point ID is required'),
        handleValidationErrors
    ],
    async (req, res) => {
        try {
            const { chargePointId } = req.body;

            // This endpoint can be used to test if a charge point is connected
            // In a real implementation, you would check the WebSocket server's connected clients

            res.json({
                success: true,
                data: {
                    chargePointId,
                    testUrl: `wss://cms-o4rp.onrender.com/ocpp/${chargePointId}`,
                    status: 'ready_for_connection',
                    timestamp: new Date().toISOString(),
                    instructions: {
                        step1: 'Use an OCPP 1.6 compatible client or simulator',
                        step2: `Connect to: wss://cms-o4rp.onrender.com/ocpp/${chargePointId}`,
                        step3: 'Send a BootNotification message to register the charger',
                        step4: 'Monitor the connection status in the dashboard',
                        sampleBootNotification: {
                            messageType: 2,
                            messageId: "unique-message-id",
                            action: "BootNotification",
                            payload: {
                                chargePointVendor: "YourVendor",
                                chargePointModel: "YourModel",
                                chargePointSerialNumber: chargePointId,
                                firmwareVersion: "1.0.0"
                            }
                        }
                    }
                }
            });

        } catch (error) {
            console.error('Error testing OCPP connection:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to test OCPP connection',
                error: error.message
            });
        }
    }
);

// GET /api/ocpp/connected-chargers - Get list of currently connected charge points
router.get('/connected-chargers', auth, async (req, res) => {
    try {
        // This would typically get data from the OCPP WebSocket server
        // For now, return a placeholder response
        res.json({
            success: true,
            data: {
                connectedChargers: [],
                totalConnected: 0,
                lastUpdated: new Date().toISOString()
            },
            message: 'Connected chargers list - WebSocket server integration pending'
        });

    } catch (error) {
        console.error('Error fetching connected chargers:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch connected chargers',
            error: error.message
        });
    }
});

// GET /api/ocpp/logs - Get OCPP message logs
router.get('/logs', auth, async (req, res) => {
    try {
        const { limit = 100, chargePointId, direction, action } = req.query;

        // This would typically get data from the OCPP WebSocket server
        // For now, return a placeholder response
        res.json({
            success: true,
            data: {
                logs: [],
                total: 0,
                filters: {
                    chargePointId,
                    direction,
                    action,
                    limit: parseInt(limit)
                }
            },
            message: 'OCPP logs - WebSocket server integration pending'
        });

    } catch (error) {
        console.error('Error fetching OCPP logs:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch OCPP logs',
            error: error.message
        });
    }
});

// POST /api/ocpp/send-command - Send command to a charge point
router.post('/send-command',
    [
        auth,
        body('chargePointId')
            .notEmpty().withMessage('Charge Point ID is required'),
        body('command')
            .notEmpty().withMessage('Command is required')
            .isIn(['Reset', 'RemoteStartTransaction', 'RemoteStopTransaction', 'ChangeConfiguration', 'GetConfiguration', 'ClearCache'])
            .withMessage('Invalid command'),
        body('payload')
            .optional()
            .isObject().withMessage('Payload must be an object'),
        handleValidationErrors
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { chargePointId, command, payload = {} } = req.body;

            // This would typically send a command via the OCPP WebSocket server
            // For now, return a placeholder response
            res.json({
                success: true,
                data: {
                    messageId: uuidv4(),
                    chargePointId,
                    command,
                    payload,
                    sentAt: new Date().toISOString(),
                    status: 'sent'
                },
                message: 'Command sending - WebSocket server integration pending'
            });

        } catch (error) {
            console.error('Error sending OCPP command:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to send OCPP command',
                error: error.message
            });
        }
    }
);

// GET /api/ocpp/server-status - Get OCPP server status
router.get('/server-status', auth, async (req, res) => {
    try {
        res.json({
            success: true,
            data: {
                status: 'running',
                connectedChargePoints: 0,
                totalMessages: 0,
                uptime: process.uptime(),
                serverTime: new Date().toISOString(),
                version: '1.6',
                port: process.env.OCPP_PORT || 5001
            }
        });

    } catch (error) {
        console.error('Error fetching OCPP server status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch OCPP server status',
            error: error.message
        });
    }
});

module.exports = router;
