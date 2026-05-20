const express = require('express');
const { body, param, validationResult } = require('express-validator');
const User = require('../models/User');
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

// GET /api/users/profile - Get current user profile
router.get('/profile', auth, async (req, res) => {
    try {
        res.json({
            success: true,
            data: req.user
        });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user profile',
            error: error.message
        });
    }
});

// PUT /api/users/profile - Update user profile
router.put('/profile',
    auth,
    [
        body('profile.firstName')
            .optional()
            .isLength({ min: 1, max: 50 }).withMessage('First name must be 1-50 characters'),
        body('profile.lastName')
            .optional()
            .isLength({ min: 1, max: 50 }).withMessage('Last name must be 1-50 characters'),
        body('profile.phone')
            .optional()
            .matches(/^\+?[\d\s-()]+$/).withMessage('Please provide a valid phone number'),
        body('profile.dateOfBirth')
            .optional()
            .isISO8601().withMessage('Please provide a valid date'),
        body('preferences.language')
            .optional()
            .isIn(['en', 'hi', 'mr', 'gu', 'ta', 'te', 'kn', 'ml']).withMessage('Invalid language'),
        body('preferences.theme')
            .optional()
            .isIn(['light', 'dark', 'auto']).withMessage('Invalid theme')
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const updateData = {};
            
            // Handle nested profile updates
            if (req.body.profile) {
                Object.keys(req.body.profile).forEach(key => {
                    updateData[`profile.${key}`] = req.body.profile[key];
                });
            }

            // Handle nested preferences updates
            if (req.body.preferences) {
                Object.keys(req.body.preferences).forEach(key => {
                    updateData[`preferences.${key}`] = req.body.preferences[key];
                });
            }

            const user = await User.findByIdAndUpdate(
                req.user.id,
                updateData,
                { new: true, runValidators: true }
            ).select('-password');

            res.json({
                success: true,
                message: 'Profile updated successfully',
                data: user
            });

        } catch (error) {
            console.error('Error updating user profile:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update profile',
                error: error.message
            });
        }
    }
);

// POST /api/users/change-password - Change user password
router.post('/change-password',
    auth,
    [
        body('currentPassword')
            .notEmpty().withMessage('Current password is required'),
        body('newPassword')
            .isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
        body('confirmPassword')
            .custom((value, { req }) => {
                if (value !== req.body.newPassword) {
                    throw new Error('Password confirmation does not match');
                }
                return true;
            })
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { currentPassword, newPassword } = req.body;

            // Get user with password
            const user = await User.findById(req.user.id).select('+password');

            // Verify current password
            const isMatch = await user.comparePassword(currentPassword);
            if (!isMatch) {
                return res.status(400).json({
                    success: false,
                    message: 'Current password is incorrect'
                });
            }

            // Update password
            user.password = newPassword;
            await user.save();

            res.json({
                success: true,
                message: 'Password changed successfully'
            });

        } catch (error) {
            console.error('Error changing password:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to change password',
                error: error.message
            });
        }
    }
);

module.exports = router;
