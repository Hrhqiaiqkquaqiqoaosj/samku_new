const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const Station = require('../models/Station');
const Charger = require('../models/Charger');
const { auth } = require('../middleware/auth');

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

// GET /api/stations - Get all stations with optional filters
router.get('/', 
    [
        auth,
        query('hostId').optional().isMongoId().withMessage('Invalid host ID'),
        query('status').optional().isIn(['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'SUSPENDED']),
        query('city').optional().isLength({ min: 1 }).withMessage('City must not be empty'),
        query('state').optional().isLength({ min: 1 }).withMessage('State must not be empty'),
        query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
        query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
        query('search').optional().isLength({ min: 1 }).withMessage('Search term must not be empty'),
        query('isVerified').optional().isBoolean().withMessage('isVerified must be boolean'),
        handleValidationErrors
    ],
    async (req, res) => {
        try {
            const { 
                hostId, 
                status, 
                city, 
                state, 
                page = 1, 
                limit = 10, 
                search, 
                isVerified 
            } = req.query;
            const skip = (page - 1) * limit;

            // Build filter object
            const filter = {};
            
            if (hostId) {
                filter.hostId = hostId;
            }
            
            if (status) {
                filter.status = status;
            }

            if (city) {
                filter['address.city'] = { $regex: city, $options: 'i' };
            }

            if (state) {
                filter['address.state'] = { $regex: state, $options: 'i' };
            }

            if (isVerified !== undefined) {
                filter.isVerified = isVerified === 'true';
            }

            if (search) {
                filter.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { ownedBy: { $regex: search, $options: 'i' } },
                    { 'address.area': { $regex: search, $options: 'i' } },
                    { 'address.city': { $regex: search, $options: 'i' } }
                ];
            }

            // Execute query with pagination
            const [stations, total] = await Promise.all([
                Station.find(filter)
                    .populate('hostId', 'name contactPerson contactEmail phoneNumber')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(limit))
                    .lean(),
                Station.countDocuments(filter)
            ]);

            // Get charger counts for each station
            const stationsWithChargerCounts = await Promise.all(
                stations.map(async (station) => {
                    const chargerCounts = await Charger.aggregate([
                        { $match: { stationId: station._id, isActive: true } },
                        {
                            $group: {
                                _id: '$status',
                                count: { $sum: 1 }
                            }
                        }
                    ]);

                    const counts = {
                        total: 0,
                        online: 0,
                        offline: 0,
                        configuring: 0,
                        faulted: 0,
                        reserved: 0,
                        unavailable: 0
                    };

                    chargerCounts.forEach(item => {
                        counts.total += item.count;
                        switch (item._id) {
                            case 'ONLINE':
                                counts.online = item.count;
                                break;
                            case 'OFFLINE':
                                counts.offline = item.count;
                                break;
                            case 'CONFIGURING':
                                counts.configuring = item.count;
                                break;
                            case 'FAULTED':
                                counts.faulted = item.count;
                                break;
                            case 'RESERVED':
                                counts.reserved = item.count;
                                break;
                            case 'UNAVAILABLE':
                                counts.unavailable = item.count;
                                break;
                        }
                    });

                    return {
                        ...station,
                        chargerCounts: counts
                    };
                })
            );

            res.json({
                success: true,
                data: stationsWithChargerCounts,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    totalItems: total,
                    itemsPerPage: parseInt(limit)
                }
            });

        } catch (error) {
            console.error('Error fetching stations:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch stations',
                error: error.message
            });
        }
    }
);

// GET /api/stations/host/:hostId - Get stations by host
router.get('/host/:hostId',
    [
        auth,
        param('hostId').isMongoId().withMessage('Invalid host ID'),
        handleValidationErrors
    ],
    async (req, res) => {
        try {
            const { hostId } = req.params;
            
            const stations = await Station.find({ hostId })
                .populate('hostId', 'name contactPerson')
                .sort({ createdAt: -1 });

            res.json({
                success: true,
                data: stations
            });

        } catch (error) {
            console.error('Error fetching stations by host:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch stations for host',
                error: error.message
            });
        }
    }
);

// GET /api/stations/:id - Get single station
router.get('/:id',
    [
        auth,
        param('id').isMongoId().withMessage('Invalid station ID'),
        handleValidationErrors
    ],
    async (req, res) => {
        try {
            const station = await Station.findById(req.params.id)
                .populate('hostId')
                .populate('chargers');

            if (!station) {
                return res.status(404).json({
                    success: false,
                    message: 'Station not found'
                });
            }

            // Get charger statistics
            const chargerStats = await Charger.aggregate([
                { $match: { stationId: station._id, isActive: true } },
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 }
                    }
                }
            ]);

            const stats = {
                total: 0,
                online: 0,
                offline: 0,
                configuring: 0,
                faulted: 0,
                reserved: 0,
                unavailable: 0
            };

            chargerStats.forEach(item => {
                stats.total += item.count;
                stats[item._id.toLowerCase()] = item.count;
            });

            res.json({
                success: true,
                data: {
                    ...station.toObject(),
                    chargerStats: stats
                }
            });

        } catch (error) {
            console.error('Error fetching station:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch station',
                error: error.message
            });
        }
    }
);

// POST /api/stations - Create new station
router.post('/',
    [
        auth,
        body('name')
            .notEmpty().withMessage('Station name is required')
            .isLength({ min: 1, max: 100 }).withMessage('Station name must be between 1 and 100 characters'),
        body('ownedBy')
            .notEmpty().withMessage('Owner information is required'),
        body('hostId')
            .notEmpty().withMessage('Host ID is required')
            .isMongoId().withMessage('Invalid host ID'),
        body('address.area')
            .notEmpty().withMessage('Area is required'),
        body('address.city')
            .notEmpty().withMessage('City is required'),
        body('address.state')
            .notEmpty().withMessage('State is required'),
        body('address.pincode')
            .notEmpty().withMessage('Pincode is required')
            .matches(/^\d{6}$/).withMessage('Pincode must be 6 digits'),
        body('address.coordinates.latitude')
            .optional()
            .isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
        body('address.coordinates.longitude')
            .optional()
            .isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),
        body('contact.phone')
            .notEmpty().withMessage('Phone number is required')
            .matches(/^\+?[\d\s-()]+$/).withMessage('Invalid phone number format'),
        body('contact.email')
            .notEmpty().withMessage('Email is required')
            .isEmail().withMessage('Invalid email format'),
        body('operatingHours.open')
            .notEmpty().withMessage('Opening time is required')
            .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Opening time must be in HH:MM format'),
        body('operatingHours.close')
            .notEmpty().withMessage('Closing time is required')
            .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Closing time must be in HH:MM format'),
        body('operatingHours.is24x7')
            .optional()
            .isBoolean().withMessage('is24x7 must be boolean'),
        body('amenities')
            .optional()
            .isArray().withMessage('Amenities must be an array'),
        body('amenities.*')
            .optional()
            .isIn(['parking', 'restroom', 'cafe', 'wifi', 'restaurant', 'shopping', 'atm', 'medical'])
            .withMessage('Invalid amenity'),
        body('features')
            .optional()
            .isArray().withMessage('Features must be an array'),
        body('pricing.baseRate')
            .optional()
            .isFloat({ min: 0 }).withMessage('Base rate must be a positive number')
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const stationData = {
                ...req.body,
                metadata: {
                    createdBy: req.user.id
                }
            };

            // First validate that the hostId exists
            const Host = require('../models/Host');
            const hostExists = await Host.findById(stationData.hostId);
            if (!hostExists) {
                return res.status(400).json({
                    success: false,
                    message: 'Host not found with the provided ID',
                });
            }

            const station = new Station(stationData);
            await station.save();

            // Populate host data for response, but with a try-catch to handle errors
            try {
                await station.populate('hostId', 'name contactPerson contactEmail phoneNumber');
            } catch (populateError) {
                console.warn('Warning: Could not populate host data:', populateError.message);
                // Continue without populated data if it fails
            }

            res.status(201).json({
                success: true,
                message: 'Station created successfully',
                data: station
            });

        } catch (error) {
            console.error('Error creating station:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create station',
                error: error.message
            });
        }
    }
);

// PUT /api/stations/:id - Update station
router.put('/:id',
    [
        auth,
        param('id').isMongoId().withMessage('Invalid station ID'),
        body('name')
            .optional()
            .isLength({ min: 1, max: 100 }).withMessage('Station name must be between 1 and 100 characters'),
        body('hostId')
            .optional()
            .isMongoId().withMessage('Invalid host ID'),
        body('address.pincode')
            .optional()
            .matches(/^\d{6}$/).withMessage('Pincode must be 6 digits'),
        body('address.coordinates.latitude')
            .optional()
            .isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
        body('address.coordinates.longitude')
            .optional()
            .isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),
        body('contact.phone')
            .optional()
            .matches(/^\+?[\d\s-()]+$/).withMessage('Invalid phone number format'),
        body('contact.email')
            .optional()
            .isEmail().withMessage('Invalid email format'),
        body('operatingHours.open')
            .optional()
            .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Opening time must be in HH:MM format'),
        body('operatingHours.close')
            .optional()
            .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Closing time must be in HH:MM format'),
        body('status')
            .optional()
            .isIn(['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'SUSPENDED']).withMessage('Invalid status'),
        body('amenities')
            .optional()
            .isArray().withMessage('Amenities must be an array'),
        body('pricing.baseRate')
            .optional()
            .isFloat({ min: 0 }).withMessage('Base rate must be a positive number')
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { id } = req.params;
            const updateData = { ...req.body };
            
            // Add metadata
            updateData['metadata.updatedBy'] = req.user.id;

            const station = await Station.findByIdAndUpdate(
                id,
                updateData,
                { new: true, runValidators: true }
            ).populate('hostId', 'name contactPerson contactEmail phoneNumber');

            if (!station) {
                return res.status(404).json({
                    success: false,
                    message: 'Station not found'
                });
            }

            res.json({
                success: true,
                message: 'Station updated successfully',
                data: station
            });

        } catch (error) {
            console.error('Error updating station:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update station',
                error: error.message
            });
        }
    }
);

// DELETE /api/stations/:id - Delete station
router.delete('/:id',
    [
        auth,
        param('id').isMongoId().withMessage('Invalid station ID'),
        handleValidationErrors
    ],
    async (req, res) => {
        try {
            const { id } = req.params;

            // Check if station has any chargers
            const chargerCount = await Charger.countDocuments({ 
                stationId: id, 
                isActive: true 
            });

            if (chargerCount > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Cannot delete station with ${chargerCount} active chargers. Please remove or deactivate all chargers first.`
                });
            }

            const station = await Station.findByIdAndDelete(id);

            if (!station) {
                return res.status(404).json({
                    success: false,
                    message: 'Station not found'
                });
            }

            res.json({
                success: true,
                message: 'Station deleted successfully'
            });

        } catch (error) {
            console.error('Error deleting station:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete station',
                error: error.message
            });
        }
    }
);

// POST /api/stations/:id/verify - Verify station (admin only)
router.post('/:id/verify',
    [
        auth,
        param('id').isMongoId().withMessage('Invalid station ID'),
        handleValidationErrors
    ],
    async (req, res) => {
        try {
            // Check if user is admin
            if (req.user.role !== 'ADMIN') {
                return res.status(403).json({
                    success: false,
                    message: 'Only administrators can verify stations'
                });
            }

            const station = await Station.findByIdAndUpdate(
                req.params.id,
                { 
                    isVerified: true,
                    'metadata.updatedBy': req.user.id
                },
                { new: true }
            ).populate('hostId', 'name contactPerson');

            if (!station) {
                return res.status(404).json({
                    success: false,
                    message: 'Station not found'
                });
            }

            res.json({
                success: true,
                message: 'Station verified successfully',
                data: station
            });

        } catch (error) {
            console.error('Error verifying station:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to verify station',
                error: error.message
            });
        }
    }
);

// GET /api/stations/:id/chargers - Get all chargers for a station
router.get('/:id/chargers',
    auth,
    [
        param('id').isMongoId().withMessage('Invalid station ID'),
        query('status').optional().isIn(['ONLINE', 'OFFLINE', 'CONFIGURING', 'FAULTED', 'RESERVED', 'UNAVAILABLE']),
        query('powerType').optional().isIn(['AC', 'DC'])
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { id } = req.params;
            const { status, powerType } = req.query;

            // Verify station exists
            const station = await Station.findById(id);
            if (!station) {
                return res.status(404).json({
                    success: false,
                    message: 'Station not found'
                });
            }

            // Build filter
            const filter = { stationId: id, isActive: true };
            if (status) filter.status = status;
            if (powerType) filter.powerType = powerType;

            const chargers = await Charger.find(filter)
                .sort({ createdAt: -1 });

            res.json({
                success: true,
                data: {
                    station: {
                        id: station._id,
                        name: station.name,
                        address: station.address
                    },
                    chargers
                }
            });

        } catch (error) {
            console.error('Error fetching station chargers:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch station chargers',
                error: error.message
            });
        }
    }
);

// GET /api/stations/statistics - Get overall statistics
router.get('/statistics/overview',
    [auth],
    async (req, res) => {
        try {
            const [
                totalStations,
                activeStations,
                verifiedStations,
                totalChargers,
                onlineChargers
            ] = await Promise.all([
                Station.countDocuments(),
                Station.countDocuments({ status: 'ACTIVE' }),
                Station.countDocuments({ isVerified: true }),
                Charger.countDocuments({ isActive: true }),
                Charger.countDocuments({ status: 'ONLINE', isActive: true })
            ]);

            // Get stations by state
            const stationsByState = await Station.aggregate([
                {
                    $group: {
                        _id: '$address.state',
                        count: { $sum: 1 }
                    }
                },
                { $sort: { count: -1 } },
                { $limit: 10 }
            ]);

            res.json({
                success: true,
                data: {
                    overview: {
                        totalStations,
                        activeStations,
                        verifiedStations,
                        totalChargers,
                        onlineChargers,
                        chargerUtilization: totalChargers > 0 ? Math.round((onlineChargers / totalChargers) * 100) : 0
                    },
                    stationsByState
                }
            });

        } catch (error) {
            console.error('Error fetching station statistics:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch station statistics',
                error: error.message
            });
        }
    }
);

module.exports = router;
