const express = require('express');
const { auth } = require('../middleware/auth');
const Charger = require('../models/Charger');
const Station = require('../models/Station');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Host = require('../models/Host');

const router = express.Router();

// GET /api/stats/dashboard - Get dashboard statistics
router.get('/dashboard', auth, async (req, res) => {
    try {
        // Get counts in parallel
        const [
            totalChargers,
            activeChargers,
            totalStations,
            operationalStations,
            maintenanceStations,
            totalCustomers,
            activeCustomers,
            transactions,
            recentTransactions
        ] = await Promise.all([
            Charger.countDocuments({ isActive: true }),
            Charger.countDocuments({ isActive: true, status: 'ONLINE' }),
            Station.countDocuments({ isActive: true }),
            Station.countDocuments({ isActive: true, status: 'ACTIVE' }),
            Station.countDocuments({ isActive: true, status: 'MAINTENANCE' }),
            User.countDocuments({ role: 'USER' }),
            User.countDocuments({ role: 'USER', isActive: true }),
            Transaction.find({}).sort({ createdAt: -1 }),
            Transaction.find({})
                .sort({ createdAt: -1 })
                .limit(20)
                .populate('customerId', 'profile.firstName profile.lastName email')
                .populate('chargerId', 'name serialNumber')
        ]);

        // Calculate total energy
        const totalEnergyConsumed = transactions.reduce((sum, t) => sum + (t.energy || 0), 0);
        
        // Calculate total revenue
        const totalRevenue = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
        
        // Calculate completed/failed sessions
        const completedSessions = transactions.filter(t => t.status === 'COMPLETED').length;
        const failedSessions = transactions.filter(t => t.status === 'FAILED').length;
        
        // Return dashboard statistics
        res.json({
            success: true,
            data: {
                chargers: {
                    total: totalChargers,
                    active: activeChargers,
                    inactive: totalChargers - activeChargers
                },
                stations: {
                    total: totalStations,
                    operational: operationalStations,
                    maintenance: maintenanceStations
                },
                customers: {
                    total: totalCustomers,
                    active: activeCustomers,
                    growth: "+5%" // Mock data, would require historical analysis
                },
                revenue: {
                    total: `₹${totalRevenue.toFixed(2)}`,
                    monthly: `₹${(totalRevenue * 0.3).toFixed(2)}`, // Mock data, would require time-based filtering
                    trend: "+7%" // Mock data, would require historical analysis
                },
                uptime: 98.5, // Mock data, would require monitoring system
                energyConsumed: `${totalEnergyConsumed.toFixed(2)} kWh`,
                sessions: {
                    total: transactions.length,
                    completed: completedSessions,
                    failed: failedSessions
                },
                recentTransactions: recentTransactions.map(t => ({
                    id: t._id,
                    customerName: t.customerId ? `${t.customerId.profile?.firstName || ''} ${t.customerId.profile?.lastName || ''}`.trim() || t.customerId.email : 'Unknown',
                    chargerName: t.chargerId ? t.chargerId.name : 'Unknown',
                    amount: t.amount,
                    energy: t.energy,
                    status: t.status,
                    startTime: t.startTime,
                    endTime: t.endTime
                }))
            }
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard statistics',
            error: error.message
        });
    }
});

// GET /api/stats/hosts - Get hosts statistics
router.get('/hosts', auth, async (req, res) => {
    try {
        const totalHosts = await Host.countDocuments({});
        const activeHosts = await Host.countDocuments({ isActive: true });
        
        res.json({
            success: true,
            data: {
                total: totalHosts,
                active: activeHosts,
                inactive: totalHosts - activeHosts
            }
        });
    } catch (error) {
        console.error('Error fetching host stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch host statistics',
            error: error.message
        });
    }
});

// GET /api/stats/customers - Get customer statistics
router.get('/customers', auth, async (req, res) => {
    try {
        const [totalCustomers, activeCustomers] = await Promise.all([
            User.countDocuments({ role: 'USER' }),
            User.countDocuments({ role: 'USER', isActive: true })
        ]);
        
        res.json({
            success: true,
            data: {
                total: totalCustomers,
                active: activeCustomers,
                inactive: totalCustomers - activeCustomers
            }
        });
    } catch (error) {
        console.error('Error fetching customer stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch customer statistics',
            error: error.message
        });
    }
});

module.exports = router;
