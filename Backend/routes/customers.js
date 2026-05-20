const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// GET /api/customers - Get all customers (users with role USER)
router.get('/', auth, authorize('ADMIN', 'HOST'), async (req, res) => {
    try {
        // Find all users with role 'USER'
        const customers = await User.find({ role: 'USER' })
            .select('username email profile createdAt isActive isVerified')
            .sort({ createdAt: -1 });

        // Transform the data to match the frontend expectations
        const transformedCustomers = customers.map(customer => ({
            id: customer._id,
            name: customer.fullName || `${customer.profile.firstName} ${customer.profile.lastName}`,
            email: customer.email,
            phoneNumber: customer.profile.phone || 'N/A',
            type: customer.email ? 'EMAIL' : 'PHONE', // Determine type based on email presence
            createdAt: customer.createdAt.toISOString().slice(0, 19).replace('T', ' '),
            isActive: customer.isActive,
            isVerified: customer.isVerified,
            username: customer.username
        }));

        res.json({
            success: true,
            message: 'Customers fetched successfully',
            data: transformedCustomers
        });
    } catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch customers',
            error: error.message
        });
    }
});

// GET /api/customers/:id - Get customer by ID
router.get('/:id', auth, authorize('ADMIN', 'HOST'), async (req, res) => {
    try {
        const customer = await User.findOne({ 
            _id: req.params.id, 
            role: 'USER' 
        }).select('username email profile createdAt isActive isVerified');

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        const transformedCustomer = {
            id: customer._id,
            name: customer.fullName || `${customer.profile.firstName} ${customer.profile.lastName}`,
            email: customer.email,
            phoneNumber: customer.profile.phone || 'N/A',
            type: customer.email ? 'EMAIL' : 'PHONE',
            createdAt: customer.createdAt.toISOString().slice(0, 19).replace('T', ' '),
            isActive: customer.isActive,
            isVerified: customer.isVerified,
            username: customer.username
        };

        res.json({
            success: true,
            data: transformedCustomer
        });
    } catch (error) {
        console.error('Error fetching customer:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch customer',
            error: error.message
        });
    }
});

module.exports = router;
