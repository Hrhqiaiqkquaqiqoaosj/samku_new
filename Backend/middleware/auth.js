const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.'
            });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id).select('-password');
            
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid token. User not found.'
                });
            }

            if (!user.isActive) {
                return res.status(401).json({
                    success: false,
                    message: 'Account is deactivated.'
                });
            }

            if (user.isLocked) {
                return res.status(401).json({
                    success: false,
                    message: 'Account is temporarily locked. Please try again later.'
                });
            }

            req.user = user;
            next();
        } catch (tokenError) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token.'
            });
        }
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during authentication.'
        });
    }
};

// Role-based authorization middleware
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. Authentication required.'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Insufficient permissions.'
            });
        }

        next();
    };
};

// Permission-based authorization middleware
const hasPermission = (resource, action) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. Authentication required.'
            });
        }

        // Admin has all permissions
        if (req.user.role === 'ADMIN') {
            return next();
        }

        // Check user permissions
        const userPermissions = req.user.permissions || [];
        const hasRequiredPermission = userPermissions.some(perm => 
            perm.resource === resource && 
            (perm.actions.includes(action) || perm.actions.includes('manage'))
        );

        if (!hasRequiredPermission) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Required permission: ${action} on ${resource}`
            });
        }

        next();
    };
};

module.exports = {
    auth,
    authorize,
    hasPermission
};
