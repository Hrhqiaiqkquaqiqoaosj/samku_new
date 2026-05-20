const express = require("express");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const { auth } = require("../middleware/auth");

const router = express.Router();

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array(),
    });
  }
  next();
};

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });
};

// Generate refresh token
const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || "30d",
  });
};

// POST /api/auth/register - Register new user
router.post(
  "/register",
  [
    body("username")
      .isLength({ min: 3, max: 30 })
      .withMessage("Username must be 3-30 characters")
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage(
        "Username can only contain letters, numbers and underscores"
      ),
    body("email").isEmail().withMessage("Please provide a valid email"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    body("profile.firstName")
      .notEmpty()
      .withMessage("First name is required")
      .isLength({ max: 50 })
      .withMessage("First name cannot exceed 50 characters"),
    body("profile.lastName")
      .notEmpty()
      .withMessage("Last name is required")
      .isLength({ max: 50 })
      .withMessage("Last name cannot exceed 50 characters"),
    body("profile.phone")
      .matches(/^\+?[\d\s-()]+$/)
      .withMessage("Please provide a valid phone number"),
    body("role")
      .optional()
      .isIn(["USER", "HOST"])
      .withMessage("Role must be USER or HOST"),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      let { username, email, password, profile, role = "USER" } = req.body;

      // If no username provided, generate one from email
      if (!username) {
        username = email.split("@")[0].toLowerCase();
        // Add timestamp to ensure uniqueness
        const timestamp = Date.now().toString().slice(-4);
        username = `${username}${timestamp}`;
      }

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [{ email: email.toLowerCase() }, { username }],
      });

      if (existingUser) {
        if (existingUser.email === email.toLowerCase()) {
          return res.status(400).json({
            success: false,
            message: "Email already registered",
          });
        }

        // If username conflicts, generate a new one
        const timestamp = Date.now().toString();
        username = `${email.split("@")[0].toLowerCase()}${timestamp}`;
      }

      // Create user
      const user = new User({
        username,
        email: email.toLowerCase(),
        password,
        profile,
        role,
        permissions: User.getUserPermissions(role),
      });

      await user.save();

      // Generate tokens
      const token = generateToken(user._id);
      const refreshToken = generateRefreshToken(user._id);

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: {
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            profile: user.profile,
            isVerified: user.isVerified,
          },
          token,
          refreshToken,
        },
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to register user",
        error: error.message,
      });
    }
  }
);

// POST /api/auth/login - Login user
router.post(
  "/login",
  [
    body("identifier").notEmpty().withMessage("Email or username is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { identifier, password } = req.body;

      // Find user by email or username
      const user = await User.findByEmailOrUsername(identifier);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      // Check if account is locked
      if (user.isLocked) {
        return res.status(401).json({
          success: false,
          message:
            "Account is temporarily locked due to too many failed login attempts",
        });
      }

      // Check if account is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: "Account is deactivated",
        });
      }

      // Check password
      const isMatch = await user.comparePassword(password);

      if (!isMatch) {
        // Increment login attempts
        await user.incLoginAttempts();

        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      // Reset login attempts on successful login
      if (user.loginAttempts && user.loginAttempts > 0) {
        await user.resetLoginAttempts();
      }

      // Generate tokens
      const token = generateToken(user._id);
      const refreshToken = generateRefreshToken(user._id);

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      res.json({
        success: true,
        message: "Login successful",
        data: {
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            profile: user.profile,
            isVerified: user.isVerified,
            permissions: user.permissions,
          },
          token,
          refreshToken,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({
        success: false,
        message: "Login failed",
        error: error.message,
      });
    }
  }
);

// POST /api/auth/refresh-token - Refresh access token
router.post(
  "/refresh-token",
  [body("refreshToken").notEmpty().withMessage("Refresh token is required")],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { refreshToken } = req.body;

      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      const user = await User.findById(decoded.id).select("-password");

      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          message: "Invalid refresh token",
        });
      }

      // Generate new access token
      const newToken = generateToken(user._id);

      res.json({
        success: true,
        data: {
          token: newToken,
        },
      });
    } catch (error) {
      console.error("Refresh token error:", error);
      res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }
  }
);

// POST /api/auth/logout - Logout user
router.post("/logout", auth, async (req, res) => {
  try {
    // In a more sophisticated system, you would invalidate the token
    // For now, we'll just return success as the client will remove the token
    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Logout failed",
      error: error.message,
    });
  }
});

// POST /api/auth/forgot-password - Request password reset
router.post(
  "/forgot-password",
  [body("email").isEmail().withMessage("Please provide a valid email")],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { email } = req.body;

      const user = await User.findOne({ email: email.toLowerCase() });

      if (!user) {
        // Don't reveal if email exists for security
        return res.json({
          success: true,
          message: "If the email exists, a password reset link has been sent",
        });
      }

      // Generate reset token
      const resetToken = user.generatePasswordResetToken();
      await user.save();

      // In a real application, you would send an email here
      // For now, we'll just log the token (remove in production)
      console.log(`Password reset token for ${email}: ${resetToken}`);

      res.json({
        success: true,
        message: "If the email exists, a password reset link has been sent",
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to process password reset request",
        error: error.message,
      });
    }
  }
);

// POST /api/auth/reset-password - Reset password with token
router.post(
  "/reset-password",
  [
    body("token").notEmpty().withMessage("Reset token is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { token, password } = req.body;

      // Hash the token to compare with stored hash
      const hashedToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

      const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() },
      });

      if (!user) {
        return res.status(400).json({
          success: false,
          message: "Password reset token is invalid or has expired",
        });
      }

      // Set new password
      user.password = password;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;

      // Reset login attempts if any
      user.loginAttempts = 0;
      user.lockUntil = undefined;

      await user.save();

      res.json({
        success: true,
        message: "Password reset successful",
      });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to reset password",
        error: error.message,
      });
    }
  }
);

// GET /api/auth/me - Get current user
router.get("/me", auth, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user,
      },
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get user data",
      error: error.message,
    });
  }
});

// POST /api/auth/verify-email - Verify email address
router.post(
  "/verify-email",
  [body("token").notEmpty().withMessage("Verification token is required")],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { token } = req.body;

      // Hash the token to compare with stored hash
      const hashedToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

      const user = await User.findOne({
        emailVerificationToken: hashedToken,
        emailVerificationExpires: { $gt: Date.now() },
      });

      if (!user) {
        return res.status(400).json({
          success: false,
          message: "Email verification token is invalid or has expired",
        });
      }

      // Verify email
      user.isVerified = true;
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;

      await user.save();

      res.json({
        success: true,
        message: "Email verified successfully",
      });
    } catch (error) {
      console.error("Email verification error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to verify email",
        error: error.message,
      });
    }
  }
);

module.exports = router;
