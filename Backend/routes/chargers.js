const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const Charger = require('../models/Charger');
const Station = require('../models/Station');
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

// GET /api/chargers - Get all chargers with optional filters
router.get('/', 
    auth,
    [
        query('stationId').optional().isMongoId().withMessage('Invalid station ID'),
        query('status').optional().isIn(['ONLINE', 'OFFLINE', 'CONFIGURING', 'FAULTED', 'RESERVED', 'UNAVAILABLE']),
        query('powerType').optional().isIn(['AC', 'DC']),
        query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
        query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
        query('search').optional().isLength({ min: 1 }).withMessage('Search term must not be empty')
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { stationId, status, powerType, page = 1, limit = 10, search } = req.query;
            const skip = (page - 1) * limit;

            // Build filter object
            const filter = { isActive: true };
            
            if (stationId) {
                filter.stationId = stationId;
            }
            
            if (status) {
                filter.status = status;
            }
            
            if (powerType) {
                filter.powerType = powerType;
            }

            if (search) {
                filter.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { serialNumber: { $regex: search, $options: 'i' } }
                ];
            }

            // Execute query with pagination
            const [chargers, total] = await Promise.all([
                Charger.find(filter)
                    .populate('stationId', 'name address.city address.area')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(limit))
                    .lean(),
                Charger.countDocuments(filter)
            ]);

            res.json({
                success: true,
                data: chargers,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    totalItems: total,
                    itemsPerPage: parseInt(limit)
                }
            });

        } catch (error) {
            console.error('Error fetching chargers:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch chargers',
                error: error.message
            });
        }
    }
);

// GET /api/chargers/station/:stationId - Get chargers by station
router.get('/station/:stationId',
    auth,
    [
        param('stationId').isMongoId().withMessage('Invalid station ID')
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { stationId } = req.params;
            
            // Verify station exists
            const station = await Station.findById(stationId);
            if (!station) {
                return res.status(404).json({
                    success: false,
                    message: 'Station not found'
                });
            }

            const chargers = await Charger.findByStation(stationId);

            res.json({
                success: true,
                data: chargers,
                station: {
                    id: station._id,
                    name: station.name,
                    address: station.address
                }
            });

        } catch (error) {
            console.error('Error fetching chargers by station:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch chargers for station',
                error: error.message
            });
        }
    }
);

// GET /api/chargers/:id - Get single charger
router.get('/:id',
    auth,
    [
        param('id').notEmpty().withMessage('Charger ID is required')
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
           const charger = await Charger.findOne({ serialNumber: req.params.id })
                .populate('stationId')
                .populate('currentTransaction');

            if (!charger) {
                return res.status(404).json({
                    success: false,
                    message: 'Charger not found'
                });
            }

            res.json({
                success: true,
                data: charger
            });

        } catch (error) {
            console.error('Error fetching charger:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch charger',
                error: error.message
            });
        }
    }
);

// POST /api/chargers - Create new charger
router.post('/',
    [
        auth,
        body('serialNumber')
            .notEmpty().withMessage('Serial number is required')
            .isLength({ min: 3, max: 50 }).withMessage('Serial number must be between 3 and 50 characters')
            .matches(/^[A-Z0-9_-]+$/).withMessage('Serial number can only contain uppercase letters, numbers, underscores and hyphens'),
        body('name')
            .notEmpty().withMessage('Name is required')
            .isLength({ min: 1, max: 100 }).withMessage('Name must be between 1 and 100 characters'),
        body('stationId')
            .notEmpty().withMessage('Station ID is required')
            .isMongoId().withMessage('Invalid station ID'),
        body('powerType')
            .notEmpty().withMessage('Power type is required')
            .isIn(['AC', 'DC']).withMessage('Power type must be AC or DC'),
        body('capacity')
            .notEmpty().withMessage('Capacity is required'),
        body('maxPower')
            .optional()
            .isFloat({ min: 0 }).withMessage('Max power must be a positive number'),
        body('connectorType')
            .optional()
            .isIn(['CCS', 'CHAdeMO', 'Type2', 'Type1', 'GB/T']).withMessage('Invalid connector type'),
        body('numberOfConnectors')
            .optional()
            .isInt({ min: 1, max: 4 }).withMessage('Number of connectors must be between 1 and 4')
    ],
    handleValidationErrors,    async (req, res) => {
        try {
            const {
                serialNumber,
                name,
                stationId,
                powerType,
                capacity,
                maxPower,
                connectorType,
                numberOfConnectors
            } = req.body;

            console.log('Creating charger with stationId:', stationId);
            
            // Check if station exists
            const station = await Station.findById(stationId);
            if (!station) {
                console.error(`Station not found with ID: ${stationId}`);
                return res.status(404).json({
                    success: false,
                    message: 'Station not found'
                });
            }

            // Check if serial number already exists
            const existingCharger = await Charger.findOne({ 
                serialNumber: serialNumber.toUpperCase() 
            });
            if (existingCharger) {
                return res.status(400).json({
                    success: false,
                    message: 'Charger with this serial number already exists'
                });
            }

            // Create charger
            const charger = new Charger({
                serialNumber: serialNumber.toUpperCase(),
                name,
                stationId,
                powerType,
                capacity,
                maxPower,
                connectorType: connectorType || 'Type2',
                numberOfConnectors: numberOfConnectors || 1,
                metadata: {
                    createdBy: req.user.id
                }
            });

            await charger.save();

            // Generate QR code
            charger.generateQRCode();
            await charger.save();

            // Update station's total chargers count
            await Station.findByIdAndUpdate(stationId, {
                $inc: { totalChargers: 1 }
            });

            // Populate station data for response
            await charger.populate('stationId', 'name address');

            res.status(201).json({
                success: true,
                message: 'Charger created successfully',
                data: charger
            });

        } catch (error) {
            console.error('Error creating charger:', error);
            
            if (error.code === 11000) {
                return res.status(400).json({
                    success: false,
                    message: 'Charger with this serial number already exists'
                });
            }

            res.status(500).json({
                success: false,
                message: 'Failed to create charger',
                error: error.message
            });
        }
    }
);

// PUT /api/chargers/:id - Update charger
router.put('/:id',
    [
        auth,
        param('id').isMongoId().withMessage('Invalid charger ID'),
        body('name')
            .optional()
            .isLength({ min: 1, max: 100 }).withMessage('Name must be between 1 and 100 characters'),
        body('stationId')
            .optional()
            .isMongoId().withMessage('Invalid station ID'),
        body('powerType')
            .optional()
            .isIn(['AC', 'DC']).withMessage('Power type must be AC or DC'),
        body('capacity')
            .optional()
            .notEmpty().withMessage('Capacity cannot be empty'),
        body('maxPower')
            .optional()
            .isFloat({ min: 0 }).withMessage('Max power must be a positive number'),
        body('connectorType')
            .optional()
            .isIn(['CCS', 'CHAdeMO', 'Type2', 'Type1', 'GB/T']).withMessage('Invalid connector type'),
        body('numberOfConnectors')
            .optional()
            .isInt({ min: 1, max: 4 }).withMessage('Number of connectors must be between 1 and 4'),
        body('status')
            .optional()
            .isIn(['ONLINE', 'OFFLINE', 'CONFIGURING', 'FAULTED', 'RESERVED', 'UNAVAILABLE'])
            .withMessage('Invalid status')
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { id } = req.params;
            const updateData = { ...req.body };
            
            // Add metadata
            updateData['metadata.updatedBy'] = req.user.id;

            // If station is being changed, verify new station exists
            if (updateData.stationId) {
                const station = await Station.findById(updateData.stationId);
                if (!station) {
                    return res.status(404).json({
                        success: false,
                        message: 'New station not found'
                    });
                }
            }

            const charger = await Charger.findByIdAndUpdate(
                id,
                updateData,
                { new: true, runValidators: true }
            ).populate('stationId', 'name address');

            if (!charger) {
                return res.status(404).json({
                    success: false,
                    message: 'Charger not found'
                });
            }

            res.json({
                success: true,
                message: 'Charger updated successfully',
                data: charger
            });

        } catch (error) {
            console.error('Error updating charger:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update charger',
                error: error.message
            });
        }
    }
);

// DELETE /api/chargers/:id - Delete charger (soft delete)
router.delete('/:id',
    [
        auth,
        param('id').isMongoId().withMessage('Invalid charger ID'),
        handleValidationErrors
    ],
    async (req, res) => {
        try {
            const { id } = req.params;

            const charger = await Charger.findById(id);
            if (!charger) {
                return res.status(404).json({
                    success: false,
                    message: 'Charger not found'
                });
            }

            // Check if charger has active transactions
            if (charger.currentTransaction) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot delete charger with active transaction'
                });
            }

            // Soft delete
            charger.isActive = false;
            charger.metadata.updatedBy = req.user.id;
            await charger.save();

            // Update station's total chargers count
            await Station.findByIdAndUpdate(charger.stationId, {
                $inc: { totalChargers: -1 }
            });

            res.json({
                success: true,
                message: 'Charger deleted successfully'
            });

        } catch (error) {
            console.error('Error deleting charger:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete charger',
                error: error.message
            });
        }
    }
);

// POST /api/chargers/:id/generate-qr - Generate QR code for charger
router.post('/:id/generate-qr',
    [
        auth,
        param('id').isMongoId().withMessage('Invalid charger ID'),
        handleValidationErrors
    ],
    async (req, res) => {
        try {
            const charger = await Charger.findById(req.params.id);
            if (!charger) {
                return res.status(404).json({
                    success: false,
                    message: 'Charger not found'
                });
            }

            const qrUrl = charger.generateQRCode();
            await charger.save();

            res.json({
                success: true,
                message: 'QR code generated successfully',
                data: {
                    qrCodeUrl: qrUrl,
                    generatedAt: charger.qrCode.generated
                }
            });

        } catch (error) {
            console.error('Error generating QR code:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to generate QR code',
                error: error.message
            });
        }
    }
);

// GET /api/chargers/:id/ocpp-url - Get OCPP WebSocket URL for charger
router.get('/:id/ocpp-url',
    [
        auth,
        param('id').isMongoId().withMessage('Invalid charger ID'),
        handleValidationErrors
    ],
    async (req, res) => {
        try {
            const charger = await Charger.findById(req.params.id);
            if (!charger) {
                return res.status(404).json({
                    success: false,
                    message: 'Charger not found'
                });
            }

            const baseUrl = process.env.NODE_ENV === 'production' 
                ? 'wss://cms-o4rp.onrender.com' 
                : 'ws://localhost:5001';
            
            const ocppUrl = `${baseUrl}/ocpp/${charger.serialNumber}`;

            res.json({
                success: true,
                data: {
                    serialNumber: charger.serialNumber,
                    websocketUrl: ocppUrl,
                    frontendUrl: process.env.NODE_ENV === 'production' 
                        ? 'https://cms-o4rp.onrender.com' 
                        : 'http://localhost:5173',
                    isConnected: charger.ocppConnection.isConnected,
                    lastHeartbeat: charger.ocppConnection.lastHeartbeat
                }
            });

        } catch (error) {
            console.error('Error getting OCPP URL:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get OCPP URL',
                error: error.message
            });
        }
    }
);

// POST /api/chargers/:id/update-status - Update charger status
router.post('/:id/update-status',
    [
        auth,
        param('id').isMongoId().withMessage('Invalid charger ID'),
        body('status')
            .notEmpty().withMessage('Status is required')
            .isIn(['ONLINE', 'OFFLINE', 'CONFIGURING', 'FAULTED', 'RESERVED', 'UNAVAILABLE'])
            .withMessage('Invalid status'),
        handleValidationErrors
    ],
    async (req, res) => {
        try {
            const { id } = req.params;
            const { status } = req.body;

            const charger = await Charger.findById(id);
            if (!charger) {
                return res.status(404).json({
                    success: false,
                    message: 'Charger not found'
                });
            }

            await charger.updateStatus(status);

            res.json({
                success: true,
                message: 'Charger status updated successfully',
                data: {
                    id: charger._id,
                    serialNumber: charger.serialNumber,
                    status: charger.status,
                    lastOnline: charger.lastOnline,
                    lastOffline: charger.lastOffline
                }
            });

        } catch (error) {
            console.error('Error updating charger status:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update charger status',
                error: error.message
            });
        }
    }
);

// GET /api/chargers/:id/meter-values - Get meter values for charger
router.get('/:id/meter-values',
    [
        auth,
        param('id').isMongoId().withMessage('Invalid charger ID'),
        query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('Limit must be between 1 and 1000'),
        query('from').optional().isISO8601().withMessage('From date must be in ISO 8601 format'),
        query('to').optional().isISO8601().withMessage('To date must be in ISO 8601 format'),
        handleValidationErrors
    ],
    async (req, res) => {
        try {
            const { id } = req.params;
            const { limit = 100, from, to } = req.query;

            const charger = await Charger.findById(id);
            if (!charger) {
                return res.status(404).json({
                    success: false,
                    message: 'Charger not found'
                });
            }

            let meterValues = charger.meterValues || [];

            // Filter by date range if provided
            if (from || to) {
                meterValues = meterValues.filter(mv => {
                    const timestamp = new Date(mv.timestamp);
                    if (from && timestamp < new Date(from)) return false;
                    if (to && timestamp > new Date(to)) return false;
                    return true;
                });
            }

            // Limit results
            meterValues = meterValues.slice(-parseInt(limit));

            res.json({
                success: true,
                data: {
                    chargerId: charger._id,
                    serialNumber: charger.serialNumber,
                    meterValues: meterValues.reverse(), // Latest first
                    totalCount: meterValues.length
                }
            });

        } catch (error) {
            console.error('Error fetching meter values:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch meter values',
                error: error.message
            });
        }
    }
);

module.exports = router;
